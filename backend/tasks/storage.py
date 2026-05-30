import boto3
import uuid
import os
from django.conf import settings
from botocore.exceptions import ClientError
from botocore.config import Config


def get_s3_client():
    """
    Создаёт boto3-клиент для Yandex Cloud Object Storage.

    Нюансы Yandex Cloud vs AWS S3:
    - endpoint_url обязателен: 'https://storage.yandexcloud.net'
    - region_name должен быть 'ru-central1' (или тот, что указан в консоли YC)
    - signature_version должен быть 's3v4' — Yandex Cloud не поддерживает v2
    - path-style addressing обязателен (по умолчанию boto3 использует virtual-hosted,
      что ломает соединение с Yandex Cloud)
    """
    access_key = settings.YANDEX_ACCESS_KEY
    secret_key = settings.YANDEX_SECRET_KEY
    endpoint   = getattr(settings, 'YS3_ENDPOINT_URL', 'https://storage.yandexcloud.net')
    region     = getattr(settings, 'YS3_REGION', 'ru-central1')

    if not access_key or not secret_key:
        raise ValueError(
            "Ключи доступа к S3 не найдены в настройках. "
            "Проверьте YANDEX_ACCESS_KEY и YANDEX_SECRET_KEY в .env"
        )

    return boto3.client(
        's3',
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        endpoint_url=endpoint,
        region_name=region,
        config=Config(
            signature_version='s3v4',
            # path-style: запросы идут как endpoint/bucket/key
            # вместо bucket.endpoint/key — Yandex Cloud требует именно это
            s3={'addressing_style': 'path'},
        ),
    )


def _get_content_type(file_obj) -> str:
    """
    Безопасно получает content_type файла.
    InMemoryUploadedFile и TemporaryUploadedFile имеют атрибут content_type,
    но он может быть None или пустым если браузер не передал заголовок.
    """
    ct = getattr(file_obj, 'content_type', None)
    if ct:
        return ct

    # Определяем по расширению как запасной вариант
    ext = os.path.splitext(getattr(file_obj, 'name', ''))[1].lower()
    fallback_map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf',
    }
    return fallback_map.get(ext, 'application/octet-stream')


def upload_file_to_s3(file_obj, folder: str = 'tasks') -> str:
    """
    Загружает файл в Yandex Cloud Object Storage и возвращает публичный URL.

    Args:
        file_obj: файл из request.FILES (InMemoryUploadedFile / TemporaryUploadedFile)
        folder:   папка внутри бакета, например 'tasks/conditions' или 'tasks/steps'

    Returns:
        Публичный URL вида https://storage.yandexcloud.net/bucket-name/folder/uuid.ext

    Raises:
        RuntimeError: если загрузка завершилась с ошибкой S3
    """
    ext         = os.path.splitext(file_obj.name)[1].lower()
    unique_name = f"{folder}/{uuid.uuid4().hex}{ext}"
    bucket_name = getattr(settings, 'YANDEX_BUCKET_NAME', None) or 'school-tr-storage'
    content_type = _get_content_type(file_obj)

    client = get_s3_client()

    try:
        # ВАЖНО: НЕ передаём ACL='public-read' — Yandex Cloud Object Storage
        # не поддерживает ACL через заголовки запроса (возвращает
        # AccessControlListNotSupported). Публичный доступ настраивается
        # один раз в консоли Yandex Cloud на уровне всего бакета:
        # Консоль YC → Object Storage → <бакет> → Настройки → Публичный доступ → Включить
        client.upload_fileobj(
            file_obj,
            bucket_name,
            unique_name,
            ExtraArgs={
                'ContentType': content_type,
            },
        )
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        raise RuntimeError(
            f"Ошибка загрузки в S3 (код {error_code}): {e}"
        )

    # Публичный URL для Yandex Cloud Object Storage:
    # https://storage.yandexcloud.net/<bucket>/<key>
    endpoint = getattr(settings, 'YS3_ENDPOINT_URL', 'https://storage.yandexcloud.net')
    # Убираем trailing slash у endpoint на случай если он есть в .env
    endpoint = endpoint.rstrip('/')
    public_url = f"{endpoint}/{bucket_name}/{unique_name}"
    return public_url


def delete_file_from_s3(url: str) -> None:
    """
    Удаляет файл из Yandex Cloud Object Storage по его публичному URL.
    Если URL не принадлежит нашему бакету — молча игнорирует.
    """
    bucket_name = getattr(settings, 'YANDEX_BUCKET_NAME', None) or 'school-tr-storage'
    endpoint    = getattr(settings, 'YS3_ENDPOINT_URL', 'https://storage.yandexcloud.net')
    endpoint    = endpoint.rstrip('/')

    prefix = f"{endpoint}/{bucket_name}/"
    if not url.startswith(prefix):
        return

    key    = url[len(prefix):]
    client = get_s3_client()

    try:
        client.delete_object(Bucket=bucket_name, Key=key)
    except ClientError as e:
        # Логируем но не падаем — удаление некритично
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Не удалось удалить файл из S3: {key}. Ошибка: {e}")