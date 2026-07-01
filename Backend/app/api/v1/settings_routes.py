from fastapi import APIRouter, Depends, status, Query
from typing import Dict, Any, List
from pydantic import BaseModel
from app.core.response import ResponseHandler
from app.dependencies.auth_dependency import get_current_super_admin
from app.dependencies.role_dependency import require_role
from app.db.mongodb import db

router = APIRouter()

class SLAConfigSchema(BaseModel):
    category: str
    priority: str
    resolution_time_hours: int

class AppSettingsSchema(BaseModel):
    maintenance_mode: bool
    allow_new_registrations: bool
    system_notice: str = None

@router.get(
    "/sla",
    summary="Get SLA configurations",
    dependencies=[Depends(require_role("SUPER_ADMIN"))]
)
async def get_sla_configs(current_user: Dict[str, Any] = Depends(get_current_super_admin)):
    """Get all SLA configurations"""
    try:
        slas = await db.settings.find_one({"type": "sla_config"})
        if not slas:
            return ResponseHandler.success("SLA configurations", {"configs": []})
            
        return ResponseHandler.success("SLA configurations", slas.get("configs", []))
    except Exception as e:
        return ResponseHandler.error("Failed to fetch SLAs", str(e), status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.post(
    "/sla",
    summary="Update SLA configuration",
    dependencies=[Depends(require_role("SUPER_ADMIN"))]
)
async def update_sla_config(
    payload: SLAConfigSchema,
    current_user: Dict[str, Any] = Depends(get_current_super_admin)
):
    """Update or add an SLA configuration"""
    try:
        from datetime import datetime
        from bson import ObjectId
        
        slas = await db.settings.find_one({"type": "sla_config"})
        configs = slas.get("configs", []) if slas else []
        
        # Check if exists and update, else append
        found = False
        for c in configs:
            if c["category"] == payload.category and c["priority"] == payload.priority:
                c["resolution_time_hours"] = payload.resolution_time_hours
                found = True
                break
                
        if not found:
            configs.append(payload.dict())
            
        await db.settings.update_one(
            {"type": "sla_config"},
            {"$set": {"configs": configs, "updated_at": datetime.utcnow()}},
            upsert=True
        )
        
        await db.audit_logs.insert_one({
            "action": "UPDATE_SLA",
            "user_id": ObjectId(current_user["user_id"]),
            "role": current_user.get("role"),
            "details": f"Updated SLA for {payload.category} - {payload.priority}",
            "timestamp": datetime.utcnow()
        })
        
        return ResponseHandler.success("SLA updated successfully")
    except Exception as e:
        return ResponseHandler.error("Failed to update SLA", str(e), status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.get(
    "/app",
    summary="Get global app settings",
    dependencies=[Depends(require_role("SUPER_ADMIN"))]
)
async def get_app_settings(current_user: Dict[str, Any] = Depends(get_current_super_admin)):
    """Get global app settings"""
    try:
        settings = await db.settings.find_one({"type": "app_config"})
        if not settings:
            default_settings = {
                "maintenance_mode": False,
                "allow_new_registrations": True,
                "system_notice": None
            }
            return ResponseHandler.success("App settings", default_settings)
            
        settings.pop("_id", None)
        return ResponseHandler.success("App settings", settings)
    except Exception as e:
        return ResponseHandler.error("Failed to fetch settings", str(e), status.HTTP_500_INTERNAL_SERVER_ERROR)


@router.put(
    "/app",
    summary="Update global app settings",
    dependencies=[Depends(require_role("SUPER_ADMIN"))]
)
async def update_app_settings(
    payload: AppSettingsSchema,
    current_user: Dict[str, Any] = Depends(get_current_super_admin)
):
    """Update global app settings"""
    try:
        from datetime import datetime
        from bson import ObjectId
        
        await db.settings.update_one(
            {"type": "app_config"},
            {"$set": {
                "maintenance_mode": payload.maintenance_mode,
                "allow_new_registrations": payload.allow_new_registrations,
                "system_notice": payload.system_notice,
                "updated_at": datetime.utcnow()
            }},
            upsert=True
        )
        
        await db.audit_logs.insert_one({
            "action": "UPDATE_APP_SETTINGS",
            "user_id": ObjectId(current_user["user_id"]),
            "role": current_user.get("role"),
            "details": f"Maintenance: {payload.maintenance_mode}",
            "timestamp": datetime.utcnow()
        })
        
        return ResponseHandler.success("App settings updated successfully")
    except Exception as e:
        return ResponseHandler.error("Failed to update settings", str(e), status.HTTP_500_INTERNAL_SERVER_ERROR)
