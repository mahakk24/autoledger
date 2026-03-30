from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.session import init_db
from app.api.routes import transactions, reports, alerts, forecast, websocket
from app.api.routes import runway
from app.api.routes import imports
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="AutoLedger API",
    description="Real-time bookkeeping automation for startups",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(runway.router, prefix="/api/v1/runway", tags=["runway"])
app.include_router(transactions.router, prefix="/api/v1/transactions", tags=["transactions"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])
app.include_router(forecast.router, prefix="/api/v1/forecast", tags=["forecast"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])
app.include_router(imports.router, prefix="/api/v1/import", tags=["import"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "autoledger-api"}
