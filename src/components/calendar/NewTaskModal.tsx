"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dayOfMonthToIso } from "../../lib/gantt-date";

type CreatedTask = {
  id: string;
  title: string;
  importance: 1 | 2 | 3;
  startDate: string;
  dueDate: string;
};

export function NewTaskModal({
  open,
  onClose,
  projectId,
  projectName,
  startDay,
  endDay,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  startDay: number;
  endDay: number;
  onCreated: (task: CreatedTask) => void;
}) {
  const [title, setTitle] = useState("");
  const [importance, setImportance] = useState<1 | 2 | 3>(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mở modal lần nào cũng reset form — tránh giữ giá trị cũ từ lần tạo trước
  useEffect(() => {
    if (open) {
      setTitle("");
      setImportance(2);
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    if (!title.trim()) {
      setError("Nhập tên task trước đã.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          title: title.trim(),
          importance,
          urgency: 2,
          startDate: dayOfMonthToIso(startDay),
          dueDate: dayOfMonthToIso(endDay),
        }),
      });
      if (!res.ok) throw new Error("create failed");
      const created = await res.json();
      onCreated(created);
      onClose();
    } catch {
      setError("Không tạo được task, thử lại nhé.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="dark border border-white/10 bg-ink-900">
        <DialogHeader>
          <DialogTitle className="font-serif-display text-lg text-kincha-400">Thêm task — {projectName}</DialogTitle>
        </DialogHeader>

        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Tên task"
          className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-kincha-400/50 focus-visible:ring-kincha-400/30"
        />

        <div className="flex items-center justify-between">
          <span className="text-[12px] text-white/40">
            Ngày {startDay} → {endDay} thg 8
          </span>
          <div className="flex gap-1">
            {([3, 2, 1] as const).map((level) => (
              <Button
                key={level}
                type="button"
                size="sm"
                variant={importance === level ? "default" : "secondary"}
                onClick={() => setImportance(level)}
                className={
                  importance === level
                    ? "bg-kincha-400 text-ink-950 hover:bg-kincha-400/80"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }
              >
                {level === 3 ? "Cao" : level === 2 ? "TB" : "Thấp"}
              </Button>
            ))}
          </div>
        </div>

        {error && <p className="text-[12px] text-shuiro-500">{error}</p>}

        <DialogFooter className="border-white/10 bg-transparent">
          <Button variant="ghost" onClick={onClose} className="text-white/60 hover:bg-white/10 hover:text-white">
            Huỷ
          </Button>
          <Button onClick={submit} disabled={submitting} className="bg-kincha-400 text-ink-950 hover:bg-kincha-400/80">
            {submitting ? "Đang tạo..." : "Tạo task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
