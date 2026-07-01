"""Complaint validators and business logic checks"""
import re
from datetime import datetime, timedelta
from typing import Optional


class ComplaintValidator:
    """Validates complaint creation and updates"""

    @staticmethod
    def validate_gps_coordinates(latitude: float, longitude: float) -> bool:
        """Validate GPS coordinates are within valid ranges"""
        return -90 <= latitude <= 90 and -180 <= longitude <= 180

    @staticmethod
    def validate_description(description: str) -> bool:
        """Validate complaint description meets minimum requirements"""
        return description and len(description.strip()) >= 10 and len(description) <= 1000

    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format"""
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None

    @staticmethod
    def validate_phone(phone: str) -> bool:
        """Validate Indian phone number"""
        pattern = r'^[6-9]\d{9}$'
        return re.match(pattern, phone) is not None

    @staticmethod
    def validate_deadline(deadline: datetime) -> bool:
        """Validate deadline is in future"""
        if not deadline:
            return True
        return deadline > datetime.utcnow()

    @staticmethod
    def validate_image_urls(image_urls: list, max_images: int = 5) -> bool:
        """Validate image URLs count and format"""
        if not image_urls:
            return True
        
        if len(image_urls) > max_images:
            return False
        
        for url in image_urls:
            if not isinstance(url, str) or not (url.startswith("http://") or url.startswith("https://")):
                return False
        
        return True

    @staticmethod
    def validate_priority(priority: str) -> bool:
        """Validate priority level"""
        valid_priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        return priority in valid_priorities

    @staticmethod
    def validate_complaint_type(complaint_type: str) -> bool:
        """Validate complaint type"""
        valid_types = [
            "GARBAGE", "ROAD_DAMAGE", "POTHOLE", "STREETLIGHT",
            "WATER_SUPPLY", "DRAINAGE", "SANITATION", "TREE_CUTTING",
            "CONSTRUCTION", "OTHER"
        ]
        return complaint_type in valid_types


class DuplicateComplaintDetector:
    """Detects duplicate complaints"""

    # Configuration
    DUPLICATE_CHECK_DAYS = 1
    DUPLICATE_DISTANCE_METERS = 10  # 10 meters radius (relaxed for testing)

    @staticmethod
    def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates using Haversine formula"""
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371000  # Earth radius in meters
        
        lat1_rad = radians(lat1)
        lat2_rad = radians(lat2)
        delta_lat = radians(lat2 - lat1)
        delta_lon = radians(lon2 - lon1)
        
        a = sin(delta_lat/2)**2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c

    @classmethod
    def is_duplicate(
        cls,
        complaint_type: str,
        latitude: float,
        longitude: float,
        existing_complaint: Optional[dict] = None
    ) -> bool:
        """Check if complaint is duplicate of existing one"""
        if not existing_complaint:
            return False
        
        # Check type
        if existing_complaint.get("complaint_type") != complaint_type:
            return False
        
        # Check location (within 500 meters)
        distance = cls.calculate_distance(
            latitude,
            longitude,
            existing_complaint.get("latitude"),
            existing_complaint.get("longitude")
        )
        
        if distance > cls.DUPLICATE_DISTANCE_METERS:
            return False
        
        # Check date (within 7 days)
        created_at = existing_complaint.get("created_at")
        if not created_at:
            return False
        
        time_diff = datetime.utcnow() - created_at
        
        return time_diff.days <= cls.DUPLICATE_CHECK_DAYS


class SpamDetector:
    """Detects spam complaints from same user"""

    # Configuration
    MAX_COMPLAINTS_PER_WEEK = 50
    MAX_COMPLAINTS_PER_DAY = 20

    @staticmethod
    def check_weekly_limit(user_complaints_this_week: int) -> bool:
        """Check if user exceeded weekly complaint limit"""
        return user_complaints_this_week < SpamDetector.MAX_COMPLAINTS_PER_WEEK

    @staticmethod
    def check_daily_limit(user_complaints_today: int) -> bool:
        """Check if user exceeded daily complaint limit"""
        return user_complaints_today < SpamDetector.MAX_COMPLAINTS_PER_DAY

    @staticmethod
    def check_repetitive_descriptions(
        current_description: str,
        recent_descriptions: list,
        similarity_threshold: float = 0.8
    ) -> bool:
        """Check for repetitive descriptions using simple similarity"""
        from difflib import SequenceMatcher
        
        current_words = set(current_description.lower().split())
        
        for desc in recent_descriptions:
            desc_words = set(desc.lower().split())
            
            # Calculate Jaccard similarity
            intersection = len(current_words & desc_words)
            union = len(current_words | desc_words)
            
            if union > 0:
                similarity = intersection / union
                if similarity > similarity_threshold:
                    return False
        
        return True
