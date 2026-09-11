import { hoursInRange, ROW_HEIGHT } from "../../lib/time";
import { EnergyRail } from "./EnergyRail";
import { TaskBlock } from "./TaskBlock";
import type { MockTask } from "../../lib/mock-data";

type DayGridProps = {
  effectiveness: Record<number, number>;
  tasks: MockTask[];
};

export function DayGrid({ effectiveness, tasks }: DayGridProps) {
  const hours = hoursInRange();
  const totalHeight = hours.length * ROW_HEIGHT * 4;

  return (
    <div className="flex max-h-[600px] overflow-y-auto border border-white/10 rounded-lg bg-ink-900/40">
      <EnergyRail effectiveness={effectiveness} />

      <div className="w-12 shrink-0 border-r border-white/10">
        {hours.map((h) => (
          <div
            key={h}
            className="text-[11px] text-white/40 pt-0.5"
            style={{ height: ROW_HEIGHT * 4 }}
          >
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      <div className="relative flex-1" style={{ height: totalHeight }}>
        {hours.map((h, i) => (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-white/5"
            style={{ top: i * ROW_HEIGHT * 4 }}
          />
        ))}

        {tasks.map((task) => (
          <TaskBlock key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
