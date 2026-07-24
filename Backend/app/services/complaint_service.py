"""Complaint service with business logic"""
from typing import Optional, List, Dict
from bson import ObjectId
from datetime import datetime, timedelta
import logging
import uuid

from app.models.complaint_model import complaint_document, complaint_history_document
from app.repositories.complaint_repository import ComplaintRepository
from app.repositories.ward_repository import WardRepository
from app.schemas.complaint_schema import (
    ComplaintCreateSchema, ComplaintUpdateStatusSchema,
    ComplaintAssignWorkerSchema, ComplaintSubmitResolutionSchema,
    ComplaintApproveSchema, ComplaintRejectSchema
)
from app.core.exceptions import (
    CivifixException, ResourceNotFoundError, ValidationError, UnauthorizedError,
    DuplicateComplaintException
)
from app.core.enums import ComplaintStatus, Roles
from app.utils.complaint_validators import (
    ComplaintValidator, DuplicateComplaintDetector, SpamDetector
)

logger = logging.getLogger(__name__)


class ComplaintService:
    """Service for complaint operations"""

    @staticmethod
    def _normalize_id(value):
        """Convert valid Mongo IDs while preserving non-Mongo identifier strings."""
        if value is None:
            return None
        if isinstance(value, ObjectId):
            return value
        if isinstance(value, str):
            try:
                return ObjectId(value)
            except Exception:
                return value
        return value

    def __init__(
        self,
        complaint_repo: ComplaintRepository,
        ward_repo: WardRepository,
        user_repo=None,
        notification_service=None
    ):
        self.complaint_repo = complaint_repo
        self.ward_repo = ward_repo
        self.user_repo = user_repo
        self.notification_service = notification_service

    async def create_complaint(
        self,
        complaint_data: ComplaintCreateSchema,
        user_id: str,
        user_role: str
    ) -> dict:
        """Create new complaint with comprehensive validations"""
        try:
            if user_role != Roles.CITIZEN:
                raise UnauthorizedError("Only citizens can create complaints")

            if not ComplaintValidator.validate_gps_coordinates(
                complaint_data.latitude,
                complaint_data.longitude
            ):
                raise ValidationError("Invalid GPS coordinates")

            ward = await self.ward_repo.get_by_id(complaint_data.ward_id)
            if not ward:
                raise ValidationError("Ward not found")
            
            if not ward.get("is_active"):
                raise ValidationError("Ward is inactive")

            district_id = str(ward.get("district_id"))
            inspector_id = ward.get("inspector_id")

            complaints_this_week = await self.complaint_repo.count_by_user_this_week(user_id)
            if not SpamDetector.check_weekly_limit(complaints_this_week):
                raise ValidationError(
                    f"You have reached the limit of {SpamDetector.MAX_COMPLAINTS_PER_WEEK} complaints per week"
                )

            complaints_today = await self.complaint_repo.count_by_user_today(user_id)
            if not SpamDetector.check_daily_limit(complaints_today):
                raise ValidationError(
                    f"You have already created a complaint today. Please try again tomorrow"
                )

            nearby_complaints = await self.complaint_repo.get_with_duplicates(
                complaint_data.ward_id,
                complaint_data.complaint_type,
                days=7
            )

            # Define statuses that are considered for duplicate detection
            duplicate_check_statuses = [
                ComplaintStatus.PENDING, 
                ComplaintStatus.ASSIGNED, 
                ComplaintStatus.IN_PROGRESS
            ]

            for existing in nearby_complaints:
                existing_status = existing.get("status")
                if existing_status not in duplicate_check_statuses:
                    continue
                    
                distance = DuplicateComplaintDetector.calculate_distance(
                    complaint_data.latitude,
                    complaint_data.longitude,
                    existing.get("latitude"),
                    existing.get("longitude")
                )

                logger.info(
                    f"[Duplicate Check] Evaluated complaint {existing.get('complaint_id')} | "
                    f"Existing Coords: ({existing.get('latitude')}, {existing.get('longitude')}) | "
                    f"Incoming Coords: ({complaint_data.latitude}, {complaint_data.longitude}) | "
                    f"Distance: {distance:.2f}m | Type: {complaint_data.complaint_type} | "
                    f"Ward: {complaint_data.ward_id} | Status: {existing_status} | "
                    f"Created: {existing.get('created_at')}"
                )

                if distance <= DuplicateComplaintDetector.DUPLICATE_DISTANCE_METERS:
                    logger.warning(f"Duplicate complaint blocked: matches {existing.get('complaint_id')} at {distance:.2f}m")
                    raise DuplicateComplaintException(
                        existing_complaint_id=existing.get("complaint_id"),
                        distance_meters=round(distance, 2),
                        existing_status=existing_status
                    )

            complaint_doc = complaint_document(complaint_data)
            complaint_doc["_id"] = ObjectId()
            complaint_doc["user_id"] = self._normalize_id(user_id)
            complaint_doc["district_id"] = self._normalize_id(district_id)
            complaint_doc["ward_id"] = self._normalize_id(complaint_data.ward_id)
            complaint_doc["inspector_id"] = self._normalize_id(inspector_id) if inspector_id else None
            complaint_doc["complaint_id"] = self._generate_complaint_id()
            complaint_doc["status"] = ComplaintStatus.OPEN

            complaint_id = await self.complaint_repo.create(complaint_doc)

            history_data = {
                "complaint_id": complaint_doc["_id"],
                "action": "CREATED",
                "performed_by": self._normalize_id(user_id),
                "role": user_role,
                "timestamp": datetime.utcnow()
            }
            await self.complaint_repo.add_history(history_data)

            await self.ward_repo.update_complaint_counts(
                complaint_data.ward_id,
                {"increment_total": True, "new_status": "OPEN"}
            )

            if self.notification_service and inspector_id:
                await self.notification_service.notify_complaint_created(
                    complaint_id,
                    inspector_id,
                    complaint_doc.get("complaint_id")
                )

            created = await self.complaint_repo.get_by_id(complaint_id)
            
            logger.info(f"Complaint created: {complaint_doc.get('complaint_id')} by user {user_id}")
            return self._format_complaint(created)

        except CivifixException:
            raise
        except Exception as e:
            logger.error(f"Error creating complaint: {str(e)}")
            raise CivifixException("Failed to create complaint", status_code=500)

    async def get_complaint(self, complaint_id: str) -> dict:
        """Get complaint details with history"""
        try:
            complaint = await self.complaint_repo.get_by_id(complaint_id)
            if not complaint and hasattr(self.complaint_repo, "get_by_complaint_id"):
                complaint = await self.complaint_repo.get_by_complaint_id(complaint_id)
            if not complaint:
                raise ResourceNotFoundError("Complaint not found")
            
            history_lookup = complaint.get("_id") or complaint_id
            history = await self.complaint_repo.get_history(history_lookup)
            
            response = self._format_complaint(complaint)
            response["history"] = [self._format_history(h) for h in history]
            
            return response
        except CivifixException:
            raise
        except Exception as e:
            logger.error(f"Error getting complaint: {str(e)}")
            raise CivifixException("Failed to get complaint", status_code=500)

    async def assign_worker(
        self,
        complaint_id: str,
        assignment_data: ComplaintAssignWorkerSchema,
        inspector_id: str,
        user_role: str
    ) -> dict:
        """Assign worker to complaint"""
        try:
            if user_role != Roles.INSPECTOR:
                raise UnauthorizedError("Only inspectors can assign workers")

            complaint = await self.complaint_repo.get_by_id(complaint_id)
            if not complaint:
                raise ResourceNotFoundError("Complaint not found")

            if str(complaint.get("inspector_id")) != inspector_id:
                raise UnauthorizedError("You are not assigned to this complaint")

            if self.user_repo:
                worker = await self.user_repo.get_by_id(assignment_data.worker_id)
                if not worker:
                    raise ValidationError("Worker not found")
                
                if worker.get("role") != Roles.WORKER:
                    raise ValidationError("User is not a worker")
                
                if str(worker.get("district")) != str(complaint.get("district_id")):
                    raise ValidationError("Worker must be in the same district")

            update_data = {
                "worker_id": self._normalize_id(assignment_data.worker_id),
                "deadline": assignment_data.deadline,
                "status": ComplaintStatus.WORKING
            }

            success = await self.complaint_repo.update(complaint_id, update_data)
            if not success:
                raise CivifixException("Failed to assign worker")

            history_data = {
                "complaint_id": self._normalize_id(complaint_id),
                "action": "ASSIGNED",
                "old_status": complaint.get("status"),
                "new_status": ComplaintStatus.WORKING,
                "performed_by": self._normalize_id(inspector_id),
                "role": user_role,
                "remarks": assignment_data.note,
                "timestamp": datetime.utcnow()
            }
            await self.complaint_repo.add_history(history_data)

            if self.notification_service:
                await self.notification_service.notify_worker_assigned(
                    complaint_id,
                    assignment_data.worker_id,
                    assignment_data.deadline
                )

            updated = await self.complaint_repo.get_by_id(complaint_id)
            
            logger.info(f"Worker {assignment_data.worker_id} assigned to complaint {complaint_id}")
            return self._format_complaint(updated)

        except CivifixException:
            raise
        except Exception as e:
            logger.error(f"Error assigning worker: {str(e)}")
            raise CivifixException("Failed to assign worker", status_code=500)

    async def submit_work(
        self,
        complaint_id: str,
        work_data: ComplaintSubmitResolutionSchema,
        worker_id: str,
        user_role: str
    ) -> dict:
        """Worker submits work completion"""
        try:
            if user_role != Roles.WORKER:
                raise UnauthorizedError("Only workers can submit work")

            complaint = await self.complaint_repo.get_by_id(complaint_id)
            if not complaint:
                raise ResourceNotFoundError("Complaint not found")

            if str(complaint.get("worker_id")) != worker_id:
                raise UnauthorizedError("You are not assigned to this complaint")

            if complaint.get("status") != ComplaintStatus.WORKING:
                raise ValidationError(f"Can only submit work when status is {ComplaintStatus.WORKING}")

            update_data = {
                "worker_note": work_data.worker_note,
                "proof_images": work_data.proof_images,
                "status": ComplaintStatus.APPROVAL,
                "updated_at": datetime.utcnow()
            }

            success = await self.complaint_repo.update(complaint_id, update_data)
            if not success:
                raise CivifixException("Failed to submit work")

            history_data = {
                "complaint_id": self._normalize_id(complaint_id),
                "action": "STATUS_CHANGED",
                "old_status": ComplaintStatus.WORKING,
                "new_status": ComplaintStatus.APPROVAL,
                "performed_by": self._normalize_id(worker_id),
                "role": user_role,
                "remarks": "Work completed and submitted for approval",
                "timestamp": datetime.utcnow()
            }
            await self.complaint_repo.add_history(history_data)

            if self.notification_service:
                await self.notification_service.notify_work_submitted(
                    complaint_id,
                    str(complaint.get("inspector_id"))
                )

            updated = await self.complaint_repo.get_by_id(complaint_id)
            
            logger.info(f"Work submitted for complaint {complaint_id}")
            return self._format_complaint(updated)

        except CivifixException:
            raise
        except Exception as e:
            logger.error(f"Error submitting work: {str(e)}")
            raise CivifixException("Failed to submit work", status_code=500)

    async def approve_complaint(
        self,
        complaint_id: str,
        approve_data: ComplaintApproveSchema,
        inspector_id: str,
        user_role: str
    ) -> dict:
        """Inspector approves work completion"""
        try:
            if user_role != Roles.INSPECTOR:
                raise UnauthorizedError("Only inspectors can approve complaints")

            complaint = await self.complaint_repo.get_by_id(complaint_id)
            if not complaint:
                raise ResourceNotFoundError("Complaint not found")

            if str(complaint.get("inspector_id")) != inspector_id:
                raise UnauthorizedError("You are not assigned to this complaint")

            if complaint.get("status") != ComplaintStatus.APPROVAL:
                raise ValidationError(f"Can only approve complaints in {ComplaintStatus.APPROVAL} status")

            update_data = {
                "status": ComplaintStatus.CLOSED,
                "inspector_note": approve_data.note,
                "closed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }

            success = await self.complaint_repo.update(complaint_id, update_data)
            if not success:
                raise CivifixException("Failed to approve complaint")

            history_data = {
                "complaint_id": self._normalize_id(complaint_id),
                "action": "APPROVED",
                "old_status": ComplaintStatus.APPROVAL,
                "new_status": ComplaintStatus.CLOSED,
                "performed_by": self._normalize_id(inspector_id),
                "role": user_role,
                "remarks": approve_data.note,
                "timestamp": datetime.utcnow()
            }
            await self.complaint_repo.add_history(history_data)

            if self.notification_service:
                await self.notification_service.notify_complaint_approved(
                    complaint_id,
                    str(complaint.get("user_id")),
                    str(complaint.get("worker_id"))
                )

            await self.ward_repo.update_complaint_counts(
                str(complaint.get("ward_id")),
                {"new_status": "CLOSED"}
            )

            updated = await self.complaint_repo.get_by_id(complaint_id)
            
            logger.info(f"Complaint {complaint_id} approved by inspector {inspector_id}")
            return self._format_complaint(updated)

        except CivifixException:
            raise
        except Exception as e:
            logger.error(f"Error approving complaint: {str(e)}")
            raise CivifixException("Failed to approve complaint", status_code=500)

    async def reject_complaint(
        self,
        complaint_id: str,
        reject_data: ComplaintRejectSchema,
        inspector_id: str,
        user_role: str
    ) -> dict:
        """Inspector rejects work and sends back to worker"""
        try:
            if user_role != Roles.INSPECTOR:
                raise UnauthorizedError("Only inspectors can reject complaints")

            complaint = await self.complaint_repo.get_by_id(complaint_id)
            if not complaint:
                raise ResourceNotFoundError("Complaint not found")

            if str(complaint.get("inspector_id")) != inspector_id:
                raise UnauthorizedError("You are not assigned to this complaint")

            if complaint.get("status") != ComplaintStatus.APPROVAL:
                raise ValidationError(f"Can only reject complaints in {ComplaintStatus.APPROVAL} status")

            update_data = {
                "status": ComplaintStatus.WORKING,
                "rejection_reason": reject_data.reason,
                "updated_at": datetime.utcnow()
            }

            success = await self.complaint_repo.update(complaint_id, update_data)
            if not success:
                raise CivifixException("Failed to reject complaint")

            history_data = {
                "complaint_id": self._normalize_id(complaint_id),
                "action": "REJECTED",
                "old_status": ComplaintStatus.APPROVAL,
                "new_status": ComplaintStatus.WORKING,
                "performed_by": self._normalize_id(inspector_id),
                "role": user_role,
                "remarks": reject_data.reason,
                "timestamp": datetime.utcnow()
            }
            await self.complaint_repo.add_history(history_data)

            if self.notification_service:
                await self.notification_service.notify_complaint_rejected(
                    complaint_id,
                    str(complaint.get("worker_id")),
                    reject_data.reason
                )

            updated = await self.complaint_repo.get_by_id(complaint_id)
            
            logger.info(f"Complaint {complaint_id} rejected by inspector {inspector_id}")
            return self._format_complaint(updated)

        except CivifixException:
            raise
        except Exception as e:
            logger.error(f"Error rejecting complaint: {str(e)}")
            raise CivifixException("Failed to reject complaint", status_code=500)

    async def get_user_complaints(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 10,
        status: Optional[str] = None
    ) -> dict:
        """Get complaints for a citizen"""
        try:
            skip = (page - 1) * limit
            
            query = {"user_id": self._normalize_id(user_id)}
            if status:
                query["status"] = status
            
            complaints, total = await self.complaint_repo.search(
                query,
                skip=skip,
                limit=limit
            )

            formatted = [self._format_complaint(c) for c in complaints]
            
            return {
                "data": formatted,
                "total": total,
                "page": page,
                "limit": limit,
                "pages": (total + limit - 1) // limit
            }
        except Exception as e:
            logger.error(f"Error fetching user complaints: {str(e)}")
            raise CivifixException("Failed to fetch complaints", status_code=500)

    async def get_ward_complaints(
        self,
        ward_id: str,
        page: int = 1,
        limit: int = 10,
        status: Optional[str] = None
    ) -> dict:
        """Get complaints for a ward"""
        try:
            skip = (page - 1) * limit
            
            complaints, total = await self.complaint_repo.get_by_ward(
                ward_id,
                skip=skip,
                limit=limit,
                status=status
            )

            formatted = [self._format_complaint(c) for c in complaints]
            
            return {
                "data": formatted,
                "total": total,
                "page": page
            }
        except Exception as e:
            logger.error(f"Error fetching ward complaints: {str(e)}")
            raise CivifixException("Failed to fetch ward complaints", status_code=500)

    async def get_inspector_dashboard(
        self,
        inspector_id: str
    ) -> dict:
        """Get inspector dashboard stats"""
        try:
            complaints, total = await self.complaint_repo.get_by_inspector(
                inspector_id,
                limit=100
            )

            stats = {
                "total": total,
                "open": len([c for c in complaints if c.get("status") == ComplaintStatus.OPEN]),
                "working": len([c for c in complaints if c.get("status") == ComplaintStatus.WORKING]),
                "pending_approval": len([c for c in complaints if c.get("status") == ComplaintStatus.APPROVAL]),
                "closed": len([c for c in complaints if c.get("status") == ComplaintStatus.CLOSED])
            }

            recent = [self._format_complaint(c) for c in complaints[:5]]
            
            return {
                "stats": stats,
                "recent_complaints": recent
            }
        except Exception as e:
            logger.error(f"Error getting inspector dashboard: {str(e)}")
            raise CivifixException("Failed to get dashboard", status_code=500)

    @staticmethod
    def _generate_complaint_id() -> str:
        """Generate unique complaint ID"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        unique_suffix = str(uuid.uuid4())[:8].upper()
        return f"CIVI-{timestamp}-{unique_suffix}"

    def _format_complaint(self, complaint: dict) -> dict:
        """Format complaint document for response"""
        if not complaint:
            return None
        
        return {
            "_id": str(complaint.get("_id", "")),
            "complaint_id": complaint.get("complaint_id"),
            "user_id": str(complaint.get("user_id", "")),
            "district_id": str(complaint.get("district_id", "")),
            "ward_id": str(complaint.get("ward_id", "")),
            "inspector_id": str(complaint.get("inspector_id", "")) if complaint.get("inspector_id") else None,
            "worker_id": str(complaint.get("worker_id", "")) if complaint.get("worker_id") else None,
            "complaint_type": complaint.get("complaint_type"),
            "description": complaint.get("description"),
            "status": complaint.get("status"),
            "priority": complaint.get("priority"),
            "latitude": complaint.get("latitude"),
            "longitude": complaint.get("longitude"),
            "address": complaint.get("address"),
            "image_urls": complaint.get("image_urls", []),
            "proof_images": complaint.get("proof_images", []),
            "citizen_note": complaint.get("citizen_note"),
            "inspector_note": complaint.get("inspector_note"),
            "worker_note": complaint.get("worker_note"),
            "rejection_reason": complaint.get("rejection_reason"),
            "deadline": complaint.get("deadline"),
            "created_at": complaint.get("created_at"),
            "updated_at": complaint.get("updated_at"),
            "closed_at": complaint.get("closed_at")
        }

    def _format_history(self, history: dict) -> dict:
        """Format history document for response"""
        if not history:
            return None
        
        return {
            "_id": str(history.get("_id", "")),
            "complaint_id": str(history.get("complaint_id", "")),
            "action": history.get("action"),
            "old_status": history.get("old_status"),
            "new_status": history.get("new_status"),
            "performed_by": str(history.get("performed_by", "")),
            "role": history.get("role"),
            "remarks": history.get("remarks"),
            "timestamp": history.get("timestamp")
        }
