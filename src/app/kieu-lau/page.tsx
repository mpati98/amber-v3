import Link from "next/link";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-950 px-6 text-center">
      <span className="font-serif-display text-sm italic tracking-wide text-kincha-400">
        Trang chủ & điều hướng
      </span>
      <h1 className="font-serif-display text-4xl font-semibold text-white">
        Kiều Lâu
      </h1>
      <Link
        href="/"
        className="mt-6 rounded-sm border border-kincha-400/40 px-5 py-2 font-sans text-sm text-kincha-200 transition hover:bg-kincha-400/10"
      >
        Quay lại Âm Dương Giới
      </Link>
    </main>
  );
}
