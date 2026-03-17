from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.alert import AlertRule, AlertEvent
from app.models.transaction import Transaction


async def evaluate_alerts(db: AsyncSession, txn: Transaction) -> None:
    result = await db.execute(
        select(AlertRule).where(AlertRule.is_active == True)
    )
    for rule in result.scalars().all():
        triggered = False

        if rule.field == "amount":
            val = abs(txn.amount)
            if rule.condition == "gt" and val > rule.threshold:
                triggered = True
            elif rule.condition == "lt" and val < rule.threshold:
                triggered = True
            elif rule.condition == "eq" and val == rule.threshold:
                triggered = True

        if triggered:
            event = AlertEvent(
                rule_id=rule.id,
                transaction_id=txn.id,
                message=(
                    f"Alert '{rule.name}': {txn.merchant} "
                    f"₹{abs(txn.amount):,.0f} triggered rule "
                    f"({rule.condition} ₹{rule.threshold:,.0f})"
                ),
            )
            db.add(event)

    await db.commit()
