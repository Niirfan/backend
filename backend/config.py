import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
UPLOAD_PROFILES = STATIC_DIR / "profiles"
UPLOAD_MATERIALS = STATIC_DIR / "materials"

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in .env")

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY or len(SECRET_KEY) < 32:
    raise RuntimeError("SECRET_KEY is not set or too short")

LINE_TOKEN = os.getenv("LINE_TOKEN")
if not LINE_TOKEN:
    raise RuntimeError("LINE_TOKEN is not set in .env")

LINE_CHANNEL_SECRET = os.getenv("LINE_CHANNEL_SECRET")
if not LINE_CHANNEL_SECRET:
    raise RuntimeError("LINE_CHANNEL_SECRET is not set in .env")

LINE_GROUP_ID = os.getenv("LINE_GROUP_ID")  
LIFF_ID = os.getenv("LIFF_ID")
if not LIFF_ID:
    raise RuntimeError("LIFF_ID is not set in .env")

LIFF_URL = f"https://liff.line.me/{LIFF_ID}"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

THAI_MONTHS = [
    "", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
]