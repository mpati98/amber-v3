"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddCategoryModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [kind, setKind] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setIcon("");
      setKind("EXPENSE");
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    if (!name.trim()) {
      setError("Nhập tên danh mục trước đã.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/finance/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), icon: icon.trim() || undefined, kind }),
      });
      if (!res.ok) throw new Error("create failed");
      onCreated();
      onClose();
    } catch {
      setError("Không tạo được danh mục, thử lại nhé.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm danh mục</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={kind === "EXPENSE" ? "default" : "secondary"}
            onClick={() => setKind("EXPENSE")}
          >
            Chi tiêu
          </Button>
          <Button
            type="button"
            size="sm"
            variant={kind === "INCOME" ? "default" : "secondary"}
            onClick={() => setKind("INCOME")}
          >
            Thu nhập
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🍜"
            className="w-16 text-center"
            maxLength={4}
          />
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên danh mục (VD: Ăn uống)"
            className="flex-1"
          />
        </div>

        {error && <p className="text-[12px] text-accent-700">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Đang tạo..." : "Tạo danh mục"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
