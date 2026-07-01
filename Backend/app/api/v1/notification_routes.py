from fastapi import APIRouter, Depends, Query, status
from typing import Dict, Any, Optional
from app.core.response import ResponseHandler
from app.dependencies.auth_dependency import get_current_user
from app.repositories.notification_repository import NotificationRepository
from app.db.mongodb import get_database

router = APIRouter()

def get_notification_repo(db=Depends(get_database)):
    return NotificationRepository(db)

@router.get(
    "",
    summary="Get user notifications",
    responses={
        200: {"description": "Notifications fetched successfully"}
    }
)
async def get_my_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    is_read: Optional[bool] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    repo: NotificationRepository = Depends(get_notification_repo)
):
    try:
        user_id = current_user.get("user_id")
        skip = (page - 1) * limit
        
        notifications, total = await repo.get_user_notifications(user_id, skip=skip, limit=limit, is_read=is_read)
        
        # Format response
        result = [
            {**n, "_id": str(n["_id"])} 
            for n in notifications
        ]
        
        return ResponseHandler.success(
            message="Notifications fetched successfully",
            data={
                "notifications": result,
                "total": total,
                "page": page,
                "limit": limit
            }
        )
    except Exception as e:
        return ResponseHandler.error(
            message="Failed to fetch notifications",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.put(
    "/{notification_id}/read",
    summary="Mark notification as read",
)
async def mark_notification_read(
    notification_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    repo: NotificationRepository = Depends(get_notification_repo)
):
    try:
        success = await repo.mark_as_read(notification_id)
        if success:
            return ResponseHandler.success(message="Notification marked as read")
        return ResponseHandler.error(message="Notification not found", status_code=404)
    except Exception as e:
        return ResponseHandler.error(
            message="Failed to update notification",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@router.put(
    "/read-all",
    summary="Mark all notifications as read",
)
async def mark_all_read(
    current_user: Dict[str, Any] = Depends(get_current_user),
    repo: NotificationRepository = Depends(get_notification_repo)
):
    try:
        user_id = current_user.get("user_id")
        await repo.collection.update_many(
            {"user_id": user_id, "is_read": False},
            {"$set": {"is_read": True}}
        )
        return ResponseHandler.success(message="All notifications marked as read")
    except Exception as e:
        return ResponseHandler.error(
            message="Failed to update notifications",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
