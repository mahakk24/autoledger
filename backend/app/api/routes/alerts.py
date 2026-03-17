from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.alert import AlertRule, AlertEvent
from app.schemas.alert import AlertRuleCreate, AlertRuleOut, AlertEventOut

router = APIRouter()


@router.post("/rules", response_model=AlertRuleOut, status_code=201)
async def create_rule(data: AlertRuleCreate, db: AsyncSession = Depends(get_db)):
    rule = AlertRule(**data.model_dump())
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.get("/rules", response_model=list[AlertRuleOut])
async def list_rules(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AlertRule).order_by(AlertRule.created_at.desc()))
    return result.scalars().all()


@router.delete("/rules/{rule_id}", status_code=204)
async def delete_rule(rule_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AlertRule).where(AlertRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if rule:
        await db.delete(rule)
        await db.commit()


@router.get("/events", response_model=list[AlertEventOut])
async def list_events(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AlertEvent).order_by(AlertEvent.triggered_at.desc()).limit(50)
    )
    return result.scalars().all()


@router.patch("/events/{event_id}/read", status_code=200)
async def mark_read(event_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AlertEvent).where(AlertEvent.id == event_id))
    event = result.scalar_one_or_none()
    if event:
        event.is_read = True
        await db.commit()
    return {"ok": True}
