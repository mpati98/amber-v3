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
        <span className="text-primary-900">
          {icon ? `${icon} ` : ""}
          {name}
        </span>
        <span className={over ? "text-accent-700 font-medium" : "text-text-secondary"}>
          {formatVND(spent)} / {formatVND(limit)}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-primary-50 overflow-hidden">
        <div
          className={`h-full rounded-full ${over ? "bg-accent-700" : "bg-primary-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
