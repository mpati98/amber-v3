"use client";

import { useState } from "react";
import Modal from "@/components/tang-kinh-cac/Modal";
import { apiFetch } from "@/lib/clientFetch";

const inputClass =
  "w-full rounded-sm border border-white/15 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-kincha-400/60 focus:outline-none";

export default function AddBookModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [format, setFormat] = useState("PHYSICAL");
  const [status, setStatus] = useState("TO_READ");
  const [totalPages, setTotalPages] = useState("");
  const [coverUrl, setCoverUrl] = useState("");

  async function submit() {
    if (!title.trim()) return;
    const created = await apiFetch("/api/tang-kinh-cac/publications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        author: author || undefined,
        format,
        status,
        totalPages: totalPages ? Number(totalPages) : undefined,
        coverUrl: coverUrl || undefined,
      }),
    });
    if (!created) return;
    setTitle("");
    setAuthor("");
    setTotalPages("");
    setCoverUrl("");
    onCreated();
  }

  return (
    <Modal open={open} onClose={onClose} title="Thêm sách">
      <div className="space-y-3">
        <input className={inputClass} placeholder="Tên sách" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className={inputClass} placeholder="Tác giả" value={author} onChange={(e) => setAuthor(e.target.value)} />
        <input
          className={inputClass}
          placeholder="URL ảnh bìa (tùy chọn)"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <select className={inputClass} value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="PHYSICAL">Sách giấy</option>
            <option value="EBOOK">Ebook</option>
            <option value="AUDIOBOOK">Audiobook</option>
          </select>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="TO_READ">Muốn đọc</option>
            <option value="READING">Đang đọc</option>
            <option value="READ">Đã đọc</option>
          </select>
        </div>
        <input
          className={inputClass}
          type="number"
          placeholder="Tổng số trang (tùy chọn)"
          value={totalPages}
          onChange={(e) => setTotalPages(e.target.value)}
        />
        <button onClick={submit} className="w-full rounded-sm bg-kincha-400 py-2 text-sm font-medium text-ink-950">
          Thêm vào Tàng Kinh Các
        </button>
      </div>
    </Modal>
  );
}
