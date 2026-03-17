import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { PnLRow } from "../../services/api";

const COLORS: Record<string, string> = {
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

interface Props { data: PnLRow[] }

export default function CategoryDonut({ data }: Props) {
  const totals: Record<string, number> = {};
  for (const row of data) {
    if (row.category === "revenue") continue;
    const cat = row.category ?? "other";
    totals[cat] = (totals[cat] ?? 0) + Math.abs(row.total);
  }

  const chartData = Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const fmt = (v: number) =>
    v >= 100_000 ? `₹${(v / 100_000).toFixed(1)}L` : `₹${(v / 1_000).toFixed(0)}k`;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="text-sm font-medium text-gray-700 mb-4">Spend breakdown</h2>
      {chartData.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-16">No expense data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
              dataKey="value" paddingAngle={2}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name] ?? "#888"} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => fmt(v)} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
