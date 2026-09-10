import { importanceStyles, importanceTagStyles, importanceLabel } from "../../lib/importance";
import type { MockTask } from "../../lib/mock-data";

export function TaskChip({ task }: { task: MockTask }) {
  return (
    <div
      className={`rounded-r-md border-l-4 px-1.5 py-1 flex items-start justify-between gap-1 ${importanceStyles[task.importance]}`}
    >
      <div className="min-w-0">
        <div className="text-[11px] font-medium leading-tight truncate">{task.title}</div>
        <div className="text-[10px] opacity-80 truncate">{task.startTime}</div>
      </div>
      <span
        className={`shrink-0 text-[9px] font-medium px-1 py-0.5 rounded ${importanceTagStyles[task.importance]}`}
      >
        {importanceLabel[task.importance]}
      </span>
    </div>
  );
}
