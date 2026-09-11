"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Status = "PLANNED" | "IN_PROGRESS" | "COMPLETED";

const STATUS_LABEL: Record<Status, string> = {
  PLANNED: "Dự định học",
  IN_PROGRESS: "Đang học",
  COMPLETED: "Đã xong",
};

export function AddCourseModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [field, setField] = useState("");
  const [status, setStatus] = useState<Status>("PLANNED");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName("");
      setSource("");
      setField("");
      setStatus("PLANNED");
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    if (!name.trim()) {
      setError("Nhập tên khóa học trước đã.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/learn/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          source: source.trim() || undefined,
          field: field.trim() || undefined,
          status,
          startDate: status === "IN_PROGRESS" ? new Date().toISOString().slice(0, 10) : undefined,
        }),
      });
      if (!res.ok) throw new Error("create failed");
      onCreated();
      onClose();
    } catch {
      setError("Không tạo được khóa học, thử lại nhé.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="dark border border-white/10 bg-ink-900">
        <DialogHeader>
          <DialogTitle className="font-serif-display text-lg text-kincha-400">Thêm khóa học</DialogTitle>
        </DialogHeader>

        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên khóa (VD: CS50, React Advanced)"
          className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-kincha-400/50 focus-visible:ring-kincha-400/30"
        />
        <Input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Nguồn (Udemy, Coursera...)"
          className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-kincha-400/50 focus-visible:ring-kincha-400/30"
        />
        <Input
          value={field}
          onChange={(e) => setField(e.target.value)}
          placeholder="Lĩnh vực (VD: Lập trình web)"
          className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-kincha-400/50 focus-visible:ring-kincha-400/30"
        />

        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={status === s ? "default" : "secondary"}
              onClick={() => setStatus(s)}
              className={
                status === s
                  ? "bg-kincha-400 text-ink-950 hover:bg-kincha-400/80"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }
            >
              {STATUS_LABEL[s]}
            </Button>
          ))}
        </div>

        {error && <p className="text-[12px] text-shuiro-500">{error}</p>}

        <DialogFooter className="border-white/10 bg-transparent">
          <Button variant="ghost" onClick={onClose} className="text-white/60 hover:bg-white/10 hover:text-white">
            Huỷ
          </Button>
          <Button onClick={submit} disabled={submitting} className="bg-kincha-400 text-ink-950 hover:bg-kincha-400/80">
            {submitting ? "Đang tạo..." : "Tạo khóa học"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
