from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
import boto3
import re
from uuid import uuid4
from pathlib import Path
from botocore.config import Config
from app.api.dependencies import get_current_user
from app.core.config import get_settings

router = APIRouter(prefix="/upload", tags=["Upload"])

_s = get_settings()
R2_ACCESS_KEY = _s.R2_ACCESS_KEY
R2_SECRET_KEY = _s.R2_SECRET_KEY
R2_ENDPOINT = _s.R2_ENDPOINT
R2_BUCKET_NAME = _s.R2_BUCKET_NAME
R2_PUBLIC_URL = _s.R2_PUBLIC_URL

# Initialize R2 client (S3-compatible)
r2 = None
if R2_ENDPOINT and R2_ACCESS_KEY and R2_SECRET_KEY:
    r2 = boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        config=Config(s3={"addressing_style": "virtual"}),
        region_name="auto",
    )

# Local upload directory as fallback
LOCAL_UPLOAD_DIR = Path("static/uploads/products")
LOCAL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def _slugify(text: str) -> str:
    """Convert text to a URL-safe slug."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    dish_name: str = Form(None),
    current_user: dict = Depends(get_current_user),
):
    client_id = current_user.get("client_id")
    if not client_id:
        raise HTTPException(status_code=401, detail="Client ID not found")
        
    print(f"[UPLOAD] Received file: {file.filename}, type: {file.content_type}, dish_name: {dish_name}, client_id: {client_id}")
    try:
        # Validation: Max 2MB, specific extensions
        MAX_SIZE = 2 * 1024 * 1024 # 2MB
        valid_extensions = ("image/jpeg", "image/png", "image/webp")
        
        if not file.content_type or file.content_type not in valid_extensions:
            raise HTTPException(status_code=400, detail="Only JPG, PNG, and WebP images allowed")

        # Read file content to check size
        content = await file.read()
        if len(content) > MAX_SIZE:
            raise HTTPException(status_code=400, detail="Image size exceeds 2MB limit")

        file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        short_id = str(uuid4())[:8]

        # Generate unique filename under dish-images/{client_id}/
        if dish_name:
            slug = _slugify(dish_name)
            storage_key = f"dish-images/{client_id}/{slug}-{short_id}.{file_extension}"
        else:
            storage_key = f"dish-images/{client_id}/{uuid4()}.{file_extension}"
            
        local_filename = storage_key.split("/")[-1]

        print(f"[UPLOAD] Uploading to R2 with key: {storage_key}")

        # Use R2 if configured, otherwise use local storage
        if r2 and R2_BUCKET_NAME:
            from io import BytesIO
            r2.upload_fileobj(
                BytesIO(content),
                R2_BUCKET_NAME,
                storage_key,
                ExtraArgs={
                    "ContentType": file.content_type
                },
            )
            # Use Public URL if provided, otherwise fallback to endpoint-based URL
            base_url = R2_PUBLIC_URL.rstrip("/") if R2_PUBLIC_URL else f"{R2_ENDPOINT}/{R2_BUCKET_NAME}"
            image_url = f"{base_url}/{storage_key}"
            print(f"[UPLOAD] Successfully uploaded to R2: {image_url}")
        else:
            # Fallback to local storage
            file_path = LOCAL_UPLOAD_DIR / local_filename
            with open(file_path, "wb") as f:
                f.write(content)
            image_url = f"/static/uploads/products/{local_filename}"
            print(f"[UPLOAD] Saved locally: {image_url}")

        return {
            "success": True,
            "image_url": image_url
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"[UPLOAD ERROR] {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/dish-library")
async def get_r2_dish_library(current_user: dict = Depends(get_current_user)):
    """Fetch images from the configured R2 bucket (common + client specific)."""
    try:
        client_id = current_user.get("client_id")
        if not client_id:
            raise HTTPException(status_code=401, detail="Client ID not found")

        if r2 and R2_BUCKET_NAME:
            contents = []
            
            # 1. Fetch Shared images (common)
            common_prefix = "dish-images/common/"
            common_response = r2.list_objects_v2(Bucket=R2_BUCKET_NAME, Prefix=common_prefix)
            contents.extend(common_response.get('Contents', []))
            
            # 2. Fetch Client-specific images
            client_prefix = f"dish-images/{client_id}/"
            client_response = r2.list_objects_v2(Bucket=R2_BUCKET_NAME, Prefix=client_prefix)
            contents.extend(client_response.get('Contents', []))
            
            # 3. Backward compatibility (if you still want to check old dish-library/)
            # Commenting this out since the user wants strict adherence to the new structure, 
            # but keeping it if needed:
            # prefix_old = "dish-library/"
            # response_old = r2.list_objects_v2(Bucket=R2_BUCKET_NAME, Prefix=prefix_old)
            # contents.extend(response_old.get('Contents', []))
            
            images = []
            valid_exts = ('.jpg', '.jpeg', '.png', '.webp')
            base_url = R2_PUBLIC_URL.rstrip("/") if R2_PUBLIC_URL else f"{R2_ENDPOINT}/{R2_BUCKET_NAME}"
            
            # Use a set to avoid duplicates if same key appears in multiple lists
            seen_keys = set()
            
            for obj in contents:
                key = obj['Key']
                if key in seen_keys or key.endswith('/') or not key.lower().endswith(valid_exts):
                    continue
                
                seen_keys.add(key)
                url = f"{base_url}/{key}"
                
                # Prettify the name
                name_with_ext = key.split('/')[-1]
                name_clean = name_with_ext.rsplit('.', 1)[0]
                # Remove UUID suffix
                name_clean = re.sub(r'-[a-f0-9]{8}$', '', name_clean)
                name = name_clean.replace('-', ' ').replace('_', ' ').title()
                
                images.append({
                    "id": key,
                    "name": name,
                    "image_url": url
                })
            return images
        return []
    except Exception as e:
        print(f"R2 Error: {e}")
        return []


def delete_image(image_url: str):
    """Delete an image from R2 based on its public URL."""
    try:
        if not image_url:
            return

        # Extract the key from the URL
        # e.g. https://pub-xxx.r2.dev/dish-images/abc.jpg -> dish-images/abc.jpg
        if R2_PUBLIC_URL and R2_PUBLIC_URL in image_url:
            file_key = image_url.split(R2_PUBLIC_URL.rstrip("/") + "/")[-1]
        elif R2_ENDPOINT and R2_ENDPOINT in image_url:
            file_key = image_url.split(f"{R2_ENDPOINT}/{R2_BUCKET_NAME}/")[-1]
        else:
            # Fallback extraction
            file_key = image_url.split('/')[-1]

        # Delete from R2 if configured
        if r2 and R2_BUCKET_NAME:
            r2.delete_object(
                Bucket=R2_BUCKET_NAME,
                Key=file_key
            )
            print(f"Deleted from R2: {file_key}")
        # Otherwise try to delete from local storage
        else:
            file_path = LOCAL_UPLOAD_DIR / file_key.split('/')[-1]
            if file_path.exists():
                file_path.unlink()
                print(f"Deleted from local storage: {file_key}")

    except Exception as e:
        print("Delete error:", e)
