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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm khóa học</DialogTitle>
        </DialogHeader>

        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên khóa (VD: CS50, React Advanced)" />
        <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Nguồn (Udemy, Coursera...)" />
        <Input value={field} onChange={(e) => setField(e.target.value)} placeholder="Lĩnh vực (VD: Lập trình web)" />

        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <Button key={s} type="button" size="sm" variant={status === s ? "default" : "secondary"} onClick={() => setStatus(s)}>
              {STATUS_LABEL[s]}
            </Button>
          ))}
        </div>

        {error && <p className="text-[12px] text-accent-700">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Đang tạo..." : "Tạo khóa học"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
