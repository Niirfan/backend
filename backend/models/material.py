# Models สำหรับวัสดุและสต็อก

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, ForeignKey
from backend.database import Base
from datetime import datetime, timezone


class Material(Base):
    """ตารางวัสดุ (sams_material)"""
    __tablename__ = "sams_material"
    
    mat_id = Column(Integer, primary_key=True)
    mat_code = Column(String(10), unique=True)
    mat_name = Column(String(50), nullable=False)
    mat_type_id = Column(Integer, ForeignKey("material_type.mat_type_id"))
    unit_pack = Column(String(20))
    qty_per_pack = Column(Integer)
    unit_sub = Column(String(20))
    price_per_pack = Column(Numeric(10, 2), default=0.0, nullable=False)
    is_active = Column(Boolean, default=True)
    min_qty = Column(Integer, default=10)
    image = Column(String(100), nullable=True)


class MaterialStock(Base):
    """ตารางสต็อกวัสดุ (material_stock)"""
    __tablename__ = "material_stock"
    
    stock_id = Column(Integer, primary_key=True)
    mat_id = Column(Integer, ForeignKey("sams_material.mat_id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2))
    import_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)  
