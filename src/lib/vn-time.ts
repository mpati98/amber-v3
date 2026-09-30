// Lịch theo giờ Việt Nam (UTC+7, không có giờ mùa hè) cho các route tính
// "hôm nay" / "tháng này" / "năm nay". Server chạy UTC nên dùng thẳng
// new Date() sẽ lệch ngày trong khoảng 0h–7h sáng giờ VN.

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Date đã dịch +7h: đọc bằng getUTC*() sẽ ra ngày/tháng/năm theo giờ VN. */
function shiftToVn(at: Date): Date {
  return new Date(at.getTime() + VN_OFFSET_MS);
}

function isoDate(y: number, monthIndex: number, day: number): string {
  return new Date(Date.UTC(y, monthIndex, day)).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" theo lịch VN. */
export function vnToday(at: Date = new Date()): string {
  return shiftToVn(at).toISOString().slice(0, 10);
}

/** Năm theo lịch VN (vd archivedAt 2026-12-31T20:00Z là năm 2027 ở VN). */
export function vnYear(at: Date = new Date()): number {
  return shiftToVn(at).getUTCFullYear();
}

/** Tháng chứa [at] theo lịch VN: ngày đầu/cuối tháng dạng "YYYY-MM-DD", month 1–12. */
export function vnMonthBounds(at: Date = new Date()): { year: number; month: number; start: string; end: string } {
  const vn = shiftToVn(at);
  const year = vn.getUTCFullYear();
  const monthIndex = vn.getUTCMonth();
  return {
    year,
    month: monthIndex + 1,
    start: isoDate(year, monthIndex, 1),
    end: isoDate(year, monthIndex + 1, 0), // ngày 0 của tháng sau = ngày cuối tháng này
  };
}
