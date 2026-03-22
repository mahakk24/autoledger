import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { ForecastPoint } from "../../services/api";

interface Props { data: ForecastPoint[] }

export default function ForecastChart({ data }: Props) {
  const fmt = (v: number) =>
    v >= 100_000 ? `₹${(v / 100_000).toFixed(1)}L`
    : v <= -100_000 ? `-₹${(Math.abs(v) / 100_000).toFixed(1)}L`
    : `₹${(v / 1_000).toFixed(0)}k`;

  const xFmt = (d: string) => {
    try { return format(parseISO(d), "dd MMM"); } catch { return d; }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      
      {data.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-16">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fcGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1D9E75" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#1D9E75" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="date" tickFormatter={xFmt} tick={{ fontSize: 10 }}
              axisLine={false} tickLine={false} interval={4} />
            <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }}
              axisLine={false} tickLine={false} width={52} />
            <Tooltip
              formatter={(v: number, name: string) => [fmt(v), name]}
              labelFormatter={(l) => xFmt(l)} />
            <ReferenceLine y={0} stroke="#E24B4A" strokeDasharray="4 2" strokeWidth={1} />
            {/* Confidence band */}
            <Area type="monotone" dataKey="upper" stroke="none" fill="#E1F5EE" />
            <Area type="monotone" dataKey="lower" stroke="none" fill="#fff" />
            {/* Main forecast line */}
            <Area type="monotone" dataKey="predicted_net"
              stroke="#1D9E75" strokeWidth={2} fill="url(#fcGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
