"""Inspector API routes"""
from fastapi import APIRouter, Depends, status, HTTPException, Query
from typing import Dict, Any
from bson import ObjectId
from datetime import datetime
import logging
import random

from app.core.response import ResponseHandler
from app.dependencies.auth_dependency import get_current_user
from app.dependencies.role_dependency import require_role
from app.db.mongodb import db

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get(
    "/dashboard",
    summary="Get inspector dashboard stats",
    dependencies=[Depends(require_role("INSPECTOR"))]
)
async def get_inspector_dashboard(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get dashboard statistics for an inspector"""
    try:
        inspector_id = ObjectId(current_user["user_id"])
        
        # Determine the ward
        ward = await db.wards.find_one({"inspector_id": inspector_id, "is_active": True})
        if not ward:
            return ResponseHandler.success(
                message="No ward assigned",
                data={
                    "assigned_count": 0, "pending_inspections": 0, "in_progress_count": 0,
                    "completed_today": 0, "high_priority_count": 0, "recent_complaints": []
                }
            )
            
        ward_id = ward["_id"]
        
        # Calculate stats
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        assigned_count = await db.complaints.count_documents({"ward_id": ward_id, "status": "ASSIGNED"})
        pending_inspections = await db.complaints.count_documents({"ward_id": ward_id, "status": {"$in": ["PENDING", "OPEN"]}})
        in_progress = await db.complaints.count_documents({"ward_id": ward_id, "status": {"$in": ["ACCEPTED", "IN_PROGRESS", "FIELD_VISIT"]}})
        completed_today = await db.complaints.count_documents({"ward_id": ward_id, "status": {"$in": ["RESOLVED", "CLOSED"]}, "updated_at": {"$gte": today}})
        high_priority = await db.complaints.count_documents({"ward_id": ward_id, "priority": {"$in": ["HIGH", "CRITICAL"]}, "status": {"$nin": ["RESOLVED", "CLOSED", "REJECTED"]}})
        
        # Get a few recent complaints needing action
        recent = await db.complaints.find(
            {"ward_id": ward_id, "status": {"$nin": ["RESOLVED", "CLOSED", "REJECTED"]}}
        ).sort("created_at", -1).limit(5).to_list(length=5)
        
        recent_formatted = []
        for c in recent:
            recent_formatted.append({
                "_id": str(c["_id"]),
                "complaint_id": c.get("complaint_id"),
                "title": c.get("title", c.get("complaint_type", "")),
                "status": c.get("status"),
                "priority": c.get("priority", "MEDIUM"),
                "created_at": c.get("created_at").isoformat() if c.get("created_at") else None
            })
            
        return ResponseHandler.success(
            message="Dashboard stats retrieved",
            data={
                "assigned_count": assigned_count,
                "pending_inspections": pending_inspections,
                "in_progress_count": in_progress,
                "completed_today": completed_today,
                "high_priority_count": high_priority,
                "recent_complaints": recent_formatted
            }
        )
    except Exception as e:
        logger.error(f"Error fetching inspector dashboard: {str(e)}")
        return ResponseHandler.error(
            message="Failed to retrieve dashboard stats",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )



@router.get(
    "/complaints",
    summary="Get ward complaints",
    dependencies=[Depends(require_role("INSPECTOR"))]
)
async def get_ward_complaints(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None, description="Comma-separated statuses"),
    priority: str = Query(None),
    search_query: str = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get complaints for inspector's ward with advanced filters"""
    try:
        # Get inspector's ward
        ward = await db.wards.find_one({
            "inspector_id": ObjectId(current_user["user_id"]),
            "is_active": True
        })

        if not ward:
            return ResponseHandler.error(
                message="Inspector not assigned to any ward",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        query = {
            "ward_id": ward["_id"]
        }
        
        if status:
            statuses = [s.strip() for s in status.split(',')]
            query["status"] = {"$in": statuses}
            
        if priority:
            query["priority"] = priority
            
        if search_query:
            # Case-insensitive search on title or complaint_id
            query["$or"] = [
                {"complaint_id": {"$regex": search_query, "$options": "i"}},
                {"title": {"$regex": search_query, "$options": "i"}},
                {"complaint_type": {"$regex": search_query, "$options": "i"}}
            ]

        skip = (page - 1) * limit
        complaints = await db.complaints.find(query)\
            .sort("created_at", -1)\
            .skip(skip)\
            .limit(limit)\
            .to_list(length=limit)

        total = await db.complaints.count_documents(query)

        result = []
        for complaint in complaints:
            result.append({
                "_id": str(complaint["_id"]),
                "complaint_id": complaint.get("complaint_id"),
                "title": complaint.get("title", complaint.get("complaint_type", "")),
                "description": complaint.get("description"),
                "status": complaint.get("status"),
                "priority": complaint.get("priority", "MEDIUM"),
                "location": complaint.get("location"),
                "created_at": complaint.get("created_at").isoformat() if complaint.get("created_at") else None,
                "updated_at": complaint.get("updated_at").isoformat() if complaint.get("updated_at") else None
            })

        return ResponseHandler.success(
            message="Complaints retrieved",
            data={
                "complaints": result,
                "page": page,
                "limit": limit,
                "total": total,
                "pages": (total + limit - 1) // limit
            }
        )
    except Exception as e:
        logger.error(f"Error fetching ward complaints: {str(e)}")
        return ResponseHandler.error(
            message="Failed to retrieve complaints",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get(
    "/workers",
    summary="Get ward workers",
    dependencies=[Depends(require_role("INSPECTOR"))]
)
async def get_ward_workers(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get workers assigned to inspector's ward"""
    try:
        # Get inspector's ward
        inspector = await db.users.find_one({"_id": ObjectId(current_user["user_id"])})

        if not inspector or not inspector.get("ward_id"):
            return ResponseHandler.error(
                message="Inspector not assigned to any ward",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        workers = await db.users.find({
            "ward_id": ObjectId(inspector["ward_id"]),
            "role": "WORKER"
        }).to_list(length=1000)

        result = []
        for worker in workers:
            # Count active complaints for this worker
            active_tasks = await db.complaints.count_documents({
                "assigned_to": ObjectId(worker["_id"]),
                "status": {"$in": ["PENDING", "IN_PROGRESS"]}
            })

            result.append({
                "_id": str(worker["_id"]),
                "name": worker.get("name"),
                "email": worker.get("email"),
                "active_tasks": active_tasks,
                "status": worker.get("status", "ACTIVE")
            })

        return ResponseHandler.success(
            message="Workers retrieved",
            data=result
        )
    except Exception as e:
        logger.error(f"Error fetching ward workers: {str(e)}")
        return ResponseHandler.error(
            message="Failed to retrieve workers",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.put(
    "/complaints/{complaint_id}/start-work",
    summary="Start work on a complaint",
    dependencies=[Depends(require_role("INSPECTOR"))]
)
async def start_work(
    complaint_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Move complaint from OPEN to IN_PROGRESS and auto-assign a random worker"""
    try:
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
        if not complaint:
            return ResponseHandler.error(
                message="Complaint not found",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if complaint.get("status") != "OPEN":
            return ResponseHandler.error(
                message="Only OPEN complaints can be started",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Find the inspector's ward
        ward = await db.wards.find_one({
            "inspector_id": ObjectId(current_user["user_id"]),
            "is_active": True
        })

        # Randomly assign a worker from the ward if any exist
        assigned_worker_id = None
        if ward:
            workers = await db.users.find({
                "ward_id": ward["_id"],
                "role": "WORKER"
            }).to_list(length=1000)
            if workers:
                selected = random.choice(workers)
                assigned_worker_id = selected["_id"]

        update_fields: Dict[str, Any] = {
            "status": "IN_PROGRESS",
            "updated_at": datetime.utcnow()
        }
        if assigned_worker_id:
            update_fields["worker_id"] = assigned_worker_id

        await db.complaints.update_one(
            {"_id": ObjectId(complaint_id)},
            {"$set": update_fields}
        )

        await db.complaint_history.insert_one({
            "complaint_id": ObjectId(complaint_id),
            "action": "STATUS_CHANGED",
            "old_status": "OPEN",
            "new_status": "IN_PROGRESS",
            "performed_by": ObjectId(current_user["user_id"]),
            "role": "INSPECTOR",
            "remarks": "Work started by inspector",
            "timestamp": datetime.utcnow()
        })

        return ResponseHandler.success(
            message="Complaint moved to IN_PROGRESS",
            data={"complaint_id": complaint_id, "status": "IN_PROGRESS"}
        )
    except Exception as e:
        logger.error(f"Error starting work on complaint: {str(e)}")
        return ResponseHandler.error(
            message="Failed to start work",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.put(
    "/complaints/{complaint_id}/reject",
    summary="Reject a complaint",
    dependencies=[Depends(require_role("INSPECTOR"))]
)
async def reject_complaint_simplified(
    complaint_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Move complaint from OPEN to REJECTED"""
    try:
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
        if not complaint:
            return ResponseHandler.error(
                message="Complaint not found",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if complaint.get("status") != "OPEN":
            return ResponseHandler.error(
                message="Only OPEN complaints can be rejected here",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        await db.complaints.update_one(
            {"_id": ObjectId(complaint_id)},
            {"$set": {"status": "REJECTED", "updated_at": datetime.utcnow()}}
        )

        await db.complaint_history.insert_one({
            "complaint_id": ObjectId(complaint_id),
            "action": "REJECTED",
            "old_status": "OPEN",
            "new_status": "REJECTED",
            "performed_by": ObjectId(current_user["user_id"]),
            "role": "INSPECTOR",
            "remarks": "Complaint rejected by inspector after physical inspection",
            "timestamp": datetime.utcnow()
        })

        return ResponseHandler.success(
            message="Complaint rejected successfully",
            data={"complaint_id": complaint_id, "status": "REJECTED"}
        )
    except Exception as e:
        logger.error(f"Error rejecting complaint: {str(e)}")
        return ResponseHandler.error(
            message="Failed to reject complaint",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


from pydantic import BaseModel
from typing import List, Optional

class ResolveComplaintRequest(BaseModel):
    proof_images: List[str]
    note: Optional[str] = None

@router.put(
    "/complaints/{complaint_id}/resolve",
    summary="Resolve a complaint",
    dependencies=[Depends(require_role("INSPECTOR"))]
)
async def resolve_complaint(
    complaint_id: str,
    payload: ResolveComplaintRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Move complaint to RESOLVED with proof images"""
    try:
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
        if not complaint:
            return ResponseHandler.error(
                message="Complaint not found",
                status_code=status.HTTP_404_NOT_FOUND
            )

        if not payload.proof_images or len(payload.proof_images) == 0:
            return ResponseHandler.error(
                message="Resolution proof images are required",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        await db.complaints.update_one(
            {"_id": ObjectId(complaint_id)},
            {"$set": {
                "status": "RESOLVED",
                "proof_images": payload.proof_images,
                "closed_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )

        await db.complaint_history.insert_one({
            "complaint_id": ObjectId(complaint_id),
            "action": "STATUS_CHANGED",
            "old_status": complaint.get("status"),
            "new_status": "RESOLVED",
            "performed_by": ObjectId(current_user["user_id"]),
            "role": "INSPECTOR",
            "remarks": payload.note or "Issue verified and resolved by inspector",
            "timestamp": datetime.utcnow()
        })

        return ResponseHandler.success(
            message="Complaint resolved successfully",
            data={"complaint_id": complaint_id, "status": "RESOLVED"}
        )
    except Exception as e:
        logger.error(f"Error resolving complaint: {str(e)}")
        return ResponseHandler.error(
            message="Failed to resolve complaint",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class StatusUpdateRequest(BaseModel):
    status: str
    note: Optional[str] = None

@router.put(
    "/complaints/{complaint_id}/status",
    summary="Update complaint status",
    dependencies=[Depends(require_role("INSPECTOR"))]
)
async def update_complaint_status(
    complaint_id: str,
    payload: StatusUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Unified endpoint to update complaint status"""
    try:
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
        if not complaint:
            return ResponseHandler.error(
                message="Complaint not found",
                status_code=status.HTTP_404_NOT_FOUND
            )

        new_status = payload.status
        old_status = complaint.get("status")

        if new_status not in ["ASSIGNED", "ACCEPTED", "IN_PROGRESS", "FIELD_VISIT", "RESOLVED", "REJECTED"]:
            return ResponseHandler.error(
                message=f"Invalid status transition to {new_status}",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        await db.complaints.update_one(
            {"_id": ObjectId(complaint_id)},
            {"$set": {
                "status": new_status,
                "updated_at": datetime.utcnow()
            }}
        )

        await db.complaint_history.insert_one({
            "complaint_id": ObjectId(complaint_id),
            "action": "STATUS_CHANGED",
            "old_status": old_status,
            "new_status": new_status,
            "performed_by": ObjectId(current_user["user_id"]),
            "role": "INSPECTOR",
            "remarks": payload.note or f"Status updated to {new_status}",
            "timestamp": datetime.utcnow()
        })

        return ResponseHandler.success(
            message=f"Complaint status updated to {new_status}",
            data={"complaint_id": complaint_id, "status": new_status}
        )
    except Exception as e:
        logger.error(f"Error updating complaint status: {str(e)}")
        return ResponseHandler.error(
            message="Failed to update complaint status",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class NoteRequest(BaseModel):
    note: str

@router.post(
    "/complaints/{complaint_id}/notes",
    summary="Add an inspector note",
    dependencies=[Depends(require_role("INSPECTOR"))]
)
async def add_inspector_note(
    complaint_id: str,
    payload: NoteRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Add a note to a complaint"""
    try:
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
        if not complaint:
            return ResponseHandler.error(
                message="Complaint not found",
                status_code=status.HTTP_404_NOT_FOUND
            )

        new_note = {
            "id": str(ObjectId()),
            "text": payload.note,
            "inspector_id": str(current_user["user_id"]),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        await db.complaints.update_one(
            {"_id": ObjectId(complaint_id)},
            {"$push": {"inspector_notes": new_note}, "$set": {"updated_at": datetime.utcnow()}}
        )

        await db.complaint_history.insert_one({
            "complaint_id": ObjectId(complaint_id),
            "action": "NOTE_ADDED",
            "performed_by": ObjectId(current_user["user_id"]),
            "role": "INSPECTOR",
            "remarks": "Added inspection note",
            "timestamp": datetime.utcnow()
        })

        return ResponseHandler.success(
            message="Note added successfully",
            data={"note": new_note}
        )
    except Exception as e:
        logger.error(f"Error adding note: {str(e)}")
        return ResponseHandler.error(
            message="Failed to add note",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class ChecklistRequest(BaseModel):
    checklist: Dict[str, bool]

@router.put(
    "/complaints/{complaint_id}/checklist",
    summary="Update field checklist",
    dependencies=[Depends(require_role("INSPECTOR"))]
)
async def update_checklist(
    complaint_id: str,
    payload: ChecklistRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update field visit checklist"""
    try:
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
        if not complaint:
            return ResponseHandler.error(
                message="Complaint not found",
                status_code=status.HTTP_404_NOT_FOUND
            )

        await db.complaints.update_one(
            {"_id": ObjectId(complaint_id)},
            {"$set": {"field_checklist": payload.checklist, "updated_at": datetime.utcnow()}}
        )

        return ResponseHandler.success(
            message="Checklist updated successfully",
            data={"checklist": payload.checklist}
        )
    except Exception as e:
        logger.error(f"Error updating checklist: {str(e)}")
        return ResponseHandler.error(
            message="Failed to update checklist",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
