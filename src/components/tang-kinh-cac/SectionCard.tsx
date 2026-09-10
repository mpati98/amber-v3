"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function SectionCard({
  href,
  icon,
  title,
  description,
  stat,
  glow,
  index,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
  stat?: string;
  glow: "yugen" | "shuiro" | "kincha";
  index: number;
}) {
  const glowColor = {
    yugen: "var(--color-yugen-500)",
    shuiro: "var(--color-shuiro-500)",
    kincha: "var(--color-kincha-400)",
  }[glow];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="h-full"
    >
      <Link href={href} className="group block h-full">
        <motion.div
          whileHover={{ y: -4 }}
          className="relative flex h-full min-h-55 flex-col overflow-hidden rounded-sm border border-white/10 bg-ink-900/60 p-6 transition-colors group-hover:border-(--glow)"
          style={{ ["--glow" as string]: glowColor }}
        >
          <div
            className="pointer-events-none absolute -inset-x-10 -top-16 h-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-40"
            style={{ background: glowColor }}
          />
          <div className="relative flex h-full flex-col">
            <span className="text-3xl">{icon}</span>
            <h3 className="mt-4 font-serif-display text-xl text-white">
              {title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-white/50 line-clamp-3">
              {description}
            </p>
            <div className="mt-5 flex items-center justify-between">
              {stat ? (
                <span className="font-sans text-xs text-white/40 line-clamp-1">
                  {stat}
                </span>
              ) : (
                <span />
              )}
              <span className="shrink-0 font-sans text-sm text-kincha-300 opacity-0 transition-opacity group-hover:opacity-100">
                Vào xem →
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
