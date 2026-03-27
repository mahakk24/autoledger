import { useQuery } from "@tanstack/react-query";
import { fetchAnomalies } from "../services/api";
import { format } from "date-fns";

const SEVERITY = (score: number) => {
  if (score < -0.7) return { label: "High", color: "bg-red-100 text-red-700" };
  if (score < -0.4) return { label: "Medium", color: "bg-amber-100 text-amber-700" };
  return { label: "Low", color: "bg-gray-100 text-gray-600" };
};

export default function AnomalyPage() {
  const { data: anomalies = [], isLoading } = useQuery({
    queryKey: ["anomalies"],
    queryFn: fetchAnomalies,
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Anomaly Report</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {anomalies.length} suspicious transactions detected
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : anomalies.length === 0 ? (
        <p className="text-sm text-gray-400">No anomalies detected.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {anomalies.map((t: any) => {
            const sev = SEVERITY(t.anomaly_score ?? 0);
            return (
              <div key={t.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${sev.color}`}>
                    {sev.label}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.merchant}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {format(new Date(t.date), "dd MMM yyyy, HH:mm")}
                      {t.category && (
                        <span className="ml-2 text-gray-300">· {t.category}</span>
                      )}
                    </p>
                    <p className="text-xs text-red-500 mt-0.5">{t.reason}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${t.amount >= 0 ? "text-emerald-600" : "text-gray-800"}`}>
                    {t.amount >= 0 ? "+" : ""}₹{Math.abs(t.amount).toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    score: {t.anomaly_score?.toFixed(3)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}