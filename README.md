# AutoLedger — Real-time Financial Intelligence for Startups

Automates bookkeeping by classifying transactions, detecting anomalies, forecasting cash flow, and surfacing everything through a live React dashboard.

## Tech Stack
- **Backend**: FastAPI + asyncpg + SQLAlchemy (async)
- **ML**: scikit-learn (classifier), Isolation Forest (anomaly), Prophet (forecast)
- **Queue**: Celery + Redis
- **Storage**: PostgreSQL
- **Frontend**: React + Vite + TailwindCSS + Recharts
- **DevOps**: Docker Compose, GitHub Actions

## Quick Start

```bash
# 1. Start all services
make up

# 2. Seed with 200 realistic startup transactions
make seed

# 3. Open dashboard
open http://localhost:3000

# 4. Explore the API docs
open http://localhost:8000/docs
```

## Project Structure
```
autoledger/
├── backend/
│   ├── app/
│   │   ├── api/routes/      # FastAPI route handlers
│   │   ├── core/            # Config, security
│   │   ├── db/              # DB session, base model
│   │   ├── ml/pipeline/     # Classifier, anomaly, forecaster
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic schemas
│   │   └── services/        # Business logic
│   └── tests/
├── frontend/
│   └── src/
│       ├── components/      # Dashboard, charts, alerts
│       ├── pages/
│       └── services/        # API client
├── docker/                  # Dockerfiles + compose
├── scripts/                 # seed.py
└── Makefile
```

## Build Modules
| Module | What you build | Key concepts |
|--------|---------------|--------------|
| 1 | Transaction ingestion + CSV parser | async Python, FastAPI, PostgreSQL |
| 2 | ML classifier + anomaly detection | scikit-learn, TF-IDF, Isolation Forest |
| 3 | Cash flow forecasting | Prophet/ARIMA, time series |
| 4 | React dashboard + WebSocket live feed | React Query, Recharts, WebSockets |
| 5 | Docker + CI/CD deployment | Docker Compose, GitHub Actions, Render |


SCREENSHOTS
![alt text](image.png)