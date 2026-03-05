from fastapi import APIRouter, UploadFile, File, HTTPException
import boto3
import os
from uuid import uuid4
from pathlib import Path

router = APIRouter(prefix="/upload", tags=["Upload"])

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME", "")

# Initialize S3 client only if credentials are provided
s3 = None
if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_BUCKET_NAME:
    s3 = boto3.client(
        "s3",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        region_name=AWS_REGION,
    )

# Local upload directory as fallback
LOCAL_UPLOAD_DIR = Path("static/uploads/products")
LOCAL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files allowed")

        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid4()}.{file_extension}"

        # Use S3 if configured, otherwise use local storage
        if s3 and AWS_BUCKET_NAME:
            s3.upload_fileobj(
                file.file,
                AWS_BUCKET_NAME,
                unique_filename,
                ExtraArgs={"ContentType": file.content_type},
            )
            image_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{unique_filename}"
        else:
            # Fallback to local storage
            file_path = LOCAL_UPLOAD_DIR / unique_filename
            content = await file.read()
            with open(file_path, "wb") as f:
                f.write(content)
            image_url = f"/static/uploads/products/{unique_filename}"

        return {
            "success": True,
            "image_url": image_url
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def delete_image_from_s3(image_url: str):
    try:
        if not image_url:
            return

        file_key = image_url.split("/")[-1]

        # Delete from S3 if configured
        if s3 and AWS_BUCKET_NAME:
            s3.delete_object(
                Bucket=AWS_BUCKET_NAME,
                Key=file_key
            )
            print(f"Deleted from S3: {file_key}")
        # Otherwise try to delete from local storage
        else:
            file_path = LOCAL_UPLOAD_DIR / file_key
            if file_path.exists():
                file_path.unlink()
                print(f"Deleted from local storage: {file_key}")

    except Exception as e:
        print("Delete error:", e)
