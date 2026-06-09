from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


class RequestItemOut(BaseModel):
    mat_id: int
    mat_name: str
    req_qty: int
    approve_qty: int

    model_config = ConfigDict(from_attributes=True)


class BranchRequestOut(BaseModel):
    mat_req_id: int
    mat_req_code: str
    requester_id: str
    requester_name: str
    branch_id: str
    branch_name: str
    req_date: datetime
    req_status: str
    total_price: float
    admin_note: Optional[str] = None
    items: List[RequestItemOut]
    items_count: int
    days_to_approve: Optional[float] = None
    days_to_issue: Optional[float] = None    
    approved_at: Optional[datetime] = None   
    rejected_at: Optional[datetime] = None   
    issued_at: Optional[datetime] = None   

    model_config = ConfigDict(from_attributes=True)


class BranchDashboardStats(BaseModel):
    total_requests: int
    pending_count: int
    approved_count: int
    rejected_count: int
    issued_count: int
    cancelled_count: int
    total_value: float                   
    avg_days_to_approve: Optional[float] = None
    avg_days_to_issue: Optional[float] = None 


class BranchDashboardResponse(BaseModel):
    stats: BranchDashboardStats
    items: List[BranchRequestOut]
    total: int
    page: int
    per_page: int
    total_pages: int