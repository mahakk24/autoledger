from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.transaction import Transaction
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/")
async def get_runway(
    scenario_marketing: float = Query(0, description="% change in marketing spend"),
    scenario_payroll: float = Query(0, description="% change in payroll"),
    scenario_software: float = Query(0, description="% change in software spend"),
    db: AsyncSession = Depends(get_db),
):
    # Get last 3 months of transactions
    three_months_ago = datetime.utcnow() - timedelta(days=90)
    result = await db.execute(
        select(Transaction).where(Transaction.date >= three_months_ago)
    )
    txns = result.scalars().all()

    # Separate income and expenses by category
    income = sum(t.amount for t in txns if t.amount > 0)
    expenses_by_category: dict[str, float] = {}
    for t in txns:
        if t.amount < 0:
            cat = t.category or "other"
            expenses_by_category[cat] = expenses_by_category.get(cat, 0) + abs(t.amount)

    # Apply scenario adjustments
    adjustments = {
        "marketing": scenario_marketing / 100,
        "payroll": scenario_payroll / 100,
        "software": scenario_software / 100,
    }
    adjusted_expenses = {}
    for cat, total in expenses_by_category.items():
        multiplier = 1 + adjustments.get(cat, 0)
        adjusted_expenses[cat] = round(total * multiplier, 2)

    total_expenses = sum(adjusted_expenses.values())
    monthly_burn = round(total_expenses / 3, 2)  # avg over 3 months
    monthly_income = round(income / 3, 2)
    net_monthly = round(monthly_income - monthly_burn, 2)

    # Runway = current cash / monthly burn
    # We estimate current cash as total net cash flow
    total_result = await db.scalar(select(func.sum(Transaction.amount)))
    current_cash = float(total_result or 0)

    runway_months = round(current_cash / monthly_burn, 1) if monthly_burn > 0 else 999

    return {
        "current_cash": round(current_cash, 2),
        "monthly_burn": monthly_burn,
        "monthly_income": monthly_income,
        "net_monthly": net_monthly,
        "runway_months": runway_months,
        "runway_label": f"{runway_months} months" if runway_months < 100 else "Profitable",
        "expenses_by_category": adjusted_expenses,
        "scenario_applied": any(v != 0 for v in [scenario_marketing, scenario_payroll, scenario_software]),
    }