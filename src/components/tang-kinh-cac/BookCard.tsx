"use client";

import { motion } from "framer-motion";
import { ScrollCard, StatusBadge, RatingStars, ProgressBar } from "@/components/tang-kinh-cac/ui";

export type Publication = {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  format: string;
  status: string;
  rating: number | null;
  currentPage: number | null;
  totalPages: number | null;
  tags: string[];
  review: string | null;
  notes: string | null;
};

export default function BookCard({
  book,
  onClick,
}: {
  book: Publication;
  onClick: () => void;
}) {
  const glow = book.status === "READING" ? "kincha" : book.status === "READ" ? "yugen" : "yugen";

  return (
    <motion.button
      layout
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3 }}
      className="text-left"
    >
      <ScrollCard glow={glow} className="flex h-full gap-4">
        <div className="h-28 w-20 flex-shrink-0 overflow-hidden rounded-sm bg-white/5">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center font-serif-display text-2xl text-white/20">
              {book.title.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <StatusBadge status={book.status} />
          <h3 className="mt-2 truncate font-serif-display text-lg text-white">{book.title}</h3>
          {book.author && <p className="truncate text-sm text-white/50">{book.author}</p>}

          {book.status === "READING" && book.totalPages ? (
            <div className="mt-auto pt-3">
              <ProgressBar value={book.currentPage || 0} max={book.totalPages} />
              <p className="mt-1 text-xs text-white/40">
                {book.currentPage || 0} / {book.totalPages} trang
              </p>
            </div>
          ) : (
            <div className="mt-auto pt-3">
              <RatingStars rating={book.rating} />
            </div>
          )}
        </div>
      </ScrollCard>
    </motion.button>
  );
}
