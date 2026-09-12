"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Account = { id: string; name: string };
type Category = { id: string; name: string; icon: string | null; kind: "INCOME" | "EXPENSE" };

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-sm text-white outline-none focus-visible:border-kincha-400/50 focus-visible:ring-3 focus-visible:ring-kincha-400/30 [&_option]:bg-ink-900 [&_option]:text-white";

export function AddTransactionModal({
  open,
  onClose,
  projectId,
  accounts,
  categories,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  accounts: Account[];
  categories: Category[];
  onCreated: () => void;
}) {
  const [kind, setKind] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = categories.filter((c) => c.kind === kind);

  useEffect(() => {
    if (open) {
      setKind("EXPENSE");
      setAccountId(accounts[0]?.id ?? "");
      setCategoryId("");
      setAmount("");
      setNote("");
      setError(null);
    }
  }, [open, accounts]);

  useEffect(() => {
    // đổi loại thu/chi thì category cũ (thuộc loại khác) không còn hợp lệ nữa
    setCategoryId(filteredCategories[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const submit = async () => {
    if (!accountId) {
      setError("Chưa có ví nào — tạo ví trước đã.");
      return;
    }
    const amountNumber = Number(amount);
    if (!amountNumber || amountNumber <= 0) {
      setError("Nhập số tiền hợp lệ.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          accountId,
          categoryId: categoryId || undefined,
          kind,
          amount: amountNumber,
          note: note.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("create failed");
      onCreated();
      onClose();
    } catch {
      setError("Không tạo được giao dịch, thử lại nhé.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="dark border border-white/10 bg-ink-900">
        <DialogHeader>
          <DialogTitle className="font-serif-display text-lg text-kincha-400">Thêm giao dịch</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={kind === "EXPENSE" ? "default" : "secondary"}
            onClick={() => setKind("EXPENSE")}
            className={
              kind === "EXPENSE"
                ? "bg-kincha-400 text-ink-950 hover:bg-kincha-400/80"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }
          >
            Chi tiêu
          </Button>
          <Button
            type="button"
            size="sm"
            variant={kind === "INCOME" ? "default" : "secondary"}
            onClick={() => setKind("INCOME")}
            className={
              kind === "INCOME"
                ? "bg-kincha-400 text-ink-950 hover:bg-kincha-400/80"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }
          >
            Thu nhập
          </Button>
        </div>

        <Input
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="Số tiền (VND)"
          inputMode="numeric"
          className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-kincha-400/50 focus-visible:ring-kincha-400/30"
        />

        <div className="grid grid-cols-2 gap-2">
          <select className={selectClass} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.length === 0 && <option value="">Chưa có ví</option>}
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          <select className={selectClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Không chọn danh mục</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú (tuỳ chọn)"
          className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-kincha-400/50 focus-visible:ring-kincha-400/30"
        />

        {error && <p className="text-[12px] text-shuiro-500">{error}</p>}

        <DialogFooter className="border-white/10 bg-transparent">
          <Button variant="ghost" onClick={onClose} className="text-white/60 hover:bg-white/10 hover:text-white">
            Huỷ
          </Button>
          <Button onClick={submit} disabled={submitting} className="bg-kincha-400 text-ink-950 hover:bg-kincha-400/80">
            {submitting ? "Đang lưu..." : "Lưu giao dịch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
