"""Complaint and Ward schemas for validation"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from app.core.enums import ComplaintStatus, ComplaintType, Priority


# ============ WARD SCHEMAS ============

class WardCreateSchema(BaseModel):
    """Schema for creating a ward"""
    district_id: str = Field(..., description="District ID")
    ward_name: str = Field(..., min_length=3, max_length=100, description="Ward name")
    ward_number: str = Field(..., min_length=1, max_length=20, description="Ward number")
    inspector_id: str = Field(..., description="Inspector ID to assign")
    description: Optional[str] = Field(None, max_length=500)
    area_coordinates: Optional[dict] = Field(None, description="GeoJSON coordinates")

    class Config:
        json_schema_extra = {
            "example": {
                "district_id": "507f1f77bcf86cd799439011",
                "ward_name": "T Nagar Zone",
                "ward_number": "12",
                "inspector_id": "507f1f77bcf86cd799439012",
                "description": "T Nagar area coverage"
            }
        }


class WardUpdateSchema(BaseModel):
    """Schema for updating a ward"""
    ward_name: Optional[str] = Field(None, min_length=3, max_length=100)
    inspector_id: Optional[str] = None
    is_active: Optional[bool] = None
    description: Optional[str] = Field(None, max_length=500)

    class Config:
        json_schema_extra = {
            "example": {
                "ward_name": "T Nagar Zone Updated",
                "is_active": True
            }
        }


class WardResponseSchema(BaseModel):
    """Schema for ward response"""
    id: Optional[str] = Field(None, alias="_id")
    district_id: str
    ward_name: str
    ward_number: str
    inspector_id: Optional[str]
    is_active: bool
    complaint_count: int
    active_complaints: int
    closed_complaints: int
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True


# ============ COMPLAINT SCHEMAS ============

class ComplaintCreateSchema(BaseModel):
    """Schema for creating a complaint"""
    ward_id: str = Field(..., description="Ward ID where complaint is reported")
    complaint_type: ComplaintType = Field(..., description="Type of complaint")
    description: str = Field(..., min_length=10, max_length=1000, description="Detailed description")
    latitude: float = Field(..., ge=-90, le=90, description="GPS latitude")
    longitude: float = Field(..., ge=-180, le=180, description="GPS longitude")
    address: Optional[str] = Field(None, max_length=500, description="Complaint location address")
    citizen_note: Optional[str] = Field(None, max_length=500)
    image_urls: Optional[List[str]] = Field(default_factory=list, description="List of complaint images")
    priority: Optional[Priority] = Field(default=Priority.MEDIUM)

    @validator("description")
    def validate_description(cls, v):
        if not v or len(v.strip()) < 10:
            raise ValueError("Description must be at least 10 characters")
        return v

    class Config:
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "ward_id": "507f1f77bcf86cd799439011",
                "complaint_type": "GARBAGE",
                "description": "Garbage pile near market area not cleaned",
                "latitude": 13.0827,
                "longitude": 80.2707,
                "address": "T Nagar Chennai",
                "citizen_note": "Please fix quickly",
                "image_urls": [],
                "priority": "MEDIUM"
            }
        }


class ComplaintUpdateStatusSchema(BaseModel):
    """Schema for updating complaint status"""
    status: ComplaintStatus = Field(..., description="New status")
    note: Optional[str] = Field(None, max_length=500, description="Status change note")

    class Config:
        use_enum_values = True


class ComplaintAssignWorkerSchema(BaseModel):
    """Schema for assigning worker to complaint"""
    worker_id: str = Field(..., description="Worker ID to assign")
    deadline: datetime = Field(..., description="Work completion deadline")
    note: Optional[str] = Field(None, max_length=500)

    class Config:
        json_schema_extra = {
            "example": {
                "worker_id": "507f1f77bcf86cd799439013",
                "deadline": "2026-06-15T00:00:00",
                "note": "High priority work needed"
            }
        }


class ComplaintSubmitResolutionSchema(BaseModel):
    """Schema for worker submitting work completion"""
    worker_note: str = Field(..., min_length=5, max_length=500, description="Work completion details")
    proof_images: Optional[List[str]] = Field(default_factory=list, description="Before/after images")

    class Config:
        json_schema_extra = {
            "example": {
                "worker_note": "Garbage cleaned, area sanitized",
                "proof_images": ["url1", "url2"]
            }
        }


class ComplaintApproveSchema(BaseModel):
    """Schema for inspector approving complaint"""
    note: Optional[str] = Field(None, max_length=500)

    class Config:
        json_schema_extra = {
            "example": {
                "note": "Work completed successfully"
            }
        }


class ComplaintRejectSchema(BaseModel):
    """Schema for inspector rejecting complaint"""
    reason: str = Field(..., min_length=10, max_length=500, description="Rejection reason")

    class Config:
        json_schema_extra = {
            "example": {
                "reason": "Work incomplete, needs more cleaning"
            }
        }


class ComplaintResponseSchema(BaseModel):
    """Schema for complaint response"""
    id: Optional[str] = Field(None, alias="_id")
    complaint_id: str
    user_id: str
    district_id: str
    ward_id: str
    inspector_id: Optional[str]
    worker_id: Optional[str]
    complaint_type: str
    description: str
    status: str
    priority: str
    latitude: float
    longitude: float
    address: Optional[str]
    image_urls: List[str]
    proof_images: List[str]
    inspector_notes: Optional[List[dict]] = Field(default_factory=list)
    field_checklist: Optional[dict] = Field(default_factory=dict)
    citizen_note: Optional[str]
    inspector_note: Optional[str]
    worker_note: Optional[str]
    rejection_reason: Optional[str]
    deadline: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime]

    class Config:
        populate_by_name = True


class ComplaintHistoryResponseSchema(BaseModel):
    """Schema for complaint history"""
    id: Optional[str] = Field(None, alias="_id")
    complaint_id: str
    action: str
    old_status: Optional[str]
    new_status: Optional[str]
    performed_by: str
    role: str
    remarks: Optional[str]
    timestamp: datetime

    class Config:
        populate_by_name = True


class ComplaintSearchFiltersSchema(BaseModel):
    """Schema for complaint search and filters"""
    status: Optional[str] = None
    ward_id: Optional[str] = None
    district_id: Optional[str] = None
    complaint_type: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=10, ge=1, le=100)
    search_query: Optional[str] = None


class DashboardStatsSchema(BaseModel):
    """Schema for dashboard statistics"""
    total_count: int
    open_count: int
    working_count: int
    closed_count: int
    pending_approval_count: int
    recent_complaints: List[ComplaintResponseSchema]


class DistrictDashboardSchema(BaseModel):
    """Schema for district-level dashboard"""
    total_complaints: int
    open_complaints: int
    closed_complaints: int
    wards_count: int
    inspectors_count: int
    workers_count: int
    average_resolution_time_hours: float
    complaint_types: dict
