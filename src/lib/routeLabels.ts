export const ROUTE_LABELS: Record<string, string> = {
  "/": "Âm Dương Giới",
  "/tang-kinh-cac": "Tàng Kinh Các",
  "/tang-kinh-cac/sach": "Sách",
  "/tang-kinh-cac/tai-lieu": "Tài liệu",
  "/tang-kinh-cac/ke-hoach-doc": "Kế hoạch đọc",
  "/kieu-lau": "Kiều Lâu",
  "/nghi-su-duong": "Nghị Sự Đường",
  "/tra-dinh": "Trà Đình",
};

export function labelForPath(path: string): string {
  return ROUTE_LABELS[path] ?? "Âm Dương Giới";
}
