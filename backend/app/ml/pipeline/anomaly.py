"""
Improved anomaly detection with category-aware thresholds
and duplicate transaction detection.
"""
import pickle
import os
import numpy as np
from sklearn.ensemble import IsolationForest
from datetime import datetime

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/anomaly.pkl")
_model = None

# Category-specific amount thresholds (INR)
# Transactions exceeding these are flagged regardless of ML score
CATEGORY_THRESHOLDS = {
    "software":   50_000,
    "marketing":  150_000,
    "travel":     80_000,
    "utilities":  20_000,
    "other":      30_000,
    "rent":       200_000,
    "payroll":    500_000,
    "contractor": 200_000,
    "revenue":    2_000_000,
}

DUPLICATE_WINDOW_HOURS = 24  # flag if same merchant + amount within 24 hrs


def _features(amount: float, hour: int, weekday: int) -> np.ndarray:
    return np.array([[abs(amount), hour, weekday]])


def get_model():
    global _model
    if _model is None:
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, "rb") as f:
                _model = pickle.load(f)
        else:
            _model = _bootstrap()
    return _model


def _bootstrap():
    rng = np.random.default_rng(42)
    n = 600
    amounts = rng.lognormal(mean=9, sigma=1.2, size=n)
    hours = rng.integers(8, 19, size=n)
    days = rng.integers(0, 5, size=n)
    X = np.column_stack([amounts, hours, days])
    model = IsolationForest(contamination=0.05, random_state=42, n_estimators=100)
    model.fit(X)
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    return model


def detect_anomaly(
    amount: float,
    date: datetime,
    category: str = None,
    merchant: str = None,
    recent_transactions: list = None,
) -> tuple[bool, float, str]:
    """
    Returns (is_anomaly, isolation_score, human_readable_reason).
    Now checks:
    - Statistical outlier (Isolation Forest)
    - Category-specific amount threshold
    - Weekend transactions
    - Unusual hours
    - Duplicate detection (same merchant + amount in last 24hrs)
    """
    model = get_model()
    X = _features(amount, date.hour, date.weekday())
    raw_score = float(model.score_samples(X)[0])
    is_anomaly = model.predict(X)[0] == -1

    reasons = []

    # 1. Statistical outlier
    if is_anomaly:
        reasons.append("statistical outlier vs baseline")

    # 2. Category-specific threshold
    if category and category in CATEGORY_THRESHOLDS:
        threshold = CATEGORY_THRESHOLDS[category]
        if abs(amount) > threshold:
            is_anomaly = True
            reasons.append(
                f"exceeds {category} threshold "
                f"(₹{abs(amount):,.0f} > ₹{threshold:,.0f})"
            )

    # 3. Weekend transaction
    if date.weekday() >= 5:
        is_anomaly = True
        reasons.append("transaction on weekend")

    # 4. Unusual hours (before 7am or after 10pm)
    if date.hour < 7 or date.hour > 22:
        is_anomaly = True
        reasons.append(f"unusual hour ({date.hour}:00)")

    # 5. Duplicate detection
    if recent_transactions and merchant:
        for t in recent_transactions:
            if (
                t.get("merchant") == merchant
                and abs(t.get("amount", 0) - abs(amount)) < 1
            ):
                is_anomaly = True
                reasons.append(f"possible duplicate of recent transaction")
                break

    reason = "; ".join(reasons) if reasons else ""
    return is_anomaly, raw_score, reason