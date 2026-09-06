"use client";

import { useState } from "react";
import Modal from "@/components/tang-kinh-cac/Modal";
import { apiFetch } from "@/lib/clientFetch";
import { uploadFile } from "@/lib/upload";

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
  const [uploading, setUploading] = useState(false);

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file);
    setUploading(false);
    if (url) setCoverUrl(url);
  }

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
        <div>
          <div className="flex items-center gap-3">
            {coverUrl && (
              <img src={coverUrl} alt="" className="h-16 w-11 shrink-0 rounded-sm object-cover" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              disabled={uploading}
              className="block flex-1 text-sm text-white/70 file:mr-3 file:rounded-sm file:border file:border-kincha-400/40 file:bg-transparent file:px-3 file:py-1.5 file:text-sm file:text-kincha-200 hover:file:bg-kincha-400/10"
            />
          </div>
          {uploading && <p className="mt-1 text-xs text-yugen-300">Đang tải lên...</p>}
        </div>
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
        <button
          onClick={submit}
          disabled={uploading}
          className="w-full rounded-sm bg-kincha-400 py-2 text-sm font-medium text-ink-950 disabled:opacity-50"
        >
          Thêm vào Tàng Kinh Các
        </button>
      </div>
    </Modal>
  );
}
