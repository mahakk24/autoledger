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
