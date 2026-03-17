from sqlalchemy import Column, String, Float, DateTime, Boolean, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum
from app.db.session import Base


class Category(str, enum.Enum):
    payroll = "payroll"
    software = "software"
    marketing = "marketing"
    rent = "rent"
    travel = "travel"
    utilities = "utilities"
    contractor = "contractor"
    revenue = "revenue"
    other = "other"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    date = Column(DateTime, nullable=False, default=datetime.utcnow)
    merchant = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    category = Column(SAEnum(Category), nullable=True)
    category_confidence = Column(Float, nullable=True)
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, nullable=True)
    anomaly_reason = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    raw_data = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
