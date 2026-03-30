# AutoLedger — Real-time Financial Intelligence for Startups

> Automates bookkeeping for early-stage startups — ML transaction classifier, anomaly detection, cash flow forecasting, runway calculator, and a live React dashboard.

## 🌐 Live Demo
- **Dashboard:** https://autoledger-frontend.onrender.com
- **API:** https://autoledger-api-6a9m.onrender.com
- **API Docs:** https://autoledger-api-6a9m.onrender.com/docs

> First load may take 30-60 seconds (free tier spin-up)

---

## The Problem

Every early-stage startup founder spends 10–20 hrs/month manually categorising bank transactions, reconciling expenses, and building P&L reports in Excel. AutoLedger replaces that entirely with an automated ML pipeline and a live dashboard.

---

## Features

| Feature | Details |
|---------|---------|
| Auto-categorisation | TF-IDF + Random Forest classifies transactions into 9 categories with confidence score |
| Explainable AI | Every classification shows keywords that drove the decision + probability breakdown |
| Anomaly detection | Isolation Forest flags unusual transactions — large amounts, odd hours, weekends |
| Cash flow forecast | 30/60/90-day forecast with 80% confidence interval |
| Runway calculator | Live burn rate + months of runway remaining |
| Scenario modelling | Drag sliders to simulate cutting marketing/payroll/software spend |
| CSV Import | Upload any bank statement CSV — columns auto-detected |
| Real-time feed | WebSocket broadcasts every new transaction instantly |
| Alert rules | Set threshold rules — get notified when any expense exceeds a limit |
| REST API | Full CRUD with auto-generated Swagger docs |

---

## Tech Stack

| Layer | Tools |
|-------|-------|
| Backend | FastAPI, SQLAlchemy (async), asyncpg |
| ML | scikit-learn (TF-IDF + Random Forest), Isolation Forest |
| Forecasting | Facebook Prophet |
| Queue | Celery + Redis |
| Database | PostgreSQL |
| Frontend | React 18, Vite, TailwindCSS, Recharts, Zustand |
| DevOps | Docker Compose, Render (live deployment) |

---

## Quick Start (Local)
```bash
# 1. Clone
git clone https://github.com/mahakk24/autoledger
cd autoledger

# 2. Start all services
docker compose -f docker/docker-compose.yml up --build -d

# 3. Open dashboard
open http://localhost:3000
```

---

## API Reference
```
POST   /api/v1/transactions/              Ingest + auto-classify transaction
GET    /api/v1/transactions/              Paginated transaction list
GET    /api/v1/transactions/{id}/explain  ML explanation with keyword attribution
GET    /api/v1/reports/pnl               Monthly P&L by category
GET    /api/v1/reports/summary           KPI summary
GET    /api/v1/reports/anomalies         All flagged anomalies with severity
GET    /api/v1/forecast/?days=30         Cash flow forecast
GET    /api/v1/runway/                   Burn rate + runway + scenario modelling
POST   /api/v1/import/preview            Preview CSV before import
POST   /api/v1/import/confirm            Bulk import transactions from CSV
POST   /api/v1/alerts/rules              Create alert rule
WS     /ws/live                          Real-time transaction WebSocket
```

---

## Modules Built

| Module | What was built |
|--------|---------------|
| 1 | Transaction ingestion pipeline — async FastAPI, PostgreSQL, WebSocket |
| 2 | ML classifier with explainability — TF-IDF, Random Forest, keyword attribution |
| 3 | Runway calculator — burn rate, scenario modelling, cash flow forecasting |
| 4 | Anomaly detector — severity scoring, category thresholds, anomaly dashboard |
| 5 | CSV import — auto-detect columns, drag & drop, bulk ingestion |
| 6 | Live deployment — Render, PostgreSQL, Redis, CI via GitHub |