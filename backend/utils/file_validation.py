from fastapi import HTTPException

MAGIC_BYTES = [
    b"\xff\xd8\xff",       # jpg
    b"\x89PNG\r\n\x1a\n",  # png
    b"RIFF",               # webp
]

MAX_IMAGE_SIZE = 2 * 1024 * 1024  # 2MB
ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}


def validate_image(contents: bytes, filename: str = "") -> str:
    """ตรวจ magic bytes, size, และ extension — คืน extension"""
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="ไฟล์รูปภาพต้องมีขนาดไม่เกิน 2MB")

    if not any(contents.startswith(m) for m in MAGIC_BYTES):
        raise HTTPException(status_code=400, detail="ไฟล์ไม่ใช่รูปภาพจริง")

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="รองรับเฉพาะ jpg, png, webp")

    return ext