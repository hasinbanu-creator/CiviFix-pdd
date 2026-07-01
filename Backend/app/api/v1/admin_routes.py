"""Admin API routes for user and role management"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from typing import Dict, Any, List
from app.schemas.user_schema import (
    CreateAdminSchema,
    UserResponseSchema,
    RoleEnum
)
from app.schemas.common_schema import SuccessSchema
from app.core.response import ResponseHandler
from app.core.exceptions import (
    UserAlreadyExistsException,
    UserNotFoundException,
    DistrictAccessException,
    ValidationException
)
from app.dependencies.auth_dependency import get_current_admin, get_current_super_admin
from app.dependencies.role_dependency import require_role
from app.services.user_service import UserService
from app.services.role_service import RoleService
from app.repositories.user_repository import UserRepository
from app.models.user_model import admin_user_document
from app.db.mongodb import db
from app.utils.helpers import serialize_mongo_documents

router = APIRouter()


# =========================
# CREATE INSPECTOR/WORKER/ADMIN
# =========================

@router.post(
    "/users",
    summary="Create new admin/inspector/worker",
    dependencies=[Depends(require_role("DISTRICT_ADMIN", "SUPER_ADMIN"))]
)
async def create_user(
    payload: CreateAdminSchema,
    current_user: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Create a new user with admin/inspector/worker role.
    
    Only DISTRICT_ADMIN can create users in their district.
    SUPER_ADMIN can create users in any district.
    """
    try:
        # Validate district access
        user_role = current_user.get("role")
        user_district = current_user.get("district")
        
        if user_role == "DISTRICT_ADMIN" and user_district != payload.district:
            raise DistrictAccessException("Can only create users in your district")
        
        # Check if user already exists
        existing = await db.users.find_one({
            "$or": [
                {"email": payload.email},
                {"mobile_number": payload.mobile_number}
            ]
        })
        
        if existing:
            raise UserAlreadyExistsException()
        
        # Create user
        user_data = {
            "name": payload.name,
            "email": payload.email,
            "mobile_number": payload.mobile_number,
            "address": payload.address,
            "district": payload.district or user_district,
            "role": payload.role,
            "permissions": [],
            "is_verified": True,
            "is_active": True,
            "status": "ACTIVE",
            "created_by": current_user.get("user_id"),
            "created_at": __import__('datetime').datetime.utcnow(),
            "updated_at": __import__('datetime').datetime.utcnow()
        }
        
        result = await db.users.insert_one(user_data)
        
        return ResponseHandler.success(
            message=f"{payload.role} created successfully",
            data={"user_id": str(result.inserted_id)},
            status_code=status.HTTP_201_CREATED
        )
    
    except (UserAlreadyExistsException, DistrictAccessException) as e:
        return ResponseHandler.error(
            message=e.message,
            status_code=e.status_code
        )
    except Exception as e:
        return ResponseHandler.error(
            message="User creation failed",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================
# GET USERS BY DISTRICT
# =========================

@router.get(
    "/users",
    summary="Get users in district",
    dependencies=[Depends(require_role("DISTRICT_ADMIN", "SUPER_ADMIN"))]
)
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    role: str = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Get all users in the district.
    
    DISTRICT_ADMIN can only see users in their district.
    SUPER_ADMIN can see all users.
    """
    try:
        user_role = current_user.get("role")
        user_district = current_user.get("district")
        
        if user_role == "SUPER_ADMIN":
            if role:
                users = await UserService.get_users_by_role(role, skip, limit)
            else:
                # Get all users
                users = []
        else:
            users = await UserService.get_district_users(
                user_district, # type: ignore
                user_district, # pyright: ignore[reportArgumentType]
                skip,
                limit
            )
        
        return ResponseHandler.success(
            message="Users retrieved",
            data=users
        )
    
    except Exception as e:
        return ResponseHandler.error(
            message="Failed to retrieve users",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================
# UPDATE USER ROLE
# =========================

@router.patch(
    "/users/{user_id}/role",
    summary="Update user role",
    dependencies=[Depends(require_role("DISTRICT_ADMIN", "SUPER_ADMIN"))]
)
async def update_user_role(
    user_id: str,
    new_role: RoleEnum,
    current_user: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Update a user's role.
    
    Only DISTRICT_ADMIN and SUPER_ADMIN can update roles.
    """
    try:
        user = await UserRepository.find_by_id(user_id)
        if not user:
            raise UserNotFoundException()
        
        # Check district access
        if (current_user.get("role") == "DISTRICT_ADMIN" and
            user.get("district") != current_user.get("district")):
            raise DistrictAccessException()
        
        await UserService.assign_role(user_id, new_role)
        
        return ResponseHandler.success(
            message=f"User role updated to {new_role}"
        )
    
    except (UserNotFoundException, DistrictAccessException) as e:
        return ResponseHandler.error(
            message=e.message,
            status_code=e.status_code
        )
    except Exception as e:
        return ResponseHandler.error(
            message="Failed to update role",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class EditUserSchema(BaseModel):
    name: str = None
    mobile_number: str = None
    district: str = None
    ward_id: str = None

@router.put(
    "/users/{user_id}",
    summary="Edit user details",
    dependencies=[Depends(require_role("DISTRICT_ADMIN", "SUPER_ADMIN"))]
)
async def edit_user(
    user_id: str,
    payload: EditUserSchema,
    current_user: Dict[str, Any] = Depends(get_current_admin)
):
    """Edit user details (Name, Mobile, District, Ward)"""
    try:
        from bson import ObjectId
        from datetime import datetime
        
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return ResponseHandler.error("User not found", status.HTTP_404_NOT_FOUND)
            
        if current_user.get("role") == "DISTRICT_ADMIN":
            if user.get("district") != current_user.get("district"):
                return ResponseHandler.error("Forbidden: District mismatch", status.HTTP_403_FORBIDDEN)
                
        update_data = {}
        if payload.name: update_data["name"] = payload.name
        if payload.mobile_number: update_data["mobile_number"] = payload.mobile_number
        
        if current_user.get("role") == "SUPER_ADMIN" and payload.district:
            update_data["district"] = payload.district
            
        if payload.ward_id:
            update_data["ward_id"] = ObjectId(payload.ward_id)
            
        update_data["updated_at"] = datetime.utcnow()
        
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        # Log to audit_logs
        await db.audit_logs.insert_one({
            "action": "EDIT_USER",
            "user_id": ObjectId(current_user["user_id"]),
            "role": current_user.get("role"),
            "target_id": str(user_id),
            "target_type": "user",
            "details": f"Updated fields: {list(update_data.keys())}",
            "timestamp": datetime.utcnow()
        })
        
        return ResponseHandler.success("User updated successfully")
    except Exception as e:
        import logging
        logging.error(f"Error editing user: {str(e)}")
        return ResponseHandler.error(
            message="Failed to edit user",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================
# SUSPEND/ACTIVATE USER
# =========================

@router.patch(
    "/users/{user_id}/suspend",
    summary="Suspend user account",
    dependencies=[Depends(require_role("DISTRICT_ADMIN", "SUPER_ADMIN"))]
)
async def suspend_user(
    user_id: str,
    current_user: Dict[str, Any] = Depends(get_current_admin)
):
    """Suspend a user account"""
    try:
        user = await UserRepository.find_by_id(user_id)
        if not user:
            raise UserNotFoundException()
        
        if (current_user.get("role") == "DISTRICT_ADMIN" and
            user.get("district") != current_user.get("district")):
            raise DistrictAccessException()
        
        await UserService.suspend_user(user_id)
        
        return ResponseHandler.success(
            message="User suspended successfully"
        )
    
    except (UserNotFoundException, DistrictAccessException) as e:
        return ResponseHandler.error(
            message=e.message,
            status_code=e.status_code
        )
    except Exception as e:
        return ResponseHandler.error(
            message="Failed to suspend user",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.patch(
    "/users/{user_id}/activate",
    summary="Activate user account",
    dependencies=[Depends(require_role("DISTRICT_ADMIN", "SUPER_ADMIN"))]
)
async def activate_user(
    user_id: str,
    current_user: Dict[str, Any] = Depends(get_current_admin)
):
    """Activate a user account"""
    try:
        user = await UserRepository.find_by_id(user_id)
        if not user:
            raise UserNotFoundException()
        
        if (current_user.get("role") == "DISTRICT_ADMIN" and
            user.get("district") != current_user.get("district")):
            raise DistrictAccessException()
        
        await UserService.activate_user(user_id)
        
        return ResponseHandler.success(
            message="User activated successfully"
        )
    
    except (UserNotFoundException, DistrictAccessException) as e:
        return ResponseHandler.error(
            message=e.message,
            status_code=e.status_code
        )
    except Exception as e:
        return ResponseHandler.error(
            message="Failed to activate user",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================
# MANAGE ROLES (SUPER_ADMIN ONLY)
# =========================

@router.post(
    "/roles",
    summary="Create custom role",
    dependencies=[Depends(require_role("SUPER_ADMIN"))]
)
async def create_role(
    name: str,
    description: str,
    permissions: List[str],
    district: str = None, # pyright: ignore[reportArgumentType]
    current_user: Dict[str, Any] = Depends(get_current_super_admin)
):
    """Create a custom role"""
    try:
        role_id = await RoleService.create_custom_role(
            name=name,
            description=description,
            permissions=permissions,
            district=district
        )
        
        return ResponseHandler.success(
            message="Role created successfully",
            data={"role_id": role_id},
            status_code=status.HTTP_201_CREATED
        )
    
    except Exception as e:
        return ResponseHandler.error(
            message="Failed to create role",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get(
    "/roles",
    summary="Get all roles",
    dependencies=[Depends(require_role("SUPER_ADMIN"))]
)
async def get_roles(
    current_user: Dict[str, Any] = Depends(get_current_super_admin)
):
    """Get all roles"""
    try:
        from app.repositories.role_repository import RoleRepository
        roles = await RoleRepository.get_all_roles()
        roles = serialize_mongo_documents(roles)
        
        return ResponseHandler.success(
            message="Roles retrieved",
            data=roles
        )
    
    except Exception as e:
        return ResponseHandler.error(
            message="Failed to retrieve roles",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================
# ADMIN DASHBOARD STATS
# =========================

@router.get(
    "/stats",
    summary="Get admin dashboard statistics",
    dependencies=[Depends(require_role("SUPER_ADMIN"))]
)
async def get_admin_stats(
    current_user: Dict[str, Any] = Depends(get_current_super_admin)
):
    """Get overall admin statistics (SUPER_ADMIN only)"""
    try:
        from bson import ObjectId

        total_districts = await db.districts.count_documents({})
        total_wards = await db.wards.count_documents({})
        total_inspectors = await db.users.count_documents({"role": "INSPECTOR"})
        total_workers = await db.users.count_documents({"role": "WORKER"})
        total_complaints = await db.complaints.count_documents({})

        return ResponseHandler.success(
            message="Statistics retrieved",
            data={
                "total_districts": total_districts,
                "total_wards": total_wards,
                "total_inspectors": total_inspectors,
                "total_workers": total_workers,
                "total_complaints": total_complaints
            }
        )
    except Exception as e:
        return ResponseHandler.error(
            message="Failed to retrieve statistics",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get(
    "/inspectors",
    summary="Get inspectors",
    dependencies=[Depends(require_role("DISTRICT_ADMIN", "SUPER_ADMIN"))]
)
async def get_inspectors(
    current_user: Dict[str, Any] = Depends(get_current_admin)
):
    """Get all inspectors (filtered by district for DISTRICT_ADMIN)"""
    try:
        query = {"role": "INSPECTOR"}

        # DISTRICT_ADMIN can only see inspectors in their district
        if current_user.get("role") == "DISTRICT_ADMIN":
            query["district"] = current_user.get("district")

        inspectors = await db.users.find(query).to_list(length=1000)

        result = []
        for inspector in inspectors:
            # Get ward info if exists
            ward = None
            if inspector.get("ward_id"):
                ward = await db.wards.find_one({"_id": ObjectId(inspector["ward_id"])})

            result.append({
                "_id": str(inspector["_id"]),
                "name": inspector.get("name"),
                "email": inspector.get("email"),
                "ward_name": ward.get("ward_name") if ward else None,
                "status": inspector.get("status", "ACTIVE")
            })

        return ResponseHandler.success(
            message="Inspectors retrieved",
            data=result
        )
    except Exception as e:
        return ResponseHandler.error(
            message="Failed to retrieve inspectors",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get(
    "/workers",
    summary="Get workers",
    dependencies=[Depends(require_role("DISTRICT_ADMIN", "SUPER_ADMIN"))]
)
async def get_workers(
    current_user: Dict[str, Any] = Depends(get_current_admin)
):
    """Get all workers (filtered by district for DISTRICT_ADMIN)"""
    try:
        from bson import ObjectId

        query = {"role": "WORKER"}

        # DISTRICT_ADMIN can only see workers in their district
        if current_user.get("role") == "DISTRICT_ADMIN":
            query["district"] = current_user.get("district")

        workers = await db.users.find(query).to_list(length=1000)

        result = []
        for worker in workers:
            # Get ward info if exists
            ward = None
            if worker.get("ward_id"):
                ward = await db.wards.find_one({"_id": ObjectId(worker["ward_id"])})

            # Count active complaints assigned to this worker
            active_tasks = await db.complaints.count_documents({
                "assigned_to": ObjectId(worker["_id"]),
                "status": {"$in": ["PENDING", "IN_PROGRESS"]}
            })

            result.append({
                "_id": str(worker["_id"]),
                "name": worker.get("name"),
                "email": worker.get("email"),
                "ward_name": ward.get("ward_name") if ward else None,
                "active_tasks": active_tasks
            })

        return ResponseHandler.success(
            message="Workers retrieved",
            data=result
        )
    except Exception as e:
        return ResponseHandler.error(
            message="Failed to retrieve workers",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@router.get(
    "/wards",
    summary="Get wards",
    dependencies=[Depends(require_role("DISTRICT_ADMIN", "SUPER_ADMIN"))]
)
async def get_wards(
    current_user: Dict[str, Any] = Depends(get_current_admin)
):
    """Get all wards (filtered by district for DISTRICT_ADMIN)"""
    try:
        from bson import ObjectId

        query = {}

        # DISTRICT_ADMIN can only see wards in their district
        if current_user.get("role") == "DISTRICT_ADMIN":
            query["district_id"] = ObjectId(current_user.get("district"))

        wards = await db.wards.find(query).to_list(length=1000)

        result = []
        for ward in wards:
            complaint_count = await db.complaints.count_documents({"ward_id": ward["_id"]})

            result.append({
                "_id": str(ward["_id"]),
                "ward_name": ward.get("ward_name"),
                "zone": ward.get("zone"),
                "complaint_count": complaint_count
            })

        return ResponseHandler.success(
            message="Wards retrieved",
            data=result
        )
    except Exception as e:
        return ResponseHandler.error(
            message="Failed to retrieve wards",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# =========================
# COMPLAINT MONITORING
# =========================

@router.get(
    "/complaints",
    summary="Monitor complaints",
    dependencies=[Depends(require_role("DISTRICT_ADMIN", "SUPER_ADMIN"))]
)
async def get_admin_complaints(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    priority: str = Query(None),
    ward_id: str = Query(None),
    search: str = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Get all complaints with filters.
    DISTRICT_ADMIN only sees complaints in their district.
    SUPER_ADMIN sees all.
    """
    try:
        from bson import ObjectId
        query = {}

        if current_user.get("role") == "DISTRICT_ADMIN":
            query["district_id"] = current_user.get("district")

        if status:
            statuses = [s.strip() for s in status.split(',')]
            query["status"] = {"$in": statuses}
            
        if priority:
            query["priority"] = priority
            
        if ward_id:
            query["ward_id"] = ObjectId(ward_id)
            
        if search:
            query["$or"] = [
                {"complaint_id": {"$regex": search, "$options": "i"}},
                {"title": {"$regex": search, "$options": "i"}}
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
                "status": complaint.get("status"),
                "priority": complaint.get("priority", "MEDIUM"),
                "district_id": complaint.get("district_id"),
                "ward_id": str(complaint.get("ward_id")) if complaint.get("ward_id") else None,
                "created_at": complaint.get("created_at").isoformat() if complaint.get("created_at") else None
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
        import logging
        logging.error(f"Error fetching admin complaints: {str(e)}")
        return ResponseHandler.error(
            message="Failed to retrieve complaints",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

from pydantic import BaseModel

class AssignInspectorRequest(BaseModel):
    inspector_id: str

@router.patch(
    "/complaints/{complaint_id}/assign",
    summary="Assign inspector to complaint",
    dependencies=[Depends(require_role("DISTRICT_ADMIN", "SUPER_ADMIN"))]
)
async def assign_complaint(
    complaint_id: str,
    payload: AssignInspectorRequest,
    current_user: Dict[str, Any] = Depends(get_current_admin)
):
    """Assign or reassign an inspector to a complaint"""
    try:
        from bson import ObjectId
        from datetime import datetime
        
        complaint = await db.complaints.find_one({"_id": ObjectId(complaint_id)})
        if not complaint:
            return ResponseHandler.error("Complaint not found", status.HTTP_404_NOT_FOUND)
            
        if current_user.get("role") == "DISTRICT_ADMIN":
            if complaint.get("district_id") != current_user.get("district"):
                return ResponseHandler.error("Forbidden: District mismatch", status.HTTP_403_FORBIDDEN)
                
        inspector = await db.users.find_one({"_id": ObjectId(payload.inspector_id), "role": "INSPECTOR"})
        if not inspector:
            return ResponseHandler.error("Inspector not found", status.HTTP_404_NOT_FOUND)
            
        old_status = complaint.get("status")
        new_status = "ASSIGNED"
        
        await db.complaints.update_one(
            {"_id": ObjectId(complaint_id)},
            {"$set": {
                "assigned_to": ObjectId(payload.inspector_id),
                "status": new_status,
                "updated_at": datetime.utcnow()
            }}
        )
        
        await db.complaint_history.insert_one({
            "complaint_id": ObjectId(complaint_id),
            "action": "ASSIGNED",
            "old_status": old_status,
            "new_status": new_status,
            "performed_by": ObjectId(current_user["user_id"]),
            "role": current_user.get("role"),
            "remarks": f"Assigned to inspector {inspector.get('name')}",
            "timestamp": datetime.utcnow()
        })
        
        # Log to audit_logs
        await db.audit_logs.insert_one({
            "action": "ASSIGN_COMPLAINT",
            "user_id": ObjectId(current_user["user_id"]),
            "role": current_user.get("role"),
            "target_id": str(complaint_id),
            "target_type": "complaint",
            "details": f"Assigned complaint to inspector {payload.inspector_id}",
            "timestamp": datetime.utcnow()
        })
        
        return ResponseHandler.success(
            message="Inspector assigned successfully",
            data={"complaint_id": complaint_id, "status": new_status}
        )
    except Exception as e:
        import logging
        logging.error(f"Error assigning complaint: {str(e)}")
        return ResponseHandler.error(
            message="Failed to assign inspector",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

from fastapi.responses import StreamingResponse
import io
import csv

@router.post(
    "/complaints/export",
    summary="Export complaints as CSV",
    dependencies=[Depends(require_role("DISTRICT_ADMIN", "SUPER_ADMIN"))]
)
async def export_complaints(
    current_user: Dict[str, Any] = Depends(get_current_admin)
):
    """Export complaints to CSV format"""
    try:
        query = {}
        if current_user.get("role") == "DISTRICT_ADMIN":
            query["district_id"] = current_user.get("district")
            
        complaints = await db.complaints.find(query).sort("created_at", -1).to_list(length=10000)
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow(["Complaint ID", "Title", "Type", "Status", "Priority", "District", "Created At", "Closed At"])
        
        for c in complaints:
            writer.writerow([
                c.get("complaint_id", ""),
                c.get("title", ""),
                c.get("complaint_type", ""),
                c.get("status", ""),
                c.get("priority", ""),
                c.get("district_id", ""),
                c.get("created_at", "").isoformat() if hasattr(c.get("created_at"), "isoformat") else "",
                c.get("closed_at", "").isoformat() if hasattr(c.get("closed_at"), "isoformat") else ""
            ])
            
        output.seek(0)
        
        # Log to audit_logs
        from datetime import datetime
        from bson import ObjectId
        await db.audit_logs.insert_one({
            "action": "EXPORT_COMPLAINTS",
            "user_id": ObjectId(current_user["user_id"]),
            "role": current_user.get("role"),
            "timestamp": datetime.utcnow()
        })
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=complaints_export_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
        )
    except Exception as e:
        import logging
        logging.error(f"Error exporting complaints: {str(e)}")
        return ResponseHandler.error(
            message="Failed to export complaints",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
