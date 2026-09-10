import type { MockDayColumn } from "../../lib/mock-data";
import { TaskChip } from "./TaskChip";

function peakDotColor(score: number): string {
  if (score >= 0.75) return "bg-accent-500";
  if (score >= 0.5) return "bg-accent-400/60";
  if (score >= 0.3) return "bg-secondary-300";
  return "bg-primary-100";
}

export function WeekGrid({ days }: { days: MockDayColumn[] }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((day) => (
        <div
          key={day.date}
          className={`rounded-lg p-1.5 min-h-[220px] flex flex-col gap-1 ${
            day.isToday ? "bg-primary-50 ring-1 ring-primary-300" : "bg-white"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-[11px] text-text-secondary leading-none">{day.weekday}</div>
              <div className="text-[13px] font-medium text-primary-900 leading-tight">
                {day.date}
              </div>
            </div>
            <span
              className={`w-2 h-2 rounded-sm shrink-0 ${peakDotColor(day.peakScore)}`}
              aria-label="Khung giờ hiệu suất cao nhất trong ngày"
            />
          </div>

          <div className="flex flex-col gap-1 flex-1">
            {day.tasks.map((task) => (
              <TaskChip key={task.id} task={task} />
            ))}
            {day.tasks.length === 0 && (
              <span className="text-[11px] text-text-secondary">Trống</span>
            )}
          </div>

          {day.supportingCount > 0 && (
            <div className="text-[10px] text-primary-500 border-t border-primary-100 pt-1 mt-1">
              +{day.supportingCount} supporting
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
