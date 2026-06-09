from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship  # ✅ เพิ่ม
from backend.database import Base


class User(Base):
    __tablename__ = "sams_users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    emp_code = Column(String(10), unique=True, index=True, nullable=False)
    full_name = Column(String(50), nullable=False)
    position = Column(String(50), nullable=False)
    branch_id = Column(String(5), ForeignKey("sams_branch.branch_id"), nullable=False)
    service_point_id = Column(Integer, ForeignKey("sams_service.service_point_id"), nullable=True)
    phone = Column(String(10), nullable=False)
    email = Column(String(50), nullable=False, index=True)
    user_role = Column(
        Enum("User", "Admin", "BranchManager", name="role_enum"),
        default="User"
    )
    profile_image = Column(String(255), nullable=True)
    password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    can_request = Column(Boolean, default=False)
    line_user_id = Column(String(50), nullable=True)

    branch = relationship("Branch", lazy="joined") 
    service_point = relationship("ServicePoint", lazy="joined")