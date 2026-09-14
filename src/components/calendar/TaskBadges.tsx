const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  PREP: { label: "Chuẩn bị", className: "bg-white/10 text-white/60" },
  WAITING: { label: "Chờ", className: "bg-yugen-500/20 text-yugen-300" },
  IN_PROGRESS: { label: "Đang làm", className: "bg-kincha-400/20 text-kincha-400" },
  DONE: { label: "Xong", className: "bg-emerald-400/20 text-emerald-300" },
};

export function TaskStatusBadge({ status }: { status: string }) {
  const s = STATUS_LABEL[status] ?? { label: status, className: "bg-white/10 text-white/60" };
  return (
    <span className={`rounded-sm px-2 py-0.5 font-sans text-[10px] font-medium tracking-wide ${s.className}`}>
      {s.label}
    </span>
  );
}

// Đồng bộ màu với chú thích ở MonthGantt: cao = shuiro, TB = kincha, thấp = yugen.
const IMPORTANCE_LABEL: Record<number, { label: string; className: string }> = {
  3: { label: "Cao", className: "bg-shuiro-500 text-white" },
  2: { label: "TB", className: "bg-kincha-400 text-ink-950" },
  1: { label: "Thấp", className: "bg-yugen-500 text-white" },
};

export function ImportanceTag({ importance }: { importance: number }) {
  const s = IMPORTANCE_LABEL[importance] ?? IMPORTANCE_LABEL[1];
  return (
    <span className={`shrink-0 rounded-sm px-1.5 py-0.5 font-sans text-[10px] font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}
