# backend/schemas/users.py
from pydantic import BaseModel, EmailStr, ConfigDict, model_validator, field_validator
from typing import Optional, List
from enum import Enum


class UserRole(str, Enum):
    ADMIN = "Admin"
    USER = "User"
    BRANCH_MANAGER = "BranchManager"


class UserBase(BaseModel):
    emp_code: str
    full_name: str
    position: str
    branch_id: str
    service_point_id: Optional[int] = None
    phone: str
    email: EmailStr
    user_role: UserRole = UserRole.USER
    profile_image: Optional[str] = None
    is_active: bool = True


class UserLogin(BaseModel):
    emp_code: str
    password: str


class UserResponse(UserBase):
    user_id: int
    can_request: Optional[bool] = None
    branch_name: Optional[str] = None
    # 🎯 1. เพิ่มฟิลด์นี้เข้าไป เพื่อให้ Pydantic ยอมปล่อยชื่อจุดบริการส่งออกไปหา React หน้าบ้าน
    service_point_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def extract_branch_name(cls, obj):
        # 🎯 2. แกะชื่อสาขาจากตารางเชื่อมสัมพันธ์ (มีอยู่เดิมของคุณ)
        if hasattr(obj, "branch") and obj.branch:
            obj.__dict__["branch_name"] = obj.branch.branch_name
            
        # 🎯 3. แกะชื่อจุดบริการจากตารางเชื่อมสัมพันธ์ (เพิ่มใหม่เข้าล็อกเสารับส่งข้อมูล)
        if hasattr(obj, "service_point") and obj.service_point:
            obj.__dict__["service_point_name"] = obj.service_point.service_point_name
            
        return obj


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    can_request: bool


class TokenData(BaseModel):
    emp_code: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    position: Optional[str] = None
    branch_id: Optional[str] = None
    service_point_id: Optional[int] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    user_role: Optional[UserRole] = None
    profile_image: Optional[str] = None
    is_active: Optional[bool] = None
    can_request: Optional[bool] = None  # ✅ เพิ่มตรงนี้


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
        return v

class AdminResetPassword(BaseModel):
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
        return v


class PaginatedUserResponse(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class LiffRegisterRequest(BaseModel):
    emp_code: str
    line_user_id: str
    liff_access_token: str