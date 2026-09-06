"use client";

import { useEffect, useState } from "react";
import BookCard, { Publication } from "@/components/tang-kinh-cac/BookCard";
import AddBookModal from "@/components/tang-kinh-cac/AddBookModal";
import BookDetailModal from "@/components/tang-kinh-cac/BookDetailModal";
import { apiFetch } from "@/lib/clientFetch";

const FILTERS = [
  { value: "", label: "Tất cả" },
  { value: "READING", label: "Đang đọc" },
  { value: "TO_READ", label: "Muốn đọc" },
  { value: "READ", label: "Đã đọc" },
  { value: "ABANDONED", label: "Bỏ dở" },
];

export default function BooksPage() {
  const [books, setBooks] = useState<Publication[]>([]);
  const [filter, setFilter] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Publication | null>(null);

  async function load() {
    const url = filter ? `/api/tang-kinh-cac/publications?status=${filter}` : "/api/tang-kinh-cac/publications";
    const items = await apiFetch<Publication[]>(url);
    setBooks(items ?? []);
  }

  useEffect(() => {
    load();
  }, [filter]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
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
          + Thêm sách
        </button>
      </div>

      {books.length === 0 ? (
        <p className="py-16 text-center text-white/30">Chưa có sách nào trong mục này.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <BookCard key={book.id} book={book} onClick={() => setSelected(book)} />
          ))}
        </div>
      )}

      <AddBookModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => {
          setAddOpen(false);
          load();
        }}
      />
      <BookDetailModal
        book={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onSaved={() => {
          setSelected(null);
          load();
        }}
        onDeleted={() => {
          setSelected(null);
          load();
        }}
      />
    </div>
  );
}
