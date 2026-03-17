from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate
from app.ml.pipeline.classifier import classify_transaction
from app.ml.pipeline.anomaly import detect_anomaly
from app.services.alert_service import evaluate_alerts


async def ingest_transaction(db: AsyncSession, data: TransactionCreate) -> Transaction:
    category, confidence = classify_transaction(data.merchant, data.description or "")
    is_anomaly, score, reason = detect_anomaly(data.amount, data.date)

    txn = Transaction(
        date=data.date,
        merchant=data.merchant,
        amount=data.amount,
        currency=data.currency,
        description=data.description,
        category=category,
        category_confidence=confidence,
        is_anomaly=is_anomaly,
        anomaly_score=score,
        anomaly_reason=reason,
    )
    db.add(txn)
    await db.commit()
    await db.refresh(txn)

    await evaluate_alerts(db, txn)
    return txn


async def get_transactions(db: AsyncSession, page: int = 1, size: int = 50):
    offset = (page - 1) * size
    result = await db.execute(
        select(Transaction)
        .order_by(Transaction.date.desc())
        .offset(offset)
        .limit(size)
    )
    items = result.scalars().all()
    count = await db.scalar(select(func.count(Transaction.id)))
    return items, count or 0
