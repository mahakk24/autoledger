"""
30-day cash flow forecasting.
Uses Facebook Prophet when available; falls back to weighted moving average.
"""
from datetime import datetime, timedelta
from typing import List, Dict
import numpy as np


def forecast_cashflow(transactions: List[Dict], days: int = 30) -> List[Dict]:
    """
    Input:  list of {"date": "YYYY-MM-DD", "amount": float}
    Output: list of {"date": "YYYY-MM-DD", "predicted_net", "lower", "upper"}
    """
    try:
        from prophet import Prophet
        import pandas as pd

        df = pd.DataFrame(transactions)
        if df.empty:
            return _flat_forecast(days)

        df["ds"] = pd.to_datetime(df["date"])
        df["y"] = df["amount"].astype(float)
        daily = df.groupby("ds")["y"].sum().reset_index()

        model = Prophet(interval_width=0.80, daily_seasonality=False, weekly_seasonality=True)
        model.fit(daily)

        future = model.make_future_dataframe(periods=days)
        fc = model.predict(future).tail(days)

        return [
            {
                "date": row["ds"].strftime("%Y-%m-%d"),
                "predicted_net": round(row["yhat"], 2),
                "lower": round(row["yhat_lower"], 2),
                "upper": round(row["yhat_upper"], 2),
            }
            for _, row in fc.iterrows()
        ]

    except ImportError:
        return _moving_average_forecast(transactions, days)


def _moving_average_forecast(transactions: List[Dict], days: int) -> List[Dict]:
    """Weighted moving average fallback — no external deps."""
    recent = [t["amount"] for t in transactions[-60:]] if transactions else []
    if not recent:
        return _flat_forecast(days)

    weights = np.exp(np.linspace(0, 1, len(recent)))
    weights /= weights.sum()
    mean = float(np.dot(weights, recent))
    std = float(np.std(recent))
    base = datetime.utcnow()

    return [
        {
            "date": (base + timedelta(days=i)).strftime("%Y-%m-%d"),
            "predicted_net": round(mean, 2),
            "lower": round(mean - 1.28 * std, 2),
            "upper": round(mean + 1.28 * std, 2),
        }
        for i in range(1, days + 1)
    ]


def _flat_forecast(days: int) -> List[Dict]:
    base = datetime.utcnow()
    return [
        {"date": (base + timedelta(days=i)).strftime("%Y-%m-%d"),
         "predicted_net": 0.0, "lower": 0.0, "upper": 0.0}
        for i in range(1, days + 1)
    ]
