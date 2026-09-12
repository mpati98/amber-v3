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
      <DialogContent className="dark border border-white/10 bg-ink-900">
        <DialogHeader>
          <DialogTitle className="font-serif-display text-lg text-kincha-400">Thêm danh mục</DialogTitle>
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

        <div className="flex gap-2">
          <Input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🍜"
            className="w-16 text-center border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-kincha-400/50 focus-visible:ring-kincha-400/30"
            maxLength={4}
          />
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên danh mục (VD: Ăn uống)"
            className="flex-1 border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-kincha-400/50 focus-visible:ring-kincha-400/30"
          />
        </div>

        {error && <p className="text-[12px] text-shuiro-500">{error}</p>}

        <DialogFooter className="border-white/10 bg-transparent">
          <Button variant="ghost" onClick={onClose} className="text-white/60 hover:bg-white/10 hover:text-white">
            Huỷ
          </Button>
          <Button onClick={submit} disabled={submitting} className="bg-kincha-400 text-ink-950 hover:bg-kincha-400/80">
            {submitting ? "Đang tạo..." : "Tạo danh mục"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
