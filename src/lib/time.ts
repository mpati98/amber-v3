export const ROW_HEIGHT = 16; // px cho mỗi 15 phút
export const DAY_START_MIN = 6 * 60; // grid bắt đầu 06:00
export const DAY_END_MIN = 22 * 60; // grid kết thúc 22:00

export function minutesFromMidnight(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function topPx(hhmm: string): number {
  return ((minutesFromMidnight(hhmm) - DAY_START_MIN) / 15) * ROW_HEIGHT;
}

export function heightPx(durationMinutes: number): number {
  return (durationMinutes / 15) * ROW_HEIGHT;
}

export function hoursInRange(): number[] {
  const hours: number[] = [];
  for (let m = DAY_START_MIN; m < DAY_END_MIN; m += 60) hours.push(m / 60);
  return hours;
}
