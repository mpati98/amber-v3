import Link from "next/link";
import TabNav from "@/components/tang-kinh-cac/TabNav";

export default function TangKinhCacLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-950 pb-24 text-white">
      <header className="flex items-center justify-between px-6 py-6 sm:px-10">
        <div>
          <div className="font-serif-display text-sm italic tracking-wide text-kincha-400">
            âm dương giới
          </div>
          <h1 className="mt-1 font-serif-display text-2xl font-semibold sm:text-3xl">
            Tàng Kinh Các
          </h1>
        </div>
        <Link
          href="/"
          className="rounded-sm border border-white/15 px-4 py-2 font-sans text-sm text-white/70 transition hover:border-kincha-400/50 hover:text-kincha-200"
        >
          ← Âm Dương Giới
        </Link>
      </header>

      <TabNav />

      <main className="px-6 py-8 sm:px-10">{children}</main>
    </div>
  );
}
