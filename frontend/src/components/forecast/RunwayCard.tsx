import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchRunway } from "../../services/api";

export default function RunwayCard() {
  const [marketing, setMarketing] = useState(0);
  const [payroll, setPayroll] = useState(0);
  const [software, setSoftware] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["runway", marketing, payroll, software],
    queryFn: () => fetchRunway(marketing, payroll, software),
  });

  const fmt = (v: number) =>
    v >= 100_000
      ? `₹${(v / 100_000).toFixed(1)}L`
      : `₹${(v / 1_000).toFixed(0)}k`;

  const runwayColor =
    !data ? "text-gray-900"
    : data.runway_months < 3 ? "text-red-600"
    : data.runway_months < 6 ? "text-amber-600"
    : "text-emerald-600";

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Runway
          </p>
          {isLoading ? (
            <p className="text-2xl font-semibold text-gray-300 mt-1">…</p>
          ) : (
            <p className={`text-2xl font-semibold mt-1 ${runwayColor}`}>
              {data?.runway_label}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            at {fmt(data?.monthly_burn ?? 0)}/mo burn
          </p>
        </div>
        {data?.scenario_applied && (
          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium">
            Scenario active
          </span>
        )}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Monthly burn", value: fmt(data?.monthly_burn ?? 0) },
          { label: "Monthly income", value: fmt(data?.monthly_income ?? 0) },
          { label: "Net monthly", value: fmt(Math.abs(data?.net_monthly ?? 0)),
            negative: (data?.net_monthly ?? 0) < 0 },
        ].map((m) => (
          <div key={m.label} className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500">{m.label}</p>
            <p className={`text-sm font-semibold mt-0.5 ${m.negative ? "text-red-600" : "text-gray-800"}`}>
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* Scenario sliders */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Scenario modelling
        </p>
        <div className="space-y-3">
          {[
            { label: "Marketing", value: marketing, set: setMarketing },
            { label: "Payroll",   value: payroll,   set: setPayroll },
            { label: "Software",  value: software,  set: setSoftware },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-20">{s.label}</span>
              <input
                type="range" min={-50} max={50} value={s.value}
                onChange={(e) => s.set(Number(e.target.value))}
                className="flex-1 accent-gray-900"
              />
              <span className={`text-xs font-medium w-10 text-right
                ${s.value > 0 ? "text-red-500" : s.value < 0 ? "text-emerald-600" : "text-gray-400"}`}>
                {s.value > 0 ? "+" : ""}{s.value}%
              </span>
            </div>
          ))}
        </div>
        {(marketing !== 0 || payroll !== 0 || software !== 0) && (
          <button
            onClick={() => { setMarketing(0); setPayroll(0); setSoftware(0); }}
            className="text-xs text-gray-400 hover:text-gray-600 mt-3"
          >
            Reset scenario
          </button>
        )}
      </div>

      {/* Expense breakdown */}
      {data?.expenses_by_category && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            3-month spend by category
          </p>
          <div className="space-y-1.5">
            {Object.entries(data.expenses_by_category)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, val]) => (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 capitalize">{cat}</span>
                  <span className="text-xs font-medium text-gray-800">{fmt(val)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}