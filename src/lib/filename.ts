const MAX_NAME_LENGTH = 100;

/** Tên file từ client → an toàn để ghép vào đường dẫn Blob: chỉ [a-zA-Z0-9._-], không "/" hay "..". */
export function sanitizeFileName(raw: string): string {
  const base = raw.split(/[\\/]/).pop() ?? "";
  let name = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.{2,}/g, "_").replace(/^[.]+/, "");
  if (name.length > MAX_NAME_LENGTH) {
    const dot = name.lastIndexOf(".");
    const ext = dot > 0 && name.length - dot <= 10 ? name.slice(dot) : "";
    name = name.slice(0, MAX_NAME_LENGTH - ext.length) + ext;
  }
  return name || "file";
}
