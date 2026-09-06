"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/tang-kinh-cac", label: "Tổng quan" },
  { href: "/tang-kinh-cac/sach", label: "Sách" },
  { href: "/tang-kinh-cac/tai-lieu", label: "Tài liệu" },
  { href: "/tang-kinh-cac/ke-hoach-doc", label: "Kế hoạch đọc" },
];

export default function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-white/10 px-6 sm:px-10">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative px-3 py-3 font-sans text-sm transition-colors ${
              active ? "text-kincha-400" : "text-white/50 hover:text-white/80"
            }`}
          >
            {tab.label}
            {active && (
              <span className="absolute inset-x-2 -bottom-px h-px bg-kincha-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
