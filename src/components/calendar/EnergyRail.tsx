import { hoursInRange, ROW_HEIGHT } from "../../lib/time";

function colorForScore(score: number): string {
  if (score >= 0.75) return "bg-accent-500";
  if (score >= 0.5) return "bg-accent-400/60";
  if (score >= 0.3) return "bg-secondary-300";
  return "bg-primary-100";
}

export function EnergyRail({ effectiveness }: { effectiveness: Record<number, number> }) {
  const hours = hoursInRange();
  return (
    <div className="w-2 shrink-0">
      {hours.map((h) => (
        <div
          key={h}
          className={colorForScore(effectiveness[h] ?? 0)}
          style={{ height: ROW_HEIGHT * 4 }}
        />
      ))}
    </div>
  );
}
