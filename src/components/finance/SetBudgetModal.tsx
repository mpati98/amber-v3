"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = { id: string; name: string; icon: string | null; kind: "INCOME" | "EXPENSE" };

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function SetBudgetModal({
  open,
  onClose,
  projectId,
  projectName,
  categories,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  categories: Category[];
  onSaved: () => void;
}) {
  const expenseCategories = categories.filter((c) => c.kind === "EXPENSE");
  const [categoryId, setCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCategoryId(expenseCategories[0]?.id ?? "");
      setLimitAmount("");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    if (!categoryId) {
      setError("Chưa có danh mục chi tiêu nào — tạo danh mục trước đã.");
      return;
    }
    const limit = Number(limitAmount);
    if (!limit || limit <= 0) {
      setError("Nhập hạn mức hợp lệ.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/finance/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, categoryId, limitAmount: limit }),
      });
      if (!res.ok) throw new Error("save failed");
      onSaved();
      onClose();
    } catch {
      setError("Không lưu được ngân sách, thử lại nhé.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đặt ngân sách — {projectName}</DialogTitle>
        </DialogHeader>

        <select className={selectClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {expenseCategories.length === 0 && <option value="">Chưa có danh mục chi tiêu</option>}
          {expenseCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon ? `${c.icon} ` : ""}
              {c.name}
            </option>
          ))}
        </select>

        <Input
          value={limitAmount}
          onChange={(e) => setLimitAmount(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="Hạn mức (VND)"
          inputMode="numeric"
        />

        {error && <p className="text-[12px] text-accent-700">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Đang lưu..." : "Lưu ngân sách"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
