import { motion } from "framer-motion";
import type { MockDayColumn } from "../../lib/mock-data";
import { TaskChip } from "./TaskChip";
import { importanceLabel, importanceTagStyles } from "../../lib/importance";

function peakDotColor(score: number): string {
  if (score >= 0.75) return "bg-shuiro-500";
  if (score >= 0.5) return "bg-kincha-400/60";
  if (score >= 0.3) return "bg-yugen-500/50";
  return "bg-white/10";
}

export function WeekGrid({
  days,
  selectedDate,
  onSelectDate,
}: {
  days: MockDayColumn[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {days.map((day) => {
        const isSelected = day.date === selectedDate;
        return (
          <motion.button
            key={day.date}
            layout
            type="button"
            onClick={() => onSelectDate(day.date)}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className={`text-left rounded-lg p-1.5 min-h-55 flex flex-col gap-1 ${
              isSelected
                ? "flex-3 bg-ink-900 ring-2 ring-kincha-400 shadow-md"
                : selectedDate
                  ? "flex-[0.6] bg-ink-900/40"
                  : "flex-1 bg-ink-900/60"
            } ${day.isToday && !isSelected ? "ring-1 ring-yugen-500/50" : ""}`}
          >
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="text-[11px] text-white/40 leading-none">{day.weekday}</div>
                <div className="text-[13px] font-medium text-white leading-tight">
                  {day.date}
                </div>
              </div>
              <span
                className={`w-2 h-2 rounded-sm shrink-0 ${peakDotColor(day.peakScore)}`}
                aria-label="Khung giờ hiệu suất cao nhất trong ngày"
              />
            </div>

            <div className="flex flex-col gap-1 flex-1">
              {day.tasks.map((task) =>
                isSelected ? (
                  <div key={task.id} className={`rounded-r-md border-l-4 px-2 py-1.5 ${importanceTagStyles[task.importance].replace("text-", "border-l-").split(" ")[0]}`}>
                    <div className="text-[12px] font-medium text-white">{task.title}</div>
                    <div className="text-[11px] text-white/40">{task.projectName}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] text-white/40">
                        {task.startTime}–{task.endTime}
                      </span>
                      <span className={`text-[9px] font-medium px-1 py-0.5 rounded ${importanceTagStyles[task.importance]}`}>
                        {importanceLabel[task.importance]}
                      </span>
                    </div>
                  </div>
                ) : (
                  <TaskChip key={task.id} task={task} />
                )
              )}
              {day.tasks.length === 0 && (
                <span className="text-[11px] text-white/30">Trống</span>
              )}
            </div>

            {day.supportingCount > 0 && (
              <div className="text-[10px] text-kincha-400 border-t border-white/10 pt-1 mt-1">
                +{day.supportingCount} supporting
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
