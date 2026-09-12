import { formatVND } from "@/lib/currency";

type Transaction = {
  id: string;
  kind: "INCOME" | "EXPENSE";
  amount: string;
  note: string | null;
  occurredAt: string;
  category?: { name: string; icon: string | null } | null;
  account?: { name: string } | null;
};

export function TransactionRow({
  transaction,
  onDelete,
}: {
  transaction: Transaction;
  onDelete: (id: string) => void;
}) {
  const isIncome = transaction.kind === "INCOME";
  const date = new Date(transaction.occurredAt);

  return (
    <div className="flex items-center justify-between py-2 border-b border-white/10 last:border-0 group">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg shrink-0">{transaction.category?.icon ?? (isIncome ? "💰" : "💸")}</span>
        <div className="min-w-0">
          <p className="text-[13px] text-white truncate">
            {transaction.note || transaction.category?.name || (isIncome ? "Thu nhập" : "Chi tiêu")}
          </p>
          <p className="text-[11px] text-white/40">
            {transaction.account?.name} · {date.toLocaleDateString("vi-VN")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[13px] font-medium ${isIncome ? "text-emerald-300" : "text-shuiro-500"}`}>
          {isIncome ? "+" : "−"}
          {formatVND(Number(transaction.amount))}
        </span>
        <button
          onClick={() => onDelete(transaction.id)}
          className="opacity-0 group-hover:opacity-100 text-[11px] text-white/40 hover:text-shuiro-500 transition-opacity"
        >
          Xoá
        </button>
      </div>
    </div>
  );
}
