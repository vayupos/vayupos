import boto3
import os
from uuid import uuid4
from fastapi import UploadFile

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

def upload_image(file: UploadFile):
    file_extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid4()}.{file_extension}"

    s3.upload_fileobj(
        file.file,
        AWS_BUCKET_NAME,
        unique_filename,
        ExtraArgs={"ContentType": file.content_type},
    )

    return f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{unique_filename}"
