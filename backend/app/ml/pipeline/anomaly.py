"""
Anomaly detection using Isolation Forest.
Flags transactions deviating from typical startup spending patterns.
"""
import pickle
import os
import numpy as np
from sklearn.ensemble import IsolationForest
from datetime import datetime

MODEL_PATH = os.path.join(os.path.dirname(__file__), "../models/anomaly.pkl")
_model = None


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
    """Train on a synthetic distribution of normal startup transactions."""
    rng = np.random.default_rng(42)
    n = 600
    # Log-normal amounts in INR — typical range 1k–200k
    amounts = rng.lognormal(mean=9, sigma=1.2, size=n)
    hours = rng.integers(8, 19, size=n)      # business hours
    days = rng.integers(0, 5, size=n)        # weekdays
    X = np.column_stack([amounts, hours, days])

    model = IsolationForest(contamination=0.05, random_state=42, n_estimators=100)
    model.fit(X)

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    return model


def detect_anomaly(amount: float, date: datetime) -> tuple[bool, float, str]:
    """Returns (is_anomaly, isolation_score, human_readable_reason)."""
    model = get_model()
    X = _features(amount, date.hour, date.weekday())
    raw_score = float(model.score_samples(X)[0])
    is_anomaly = model.predict(X)[0] == -1

    reason = ""
    if is_anomaly:
        parts = []
        if abs(amount) > 500_000:
            parts.append(f"unusually large amount ₹{abs(amount):,.0f}")
        if date.weekday() >= 5:
            parts.append("transaction on a weekend")
        if date.hour < 7 or date.hour > 22:
            parts.append(f"unusual hour ({date.hour}:00)")
        reason = "; ".join(parts) if parts else "statistical outlier vs historical baseline"

    return is_anomaly, raw_score, reason
