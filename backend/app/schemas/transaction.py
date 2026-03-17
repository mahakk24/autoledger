from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID
from app.models.transaction import Category


class TransactionCreate(BaseModel):
    date: datetime
    merchant: str
    amount: float
    currency: str = "INR"
    description: Optional[str] = None


class TransactionOut(BaseModel):
    id: UUID
    date: datetime
    merchant: str
    amount: float
    currency: str
    category: Optional[Category]
    category_confidence: Optional[float]
    is_anomaly: bool
    anomaly_score: Optional[float]
    anomaly_reason: Optional[str]
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionPage(BaseModel):
    items: list[TransactionOut]
    total: int
    page: int
    size: int
