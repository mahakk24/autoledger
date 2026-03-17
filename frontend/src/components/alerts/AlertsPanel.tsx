import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAlertEvents, createAlertRule, markAlertRead } from "../../services/api";
import { format } from "date-fns";

export default function AlertsPanel() {
  const qc = useQueryClient();
  const { data: events = [] } = useQuery({
    queryKey: ["alert-events"],
    queryFn: fetchAlertEvents,
    refetchInterval: 10_000,
  });

  const [showForm, setShowForm] = useState(false);
  const [rule, setRule] = useState({ name: "", condition: "gt", threshold: "", field: "amount" });

  const createMut = useMutation({
    mutationFn: () =>
      createAlertRule({
        name: rule.name,
        condition: rule.condition as "gt" | "lt" | "eq",
        threshold: Number(rule.threshold),
        field: "amount",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alert-rules"] });
      setShowForm(false);
      setRule({ name: "", condition: "gt", threshold: "", field: "amount" });
    },
  });

  const readMut = useMutation({
    mutationFn: markAlertRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-events"] }),
  });

  const unread = events.filter((e: any) => !e.is_read).length;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-gray-700">Alerts</h2>
          {unread > 0 && (
            <span className="text-xs bg-red-100 text-red-600 font-medium px-1.5 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-2 py-1 transition-colors"
        >
          + Rule
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
          <input
            className="w-full border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none"
            placeholder="Rule name"
            value={rule.name}
            onChange={(e) => setRule((r) => ({ ...r, name: e.target.value }))}
          />
          <div className="flex gap-2">
            <select
              className="border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none"
              value={rule.condition}
              onChange={(e) => setRule((r) => ({ ...r, condition: e.target.value }))}
            >
              <option value="gt">Amount &gt;</option>
              <option value="lt">Amount &lt;</option>
            </select>
            <input
              type="number"
              className="flex-1 border border-gray-200 rounded px-2 py-1.5 bg-white focus:outline-none"
              placeholder="₹ threshold"
              value={rule.threshold}
              onChange={(e) => setRule((r) => ({ ...r, threshold: e.target.value }))}
            />
          </div>
          <button
            onClick={() => createMut.mutate()}
            disabled={!rule.name || !rule.threshold || createMut.isPending}
            className="w-full py-1.5 bg-gray-900 text-white rounded font-medium disabled:opacity-40"
          >
            {createMut.isPending ? "Saving…" : "Create rule"}
          </button>
        </div>
      )}

      <div className="space-y-2 max-h-72 overflow-y-auto">
        {events.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">
            No alerts yet. Create a rule above.
          </p>
        )}
        {events.map((e: any) => (
          <div
            key={e.id}
            className={`flex gap-2 items-start p-2 rounded-lg transition-colors
              ${e.is_read ? "opacity-50" : "bg-amber-50"}`}
          >
            <span className="w-1.5 h-1.5 mt-1.5 rounded-full bg-amber-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 leading-snug">{e.message}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {format(new Date(e.triggered_at), "dd MMM, HH:mm")}
              </p>
            </div>
            {!e.is_read && (
              <button
                onClick={() => readMut.mutate(e.id)}
                className="text-xs text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                ✓
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
