"use client";

import { useState } from "react";
import Modal from "@/components/tang-kinh-cac/Modal";
import ChecklistView from "@/components/tang-kinh-cac/ChecklistView";
import { parseOutline, OutlineTree } from "@/components/tang-kinh-cac/MindmapOutline";
import type { DocumentItem } from "@/components/tang-kinh-cac/DocumentCard";
import { apiFetch } from "@/lib/clientFetch";

export default function DocumentViewerModal({
  doc,
  open,
  onClose,
  onChanged,
}: {
  doc: DocumentItem | null;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [content, setContent] = useState(doc?.content ?? "");

  if (!doc) return null;

  async function patch(data: Partial<DocumentItem>) {
    const saved = await apiFetch(`/api/tang-kinh-cac/documents/${doc!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (saved) onChanged();
  }

  async function remove() {
    if (!confirm("Xóa tài liệu này?")) return;
    const deleted = await apiFetch(`/api/tang-kinh-cac/documents/${doc!.id}`, { method: "DELETE" });
    if (!deleted) return;
    onClose();
    onChanged();
  }

  return (
    <Modal open={open} onClose={onClose} title={doc.title}>
      <div className="space-y-4">
        {doc.type === "TEXT" && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85">{doc.content}</p>
        )}

        {doc.type === "CHECKLIST" && (
          <ChecklistView
            content={content || doc.content || ""}
            onToggle={(newContent) => {
              setContent(newContent);
              patch({ content: newContent });
            }}
          />
        )}

        {doc.type === "MINDMAP" && doc.content && <OutlineTree nodes={parseOutline(doc.content)} />}

        {doc.type === "IMAGE" && doc.attachmentUrl && (
          <img src={doc.attachmentUrl} alt={doc.title} className="w-full rounded-sm" />
        )}

        {doc.type === "FILE" && doc.attachmentUrl && (
          <a
            href={doc.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-sm border border-kincha-400/40 px-4 py-2 text-sm text-kincha-200"
          >
            📎 Mở tệp
          </a>
        )}

        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <button
            onClick={() => patch({ pinned: !doc.pinned })}
            className="text-sm text-yugen-300 underline"
          >
            {doc.pinned ? "Bỏ ghim" : "Ghim tài liệu"}
          </button>
          <button onClick={remove} className="text-sm text-shuiro-500">
            Xóa
          </button>
        </div>
      </div>
    </Modal>
  );
}
