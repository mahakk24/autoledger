import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { PnLRow } from "../../services/api";

const COLORS: Record<string, string> = {
  revenue:    "#1D9E75",
  payroll:    "#7F77DD",
  software:   "#378ADD",
  marketing:  "#EF9F27",
  rent:       "#888780",
  travel:     "#D4537E",
  contractor: "#1D9E75",
  utilities:  "#D85A30",
  other:      "#B4B2A9",
};

interface Props { data: PnLRow[] }

export default function PnLChart({ data }: Props) {
  // Group rows into {month, category: total, ...}
  const grouped: Record<string, Record<string, number>> = {};
  for (const row of data) {
    const key = row.month ? format(parseISO(row.month), "MMM yy") : "?";
    if (!grouped[key]) grouped[key] = { month: key } as any;
    grouped[key][row.category ?? "other"] =
      (grouped[key][row.category ?? "other"] ?? 0) + Math.abs(row.total);
  }

  const chartData = Object.values(grouped);
  const categories = [...new Set(data.map((r) => r.category ?? "other"))];

  const fmt = (v: number) =>
    v >= 100_000 ? `₹${(v / 100_000).toFixed(1)}L` : `₹${(v / 1_000).toFixed(0)}k`;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="text-sm font-medium text-gray-700 mb-4">Monthly spend by category</h2>
      {chartData.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-16">No data yet — run the seed script</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip formatter={(v: number) => fmt(v)} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            {categories.map((cat) => (
              <Bar key={cat} dataKey={cat} stackId="a"
                fill={COLORS[cat] ?? "#888"} radius={cat === categories.at(-1) ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
