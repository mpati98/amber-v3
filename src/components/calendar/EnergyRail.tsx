import { hoursInRange, ROW_HEIGHT } from "../../lib/time";

function colorForScore(score: number): string {
  if (score >= 0.75) return "bg-shuiro-500";
  if (score >= 0.5) return "bg-kincha-400/60";
  if (score >= 0.3) return "bg-yugen-500/50";
  return "bg-white/10";
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
