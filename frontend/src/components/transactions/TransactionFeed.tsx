import { useState } from "react";
import { format } from "date-fns";
import TransactionExplainModal from "./TransactionExplainModal";
import type { Transaction } from "../../services/api";

const CATEGORY_PILL: Record<string, string> = {
  payroll:    "bg-purple-50  text-purple-700",
  software:   "bg-blue-50    text-blue-700",
  marketing:  "bg-amber-50   text-amber-700",
  revenue:    "bg-emerald-50 text-emerald-700",
  rent:       "bg-gray-100   text-gray-600",
  travel:     "bg-pink-50    text-pink-700",
  contractor: "bg-teal-50    text-teal-700",
  utilities:  "bg-orange-50  text-orange-700",
  other:      "bg-gray-100   text-gray-500",
};

interface Props {
  transactions: Transaction[];
  isLive?: boolean;
}

export default function TransactionFeed({ transactions, isLive }: Props) {
  const [selected, setSelected] = useState<Transaction | null>(null);

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-700">Transaction feed</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Click any row to see ML explanation</span>
            {isLive && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>

        {transactions.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-12">
            No transactions yet — use "+ Add transaction" to add one
          </p>
        ) : (
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {transactions.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelected(t)}
                className={`flex items-center justify-between py-2.5 px-2 rounded-lg cursor-pointer transition-colors hover:bg-gray-50
                  ${t.is_anomaly ? "border-l-2 border-red-400 pl-3" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {t.is_anomaly && (
                    <span
                      className="flex-shrink-0 w-2 h-2 rounded-full bg-red-500"
                      title={t.anomaly_reason ?? "Anomaly"}
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.merchant}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(t.date), "dd MMM, HH:mm")}
                      {t.is_anomaly && t.anomaly_reason && (
                        <span className="ml-2 text-red-400 truncate">{t.anomaly_reason}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  {t.category && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_PILL[t.category] ?? "bg-gray-100 text-gray-500"}`}>
                      {t.category}
                    </span>
                  )}
                  {t.category_confidence != null && (
                    <span className="text-xs text-gray-300 hidden sm:block">
                      {Math.round(t.category_confidence * 100)}%
                    </span>
                  )}
                  <p className={`text-sm font-semibold tabular-nums ${t.amount >= 0 ? "text-emerald-600" : "text-gray-800"}`}>
                    {t.amount >= 0 ? "+" : ""}₹{Math.abs(t.amount).toLocaleString("en-IN")}
                  </p>
                  <span className="text-gray-300 text-xs">›</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <TransactionExplainModal
          transaction={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
