# Models สำหรับข้อมูลพื้นฐาน — สาขา, จุดบริการ, ประเภทวัสดุ

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship  # เพิ่มบรรทัดนี้
from backend.database import Base


class Branch(Base):
    """ตารางสาขา (sams_branch)"""
    __tablename__ = "sams_branch"
    
    branch_id = Column(String(5), primary_key=True)
    branch_name = Column(String(50), nullable=False)


class ServicePoint(Base):
    """ตารางจุดบริการ (sams_service)"""
    __tablename__ = "sams_service"
    
    service_point_id = Column(Integer, primary_key=True)
    service_point_name = Column(String(50), nullable=False)
    branch_id = Column(String(5), ForeignKey("sams_branch.branch_id"))
    service_point_code = Column(String(10))
    branch = relationship("Branch") 


class MaterialType(Base):
    """ตารางประเภทวัสดุ (material_type)"""
    __tablename__ = "material_type"
    
    mat_type_id = Column(Integer, primary_key=True, autoincrement=True)
    mat_type_name = Column(String(50), nullable=False)