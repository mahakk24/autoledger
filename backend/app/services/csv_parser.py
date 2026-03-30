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


def detect_columns(headers: list[str]) -> dict:
    """Auto-detect which column index maps to date/amount/merchant."""
    return {
        "date_col": _detect_column(headers, DATE_PATTERNS),
        "amount_col": _detect_column(headers, AMOUNT_PATTERNS),
        "merchant_col": _detect_column(headers, MERCHANT_PATTERNS),
        "headers": headers,
    }


def parse_csv(
    content: str,
    date_col: int,
    amount_col: int,
    merchant_col: int,
    skip_rows: int = 0,
) -> tuple[list[dict], list[str]]:
    """
    Parse CSV content into transaction dicts.
    Returns (transactions, errors).
    """
    transactions = []
    errors = []

    reader = csv.reader(io.StringIO(content))
    rows = list(reader)

    # Skip header + any extra rows
    data_rows = rows[skip_rows + 1:]

    for i, row in enumerate(data_rows):
        if not any(cell.strip() for cell in row):
            continue  # skip empty rows

        try:
            if max(date_col, amount_col, merchant_col) >= len(row):
                errors.append(f"Row {i+2}: not enough columns")
                continue

            date = _parse_date(row[date_col])
            amount = _parse_amount(row[amount_col])
            merchant = row[merchant_col].strip()

            if not date:
                errors.append(f"Row {i+2}: could not parse date '{row[date_col]}'")
                continue
            if amount is None:
                errors.append(f"Row {i+2}: could not parse amount '{row[amount_col]}'")
                continue
            if not merchant:
                errors.append(f"Row {i+2}: empty merchant/description")
                continue

            transactions.append({
                "date": date.isoformat(),
                "merchant": merchant,
                "amount": amount,
                "currency": "INR",
                "description": f"Imported from CSV",
            })
        except Exception as e:
            errors.append(f"Row {i+2}: {str(e)}")

    return transactions, errors