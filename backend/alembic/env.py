from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# =======================================================================
# 🎯 จุดอัปเดต: นำเข้าคอนฟิกและโมเดลทั้งหมดจากระบบ SAMS ของคุณอิรฟาน
# =======================================================================
from backend.config import DATABASE_URL
from backend.database import Base

# นำเข้าโมเดลทั้งหมดมาจดสแตนด์บายไว้ เพื่อให้ Alembic ตรวจจับการเปลี่ยนแปลงของตารางได้อัตโนมัติ
from backend.models import users, master, material, request
# =======================================================================

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    # 🎯 ปรับแก้ไข: บังคับใช้ DATABASE_URL จากคอนฟิกส่วนกลาง
    url = DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    # 🎯 ปรับแก้ไข: ดึงข้อมูลการตั้งค่าเซกชันแล้วแทนที่ URL ด้วยคอนฟิกกลางจาก .env
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = DATABASE_URL

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()