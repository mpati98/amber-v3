"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/currency";
import { ScrollCard } from "@/components/tang-kinh-cac/ui";
import { AddAccountModal } from "@/components/finance/AddAccountModal";
import { AddCategoryModal } from "@/components/finance/AddCategoryModal";
import { AddTransactionModal } from "@/components/finance/AddTransactionModal";
import { SetBudgetModal } from "@/components/finance/SetBudgetModal";
import { BudgetProgressRow } from "@/components/finance/BudgetProgressRow";
import { TransactionRow } from "@/components/finance/TransactionRow";

type Account = { id: string; name: string; type: string; currentBalance: string };
type Category = { id: string; name: string; icon: string | null; kind: "INCOME" | "EXPENSE" };
type Transaction = {
  id: string;
  kind: "INCOME" | "EXPENSE";
  amount: string;
  note: string | null;
  occurredAt: string;
  category?: { name: string; icon: string | null } | null;
  account?: { name: string } | null;
};
type Summary = {
  project: { id: string; name: string; startDate: string; endDate: string; archivedAt: string | null };
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netThisMonth: number;
  budgetProgress: { categoryId: string; categoryName: string; icon: string | null; limitAmount: number; spent: number }[];
};

export default function FinanceProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);

  const [summary, setSummary] = useState<Summary | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [setBudgetOpen, setSetBudgetOpen] = useState(false);

  const loadAll = useCallback(async () => {
    const [summaryRes, accountsRes, categoriesRes, transactionsRes] = await Promise.all([
      fetch(`/api/finance/summary?projectId=${projectId}`),
      fetch("/api/finance/accounts"),
      fetch("/api/finance/categories"),
      fetch(`/api/finance/transactions?projectId=${projectId}`),
    ]);
    if (summaryRes.status === 404) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setSummary(await summaryRes.json());
    setAccounts(await accountsRes.json());
    setCategories(await categoriesRes.json());
    setTransactions(await transactionsRes.json());
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const deleteTransaction = async (id: string) => {
    await fetch(`/api/finance/transactions/${id}`, { method: "DELETE" });
    loadAll();
  };

  if (notFound) {
    return (
      <main className="min-h-screen bg-ink-950 p-4 text-white sm:p-6 lg:p-8">
        <Link href="/finance" className="text-[11px] text-kincha-400 hover:text-kincha-200">
          ← Tài chính cá nhân
        </Link>
        <p className="mt-4 font-sans text-[12px] text-white/40">Không tìm thấy dự án này.</p>
      </main>
    );
  }

  if (loading || !summary) {
    return (
      <main className="min-h-screen bg-ink-950 p-4 text-white sm:p-6 lg:p-8">
        <p className="font-sans text-[12px] text-white/40">Đang tải...</p>
      </main>
    );
  }

  const isArchived = !!summary.project.archivedAt;

  return (
    <main className="min-h-screen bg-ink-950 p-4 pb-24 text-white sm:p-6 lg:p-8">
      <div className="mb-1 flex items-center justify-between font-sans text-[11px] text-white/40">
        <Link href="/finance" className="text-kincha-400 hover:text-kincha-200">
          ← Tài chính cá nhân
        </Link>
        {isArchived && (
          <span className="rounded-sm border border-white/15 px-2 py-0.5 text-[10px] text-white/50">Đã kết thúc</span>
        )}
      </div>

      <h1 className="mb-4 font-serif-display text-xl font-semibold tracking-wide text-white">
        {summary.project.name}
      </h1>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <ScrollCard glow="kincha" className="p-3">
          <p className="mb-1 font-sans text-[11px] text-white/40">Tổng số dư (mọi ví)</p>
          <p className="font-serif-display text-base font-semibold text-white">{formatVND(summary.totalBalance)}</p>
        </ScrollCard>
        <ScrollCard glow="kincha" className="p-3">
          <p className="mb-1 font-sans text-[11px] text-white/40">Chênh lệch tháng</p>
          <p
            className={`font-serif-display text-base font-semibold ${summary.netThisMonth >= 0 ? "text-emerald-300" : "text-shuiro-500"}`}
          >
            {formatVND(summary.netThisMonth)}
          </p>
        </ScrollCard>
        <ScrollCard glow="yugen" className="p-3">
          <p className="mb-1 font-sans text-[11px] text-white/40">Thu tháng này</p>
          <p className="font-serif-display text-base font-semibold text-emerald-300">{formatVND(summary.totalIncome)}</p>
        </ScrollCard>
        <ScrollCard glow="shuiro" className="p-3">
          <p className="mb-1 font-sans text-[11px] text-white/40">Chi tháng này</p>
          <p className="font-serif-display text-base font-semibold text-shuiro-500">{formatVND(summary.totalExpense)}</p>
        </ScrollCard>
      </div>

      <ScrollCard glow="yugen" className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-sans text-[12px] font-medium tracking-wide text-kincha-400">Ví & tài khoản</h2>
          <button onClick={() => setAddAccountOpen(true)} className="text-[11px] text-kincha-400 hover:underline">
            + Thêm ví
          </button>
        </div>
        {accounts.length === 0 ? (
          <p className="font-sans text-[12px] text-white/40">Chưa có ví nào.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {accounts.map((a) => (
              <div key={a.id} className="min-w-30 shrink-0 rounded-sm border border-white/10 bg-white/5 px-3 py-2">
                <p className="font-sans text-[12px] text-white">{a.name}</p>
                <p className="font-sans text-[13px] font-medium text-kincha-400">{formatVND(Number(a.currentBalance))}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollCard>

      <ScrollCard glow="kincha" className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-sans text-[12px] font-medium tracking-wide text-kincha-400">Ngân sách</h2>
          <button onClick={() => setSetBudgetOpen(true)} className="text-[11px] text-kincha-400 hover:underline">
            + Đặt ngân sách
          </button>
        </div>
        {!summary.budgetProgress.length ? (
          <p className="font-sans text-[12px] text-white/40">Chưa đặt ngân sách cho danh mục nào.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {summary.budgetProgress.map((b) => (
              <BudgetProgressRow key={b.categoryId} icon={b.icon} name={b.categoryName} spent={b.spent} limit={b.limitAmount} />
            ))}
          </div>
        )}
      </ScrollCard>

      <ScrollCard glow="shuiro">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-sans text-[12px] font-medium tracking-wide text-kincha-400">Giao dịch</h2>
          <button onClick={() => setAddCategoryOpen(true)} className="text-[11px] text-kincha-400 hover:underline">
            + Danh mục
          </button>
        </div>
        {transactions.length === 0 ? (
          <p className="font-sans text-[12px] text-white/40">Chưa có giao dịch nào.</p>
        ) : (
          <div>
            {transactions.map((t) => (
              <TransactionRow key={t.id} transaction={t} onDelete={deleteTransaction} />
            ))}
          </div>
        )}
      </ScrollCard>

      {!isArchived && (
        <div className="fixed bottom-6 right-6 pointer-events-none flex justify-end">
          <Button
            size="lg"
            className="pointer-events-auto bg-kincha-400 text-ink-950 shadow-lg hover:bg-kincha-400/80"
            onClick={() => (accounts.length === 0 ? setAddAccountOpen(true) : setAddTransactionOpen(true))}
          >
            {accounts.length === 0 ? "+ Thêm ví trước" : "+ Thêm giao dịch"}
          </Button>
        </div>
      )}

      <AddAccountModal open={addAccountOpen} onClose={() => setAddAccountOpen(false)} onCreated={loadAll} />
      <AddCategoryModal open={addCategoryOpen} onClose={() => setAddCategoryOpen(false)} onCreated={loadAll} />
      <AddTransactionModal
        open={addTransactionOpen}
        onClose={() => setAddTransactionOpen(false)}
        projectId={projectId}
        accounts={accounts}
        categories={categories}
        onCreated={loadAll}
      />
      <SetBudgetModal
        open={setBudgetOpen}
        onClose={() => setSetBudgetOpen(false)}
        projectId={projectId}
        projectName={summary.project.name}
        categories={categories}
        onSaved={loadAll}
      />
    </main>
  );
}
