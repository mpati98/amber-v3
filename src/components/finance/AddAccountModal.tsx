"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AccountType = "CASH" | "BANK" | "E_WALLET" | "CREDIT_CARD";

const TYPE_LABEL: Record<AccountType, string> = {
  CASH: "Tiền mặt",
  BANK: "Ngân hàng",
  E_WALLET: "Ví điện tử",
  CREDIT_CARD: "Thẻ tín dụng",
};

export function AddAccountModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("CASH");
  const [balance, setBalance] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setType("CASH");
      setBalance("");
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    if (!name.trim()) {
      setError("Nhập tên ví trước đã.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/finance/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          type,
          currentBalance: balance ? Number(balance) : 0,
        }),
      });
      if (!res.ok) throw new Error("create failed");
      onCreated();
      onClose();
    } catch {
      setError("Không tạo được ví, thử lại nhé.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm ví</DialogTitle>
        </DialogHeader>

        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên ví (VD: Vietcombank, Momo)"
        />

        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TYPE_LABEL) as AccountType[]).map((t) => (
            <Button
              key={t}
              type="button"
              size="sm"
              variant={type === t ? "default" : "secondary"}
              onClick={() => setType(t)}
            >
              {TYPE_LABEL[t]}
            </Button>
          ))}
        </div>

        <Input
          value={balance}
          onChange={(e) => setBalance(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="Số dư ban đầu (VND, để trống nếu = 0)"
          inputMode="numeric"
        />

        {error && <p className="text-[12px] text-accent-700">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Đang tạo..." : "Tạo ví"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
