import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchSummary, fetchPnL, fetchForecast, fetchTransactions } from "../services/api";
import { useLiveStore } from "../store/liveStore";
import KpiCard from "../components/dashboard/KpiCard";
import PnLChart from "../components/dashboard/PnLChart";
import CategoryDonut from "../components/dashboard/CategoryDonut";
import ForecastChart from "../components/forecast/ForecastChart";
import TransactionFeed from "../components/transactions/TransactionFeed";
import AlertsPanel from "../components/alerts/AlertsPanel";
import AddTransactionModal from "../components/transactions/AddTransactionModal";
import RunwayCard from "../components/forecast/RunwayCard";

export default function Dashboard() {
  const [showAdd, setShowAdd] = useState(false);
  const [forecastDays, setForecastDays] = useState(30);
  const { liveFeed, wsConnected, startLiveFeed } = useLiveStore();

  useEffect(() => {
    const stop = startLiveFeed();
    return stop;
  }, []);

  const { data: summary } = useQuery({
    queryKey: ["summary"],
    queryFn: fetchSummary,
    refetchInterval: 30_000,
  });
  const { data: pnl = [] } = useQuery({ queryKey: ["pnl"], queryFn: fetchPnL });
  const { data: forecastData } = useQuery({
    queryKey: ["forecast", forecastDays],
    queryFn: () => fetchForecast(forecastDays),
  });
  const { data: txPage } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => fetchTransactions(1, 50),
    refetchInterval: 15_000,
  });

  const totalAmount = summary?.total_amount ?? 0;
  const totalFmt =
    Math.abs(totalAmount) >= 100_000
      ? `${totalAmount >= 0 ? "+" : "-"}₹${(Math.abs(totalAmount) / 100_000).toFixed(1)}L`
      : `${totalAmount >= 0 ? "+" : "-"}₹${(Math.abs(totalAmount) / 1_000).toFixed(0)}k`;

  const liveIds = new Set(liveFeed.map((t) => t.id));
  const merged = [
    ...liveFeed,
    ...(txPage?.items ?? []).filter((t: any) => !liveIds.has(t.id)),
  ];

  // Burn rate = average monthly expenses
  const expenses = (txPage?.items ?? []).filter((t: any) => t.amount < 0);
  const totalExpenses = expenses.reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
  const burnRate = totalExpenses > 0 ? Math.round(totalExpenses / 6) : 0;
  const burnFmt = burnRate >= 100_000
    ? `₹${(burnRate / 100_000).toFixed(1)}L/mo`
    : `₹${(burnRate / 1_000).toFixed(0)}k/mo`;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {wsConnected
              ? "Connected — transactions stream in real-time"
              : "Connecting to live feed…"}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          + Add transaction
        </button>
      </div>

      {/* KPI cards — now 4 */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Net cash flow"
          value={totalFmt}
          sub="All time"
          accent={totalAmount >= 0 ? "success" : "danger"}
        />
        <KpiCard
          label="Burn rate"
          value={burnFmt}
          sub="Avg monthly spend"
        />
        <KpiCard
          label="Anomalies flagged"
          value={summary?.anomaly_count ?? 0}
          sub="Unusual transactions"
          accent={(summary?.anomaly_count ?? 0) > 0 ? "danger" : "default"}
        />
        <KpiCard
          label="Total transactions"
          value={(summary?.transaction_count ?? 0).toLocaleString()}
          sub={wsConnected ? "Live" : "Last sync"}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-6">
        <PnLChart data={pnl} />
        <CategoryDonut data={pnl} />
      </div>

      {/* Forecast with day selector */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-medium text-gray-700">Cash flow forecast</h2>
            <p className="text-xs text-gray-400 mt-0.5">Shaded band = 80% confidence interval</p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 60, 90].map((d) => (
              <button
                key={d}
                onClick={() => setForecastDays(d)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors
                  ${forecastDays === d
                    ? "bg-gray-900 text-white border-gray-900"
                    : "text-gray-500 border-gray-200 hover:border-gray-400"}`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        <ForecastChart data={forecastData?.forecast ?? []} />
      </div>

      {/* Runway + Feed + Alerts */}
      <div className="grid grid-cols-3 gap-6">
        <RunwayCard />
        <TransactionFeed transactions={merged} isLive={wsConnected} />
        <AlertsPanel />
      </div>

      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
