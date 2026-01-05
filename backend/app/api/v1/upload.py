from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from pathlib import Path
import uuid

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("static/uploads/products")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed image extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS

@router.post("/upload-image")
async def upload_image(file: UploadFile = File(...), request: Request = None):
    """
    Upload product image
    Returns: JSON with image_url
    """
    print(f"📸 Upload request received: {file.filename if file else 'No file'}")
    
    try:
        # Validate file exists
        if not file:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Validate content type - FIX: startswith not startsWith
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Only images are allowed"
            )
        
        # Validate file extension
        if not allowed_file(file.filename):
            raise HTTPException(
                status_code=400,
                detail="Invalid file extension. Allowed: jpg, jpeg, png, gif, webp, bmp"
            )
        
        # Read file contents
        contents = await file.read()
        file_size = len(contents)
        
        # Validate file size
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File size too large. Maximum size is {MAX_FILE_SIZE / (1024 * 1024)}MB"
            )
        
        if file_size == 0:
            raise HTTPException(status_code=400, detail="File is empty")
        
        # Generate unique filename
        file_extension = Path(file.filename).suffix.lower()
        if not file_extension:
            file_extension = ".jpg"
        
        unique_filename = f"{uuid.uuid4().hex}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save file
        with file_path.open("wb") as buffer:
            buffer.write(contents)
        
        # Build full URL
        base_url = str(request.base_url).rstrip('/') if request else "http://127.0.0.1:8000"
        image_url = f"{base_url}/static/uploads/products/{unique_filename}"
        
        print(f"✅ Image saved: {image_url}")
        
        return {
            "success": True,
            "message": "Image uploaded successfully",
            "image_url": image_url,
            "url": image_url,
            "filename": unique_filename
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image: {str(e)}"
        )

@router.delete("/upload-image/{filename}")
async def delete_image(filename: str):
    """
    Delete uploaded image
    """
    try:
        file_path = UPLOAD_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Image not found")
        
        if not file_path.is_file():
            raise HTTPException(status_code=400, detail="Invalid file path")
        
        # Delete the file
        file_path.unlink()
        
        print(f"🗑️ Image deleted: {filename}")
        
        return {
            "success": True,
            "message": "Image deleted successfully",
            "filename": filename
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete image: {str(e)}"
        )