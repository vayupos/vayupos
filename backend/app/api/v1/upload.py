from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import boto3
import os
import re
from uuid import uuid4
from pathlib import Path

router = APIRouter(prefix="/upload", tags=["Upload"])

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME", "")

# Initialize S3 client if bucket is configured
s3 = None
if AWS_BUCKET_NAME:
    if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
        s3 = boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION,
        )
    else:
        # Fallback to default credential provider chain (e.g., IAM roles on EC2)
        s3 = boto3.client("s3", region_name=AWS_REGION)

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
):
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files allowed")

        file_extension = file.filename.split(".")[-1]
        short_id = str(uuid4())[:8]

        # If dish_name is provided, store under dish-library/ so it shows
        # up automatically in the Dish Library with a readable name
        if dish_name:
            slug = _slugify(dish_name)
            s3_key = f"dish-library/{slug}-{short_id}.{file_extension}"
            local_filename = f"{slug}-{short_id}.{file_extension}"
        else:
            s3_key = f"{uuid4()}.{file_extension}"
            local_filename = s3_key

        # Use S3 if configured, otherwise use local storage
        if s3 and AWS_BUCKET_NAME:
            s3.upload_fileobj(
                file.file,
                AWS_BUCKET_NAME,
                s3_key,
                ExtraArgs={"ContentType": file.content_type},
            )
            image_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"
        else:
            # Fallback to local storage
            file_path = LOCAL_UPLOAD_DIR / local_filename
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            image_url = f"/static/uploads/products/{local_filename}"

        return {
            "success": True,
            "image_url": image_url
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dish-library")
async def get_s3_dish_library():
    """Fetch images from the configured S3 bucket."""
    try:
        if s3 and AWS_BUCKET_NAME:
            # First try the dish-library/ prefix
            prefix = "dish-library/"
            response = s3.list_objects_v2(Bucket=AWS_BUCKET_NAME, Prefix=prefix)
            contents = response.get('Contents', [])
            
            # If nothing in dish-library/, try the root
            if not contents:
                response = s3.list_objects_v2(Bucket=AWS_BUCKET_NAME)
                contents = response.get('Contents', [])
            
            images = []
            valid_extensions = ('.jpg', '.jpeg', '.png', '.webp', '.gif')
            
            for obj in contents:
                key = obj['Key']
                # Skip the folder placeholder itself or non-images
                if key.endswith('/') or not key.lower().endswith(valid_extensions):
                    continue
                
                url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{key}"
                # Prettify the name: extract filename, remove extension, replace dashes/underscores
                name_with_ext = key.split('/')[-1]
                name_clean = name_with_ext.rsplit('.', 1)[0]
                # Remove trailing -xxxxxxxx UUID suffix from uploaded images
                name_clean = re.sub(r'-[a-f0-9]{8}$', '', name_clean)
                name = name_clean.replace('-', ' ').replace('_', ' ').title()
                
                # Special handling for your test images (removing -s3 suffix if present)
                if name.lower().endswith(' s3'):
                    name = name[:-3]
                
                images.append({
                    "id": key,
                    "name": name,
                    "image_url": url
                })
            return images
        return []
    except Exception as e:
        print(f"S3 Error: {e}")
        return []


def delete_image_from_s3(image_url: str):
    try:
        if not image_url:
            return

        # Extract the full S3 key from the URL
        # e.g. https://bucket.s3.region.amazonaws.com/dish-library/chai-abc123.jpg
        #   -> dish-library/chai-abc123.jpg
        if 'amazonaws.com/' in image_url:
            file_key = image_url.split('amazonaws.com/')[-1]
        else:
            file_key = image_url.split('/')[-1]

        # Delete from S3 if configured
        if s3 and AWS_BUCKET_NAME:
            s3.delete_object(
                Bucket=AWS_BUCKET_NAME,
                Key=file_key
            )
            print(f"Deleted from S3: {file_key}")
        # Otherwise try to delete from local storage
        else:
            file_path = LOCAL_UPLOAD_DIR / file_key.split('/')[-1]
            if file_path.exists():
                file_path.unlink()
                print(f"Deleted from local storage: {file_key}")

    except Exception as e:
        print("Delete error:", e)
