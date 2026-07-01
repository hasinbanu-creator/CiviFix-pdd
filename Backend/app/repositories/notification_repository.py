"""Notification repository for data access"""
from typing import Optional, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class NotificationRepository:
    """Repository for notification operations"""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db["notifications"]

    async def create(self, notification_data: dict) -> str:
        """Create a new notification"""
        try:
            result = await self.collection.insert_one(notification_data)
            logger.info(f"Notification created: {result.inserted_id}")
            return str(result.inserted_id)
        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")
            raise

    async def get_user_notifications(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 20,
        is_read: Optional[bool] = None
    ) -> tuple[List[dict], int]:
        """Get notifications for a user"""
        try:
            query = {"user_id": ObjectId(user_id)}
            if is_read is not None:
                query["is_read"] = is_read
                
            total = await self.collection.count_documents(query)
            
            notifications = await self.collection.find(
                query
            ).skip(skip).limit(limit).sort("created_at", -1).to_list(length=limit)
            
            return notifications, total
        except Exception as e:
            logger.error(f"Error fetching notifications: {str(e)}")
            raise

    async def mark_as_sent(self, notification_id: str) -> bool:
        """Mark notification as sent"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(notification_id)},
                {
                    "$set": {
                        "status": "SENT",
                        "sent_at": datetime.utcnow()
                    }
                }
            )
            return result.matched_count > 0
        except Exception as e:
            logger.error(f"Error updating notification: {str(e)}")
            raise

    async def mark_as_delivered(self, notification_id: str) -> bool:
        """Mark notification as delivered"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(notification_id)},
                {
                    "$set": {
                        "status": "DELIVERED",
                        "delivered_at": datetime.utcnow()
                    }
                }
            )
            return result.matched_count > 0
        except Exception as e:
            logger.error(f"Error updating notification: {str(e)}")
            raise

    async def mark_as_failed(self, notification_id: str, error: str) -> bool:
        """Mark notification as failed"""
        try:
            result = await self.collection.update_one(
                {"_id": ObjectId(notification_id)},
                {
                    "$set": {
                        "status": "FAILED",
                        "last_error": error
                    },
                    "$inc": {"retry_count": 1}
                }
            )
            return result.matched_count > 0
        except Exception as e:
            logger.error(f"Error updating notification: {str(e)}")
            raise

    async def get_pending_notifications(self, limit: int = 100) -> List[dict]:
        """Get pending notifications for processing"""
        try:
            notifications = await self.collection.find(
                {"status": "PENDING"}
            ).limit(limit).to_list(length=limit)
            
            return notifications
        except Exception as e:
            logger.error(f"Error fetching pending notifications: {str(e)}")
            return []

    async def delete_old_delivered(self, days: int = 30) -> int:
        """Delete delivered notifications older than specified days"""
        try:
            from datetime import timedelta
            threshold = datetime.utcnow() - timedelta(days=days)
            
            result = await self.collection.delete_many({
                "status": "DELIVERED",
                "delivered_at": {"$lt": threshold}
            })
            
            logger.info(f"Deleted {result.deleted_count} old notifications")
            return result.deleted_count
        except Exception as e:
            logger.error(f"Error deleting old notifications: {str(e)}")
            raise
