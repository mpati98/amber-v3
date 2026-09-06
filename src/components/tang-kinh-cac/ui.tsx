import { ReactNode } from "react";

export function ScrollCard({
  children,
  className = "",
  glow = "yugen",
}: {
  children: ReactNode;
  className?: string;
  glow?: "yugen" | "shuiro" | "kincha";
}) {
  const glowColor = {
    yugen: "var(--color-yugen-500)",
    shuiro: "var(--color-shuiro-500)",
    kincha: "var(--color-kincha-400)",
  }[glow];

  return (
    <div
      className={`group relative rounded-sm border border-white/10 bg-ink-900/60 p-5 transition-colors hover:border-[var(--glow)] ${className}`}
      style={{ ["--glow" as string]: glowColor }}
    >
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    TO_READ: { label: "Muốn đọc", color: "text-yugen-300 border-yugen-500/40" },
    READING: { label: "Đang đọc", color: "text-kincha-400 border-kincha-400/40" },
    READ: { label: "Đã đọc", color: "text-emerald-300 border-emerald-400/40" },
    ABANDONED: { label: "Bỏ dở", color: "text-shuiro-500 border-shuiro-500/40" },
  };
  const s = map[status] ?? { label: status, color: "text-white/60 border-white/20" };
  return (
    <span className={`rounded-sm border px-2 py-0.5 font-sans text-[11px] tracking-wide ${s.color}`}>
      {s.label}
    </span>
  );
}

export function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return null;
  return (
    <span className="text-kincha-400 text-sm tracking-tight">
      {"★".repeat(rating)}
      <span className="text-white/20">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-gradient-to-r from-yugen-500 to-kincha-400 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function TypeTag({ type }: { type: string }) {
  const map: Record<string, string> = {
    TEXT: "Ghi chú",
    CHECKLIST: "Checklist",
    MINDMAP: "Mindmap",
    IMAGE: "Hình ảnh",
    FILE: "Tệp",
  };
  return (
    <span className="rounded-sm border border-white/15 px-2 py-0.5 font-sans text-[10px] uppercase tracking-wider text-white/50">
      {map[type] ?? type}
    </span>
  );
}
