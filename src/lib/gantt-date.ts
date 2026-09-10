// Bản demo Gantt hiện cố định hiển thị 1 tháng — task nằm ngoài tháng này sẽ không map đúng.
// TODO khi làm điều hướng tháng thật: đổi 2 hằng số này thành state (năm/tháng đang xem).
export const GANTT_YEAR = 2026;
export const GANTT_MONTH = 8; // 1-12

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function dayOfMonthToIso(day: number): string {
  return `${GANTT_YEAR}-${pad(GANTT_MONTH)}-${pad(day)}`;
}

// Trả về null nếu ngày ISO không thuộc tháng đang hiển thị — chỗ gọi tự quyết định bỏ qua task đó.
export function isoToDayOfMonth(iso: string): number | null {
  const [y, m, d] = iso.split("-").map(Number);
  if (y !== GANTT_YEAR || m !== GANTT_MONTH) return null;
  return d;
}
