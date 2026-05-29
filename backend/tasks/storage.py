import boto3
import uuid
import os
from django.conf import settings
from botocore.exceptions import ClientError


def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=settings.YS3_ENDPOINT_URL,
        region_name=settings.YS3_REGION,
        aws_access_key_id=settings.YS3_ACCESS_KEY,
        aws_secret_access_key=settings.YS3_SECRET_KEY,
    )


def upload_file_to_s3(file_obj, folder: str = 'tasks') -> str:
    """
    Загружает файл в Yandex Object Storage.
    
    :param file_obj: файл из request.FILES
    :param folder: папка внутри бакета ('tasks', 'steps' и т.д.)
    :return: публичный URL загруженного файла
    """
    ext = os.path.splitext(file_obj.name)[1].lower()  # например .jpg
    unique_name = f"{folder}/{uuid.uuid4().hex}{ext}"

    client = get_s3_client()

    try:
        client.upload_fileobj(
            file_obj,
            settings.YS3_BUCKET_NAME,
            unique_name,
            ExtraArgs={
                'ContentType': file_obj.content_type,
                'ACL': 'public-read',  # файл будет публично доступен
            }
        )
    except ClientError as e:
        raise RuntimeError(f"Ошибка загрузки в S3: {e}")

    public_url = (
        f"{settings.YS3_ENDPOINT_URL}"
        f"/{settings.YS3_BUCKET_NAME}"
        f"/{unique_name}"
    )
    return public_url


def delete_file_from_s3(url: str):
    """
    Удаляет файл из S3 по его публичному URL.
    Используй при удалении задания.
    """
    prefix = (
        f"{settings.YS3_ENDPOINT_URL}"
        f"/{settings.YS3_BUCKET_NAME}/"
    )
    if not url.startswith(prefix):
        return
    key = url[len(prefix):]
    client = get_s3_client()
    try:
        client.delete_object(Bucket=settings.YS3_BUCKET_NAME, Key=key)
    except ClientError:
        pass  # логируй при необходимости