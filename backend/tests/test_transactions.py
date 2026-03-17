import pytest
from httpx import AsyncClient, ASGITransport
from datetime import datetime


@pytest.mark.asyncio
async def test_health():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        r = await client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_create_and_list_transaction():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "date": datetime.utcnow().isoformat(),
            "merchant": "AWS",
            "amount": -15000,
            "currency": "INR",
            "description": "Monthly cloud bill",
        }
        r = await client.post("/api/v1/transactions/", json=payload)
        assert r.status_code == 201
        data = r.json()
        assert data["merchant"] == "AWS"
        assert data["category"] is not None
        assert data["category_confidence"] is not None
        assert "is_anomaly" in data

        r2 = await client.get("/api/v1/transactions/")
        assert r2.status_code == 200
        body = r2.json()
        assert "items" in body
        assert "total" in body


@pytest.mark.asyncio
async def test_create_alert_rule():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        rule = {
            "name": "Large expense alert",
            "condition": "gt",
            "threshold": 100000,
            "field": "amount",
        }
        r = await client.post("/api/v1/alerts/rules", json=rule)
        assert r.status_code == 201
        assert r.json()["name"] == "Large expense alert"
