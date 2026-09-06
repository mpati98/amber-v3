export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-950 px-6 text-center">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-kincha-400/25 border-t-kincha-400" />
      <span className="font-serif-display text-sm italic tracking-wide text-kincha-400">
        Đang tải…
      </span>
    </main>
  );
}
