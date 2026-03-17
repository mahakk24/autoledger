from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.transaction import Transaction
from app.ml.pipeline.forecaster import forecast_cashflow

router = APIRouter()


@router.get("/")
async def get_forecast(
    days: int = Query(30, ge=7, le=90),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Transaction).order_by(Transaction.date))
    txns = result.scalars().all()
    data = [{"date": str(t.date.date()), "amount": t.amount} for t in txns]
    return {"days": days, "forecast": forecast_cashflow(data, days)}
