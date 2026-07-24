from fastapi import Request, status
from fastapi.responses import JSONResponse
from pymongo.errors import DuplicateKeyError
from typing import Optional


class CivifixException(Exception):
    """Base exception for Civifix"""
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        error_code: Optional[str] = None,
        extra_data: Optional[dict] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.extra_data = extra_data
        super().__init__(self.message)


class AuthenticationException(CivifixException):
    """Raised when authentication fails"""
    def __init__(
        self,
        message: str = "Authentication failed",
        error_code: str = "AUTH_FAILED"
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code=error_code
        )


class AuthorizationException(CivifixException):
    """Raised when user lacks required permissions"""
    def __init__(
        self,
        message: str = "Insufficient permissions",
        error_code: str = "INSUFFICIENT_PERMISSIONS"
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code=error_code
        )


class DuplicateComplaintException(CivifixException):
    """Raised when a duplicate complaint is detected"""
    def __init__(
        self,
        message: str = "A similar complaint already exists nearby.",
        error_code: str = "DUPLICATE_COMPLAINT",
        existing_complaint_id: str = "",
        distance_meters: float = 0.0,
        existing_status: str = ""
    ):
        extra_data = {
            "existing_complaint_id": existing_complaint_id,
            "distance_meters": distance_meters,
            "existing_status": existing_status
        }
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            error_code=error_code,
            extra_data=extra_data
        )


class UserAlreadyExistsException(CivifixException):
    """Raised when trying to create duplicate user"""
    def __init__(self, message: str = "User already exists"):
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            error_code="USER_EXISTS"
        )


class UserNotFoundException(CivifixException):
    """Raised when user not found"""
    def __init__(self, message: str = "User not found"):
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="USER_NOT_FOUND"
        )


class InvalidOTPException(CivifixException):
    """Raised when OTP is invalid"""
    def __init__(self, message: str = "Invalid OTP"):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="INVALID_OTP"
        )


class OTPExpiredException(CivifixException):
    """Raised when OTP is expired"""
    def __init__(self, message: str = "OTP has expired"):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="OTP_EXPIRED"
        )


class OTPAttemptsExceededException(CivifixException):
    """Raised when OTP attempts exceeded"""
    def __init__(self, message: str = "OTP attempts exceeded"):
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="OTP_ATTEMPTS_EXCEEDED"
        )


class RateLimitException(CivifixException):
    """Raised when rate limit exceeded"""
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="RATE_LIMIT_EXCEEDED"
        )


class InvalidTokenException(CivifixException):
    """Raised when token is invalid"""
    def __init__(self, message: str = "Invalid token"):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="INVALID_TOKEN"
        )


class TokenExpiredException(CivifixException):
    """Raised when token is expired"""
    def __init__(self, message: str = "Token has expired"):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="TOKEN_EXPIRED"
        )


class ValidationException(CivifixException):
    """Raised when validation fails"""
    def __init__(
        self,
        message: str = "Validation error",
        errors: Optional[dict] = None
    ):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR"
        )
        self.errors = errors


ValidationError = ValidationException


class ResourceNotFoundError(CivifixException):
    """Raised when a requested resource is not found"""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="RESOURCE_NOT_FOUND"
        )


class UnauthorizedError(CivifixException):
    """Raised when action is unauthorized"""
    def __init__(self, message: str = "Unauthorized action"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="UNAUTHORIZED_ACTION"
        )


class DistrictAccessException(CivifixException):
    """Raised when accessing another district's resources"""
    def __init__(self, message: str = "Cannot access resources from another district"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="DISTRICT_ACCESS_DENIED"
        )


class RoleNotFoundException(CivifixException):
    """Raised when role not found"""
    def __init__(self, message: str = "Role not found"):
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="ROLE_NOT_FOUND"
        )


# Exception handlers for FastAPI

async def civifix_exception_handler(
    request: Request,
    exc: CivifixException
):
    """Handler for CivifixException"""
    content = {
        "success": False,
        "message": exc.message,
        "error_code": exc.error_code
    }
    
    if getattr(exc, 'extra_data', None):
        content.update(exc.extra_data)

    if isinstance(exc, ValidationException) and exc.errors:
        content["errors"] = exc.errors
    
    return JSONResponse(
        status_code=exc.status_code,
        content=content
    )


async def global_exception_handler(
    request: Request,
    exc: Exception
):
    """Handler for unhandled exceptions"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal server error",
            "error_code": "INTERNAL_ERROR"
        }
    )


async def duplicate_key_exception_handler(
    request: Request,
    exc: DuplicateKeyError
):
    """Handler for MongoDB duplicate key errors"""
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "success": False,
            "message": "Duplicate data found",
            "error_code": "DUPLICATE_KEY"
        }
    )
