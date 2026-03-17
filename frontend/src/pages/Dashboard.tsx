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

export default function Dashboard() {
  const [showAdd, setShowAdd] = useState(false);
  const { liveFeed, wsConnected, startLiveFeed } = useLiveStore();

  // Start WebSocket connection
  useEffect(() => {
    const stop = startLiveFeed();
    return stop;
  }, []);

  const { data: summary } = useQuery({ queryKey: ["summary"], queryFn: fetchSummary, refetchInterval: 30_000 });
  const { data: pnl = [] } = useQuery({ queryKey: ["pnl"], queryFn: fetchPnL });
  const { data: forecastData } = useQuery({ queryKey: ["forecast"], queryFn: () => fetchForecast(30) });
  const { data: txPage } = useQuery({ queryKey: ["transactions"], queryFn: () => fetchTransactions(1, 40), refetchInterval: 15_000 });

  const totalAmount = summary?.total_amount ?? 0;
  const totalFmt =
    Math.abs(totalAmount) >= 100_000
      ? `${totalAmount >= 0 ? "+" : "-"}₹${(Math.abs(totalAmount) / 100_000).toFixed(1)}L`
      : `${totalAmount >= 0 ? "+" : "-"}₹${(Math.abs(totalAmount) / 1_000).toFixed(0)}k`;

  // Merge live feed with DB transactions, deduplicate
  const liveIds = new Set(liveFeed.map((t) => t.id));
  const merged = [
    ...liveFeed,
    ...(txPage?.items ?? []).filter((t: any) => !liveIds.has(t.id)),
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header row */}
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

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Net cash flow"
          value={totalFmt}
          sub="All time"
          accent={totalAmount >= 0 ? "success" : "danger"}
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

      {/* Forecast full width */}
      <ForecastChart data={forecastData?.forecast ?? []} />

      {/* Feed + Alerts */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <TransactionFeed transactions={merged} isLive={wsConnected} />
        </div>
        <AlertsPanel />
      </div>

      {showAdd && <AddTransactionModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
