// Client-side fetch wrapper: every API route in this app returns JSON (even
// on error), so `res.json()` is always safe to call — the missing check was
// `res.ok`. On 401 (session missing/expired) we bounce to /login instead of
// handing the caller an `{ error }` object disguised as real data.
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(url, init);

  if (res.status === 401) {
    if (typeof window !== "undefined") window.location.href = "/login";
    return null;
  }

  if (!res.ok) {
    console.error(`[apiFetch] ${url} failed with status ${res.status}`);
    return null;
  }

  return res.json();
}
