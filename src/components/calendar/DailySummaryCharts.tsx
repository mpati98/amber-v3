import { importanceLabel, importanceTagStyles } from "../../lib/importance";
import { DAY_END_MIN, DAY_START_MIN, hoursInRange, minutesFromMidnight } from "../../lib/time";
import type { MockTask } from "../../lib/mock-data";

const LEVELS: (1 | 2 | 3)[] = [3, 2, 1];

function countByLevel(tasks: MockTask[], key: "importance" | "urgency"): Record<1 | 2 | 3, number> {
  const counts: Record<1 | 2 | 3, number> = { 1: 0, 2: 0, 3: 0 };
  for (const t of tasks) counts[t[key]]++;
  return counts;
}

function LevelBars({ title, tasks, dim }: { title: string; tasks: MockTask[]; dim: "importance" | "urgency" }) {
  const counts = countByLevel(tasks, dim);
  const max = Math.max(1, ...LEVELS.map((l) => counts[l]));

  return (
    <div>
      <div className="text-[10px] text-text-secondary mb-1">{title}</div>
      <div className="flex flex-col gap-1">
        {LEVELS.map((level) => (
          <div key={level} className="flex items-center gap-1.5">
            <span className="w-6 shrink-0 text-[9px] text-text-secondary">
              {importanceLabel[level]}
            </span>
            <div className="flex-1 h-2.5 rounded-full bg-primary-50 overflow-hidden">
              <div
                className={`h-full rounded-full ${importanceTagStyles[level].split(" ")[0]}`}
                style={{ width: `${(counts[level] / max) * 100}%` }}
                title={`${importanceLabel[level]}: ${counts[level]} task`}
              />
            </div>
            <span className="w-3 shrink-0 text-[9px] text-primary-900 text-right">
              {counts[level]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BusyFreeMeter({ tasks }: { tasks: MockTask[] }) {
  const windowMinutes = DAY_END_MIN - DAY_START_MIN;
  const busyMinutes = tasks.reduce(
    (sum, t) => sum + Math.max(0, minutesFromMidnight(t.endTime) - minutesFromMidnight(t.startTime)),
    0
  );
  const pct = Math.min(100, (busyMinutes / windowMinutes) * 100);
  const fmt = (m: number) => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, "0") : ""}`;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] text-text-secondary">Bận vs rảnh (06:00–22:00)</span>
        <span className="text-[10px] text-primary-900 font-medium">
          {fmt(busyMinutes)} / {fmt(windowMinutes)}
        </span>
      </div>
      <div
        className="h-2.5 rounded-full bg-primary-100"
        title={`Đã lên lịch ${fmt(busyMinutes)} trên tổng ${fmt(windowMinutes)} khung giờ làm việc`}
      >
        <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function EffectivenessChart({ effectiveness }: { effectiveness: Record<number, number> }) {
  const hours = hoursInRange();
  const width = 280;
  const height = 56;
  const padTop = 10;
  const step = width / (hours.length - 1);

  const points = hours.map((h, i) => ({
    h,
    x: i * step,
    y: padTop + (1 - (effectiveness[h] ?? 0)) * (height - padTop),
    score: effectiveness[h] ?? 0,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  const peak = points.reduce((a, b) => (b.score > a.score ? b : a), points[0]);

  return (
    <div>
      <div className="text-[10px] text-text-secondary mb-1">Hiệu suất theo giờ</div>
      <svg viewBox={`0 0 ${width} ${height + 12}`} className="w-full" role="img">
        <line x1={0} y1={height} x2={width} y2={height} stroke="var(--color-primary-100)" strokeWidth={1} />
        <path d={areaPath} fill="var(--color-accent-500)" opacity={0.1} />
        <path d={linePath} fill="none" stroke="var(--color-accent-500)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p) => (
          <circle
            key={p.h}
            cx={p.x}
            cy={p.y}
            r={p.h === peak.h ? 4 : 2.5}
            fill="var(--color-accent-500)"
            stroke="var(--color-bg-light)"
            strokeWidth={2}
          >
            <title>{`${String(p.h).padStart(2, "0")}:00 — ${Math.round(p.score * 100)}%`}</title>
          </circle>
        ))}
        <text
          x={peak.x}
          y={Math.max(8, peak.y - 6)}
          textAnchor="middle"
          className="fill-primary-900"
          style={{ font: "9px var(--font-sans)" }}
        >
          {Math.round(peak.score * 100)}%
        </text>
        {[hours[0], hours[Math.floor(hours.length / 2)], hours[hours.length - 1]].map((h, i) => (
          <text
            key={i}
            x={i === 0 ? 0 : i === 1 ? width / 2 : width}
            y={height + 11}
            textAnchor={i === 0 ? "start" : i === 1 ? "middle" : "end"}
            className="fill-text-secondary"
            style={{ font: "9px var(--font-sans)" }}
          >
            {String(h).padStart(2, "0")}:00
          </text>
        ))}
      </svg>
    </div>
  );
}

export function DailySummaryCharts({
  tasks,
  effectiveness,
}: {
  tasks: MockTask[];
  effectiveness: Record<number, number>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-lg border border-primary-100 bg-white p-3 mb-3">
      <div className="grid grid-cols-2 gap-3">
        <LevelBars title="Quan trọng" tasks={tasks} dim="importance" />
        <LevelBars title="Khẩn cấp" tasks={tasks} dim="urgency" />
      </div>
      <div className="row-span-2 flex flex-col justify-center">
        <EffectivenessChart effectiveness={effectiveness} />
      </div>
      <div className="col-span-1">
        <BusyFreeMeter tasks={tasks} />
      </div>
    </div>
  );
}
