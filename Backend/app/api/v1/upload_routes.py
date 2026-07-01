from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from typing import List
import os
import uuid
import aiofiles
from app.dependencies.auth_dependency import get_current_user
from app.schemas.user_schema import UserResponseSchema

router = APIRouter()

UPLOAD_DIR = "uploads"
# Create uploads directory if it doesn't exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 5 * 1024 * 1024 # 5 MB

import logging

logger = logging.getLogger(__name__)

@router.post("/", response_model=List[str], summary="Upload multiple images")
async def upload_images(
    files: Optional[List[UploadFile]] = File(None),
    current_user: UserResponseSchema = Depends(get_current_user)
):
    """
    Upload up to 5 images.
    Returns a list of accessible URLs.
    """
    logger.info(f"Upload request received from user: {current_user.get('user_id', 'unknown')}")
    if not files:
        logger.info("No files provided for upload, returning empty list")
        return []
    
    if len(files) > 5:
        logger.error(f"Upload failed: Maximum 5 images allowed, got {len(files)}")
        raise HTTPException(status_code=400, detail="Maximum 5 images allowed")
    
    urls = []
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")
            
        file.file.seek(0, 2)
        size = file.file.tell()
        file.file.seek(0)
        
        if size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File {file.filename} exceeds 5MB limit")

        new_filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, new_filename)
        
        async with aiofiles.open(filepath, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
            
        logger.info(f"Uploaded filename: {new_filename} | path: {filepath}")
        
        # Returning path relative to the server base url
        # Frontend should prepend the API base URL
        urls.append(f"/uploads/{new_filename}")
        
    logger.info(f"Upload response URLs: {urls}")
    return urls
