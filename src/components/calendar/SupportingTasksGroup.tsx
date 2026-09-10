export function SupportingTasksGroup({ count }: { count: number }) {
  return (
    <div className="rounded-md bg-primary-50 px-2.5 py-1.5 flex items-center justify-between">
      <span className="text-[12px] text-primary-500">Supporting tasks hôm nay</span>
      <span className="text-[12px] font-medium text-primary-700">{count}</span>
    </div>
  );
}
