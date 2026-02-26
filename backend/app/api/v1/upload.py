from fastapi import APIRouter, UploadFile, File, HTTPException
import boto3
import os
from uuid import uuid4

router = APIRouter(prefix="/upload", tags=["Upload"])

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")

s3 = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION,
)


@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only image files allowed")

        file_extension = file.filename.split(".")[-1]
        unique_filename = f"{uuid4()}.{file_extension}"

        s3.upload_fileobj(
            file.file,
            AWS_BUCKET_NAME,
            unique_filename,
            ExtraArgs={"ContentType": file.content_type},
        )

        image_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{unique_filename}"

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

        s3.delete_object(
            Bucket=AWS_BUCKET_NAME,
            Key=file_key
        )

        print(f"🗑️ Deleted from S3: {file_key}")

    except Exception as e:
        print("❌ S3 delete error:", e)
