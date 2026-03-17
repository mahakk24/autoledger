import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTransaction } from "../../services/api";

interface Props { onClose: () => void }

export default function AddTransactionModal({ onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    merchant: "",
    amount: "",
    date: new Date().toISOString().slice(0, 16),
    description: "",
    type: "expense",
  });

  const mut = useMutation({
    mutationFn: () =>
      createTransaction({
        merchant: form.merchant,
        amount: form.type === "expense" ? -Math.abs(Number(form.amount)) : Math.abs(Number(form.amount)),
        date: new Date(form.date).toISOString(),
        description: form.description || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["summary"] });
      qc.invalidateQueries({ queryKey: ["pnl"] });
      onClose();
    },
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 m-4">
        <h2 className="text-base font-semibold text-gray-800 mb-5">Add transaction</h2>

        <div className="space-y-4">
          <div className="flex gap-2">
            {(["expense", "revenue"] as const).map((t) => (
              <button
                key={t}
                onClick={() => set("type", t)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
                  ${form.type === t
                    ? t === "expense"
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"}`}
              >
                {t === "expense" ? "Expense" : "Revenue"}
              </button>
            ))}
          </div>

          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            placeholder="Merchant name"
            value={form.merchant}
            onChange={(e) => set("merchant", e.target.value)}
          />

          <input
            type="number"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            placeholder="Amount (₹)"
            value={form.amount}
            onChange={(e) => set("amount", e.target.value)}
          />

          <input
            type="datetime-local"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />

          <input
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => mut.mutate()}
            disabled={!form.merchant || !form.amount || mut.isPending}
            className="flex-1 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium disabled:opacity-40 hover:bg-gray-800"
          >
            {mut.isPending ? "Saving…" : "Add"}
          </button>
        </div>

        {mut.isError && (
          <p className="text-xs text-red-500 mt-3">Something went wrong. Check the API.</p>
        )}
      </div>
    </div>
  );
}
