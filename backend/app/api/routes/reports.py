from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.transaction import Transaction

router = APIRouter()


@router.get("/pnl")
async def profit_and_loss(db: AsyncSession = Depends(get_db)):
    """Monthly totals grouped by category."""
    result = await db.execute(
        select(
            func.date_trunc("month", Transaction.date).label("month"),
            Transaction.category,
            func.sum(Transaction.amount).label("total"),
            func.count(Transaction.id).label("count"),
        )
        .group_by("month", Transaction.category)
        .order_by("month")
    )
    return [
        {"month": str(r.month), "category": r.category, "total": r.total, "count": r.count}
        for r in result.all()
    ]


@router.get("/summary")
async def summary(db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.sum(Transaction.amount)))
    anomalies = await db.scalar(
        select(func.count(Transaction.id)).where(Transaction.is_anomaly == True)
    )
    total_count = await db.scalar(select(func.count(Transaction.id)))
    return {
        "total_amount": total or 0,
        "anomaly_count": anomalies or 0,
        "transaction_count": total_count or 0,
    }
