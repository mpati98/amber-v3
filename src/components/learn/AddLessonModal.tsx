"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddLessonModal({
  open,
  onClose,
  courseId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [studiedAt, setStudiedAt] = useState(new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle("");
      setStudiedAt(new Date().toISOString().slice(0, 10));
      setDuration("");
      setNote("");
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    if (!title.trim()) {
      setError("Nhập tên bài học trước đã.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/learn/courses/${courseId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          studiedAt: studiedAt || undefined,
          durationMinutes: duration ? Number(duration) : undefined,
          note: note.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("create failed");
      onCreated();
      onClose();
    } catch {
      setError("Không tạo được bài học, thử lại nhé.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm bài học</DialogTitle>
        </DialogHeader>

        <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tên bài học" />
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={studiedAt} onChange={(e) => setStudiedAt(e.target.value)} />
          <Input
            value={duration}
            onChange={(e) => setDuration(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Thời lượng (phút)"
            inputMode="numeric"
          />
        </div>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú (tuỳ chọn)" />

        {error && <p className="text-[12px] text-accent-700">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Đang lưu..." : "Lưu bài học"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
