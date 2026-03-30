from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.services.csv_parser import detect_columns, parse_csv
from app.services.transaction_service import ingest_transaction
from app.schemas.transaction import TransactionCreate
from datetime import datetime

router = APIRouter()


@router.post("/preview")
async def preview_csv(file: UploadFile = File(...)):
    """
    Upload CSV → auto-detect columns → return preview.
    No transactions are saved yet.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files supported")

    content = (await file.read()).decode("utf-8", errors="replace")
    lines = content.strip().split("\n")

    if len(lines) < 2:
        raise HTTPException(status_code=400, detail="CSV has no data rows")

    import csv, io
    reader = csv.reader(io.StringIO(content))
    rows = list(reader)
    headers = rows[0] if rows else []

    detection = detect_columns(headers)

    # Preview first 5 data rows
    preview_rows = []
    for row in rows[1:6]:
        preview_rows.append(dict(zip(headers, row)))

    return {
        "headers": headers,
        "detected": detection,
        "preview": preview_rows,
        "total_rows": len(rows) - 1,
        "filename": file.filename,
    }


@router.post("/confirm")
async def confirm_import(
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    """
    Confirm import with column mapping.
    Parses and ingests all transactions.
    """
    content = payload.get("content", "")
    date_col = payload.get("date_col", 0)
    amount_col = payload.get("amount_col", 1)
    merchant_col = payload.get("merchant_col", 2)

    transactions, errors = parse_csv(content, date_col, amount_col, merchant_col)

    if not transactions:
        raise HTTPException(
            status_code=400,
            detail=f"No valid transactions found. Errors: {errors[:5]}"
        )

    inserted = 0
    failed = 0
    for txn_data in transactions:
        try:
            await ingest_transaction(
                db,
                TransactionCreate(
                    date=datetime.fromisoformat(txn_data["date"]),
                    merchant=txn_data["merchant"],
                    amount=txn_data["amount"],
                    currency=txn_data.get("currency", "INR"),
                    description=txn_data.get("description"),
                ),
            )
            inserted += 1
        except Exception:
            failed += 1

    return {
        "inserted": inserted,
        "failed": failed,
        "errors": errors[:10],
        "message": f"Successfully imported {inserted} transactions",
    }