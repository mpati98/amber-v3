export function SupportingTasksGroup({ count }: { count: number }) {
  return (
    <div className="rounded-md bg-white/5 px-2.5 py-1.5 flex items-center justify-between">
      <span className="text-[12px] text-white/50">Supporting tasks hôm nay</span>
      <span className="text-[12px] font-medium text-kincha-400">{count}</span>
    </div>
  );
}
