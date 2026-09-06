"use client";

import { useEffect, useState } from "react";
import DocumentCard, { DocumentItem } from "@/components/tang-kinh-cac/DocumentCard";
import AddDocumentModal from "@/components/tang-kinh-cac/AddDocumentModal";
import DocumentViewerModal from "@/components/tang-kinh-cac/DocumentViewerModal";
import { apiFetch } from "@/lib/clientFetch";

const FILTERS = [
  { value: "", label: "Tất cả" },
  { value: "TEXT", label: "Ghi chú" },
  { value: "CHECKLIST", label: "Checklist" },
  { value: "MINDMAP", label: "Mindmap" },
  { value: "IMAGE", label: "Hình ảnh" },
  { value: "FILE", label: "Tệp" },
];

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [filter, setFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<DocumentItem | null>(null);

  async function load() {
    const url = filter ? `/api/tang-kinh-cac/documents?type=${filter}` : "/api/tang-kinh-cac/documents";
    const items = await apiFetch<DocumentItem[]>(url);
    setDocs(items ?? []);
  }

  useEffect(() => {
    load();
  }, [filter]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-sm px-3 py-1.5 text-sm transition ${
                filter === f.value ? "bg-kincha-400 text-ink-950" : "text-white/50 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="rounded-sm border border-kincha-400/40 px-4 py-2 text-sm text-kincha-200 hover:bg-kincha-400/10"
        >
          + Lưu tài liệu
        </button>
      </div>

      {docs.length === 0 ? (
        <p className="py-16 text-center text-white/30">Chưa có tài liệu nào trong mục này.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {docs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onClick={() => setSelected(doc)} />
          ))}
        </div>
      )}

      <AddDocumentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false);
          load();
        }}
      />
      <DocumentViewerModal
        doc={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onChanged={load}
      />
    </div>
  );
}
