"""
Generic CSV parser with auto-column detection.
Handles messy real-world bank statement formats.
"""
import csv
import io
import re
from datetime import datetime
from typing import Optional

# Common column name patterns for each field
DATE_PATTERNS = [
    "date", "txn date", "transaction date", "value date",
    "posting date", "trans date", "dated", "dt"
]
AMOUNT_PATTERNS = [
    "amount", "txn amount", "transaction amount", "debit",
    "credit", "withdrawal", "deposit", "dr", "cr", "inr"
]
MERCHANT_PATTERNS = [
    "description", "narration", "particulars", "details",
    "merchant", "payee", "remarks", "transaction details",
    "transaction remarks", "beneficiary"
]


def _normalize(s: str) -> str:
    return s.lower().strip().replace("_", " ").replace("-", " ")


def _detect_column(headers: list[str], patterns: list[str]) -> Optional[int]:
    """Find best matching column index for a given set of patterns."""
    normalized = [_normalize(h) for h in headers]
    # Exact match first
    for i, h in enumerate(normalized):
        if h in patterns:
            return i
    # Partial match
    for i, h in enumerate(normalized):
        for p in patterns:
            if p in h or h in p:
                return i
    return None


def _parse_amount(val: str) -> Optional[float]:
    """Parse amount string — handles commas, brackets, Dr/Cr suffixes."""
    if not val or not val.strip():
        return None
    val = val.strip()
    # Remove currency symbols
    val = re.sub(r"[₹$£€]", "", val)
    # Handle (1000) = negative
    negative = False
    if val.startswith("(") and val.endswith(")"):
        negative = True
        val = val[1:-1]
    # Handle Dr/Cr suffix
    if val.upper().endswith("DR"):
        negative = True
        val = val[:-2]
    elif val.upper().endswith("CR"):
        val = val[:-2]
    # Remove commas
    val = val.replace(",", "").strip()
    try:
        amount = float(val)
        return -amount if negative else amount
    except ValueError:
        return None


def _parse_date(val: str) -> Optional[datetime]:
    """Try multiple date formats."""
    if not val or not val.strip():
        return None
    val = val.strip()
    formats = [
        "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%d-%m-%y",
        "%Y-%m-%d", "%m/%d/%Y", "%d %b %Y", "%d %B %Y",
        "%d/%m/%Y %H:%M:%S", "%d-%m-%Y %H:%M:%S",
        "%Y/%m/%d", "%b %d, %Y", "%d-%b-%Y", "%d-%b-%y",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(val, fmt)
        except ValueError:
            continue
    return None


DEBIT_PATTERNS = ["debit", "dr", "withdrawal", "withdrawals", "debit amount"]
CREDIT_PATTERNS = ["credit", "cr", "deposit", "deposits", "credit amount"]

def detect_columns(headers: list[str]) -> dict:
    return {
        "date_col": _detect_column(headers, DATE_PATTERNS),
        "amount_col": _detect_column(headers, AMOUNT_PATTERNS),
        "merchant_col": _detect_column(headers, MERCHANT_PATTERNS),
        "debit_col": _detect_column(headers, DEBIT_PATTERNS),
        "credit_col": _detect_column(headers, CREDIT_PATTERNS),
        "headers": headers,
    }


def parse_csv(
    content: str,
    date_col: int,
    amount_col: int,
    merchant_col: int,
    debit_col: int = None,
    credit_col: int = None,
    skip_rows: int = 0,
) -> tuple[list[dict], list[str]]:
    transactions = []
    errors = []

    reader = csv.reader(io.StringIO(content))
    rows = list(reader)
    data_rows = rows[skip_rows + 1:]

    for i, row in enumerate(data_rows):
        if not any(cell.strip() for cell in row):
            continue

        try:
            date = _parse_date(row[date_col])
            merchant = row[merchant_col].strip()

            # Handle debit/credit columns separately
            if debit_col is not None and credit_col is not None:
                debit = _parse_amount(row[debit_col]) if debit_col < len(row) else None
                credit = _parse_amount(row[credit_col]) if credit_col < len(row) else None
                if debit and debit != 0:
                    amount = -abs(debit)
                elif credit and credit != 0:
                    amount = abs(credit)
                else:
                    continue
            else:
                amount = _parse_amount(row[amount_col])

            if not date:
                errors.append(f"Row {i+2}: could not parse date '{row[date_col]}'")
                continue
            if amount is None:
                errors.append(f"Row {i+2}: could not parse amount")
                continue
            if not merchant:
                errors.append(f"Row {i+2}: empty merchant")
                continue

            transactions.append({
                "date": date.isoformat(),
                "merchant": merchant,
                "amount": amount,
                "currency": "INR",
                "description": "Imported from CSV",
            })
        except Exception as e:
            errors.append(f"Row {i+2}: {str(e)}")

    return transactions, errors