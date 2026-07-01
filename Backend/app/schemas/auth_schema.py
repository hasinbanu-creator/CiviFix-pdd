"""Authentication request/response schemas"""
import re
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from enum import Enum

# Stricter email regex — rejects leading/trailing dots, consecutive dots,
# hyphens at start/end of domain labels, and malformed domain segments.
_EMAIL_RE = re.compile(
    r'^[a-zA-Z0-9]'                      # local must start with alnum
    r'(?:[a-zA-Z0-9._%+\-]*'             # allowed local chars
    r'[a-zA-Z0-9])?'                     # local must end with alnum
    r'@'
    r'(?!-)'                             # domain label must not start with -
    r'(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]*[a-zA-Z0-9])?\.)'  # domain labels
    r'+[a-zA-Z]{2,}$'                   # TLD — at least 2 alpha chars
)

def _validate_strict_email(v: str) -> str:
    v = v.strip().lower()
    if '..' in v:
        raise ValueError('Email must not contain consecutive dots')
    if not _EMAIL_RE.match(v):
        raise ValueError('Enter a valid email address')
    return v


class RegisterSchema(BaseModel):
    """User registration schema"""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    mobile_number: str = Field(..., min_length=10, max_length=10)
    address: str = Field(..., min_length=5, max_length=200)
    district: str = Field(..., min_length=2, max_length=50)

    @validator('email', pre=True)
    def email_strict(cls, v):
        return _validate_strict_email(v)

    class Config:
        example = {
            "name": "Shakthi",
            "email": "user@gmail.com",
            "mobile_number": "9876543210",
            "address": "Chennai",
            "district": "6a156a1258884d22663b2a06"
        }


class LoginSchema(BaseModel):
    """Login schema"""
    email: EmailStr

    @validator('email', pre=True)
    def email_strict(cls, v):
        return _validate_strict_email(v)

    class Config:
        example = {
            "email": "user@gmail.com"
        }


class VerifyOTPSchema(BaseModel):
    """OTP verification schema"""
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

    @validator('email', pre=True)
    def email_strict(cls, v):
        return _validate_strict_email(v)

    class Config:
        example = {
            "email": "user@gmail.com",
            "otp": "123456"
        }


class RefreshTokenSchema(BaseModel):
    """Refresh token schema"""
    refresh_token: str = Field(..., description="Refresh token")

    class Config:
        example = {
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }


class TokenResponseSchema(BaseModel):
    """Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int

    class Config:
        example = {
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "token_type": "bearer",
            "expires_in": 900
        }


class UserInfoSchema(BaseModel):
    """User information from token"""
    user_id: str
    email: str
    name: str
    role: str
    district: str
    permissions: list = []

    class Config:
        example = {
            "user_id": "507f1f77bcf86cd799439011",
            "email": "user@gmail.com",
            "name": "Shakthi",
            "role": "CITIZEN",
            "district": "Chennai",
            "permissions": ["view_own_profile", "create_complaint"]
        }


class UpdateProfileSchema(BaseModel):
    """Schema for updating user profile"""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    mobile_number: Optional[str] = Field(None, min_length=10, max_length=10)
    address: Optional[str] = Field(None, min_length=5, max_length=200)

    class Config:
        example = {
            "name": "Shakthi Updated",
            "mobile_number": "9876543211",
            "address": "New Chennai Address"
        }


class LogoutSchema(BaseModel):
    """Logout schema"""
    refresh_token: Optional[str] = None

    class Config:
        example = {
            "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
