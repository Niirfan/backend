# Schema สำหรับการจอง, จ่าย และประวัติสต็อก

from pydantic import BaseModel, ConfigDict
from typing import Optional, Literal
from datetime import datetime
from backend.models.request import ReservedStatus, IssueStatus, HistoryActionType  # ✅ import Enum จาก model


class ReservedBase(BaseModel):
    mat_id: int
    req_id: int
    quantity: int
    status: ReservedStatus = ReservedStatus.RESERVED  # ✅ แทน str


class ReservedResponse(ReservedBase):
    reserve_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class IssueBase(BaseModel):
    mat_id: int
    quantity: int
    issued_by: int
    mat_req_id: int
    note: Optional[str] = None
    status: IssueStatus = IssueStatus.ISSUED  # ✅ แทน str


class IssueResponse(IssueBase):
    issue_id: int
    issue_date: datetime
    model_config = ConfigDict(from_attributes=True)


class HistoryBase(BaseModel):
    mat_id: int
    action_type: HistoryActionType  # ✅ แทน Literal — ครอบคลุม IN, OUT, RESERVE, ADJUST
    quantity: int
    balance_after: int
    ref_table: Optional[str] = None
    ref_id: Optional[int] = None


class HistoryResponse(HistoryBase):
    history_id: int
    created_at: datetime
    action_date: datetime
    model_config = ConfigDict(from_attributes=True)


class StockReceive(BaseModel):
    mat_id: int
    quantity: int
    unit_price: float = 0.0


class StockAdjust(BaseModel):
    quantity: int
    mode: Literal["add", "set"]