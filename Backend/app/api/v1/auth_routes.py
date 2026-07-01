"""Authentication API routes"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import Dict, Any
from app.schemas.auth_schema import (
    RegisterSchema,
    LoginSchema,
    VerifyOTPSchema,
    RefreshTokenSchema,
    TokenResponseSchema,
    LogoutSchema,
    UpdateProfileSchema
)
from app.schemas.common_schema import SuccessSchema
from app.core.response import ResponseHandler
from app.core.exceptions import (
    CivifixException,
    UserAlreadyExistsException,
    UserNotFoundException,
    InvalidOTPException,
    OTPExpiredException,
    OTPAttemptsExceededException,
    AuthenticationException,
    RateLimitException
)
from app.services.auth_service import AuthService
from app.services.email_service import EmailService
from app.dependencies.auth_dependency import get_current_user
from app.repositories.user_repository import UserRepository

router = APIRouter()


# =========================
# REGISTER API
# =========================

@router.post(
    "/register",
    summary="Register new user",
    responses={
        200: {"description": "Registration successful, OTP sent"},
        400: {"description": "User already exists or validation error"},
        500: {"description": "Internal server error"}
    }
)
async def register(payload: RegisterSchema):
    """
    Register a new user with email and mobile number.
    
    An OTP will be sent to the registered email for verification.
    """
    try:
        result = await AuthService.register_user(
            name=payload.name,
            email=payload.email,
            mobile_number=payload.mobile_number,
            address=payload.address,
            district=payload.district
        )
        
        # Send OTP email
        otp = result.get("otp")
        email_sent = await EmailService.send_otp_email(payload.email, otp)
        if not email_sent:
            return ResponseHandler.error(
                message="Failed to send OTP email. Please try again.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return ResponseHandler.success(
            message="Registration successful. OTP sent to email.",
            data={
                "user_id": result.get("user_id"),
                "message": "Please verify OTP to complete registration"
            },
            status_code=status.HTTP_201_CREATED
        )
    
    except UserAlreadyExistsException as e:
        return ResponseHandler.error(
            message=e.message,
            status_code=e.status_code
        )
    except AuthenticationException as e:
        return ResponseHandler.error(
            message=e.message,
            status_code=e.status_code
        )
    except Exception as e:
        return ResponseHandler.error(
            message="Registration failed",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================
# VERIFY REGISTRATION OTP API
# =========================

@router.post(
    "/verify-otp",
    summary="Verify OTP for registration",
    responses={
        200: {"description": "OTP verified, account created"},
        400: {"description": "Invalid or expired OTP"},
        404: {"description": "User not found"}
    }
)
async def verify_registration_otp(payload: VerifyOTPSchema):
    """
    Verify OTP sent during registration.
    
    Upon successful verification, JWT tokens are generated.
    """
    try:
        result = await AuthService.verify_registration_otp(
            email=payload.email,
            otp=payload.otp
        )
        
        return ResponseHandler.success(
            message="OTP verified successfully. Account activated.",
            data={
                "user_id": result.get("user_id"),
                "access_token": result.get("tokens", {}).get("access_token"),
                "refresh_token": result.get("tokens", {}).get("refresh_token"),
                "token_type": "bearer",
                "expires_in": result.get("tokens", {}).get("expires_in")
            }
        )
    
    except (InvalidOTPException, OTPExpiredException, OTPAttemptsExceededException) as e:
        return ResponseHandler.error(
            message=e.message,
            status_code=e.status_code
        )
    except UserNotFoundException as e:
        return ResponseHandler.error(
            message=e.message,
            status_code=e.status_code
        )
    except Exception as e:
        return ResponseHandler.error(
            message="OTP verification failed",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================
# LOGIN API (REQUEST OTP)
# =========================

@router.post(
    "/login",
    summary="Request login OTP",
    responses={
        200: {"description": "OTP sent to registered email"},
        404: {"description": "User not found"},
        429: {"description": "Rate limit exceeded"}
    }
)
async def login(payload: LoginSchema):
    """
    Request OTP for login.
    
    OTP will be sent to the registered email address.
    """
    try:
        result = await AuthService.login_user(email=payload.email)
        
        # Send OTP email
        otp = result.get("otp")
        email_sent = await EmailService.send_login_otp_email(payload.email, otp)
        if not email_sent:
            return ResponseHandler.error(
                message="Failed to send login OTP email. Please try again.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        return ResponseHandler.success(
            message="Login OTP sent to registered email",
            data={
                "expires_in": result.get("expires_in"),
                "message": "Enter OTP to login"
            }
        )
    
    except RateLimitException as e:
        return ResponseHandler.error(
            message=e.message,
            status_code=e.status_code
        )
    except (UserNotFoundException, AuthenticationException) as e:
        return ResponseHandler.error(
            message=e.message,
            status_code=e.status_code
        )
    except Exception as e:
        return ResponseHandler.error(
            message="Login failed",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================
# VERIFY LOGIN OTP API
# =========================

@router.post(
    "/verify-login-otp",
    summary="Verify login OTP",
    responses={
        200: {"description": "Login successful"},
        400: {"description": "Invalid or expired OTP"},
        404: {"description": "User not found"}
    }
)
async def verify_login_otp(payload: VerifyOTPSchema):
    """
    Verify OTP for login.
    
    Upon successful verification, JWT tokens are generated for the session.
    """
    try:
        result = await AuthService.verify_login_otp(
            email=payload.email,
            otp=payload.otp
        )
        
        return ResponseHandler.success(
            message="Login successful",
            data={
                "user_id": result.get("user_id"),
                "access_token": result.get("tokens", {}).get("access_token"),
                "refresh_token": result.get("tokens", {}).get("refresh_token"),
                "token_type": "bearer",
                "expires_in": result.get("tokens", {}).get("expires_in"),
                "role": result.get("role"),
                "district": result.get("district")
            }
        )
    
    except (InvalidOTPException, OTPExpiredException, OTPAttemptsExceededException) as e:
        return ResponseHandler.error(
            message=e.message,
            status_code=e.status_code
        )
    except UserNotFoundException as e:
        return ResponseHandler.error(
            message=e.message,
            status_code=e.status_code
        )
    except Exception as e:
        return ResponseHandler.error(
            message="Login verification failed",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================
# REFRESH TOKEN API
# =========================

@router.post(
    "/refresh-token",
    summary="Refresh access token",
    responses={
        200: {"description": "New access token generated"},
        401: {"description": "Invalid or expired refresh token"}
    }
)
async def refresh_token(payload: RefreshTokenSchema):
    """
    Refresh the access token using refresh token.
    
    Refresh tokens are long-lived and can be used to get new access tokens.
    """
    try:
        tokens = await AuthService.refresh_tokens(payload.refresh_token)
        
        return ResponseHandler.success(
            message="Token refreshed successfully",
            data={
                "access_token": tokens.get("access_token"),
                "refresh_token": tokens.get("refresh_token"),
                "token_type": "bearer",
                "expires_in": tokens.get("expires_in")
            }
        )
    
    except AuthenticationException as e:
        return ResponseHandler.error(
            message=e.message,
            status_code=e.status_code
        )
    except UserNotFoundException as e:
        return ResponseHandler.error(
            message=e.message,
            status_code=e.status_code
        )
    except Exception as e:
        return ResponseHandler.error(
            message="Token refresh failed",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================
# LOGOUT API
# =========================

@router.post(
    "/logout",
    summary="Logout user",
    responses={
        200: {"description": "Logout successful"}
    }
)
async def logout(
    current_user: Dict[str, Any] = Depends(get_current_user),
    payload: LogoutSchema = None
):
    """
    Logout the current user.
    
    This invalidates the refresh token and logs out the user.
    """
    try:
        # TODO: Add refresh token to blacklist if needed
        
        return ResponseHandler.success(
            message="Logout successful"
        )
    
    except Exception as e:
        return ResponseHandler.error(
            message="Logout failed",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =========================
# GET CURRENT USER API
# =========================

@router.get(
    "/me",
    summary="Get current user info",
    responses={
        200: {"description": "Current user info"},
        401: {"description": "Unauthorized"}
    }
)
async def get_current_user_info(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get information about the currently authenticated user.
    """
    return ResponseHandler.success(
        message="Current user info",
        data=current_user
    )


@router.put(
    "/me",
    summary="Update current user profile",
    responses={
        200: {"description": "Profile updated successfully"},
        400: {"description": "Validation error"},
        401: {"description": "Unauthorized"}
    }
)
async def update_current_user_info(
    payload: UpdateProfileSchema,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update information for the currently authenticated user.
    """
    try:
        user_id = current_user.get("user_id")
        
        # Filter out None values to only update provided fields
        update_data = {k: v for k, v in payload.dict().items() if v is not None}
        
        if not update_data:
            return ResponseHandler.success(
                message="No changes provided",
                data=current_user
            )
            
        success = await UserRepository.update_user(user_id, update_data)
        
        if not success:
            return ResponseHandler.error(
                message="Failed to update profile",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        # Get updated user data
        updated_user = await UserRepository.get_by_id(user_id)
        if updated_user and "_id" in updated_user:
            updated_user["_id"] = str(updated_user["_id"])
            
        return ResponseHandler.success(
            message="Profile updated successfully",
            data=updated_user
        )
        
    except Exception as e:
        return ResponseHandler.error(
            message="Profile update failed",
            errors=str(e),
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
