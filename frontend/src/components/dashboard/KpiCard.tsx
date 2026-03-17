interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "default" | "danger" | "success";
}

const ACCENTS = {
  default: "text-gray-900",
  danger: "text-red-600",
  success: "text-emerald-600",
};

export default function KpiCard({ label, value, sub, accent = "default" }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-1">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-semibold ${ACCENTS[accent]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
