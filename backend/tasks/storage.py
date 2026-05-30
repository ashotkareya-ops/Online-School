import boto3
import uuid
import os
from django.conf import settings
from botocore.exceptions import ClientError


import boto3
import uuid
import os
from django.conf import settings
from botocore.exceptions import ClientError

def get_s3_client():
    # Явно берем настройки из settings.py
    # Если переменные не найдены, они будут None, что приведет к ошибке, 
    # но зато вы будете знать, что настройки не загружены
    access_key = settings.YANDEX_ACCESS_KEY
    secret_key = settings.YANDEX_SECRET_KEY
    endpoint = settings.YS3_ENDPOINT_URL
    region = settings.YS3_REGION

    if not access_key or not secret_key:
        raise ValueError("Ключи доступа к S3 не найдены в настройках (проверьте .env!)")

    return boto3.client(
        's3',
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        endpoint_url=endpoint,
        region_name=region
    )


def upload_file_to_s3(file_obj, folder: str = 'tasks') -> str:
    ext = os.path.splitext(file_obj.name)[1].lower()
    unique_name = f"{folder}/{uuid.uuid4().hex}{ext}"

    client = get_s3_client()
    
    # Получаем имя бакета напрямую из настроек Django
    bucket_name = getattr(settings, 'YANDEX_BUCKET_NAME', None)
    
    # Резервный вариант: если Django вернул None, берем жесткую строку, чтобы не упасть
    if not bucket_name:
        bucket_name = 'school-tr-storage'

    try:
        client.upload_fileobj(
            file_obj,
            bucket_name,  # Передаем гарантированную строку
            unique_name,
            ExtraArgs={
                'ContentType': file_obj.content_type,
                'ACL': 'public-read',
            }
        )
    except ClientError as e:
        raise RuntimeError(f"Ошибка загрузки в S3: {e}")

    endpoint = getattr(settings, 'YS3_ENDPOINT_URL', 'https://storage.yandexcloud.net')
    public_url = f"{endpoint}/{bucket_name}/{unique_name}"
    return public_url


def delete_file_from_s3(url: str):
    bucket_name = getattr(settings, 'YANDEX_BUCKET_NAME', 'school-tr-storage')
    endpoint = getattr(settings, 'YS3_ENDPOINT_URL', 'https://storage.yandexcloud.net')
    
    prefix = f"{endpoint}/{bucket_name}/"
    if not url.startswith(prefix):
        return
    key = url[len(prefix):]
    client = get_s3_client()
    try:
        client.delete_object(Bucket=bucket_name, Key=key)
    except ClientError:
        pass