"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Mode = "CONVERSATION" | "EXAM_PREP" | "PROFESSIONAL";

const MODE_LABEL: Record<Mode, string> = {
  CONVERSATION: "Trò chuyện tự do",
  EXAM_PREP: "Luyện thi",
  PROFESSIONAL: "Chuyên nghiệp",
};

type CreatedSession = { id: string };

export function NewPracticeSessionModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (created: CreatedSession) => void;
}) {
  const [mode, setMode] = useState<Mode>("CONVERSATION");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tra-dinh/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, name: name.trim() || undefined }),
      });
      if (!res.ok) throw new Error("create failed");
      const created = await res.json();
      setName("");
      setMode("CONVERSATION");
      onCreated(created);
      onClose();
    } catch {
      setError("Không tạo được buổi luyện, thử lại nhé.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="dark border border-white/10 bg-ink-900">
        <DialogHeader>
          <DialogTitle className="font-serif-display text-lg text-kincha-400">Bắt đầu buổi luyện mới</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
            <Button
              key={m}
              type="button"
              size="sm"
              variant={mode === m ? "default" : "secondary"}
              onClick={() => setMode(m)}
              className={
                mode === m
                  ? "bg-kincha-400 text-ink-950 hover:bg-kincha-400/80"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }
            >
              {MODE_LABEL[m]}
            </Button>
          ))}
        </div>

        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên buổi luyện (tuỳ chọn)"
          className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-kincha-400/50 focus-visible:ring-kincha-400/30"
        />

        {error && <p className="text-[12px] text-shuiro-500">{error}</p>}

        <DialogFooter className="border-white/10 bg-transparent">
          <Button variant="ghost" onClick={onClose} className="text-white/60 hover:bg-white/10 hover:text-white">
            Huỷ
          </Button>
          <Button onClick={submit} disabled={submitting} className="bg-kincha-400 text-ink-950 hover:bg-kincha-400/80">
            {submitting ? "Đang tạo..." : "Bắt đầu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
