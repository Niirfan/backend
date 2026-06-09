# Models สำหรับใบเบิก, รายการย่อย, สต็อกจองและประวัติ

from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, Text, Enum
from backend.database import Base
from datetime import datetime, timezone
from sqlalchemy.orm import relationship  
import enum

# 1. สถานะใบเบิกหลัก (คงเดิมไว้)
class ReqStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    ISSUED = "ISSUED"

# 2. 🎯 เพิ่มใหม่: คุมสถานะสต็อกจอง (แก้ปัญหาจุด MaterialReserved.status)
class ReservedStatus(str, enum.Enum):
    RESERVED = "RESERVED"
    APPROVED = "APPROVED"
    RELEASED = "RELEASED"
    ISSUED = "ISSUED"
    CANCELLED = "CANCELLED"

# 3. 🎯 เพิ่มใหม่: คุมสถานะใบจ่ายวัสดุ (สำหรับ MaterialIssue.status)
class IssueStatus(str, enum.Enum):
    ISSUED = "ISSUED"
    CANCELLED = "CANCELLED"

# 4. 🎯 เพิ่มใหม่: คุมประเภทการเคลื่อนไหวสต็อก (สำหรับ MaterialHistory.action_type)
class HistoryActionType(str, enum.Enum):
    IN = "IN"           # รับของเข้าคลัง
    OUT = "OUT"         # เบิก/จ่ายของออก
    RESERVE = "RESERVE" # จองสต็อก
    ADJUST = "ADJUST"   # ปรับปรุงยอดสต็อกแมนนวล

class MaterialReq(Base):
    __tablename__ = "material_req"
    
    mat_req_id = Column(Integer, primary_key=True, index=True)
    mat_req_code = Column(String(20), unique=True, nullable=False)
    user_id = Column(String(10), ForeignKey("sams_users.emp_code"), nullable=False)
    req_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    total_price = Column(Numeric(10, 2), default=0.0)
    req_status = Column(
        Enum(ReqStatus, name="req_status_enum", create_type=False),
        default=ReqStatus.PENDING
    )
    admin_note = Column(Text, nullable=True)
    user = relationship("User", foreign_keys=[user_id], primaryjoin="MaterialReq.user_id == User.emp_code", lazy="joined")
    details = relationship("MaterialReqDetail", lazy="joined")
    approved_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    issued_at   = Column(DateTime, nullable=True)

class MaterialReqDetail(Base):
    """รายการวัสดุในใบเบิก (material_req_detail)"""
    __tablename__ = "material_req_detail"
    
    detail_id = Column(Integer, primary_key=True, index=True)
    mat_req_id = Column(Integer, ForeignKey("material_req.mat_req_id"), nullable=False)
    mat_id = Column(Integer, ForeignKey("sams_material.mat_id"), nullable=False)
    req_qty = Column(Integer, nullable=False)
    approve_qty = Column(Integer, default=0)
    material = relationship("Material", lazy="joined")


class MaterialReserved(Base):
    """สต็อกจองสำหรับใบเบิก (material_reserved)"""
    __tablename__ = "material_reserved"
    
    reserve_id = Column(Integer, primary_key=True, index=True)
    mat_id = Column(Integer, ForeignKey("sams_material.mat_id"), nullable=False)
    req_id = Column(Integer, ForeignKey("material_req.mat_req_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    
    # 🎯 🛠️ แก้ไขจุดนี้: เปลี่ยนจาก Text เป็น Enum เพื่อความปลอดภัยตามคำแนะนำ
    status = Column(
        Enum(ReservedStatus, name="reserved_status_enum", create_type=False), 
        default=ReservedStatus.RESERVED,
        nullable=False
    )
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class MaterialIssue(Base):
    """ใบจ่ายวัสดุ (material_issue)"""
    __tablename__ = "material_issue"
    
    issue_id = Column(Integer, primary_key=True, index=True)
    mat_id = Column(Integer, ForeignKey("sams_material.mat_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    issue_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    issued_by = Column(Integer, nullable=False)
    note = Column(String(50), nullable=True)
    
    # 🎯 🛠️ แก้ไขจุดนี้: เปลี่ยนจาก String(20) เป็น Enum เพื่อคุมสถานะการจ่าย
    status = Column(
        Enum(IssueStatus, name="issue_status_enum", create_type=False),
        default=IssueStatus.ISSUED,
        nullable=False
    )
    mat_req_id = Column(Integer, ForeignKey("material_req.mat_req_id"), nullable=False)


class MaterialHistory(Base):
    """ประวัติการเคลื่อนไหวสต็อก (material_history) - Audit Trail"""
    __tablename__ = "material_history"
    
    history_id = Column(Integer, primary_key=True, index=True)
    mat_id = Column(Integer, ForeignKey("sams_material.mat_id"), nullable=False)
    
    # 🎯 🛠️ แก้ไขจุดนี้: เปลี่ยนจาก String(10) เป็น Enum ป้องกันการพิมพ์ประเภทการเคลื่อนไหวมั่ว
    action_type = Column(
        Enum(HistoryActionType, name="history_action_enum", create_type=False),
        nullable=False
    )
    quantity = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=False)
    ref_table = Column(String(50), nullable=True)
    ref_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    action_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    emp_code = Column(String(10), nullable=True)