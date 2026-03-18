from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.transaction import TransactionCreate, TransactionOut, TransactionPage
from app.services.transaction_service import ingest_transaction, get_transactions

router = APIRouter()


@router.post("/", response_model=TransactionOut, status_code=201)
async def create_transaction(data: TransactionCreate, db: AsyncSession = Depends(get_db)):
    return await ingest_transaction(db, data)


@router.get("/", response_model=TransactionPage)
async def list_transactions(
    page: int = 1, size: int = 50, db: AsyncSession = Depends(get_db)
):
    items, total = await get_transactions(db, page, size)
    return TransactionPage(items=items, total=total, page=page, size=size)


@router.get("/{transaction_id}/explain")
async def explain_transaction(transaction_id: str, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from app.models.transaction import Transaction
    from app.ml.pipeline.classifier import explain_classification
    from app.ml.pipeline.anomaly import detect_anomaly

    result = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
    txn = result.scalar_one_or_none()
    if not txn:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Transaction not found")

    explanation = explain_classification(txn.merchant, txn.description or "")

    anomaly_detail = {}
    if txn.is_anomaly:
        anomaly_detail = {
            "is_anomaly": True,
            "anomaly_score": txn.anomaly_score,
            "reason": txn.anomaly_reason or "Statistical outlier",
        }
    else:
        anomaly_detail = {"is_anomaly": False}

    return {
        "transaction_id": str(txn.id),
        "merchant": txn.merchant,
        "amount": txn.amount,
        "classification": explanation,
        "anomaly": anomaly_detail,
    }
