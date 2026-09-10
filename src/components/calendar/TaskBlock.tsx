import { heightPx, topPx } from "@/lib/time";
import { importanceStyles, importanceTagStyles, importanceLabel } from "../../lib/importance";
import type { MockTask } from "../../lib/mock-data";

export function TaskBlock({ task }: { task: MockTask }) {
  const durationMinutes =
    parseInt(task.endTime.slice(0, 2)) * 60 +
    parseInt(task.endTime.slice(3)) -
    (parseInt(task.startTime.slice(0, 2)) * 60 + parseInt(task.startTime.slice(3)));

  return (
    <div
      className={`absolute left-0 right-1 rounded-r-md border-l-4 px-2 py-1 overflow-hidden flex items-start justify-between gap-2 ${importanceStyles[task.importance]}`}
      style={{ top: topPx(task.startTime), height: Math.max(heightPx(durationMinutes), 20) }}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-medium leading-tight truncate">{task.title}</div>
        <div className="text-[11px] opacity-80 truncate">
          {task.startTime}–{task.endTime} · {task.projectName}
        </div>
      </div>
      <span
        className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded ${importanceTagStyles[task.importance]}`}
      >
        {importanceLabel[task.importance]}
      </span>
    </div>
  );
}
