import axios from "axios";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const api = axios.create({ baseURL: `${BASE}/api/v1` });

api.interceptors.request.use((config) => {
  if (config.method === "post" && config.url && !config.url.endsWith("/")) {
    config.url = config.url + "/";
  }
  return config;
});

// ── Transactions ──────────────────────────────────────────────
export const fetchTransactions = (page = 1, size = 50) =>
  api.get("/transactions/", { params: { page, size } }).then((r) => r.data);

export const createTransaction = (data: TransactionCreate) =>
  api.post("/transactions/", data, { maxRedirects: 5 }).then((r) => r.data);

// ── Reports ───────────────────────────────────────────────────
export const fetchPnL = () => api.get("/reports/pnl").then((r) => r.data);
export const fetchSummary = () => api.get("/reports/summary").then((r) => r.data);

// ── Forecast ──────────────────────────────────────────────────
export const fetchForecast = (days = 30) =>
  api.get("/forecast/", { params: { days } }).then((r) => r.data);

export const fetchRunway = (marketing = 0, payroll = 0, software = 0) =>
  api.get("/runway/", { params: {
    scenario_marketing: marketing,
    scenario_payroll: payroll,
    scenario_software: software,
  }}).then((r) => r.data);

// ── Alerts ────────────────────────────────────────────────────
export const fetchAlertEvents = () =>
  api.get("/alerts/events").then((r) => r.data);

export const fetchAlertRules = () =>
  api.get("/alerts/rules").then((r) => r.data);

export const createAlertRule = (data: AlertRuleCreate) =>
  api.post("/alerts/rules", data).then((r) => r.data);

export const markAlertRead = (id: string) =>
  api.patch(`/alerts/events/${id}/read`).then((r) => r.data);

// ── WebSocket ─────────────────────────────────────────────────
export const connectWebSocket = (onMessage: (data: WsMessage) => void): WebSocket => {
  const url = `${BASE.replace("http", "ws")}/ws/live`;
  const ws = new WebSocket(url);
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch { /* ignore */ }
  };
  // keep-alive ping every 20s
  const ping = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) ws.send("ping");
  }, 20_000);
  ws.onclose = () => clearInterval(ping);
  return ws;
};

// ── Types ──────────────────────────────────────────────────────
export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  currency: string;
  category: string | null;
  category_confidence: number | null;
  is_anomaly: boolean;
  anomaly_score: number | null;
  anomaly_reason: string | null;
  description: string | null;
  created_at: string;
}

export interface TransactionCreate {
  date: string;
  merchant: string;
  amount: number;
  currency?: string;
  description?: string;
}

export interface AlertRuleCreate {
  name: string;
  condition: "gt" | "lt" | "eq";
  threshold: number;
  field: "amount";
}

export interface AlertEvent {
  id: string;
  rule_id: string;
  transaction_id: string;
  message: string;
  triggered_at: string;
  is_read: boolean;
}

export interface ForecastPoint {
  date: string;
  predicted_net: number;
  lower: number;
  upper: number;
}

export interface PnLRow {
  month: string;
  category: string;
  total: number;
  count: number;
}

export interface WsMessage {
  type: "new_transaction";
  data: Transaction;
}

export interface RunwayData {
  current_cash: number;
  monthly_burn: number;
  monthly_income: number;
  net_monthly: number;
  runway_months: number;
  runway_label: string;
  expenses_by_category: Record<string, number>;
  scenario_applied: boolean;
}