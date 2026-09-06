"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { Building } from "@/lib/buildings";

const MotionLink = motion.create(Link);

type Props = {
  building: Building;
  index: number;
  isHovered: boolean;
  isDimmed: boolean;
  onHoverStart: () => void;
  onHoverEnd: () => void;
};

const widthPercent = (style: Props["building"]["style"]) =>
  Math.min(100, Math.round(parseFloat(style.width) * 1.3));

export default function BuildingHotspot({
  building,
  index,
  isHovered,
  isDimmed,
  onHoverStart,
  onHoverEnd,
}: Props) {
  const sizes = `${widthPercent(building.style)}vw`;

  return (
    <MotionLink
      href={building.href}
      aria-label={building.name}
      className="group absolute z-8 block cursor-pointer focus:outline-none"
      style={{ ...building.style, ["--glow" as string]: building.glow }}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      initial={{ opacity: 0, y: 24 }}
      animate={{
        opacity: 1,
        y: isHovered ? -6 : 0,
      }}
      transition={
        isHovered
          ? { type: "spring", stiffness: 260, damping: 20 }
          : { delay: 0.15 * index, duration: 0.7, ease: "easeOut" }
      }
      whileTap={{ scale: 0.98 }}
    >
      {/* colored aura behind the sprite */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-[-12%] inset-y-[-10%] -z-10 rounded-full blur-[18px]"
        style={{
          background: `radial-gradient(ellipse 60% 55% at 50% 65%, var(--glow) 0%, transparent 70%)`,
          mixBlendMode: "screen",
        }}
        animate={{ opacity: isHovered ? 0.65 : 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* Three pre-filtered layers crossfaded by opacity instead of animating
          `filter` directly — interpolating drop-shadow forces a repaint of the
          whole sprite every frame, which is what made the hover feel slow.

          Only the base layer carries the ground drop-shadow. That shadow is
          static and already sits behind everything, so the overlays don't
          need their own copy of it — they only need the color grade
          (brightness/saturate, no blur). Duplicating the drop-shadow onto the
          "dimmed" layer meant every hover fired *three* simultaneous blur
          rasterizations (one per non-hovered building) plus the hover-glow's
          own — that's what was still slow. The hover layer keeps its glow
          drop-shadow since that's the one blur effect that's actually new. */}
      <div className="relative">
        <Image
          src={building.src}
          alt={building.name}
          width={1024}
          height={1024}
          sizes={sizes}
          className="h-auto w-full select-none"
          priority
          style={{
            filter:
              "drop-shadow(0 22px 34px rgba(0,0,0,0.55)) brightness(0.92) saturate(0.95)",
          }}
        />
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ opacity: isDimmed ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <Image
            src={building.src}
            alt=""
            aria-hidden
            width={1024}
            height={1024}
            sizes={sizes}
            className="h-auto w-full select-none"
            style={{ filter: "brightness(0.6) saturate(0.7)" }}
          />
        </motion.div>
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <Image
            src={building.src}
            alt=""
            aria-hidden
            width={1024}
            height={1024}
            sizes={sizes}
            className="h-auto w-full select-none"
            style={{
              filter:
                "drop-shadow(0 0 26px var(--glow)) brightness(1.05) saturate(1.1)",
            }}
          />
        </motion.div>
      </div>

      <motion.div
        className="pointer-events-none absolute bottom-full left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-sm border px-4 py-2"
        style={{
          borderColor: "rgba(236,203,138,0.4)",
          background: "rgba(12,13,30,0.9)",
        }}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? -6 : 4 }}
        transition={{ duration: 0.25 }}
      >
        <span className="font-serif-display text-sm text-kincha-400">
          {building.name}
        </span>
        <span className="block font-sans text-[10px] tracking-wide text-yugen-300">
          {building.sub}
        </span>
      </motion.div>
    </MotionLink>
  );
}
