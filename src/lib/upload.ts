import { apiFetch } from "@/lib/clientFetch";

export async function uploadFile(file: File): Promise<string | null> {
  const form = new FormData();
  form.append("file", file);
  const result = await apiFetch<{ url: string }>("/api/tang-kinh-cac/upload", {
    method: "POST",
    body: form,
  });
  return result?.url ?? null;
}
