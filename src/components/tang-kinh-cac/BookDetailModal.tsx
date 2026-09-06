"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/tang-kinh-cac/Modal";
import type { Publication } from "@/components/tang-kinh-cac/BookCard";
import { apiFetch } from "@/lib/clientFetch";

const inputClass =
  "w-full rounded-sm border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-kincha-400/60 focus:outline-none";

type Highlight = { id: string; quote: string; page: number | null; note: string | null };

export default function BookDetailModal({
  book,
  open,
  onClose,
  onSaved,
  onDeleted,
}: {
  book: Publication | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [form, setForm] = useState<Partial<Publication>>({});
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [newQuote, setNewQuote] = useState("");
  const [newPage, setNewPage] = useState("");

  useEffect(() => {
    if (book) {
      setForm(book);
      apiFetch<Highlight[]>(`/api/tang-kinh-cac/publications/${book.id}/highlights`).then(
        (items) => setHighlights(items ?? []),
      );
    }
  }, [book]);

  if (!book) return null;

  async function save() {
    const saved = await apiFetch(`/api/tang-kinh-cac/publications/${book!.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (saved) onSaved();
  }

  async function remove() {
    if (!confirm("Xóa sách này khỏi Tàng Kinh Các?")) return;
    const deleted = await apiFetch(`/api/tang-kinh-cac/publications/${book!.id}`, { method: "DELETE" });
    if (deleted) onDeleted();
  }

  async function addHighlight() {
    if (!newQuote.trim()) return;
    const created = await apiFetch<Highlight>(`/api/tang-kinh-cac/publications/${book!.id}/highlights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote: newQuote, page: newPage ? Number(newPage) : null }),
    });
    if (!created) return;
    setHighlights((h) => [created, ...h]);
    setNewQuote("");
    setNewPage("");
  }

  return (
    <Modal open={open} onClose={onClose} title={book.title}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <select
            className={inputClass}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="TO_READ">Muốn đọc</option>
            <option value="READING">Đang đọc</option>
            <option value="READ">Đã đọc</option>
            <option value="ABANDONED">Bỏ dở</option>
          </select>
          <select
            className={inputClass}
            value={form.format}
            onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}
          >
            <option value="PHYSICAL">Sách giấy</option>
            <option value="EBOOK">Ebook</option>
            <option value="AUDIOBOOK">Audiobook</option>
          </select>
        </div>

        {form.status === "READING" && (
          <div className="grid grid-cols-2 gap-3">
            <input
              className={inputClass}
              type="number"
              placeholder="Trang hiện tại"
              value={form.currentPage ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, currentPage: Number(e.target.value) }))}
            />
            <input
              className={inputClass}
              type="number"
              placeholder="Tổng số trang"
              value={form.totalPages ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, totalPages: Number(e.target.value) }))}
            />
          </div>
        )}

        {form.status === "READ" && (
          <div>
            <label className="mb-1 block text-xs text-white/40">Đánh giá</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setForm((f) => ({ ...f, rating: n }))}
                  className={`text-xl ${(form.rating ?? 0) >= n ? "text-kincha-400" : "text-white/20"}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        )}

        <textarea
          className={inputClass}
          rows={3}
          placeholder="Review dài..."
          value={form.review ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, review: e.target.value }))}
        />
        <textarea
          className={inputClass}
          rows={2}
          placeholder="Ghi chú nhanh..."
          value={form.notes ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />

        <div className="flex gap-2">
          <button onClick={save} className="flex-1 rounded-sm bg-kincha-400 py-2 text-sm font-medium text-ink-950">
            Lưu
          </button>
          <button onClick={remove} className="rounded-sm border border-shuiro-500/40 px-4 py-2 text-sm text-shuiro-500">
            Xóa
          </button>
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="mb-2 font-sans text-xs uppercase tracking-wider text-yugen-300/80">Highlight</div>
          <div className="space-y-2">
            {highlights.map((h) => (
              <div key={h.id} className="border-l-2 border-yugen-500/40 pl-3 text-sm">
                <p className="italic text-white/80">"{h.quote}"</p>
                {h.page && <p className="text-xs text-white/40">trang {h.page}</p>}
              </div>
            ))}
            {highlights.length === 0 && <p className="text-sm text-white/30">Chưa có highlight nào.</p>}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              className={inputClass}
              placeholder="Trích dẫn mới..."
              value={newQuote}
              onChange={(e) => setNewQuote(e.target.value)}
            />
            <input
              className={`${inputClass} w-20`}
              placeholder="Trang"
              value={newPage}
              onChange={(e) => setNewPage(e.target.value)}
            />
            <button onClick={addHighlight} className="rounded-sm border border-yugen-500/40 px-3 text-sm text-yugen-300">
              Thêm
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
