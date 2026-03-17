from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class AlertRuleCreate(BaseModel):
    name: str
    condition: str    # gt | lt | eq
    threshold: float
    field: str        # amount | category


class AlertRuleOut(AlertRuleCreate):
    id: UUID
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AlertEventOut(BaseModel):
    id: UUID
    rule_id: UUID
    transaction_id: UUID
    message: str
    triggered_at: datetime
    is_read: bool

    class Config:
        from_attributes = True
