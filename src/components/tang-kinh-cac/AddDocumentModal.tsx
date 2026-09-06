"use client";

import { useState } from "react";
import Modal from "@/components/tang-kinh-cac/Modal";
import { apiFetch } from "@/lib/clientFetch";

const inputClass =
  "w-full rounded-sm border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-kincha-400/60 focus:outline-none";

const CONTENT_TYPES = ["TEXT", "CHECKLIST", "MINDMAP"];
const PLACEHOLDER: Record<string, string> = {
  TEXT: "Viết ghi chú của bạn...",
  CHECKLIST: "- [ ] Việc cần làm 1\n- [ ] Việc cần làm 2",
  MINDMAP: "# Chủ đề chính\n## Nhánh 1\n- ý 1\n- ý 2\n## Nhánh 2\n- ý 1",
};

export default function AddDocumentModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("TEXT");
  const [content, setContent] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  async function submit() {
    if (!title.trim()) return;
    const created = await apiFetch("/api/tang-kinh-cac/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        type,
        content: CONTENT_TYPES.includes(type) ? content : undefined,
        attachmentUrl: !CONTENT_TYPES.includes(type) ? attachmentUrl : undefined,
      }),
    });
    if (!created) return;
    setTitle("");
    setContent("");
    setAttachmentUrl("");
    onCreated();
  }

  return (
    <Modal open={open} onClose={onClose} title="Lưu tài liệu mới">
      <div className="space-y-3">
        <input className={inputClass} placeholder="Tiêu đề" value={title} onChange={(e) => setTitle(e.target.value)} />

        <div className="flex gap-1">
          {["TEXT", "CHECKLIST", "MINDMAP", "IMAGE", "FILE"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-sm px-2.5 py-1 text-xs ${
                type === t ? "bg-kincha-400 text-ink-950" : "border border-white/15 text-white/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {CONTENT_TYPES.includes(type) ? (
          <textarea
            className={`${inputClass} font-mono`}
            rows={6}
            placeholder={PLACEHOLDER[type]}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        ) : (
          <div>
            <input
              className={inputClass}
              placeholder={type === "IMAGE" ? "URL ảnh" : "URL file"}
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
            />
            <p className="mt-1 text-xs text-white/30">
              Bản demo dùng URL trực tiếp — bản thật sẽ upload qua Vercel Blob và tự điền URL vào đây.
            </p>
          </div>
        )}

        <button onClick={submit} className="w-full rounded-sm bg-kincha-400 py-2 text-sm font-medium text-ink-950">
          Lưu vào Tàng Kinh Các
        </button>
      </div>
    </Modal>
  );
}
