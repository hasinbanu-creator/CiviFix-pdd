"""Civifix FastAPI application"""
import logging
from datetime import datetime
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.exceptions import (
    civifix_exception_handler,
    global_exception_handler,
    duplicate_key_exception_handler,
    CivifixException
)
from fastapi import HTTPException
from app.core.logger import setup_logging
from app.schemas.common_schema import HealthCheckSchema
from app.api.v1.auth_routes import router as auth_router
from app.api.v1.admin_routes import router as admin_router
from app.api.v1.wards_routes import router as wards_router
from app.api.v1.complaints_routes import router as complaints_router
from app.api.v1.districts_routes import router as districts_router
from app.api.v1.dashboard_routes import router as dashboard_router
from app.api.v1.inspector_routes import router as inspector_router
from app.api.v1.worker_routes import router as worker_router
from app.api.v1.notification_routes import router as notification_router
from app.api.v1.upload_routes import router as upload_router
from app.api.v1.settings_routes import router as settings_router
from app.db.indexes import create_indexes

# Setup logging
setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Civifix API",
    description="Tamil Nadu Complaint Management Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Mount uploads directory
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Exception handlers
app.add_exception_handler(CivifixException, civifix_exception_handler)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "error_code": "HTTP_ERROR"
        }
    )

app.add_exception_handler(Exception, global_exception_handler)

# Include routers
app.include_router(
    auth_router,
    prefix="/api/v1/auth",
    tags=["Authentication"]
)

app.include_router(
    admin_router,
    prefix="/api/v1/admin",
    tags=["Admin Management"]
)

app.include_router(
    wards_router,
    prefix="/api/v1/wards",
    tags=["Ward Management"]
)

app.include_router(
    complaints_router,
    prefix="/api/v1/complaints",
    tags=["Complaint Management"]
)

app.include_router(
    districts_router,
    prefix="/api/v1/admin",
    tags=["District Management"]
)

app.include_router(
    dashboard_router,
    prefix="/api/v1/dashboard",
    tags=["Dashboard"]
)

app.include_router(
    inspector_router,
    prefix="/api/v1/inspector",
    tags=["Inspector"]
)

app.include_router(
    worker_router,
    prefix="/api/v1/worker",
    tags=["Worker"]
)

app.include_router(
    notification_router,
    prefix="/api/v1/notifications",
    tags=["Notifications"]
)

app.include_router(
    upload_router,
    prefix="/api/v1/upload",
    tags=["Uploads"]
)

app.include_router(
    settings_router,
    prefix="/api/v1/admin/settings",
    tags=["Admin Settings"]
)


# =========================
# HEALTH CHECK ENDPOINTS
# =========================

@app.get("/", summary="Root endpoint")
async def root():
    """Root endpoint"""
    return {
        "success": True,
        "message": "Civifix Backend Running",
        "version": "1.0.0"
    }


@app.get(
    "/health",
    summary="Health check",
    response_model=HealthCheckSchema
)
async def health_check():
    """Health check endpoint"""
    return HealthCheckSchema(timestamp=datetime.utcnow())


@app.get("/api/health", summary="API health check")
async def api_health_check():
    """API health check"""
    return {
        "status": "healthy",
        "service": "Civifix API",
        "timestamp": datetime.utcnow().isoformat()
    }


# =========================
# STARTUP AND SHUTDOWN EVENTS
# =========================

@app.on_event("startup")
async def startup_event():
    """Initialize app on startup"""
    logger.info("=" * 50)
    logger.info("Civifix Backend Starting")
    logger.info(f"Environment: {settings.ENV}")
    logger.info(f"Database: {settings.DATABASE_NAME}")
    logger.info("=" * 50)
    
    # Initialize default roles
    from app.services.role_service import RoleService
    await RoleService.create_default_roles()
    logger.info("Default roles initialized")
    
    # Create MongoDB indexes
    from app.db.mongodb import get_database # pyright: ignore[reportAttributeAccessIssue]
    db = await get_database()
    await create_indexes(db)
    logger.info("MongoDB indexes created")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Civifix Backend Shutting Down")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
