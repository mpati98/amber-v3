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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm task — {projectName}</DialogTitle>
        </DialogHeader>

        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Tên task"
        />

        <div className="flex items-center justify-between">
          <span className="text-[12px] text-text-secondary">
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
              >
                {level === 3 ? "Cao" : level === 2 ? "TB" : "Thấp"}
              </Button>
            ))}
          </div>
        </div>

        {error && <p className="text-[12px] text-accent-700">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Đang tạo..." : "Tạo task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
