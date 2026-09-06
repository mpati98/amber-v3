"use client";

import { motion } from "framer-motion";
import { ScrollCard, TypeTag } from "@/components/tang-kinh-cac/ui";

export type DocumentItem = {
  id: string;
  title: string;
  type: string;
  content: string | null;
  attachmentUrl: string | null;
  tags: string[];
  pinned: boolean;
  topic?: { name: string } | null;
  updatedAt: string;
};

const ICONS: Record<string, string> = {
  TEXT: "📝",
  CHECKLIST: "☑",
  MINDMAP: "🌳",
  IMAGE: "🖼",
  FILE: "📎",
};

export default function DocumentCard({ doc, onClick }: { doc: DocumentItem; onClick: () => void }) {
  return (
    <motion.button
      layout
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="text-left"
    >
      <ScrollCard glow={doc.pinned ? "kincha" : "yugen"}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-lg">{ICONS[doc.type]}</span>
          <TypeTag type={doc.type} />
        </div>
        <h3 className="truncate font-serif-display text-base text-white">{doc.title}</h3>
        {doc.type !== "IMAGE" && doc.type !== "FILE" && doc.content && (
          <p className="mt-1 line-clamp-2 text-sm text-white/50">
            {doc.content.replace(/[#\-\[\]xX]/g, "").trim()}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          {doc.topic && <span className="text-xs text-yugen-300">{doc.topic.name}</span>}
          {doc.pinned && <span className="text-xs text-kincha-400">📌 ghim</span>}
        </div>
      </ScrollCard>
    </motion.button>
  );
}
