import { formatVND } from "@/lib/currency";

export function BudgetProgressRow({
  icon,
  name,
  spent,
  limit,
}: {
  icon: string | null;
  name: string;
  spent: number;
  limit: number;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const over = spent > limit;

  return (
    <div>
      <div className="flex items-center justify-between text-[12px] mb-1">
        <span className="text-white">
          {icon ? `${icon} ` : ""}
          {name}
        </span>
        <span className={over ? "text-shuiro-500 font-medium" : "text-white/40"}>
          {formatVND(spent)} / {formatVND(limit)}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${over ? "bg-shuiro-500" : "bg-kincha-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
