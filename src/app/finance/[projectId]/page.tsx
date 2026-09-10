"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/currency";
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
      <main className="p-4 max-w-2xl mx-auto bg-bg-light min-h-screen">
        <Link href="/finance" className="text-[11px] text-primary-500">
          ← Tài chính cá nhân
        </Link>
        <p className="text-[12px] text-text-secondary mt-4">Không tìm thấy dự án này.</p>
      </main>
    );
  }

  if (loading || !summary) {
    return (
      <main className="p-4 max-w-2xl mx-auto bg-bg-light min-h-screen">
        <p className="text-[12px] text-text-secondary">Đang tải...</p>
      </main>
    );
  }

  const isArchived = !!summary.project.archivedAt;

  return (
    <main className="p-4 max-w-2xl mx-auto bg-bg-light min-h-screen pb-24">
      <div className="flex items-center justify-between mb-1 text-[11px] text-text-secondary">
        <Link href="/finance" className="text-primary-500">
          ← Tài chính cá nhân
        </Link>
        {isArchived && <span className="text-[10px] rounded-full bg-primary-100 px-2 py-0.5">Đã kết thúc</span>}
      </div>

      <h1 className="text-lg font-semibold text-primary-900 tracking-wide mb-4">{summary.project.name}</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-xl bg-white border border-primary-100 p-3">
          <p className="text-[11px] text-text-secondary mb-1">Tổng số dư (mọi ví)</p>
          <p className="text-base font-semibold text-primary-900">{formatVND(summary.totalBalance)}</p>
        </div>
        <div className="rounded-xl bg-white border border-primary-100 p-3">
          <p className="text-[11px] text-text-secondary mb-1">Chênh lệch tháng</p>
          <p className={`text-base font-semibold ${summary.netThisMonth >= 0 ? "text-primary-700" : "text-accent-700"}`}>
            {formatVND(summary.netThisMonth)}
          </p>
        </div>
        <div className="rounded-xl bg-white border border-primary-100 p-3">
          <p className="text-[11px] text-text-secondary mb-1">Thu tháng này</p>
          <p className="text-base font-semibold text-primary-700">{formatVND(summary.totalIncome)}</p>
        </div>
        <div className="rounded-xl bg-white border border-primary-100 p-3">
          <p className="text-[11px] text-text-secondary mb-1">Chi tháng này</p>
          <p className="text-base font-semibold text-accent-700">{formatVND(summary.totalExpense)}</p>
        </div>
      </div>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12px] font-medium text-primary-700">Ví & tài khoản</h2>
          <button onClick={() => setAddAccountOpen(true)} className="text-[11px] text-primary-500">
            + Thêm ví
          </button>
        </div>
        {accounts.length === 0 ? (
          <p className="text-[12px] text-text-secondary">Chưa có ví nào.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {accounts.map((a) => (
              <div key={a.id} className="shrink-0 rounded-lg bg-white border border-primary-100 px-3 py-2 min-w-[120px]">
                <p className="text-[12px] text-primary-900">{a.name}</p>
                <p className="text-[13px] font-medium text-primary-700">{formatVND(Number(a.currentBalance))}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12px] font-medium text-primary-700">Ngân sách</h2>
          <button onClick={() => setSetBudgetOpen(true)} className="text-[11px] text-primary-500">
            + Đặt ngân sách
          </button>
        </div>
        {!summary.budgetProgress.length ? (
          <p className="text-[12px] text-text-secondary">Chưa đặt ngân sách cho danh mục nào.</p>
        ) : (
          <div className="flex flex-col gap-3 rounded-xl bg-white border border-primary-100 p-3">
            {summary.budgetProgress.map((b) => (
              <BudgetProgressRow key={b.categoryId} icon={b.icon} name={b.categoryName} spent={b.spent} limit={b.limitAmount} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[12px] font-medium text-primary-700">Giao dịch</h2>
          <button onClick={() => setAddCategoryOpen(true)} className="text-[11px] text-primary-500">
            + Danh mục
          </button>
        </div>
        {transactions.length === 0 ? (
          <p className="text-[12px] text-text-secondary">Chưa có giao dịch nào.</p>
        ) : (
          <div className="rounded-xl bg-white border border-primary-100 px-3">
            {transactions.map((t) => (
              <TransactionRow key={t.id} transaction={t} onDelete={deleteTransaction} />
            ))}
          </div>
        )}
      </section>

      {!isArchived && (
        <div className="fixed bottom-6 right-1/2 translate-x-1/2 max-w-2xl w-full px-4 flex justify-end pointer-events-none">
          <Button
            size="lg"
            className="pointer-events-auto shadow-lg"
            onClick={() => setAddTransactionOpen(true)}
            disabled={accounts.length === 0}
          >
            + Thêm giao dịch
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
