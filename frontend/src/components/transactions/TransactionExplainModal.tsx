import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";
import { format } from "date-fns";

interface Props {
  transaction: any;
  onClose: () => void;
}

const fetchExplain = (id: string) =>
  api.get(`/transactions/${id}/explain`).then((r) => r.data);

const CATEGORY_COLOR: Record<string, string> = {
  revenue:    "#1D9E75",
  payroll:    "#7F77DD",
  software:   "#378ADD",
  marketing:  "#EF9F27",
  rent:       "#888780",
  travel:     "#D4537E",
  contractor: "#5DCAA5",
  utilities:  "#D85A30",
  other:      "#B4B2A9",
};

export default function TransactionExplainModal({ transaction, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["explain", transaction.id],
    queryFn: () => fetchExplain(transaction.id),
  });

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-base font-semibold text-gray-900">{transaction.merchant}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {format(new Date(transaction.date), "dd MMM yyyy, HH:mm")}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-semibold ${transaction.amount >= 0 ? "text-emerald-600" : "text-gray-800"}`}>
              {transaction.amount >= 0 ? "+" : ""}₹{Math.abs(transaction.amount).toLocaleString("en-IN")}
            </p>
            <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 mt-1">close ✕</button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Analysing transaction…</div>
        ) : data ? (
          <div className="p-5 space-y-5">

            {/* Anomaly banner */}
            {data.anomaly?.is_anomaly && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-sm font-medium text-red-700">⚠ Anomaly detected</p>
                <p className="text-xs text-red-500 mt-1">{data.anomaly.reason}</p>
                <p className="text-xs text-red-400 mt-0.5">
                  Isolation score: {data.anomaly.anomaly_score?.toFixed(3)}
                </p>
              </div>
            )}

            {/* Classification */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                ML Classification
              </p>
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: CATEGORY_COLOR[data.classification?.category] ?? "#888" }}
                >
                  {data.classification?.category}
                </span>
                <span className="text-sm text-gray-500">
                  {data.classification?.confidence}% confident
                </span>
              </div>

              {/* Explanation */}
              <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed">
                {data.classification?.explanation}
              </p>
            </div>

            {/* Top keywords */}
            {data.classification?.top_keywords?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Keywords that drove this decision
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.classification.top_keywords.map((kw: string) => (
                    <span key={kw} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* All probabilities bar chart */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                All category probabilities
              </p>
              <div className="space-y-2">
                {Object.entries(data.classification?.all_probabilities ?? {})
                  .sort((a: any, b: any) => b[1] - a[1])
                  .map(([cat, prob]: any) => (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-20 flex-shrink-0">{cat}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${prob}%`,
                            backgroundColor: CATEGORY_COLOR[cat] ?? "#888",
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-10 text-right">{prob}%</span>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="p-8 text-center text-sm text-red-400">Failed to load explanation</div>
        )}
      </div>
    </div>
  );
}
