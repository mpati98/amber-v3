"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CreatedSource = { id: string; name: string; url: string };

export function AddFeedSourceModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (created: CreatedSource) => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/kieu-lau/feed-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), url: url.trim() }),
      });
      if (!res.ok) throw new Error("create failed");
      const created = await res.json();
      setName("");
      setUrl("");
      onCreated(created);
      onClose();
    } catch {
      setError("Không thêm được nguồn — kiểm tra lại URL nhé.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="dark border border-white/10 bg-ink-900">
        <DialogHeader>
          <DialogTitle className="font-serif-display text-lg text-kincha-400">Thêm nguồn tin</DialogTitle>
        </DialogHeader>

        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên nguồn (VD: TechCrunch)"
          className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-kincha-400/50 focus-visible:ring-kincha-400/30"
        />
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL RSS (VD: https://example.com/feed)"
          className="border-white/15 bg-white/5 text-white placeholder:text-white/30 focus-visible:border-kincha-400/50 focus-visible:ring-kincha-400/30"
        />

        {error && <p className="text-[12px] text-shuiro-500">{error}</p>}

        <DialogFooter className="border-white/10 bg-transparent">
          <Button variant="ghost" onClick={onClose} className="text-white/60 hover:bg-white/10 hover:text-white">
            Huỷ
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || !name.trim() || !url.trim()}
            className="bg-kincha-400 text-ink-950 hover:bg-kincha-400/80"
          >
            {submitting ? "Đang thêm..." : "Thêm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
