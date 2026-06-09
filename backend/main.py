# เซิร์ฟเวอร์หลัก — ตั้งค่า FastAPI และเชื่อมต่อ Routers ทั้งหมด
import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session
from fastapi import Depends
from fastapi.responses import JSONResponse
from backend.database import get_db

from backend.login import auth
from backend.routers import (
    materials, requests, admin_requests, master, 
    admin_stock, admin_users, users, material_images, 
    dashboard, inventory, admin_report, line_router, branch_dashboard
)
from backend.routers.admin_report_export import router as export_router
from backend.config import STATIC_DIR, UPLOAD_PROFILES, UPLOAD_MATERIALS
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from backend.login.auth import limiter, rate_limit_error_handler


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(name)s %(levelname)s %(message)s"
)

logger = logging.getLogger(__name__)

_ENV = os.getenv("ENV", "development")

app = FastAPI(
    title="SAMS API (Version 2)",
    description="ระบบจัดการวัสดุสำนักงาน",
    version="2.0.0",
    docs_url=None if _ENV == "production" else "/docs",
    redoc_url=None if _ENV == "production" else "/redoc",
    openapi_url=None if _ENV == "production" else "/openapi.json",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_error_handler)
app.add_middleware(SlowAPIMiddleware)

os.makedirs(UPLOAD_PROFILES, exist_ok=True)
os.makedirs(UPLOAD_MATERIALS, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# ✅ กรอง empty string ออก กรณี PUBLIC_URL ไม่ได้ตั้งค่าใน .env
_origins = [o for o in [
    "http://localhost:5173",
    "http://localhost:3000",
    os.getenv("PUBLIC_URL", ""),
] if o]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "ngrok-skip-browser-warning"],
)

# เชื่อมต่อระบบเส้นทาง API ทั้งหมด
app.include_router(auth.router)
app.include_router(master.router)
app.include_router(branch_dashboard.router)
app.include_router(materials.router)
app.include_router(material_images.router)
app.include_router(requests.router)
app.include_router(admin_requests.router)
app.include_router(admin_stock.router)
app.include_router(admin_users.router)
app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(inventory.router)
app.include_router(admin_report.router)
app.include_router(export_router)
app.include_router(line_router.router)


@app.get("/")
def read_root():
    return {"message": "✅ SAMS Backend V2 is running!"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception:
        logger.exception("Database connectivity health check failed")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected"}
        )