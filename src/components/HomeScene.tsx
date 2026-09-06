"use client";

import { useEffect, useRef, useState } from "react";
import SceneBackground from "./SceneBackground";
import SceneForeground from "./SceneForeground";
import BuildingHotspot from "./BuildingHotspot";
import { buildings } from "@/lib/buildings";

const STAGE_W = 1920;
const STAGE_H = 1080;

export default function HomeScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;

    const fit = () => {
      const s = Math.max(el.clientWidth / STAGE_W, el.clientHeight / STAGE_H);
      setScale(s);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={sceneRef}
      className="relative h-screen w-full overflow-hidden bg-ink-950"
    >
      <div
        className="absolute left-1/2 top-1/2 origin-center"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <SceneBackground />

        <div
          className="pointer-events-none absolute left-1/2 top-[6%] z-20 -translate-x-1/2 text-center"
          style={{ textShadow: "0 2px 14px rgba(0,0,0,.7)" }}
        >
          <div className="font-serif-display text-xs italic tracking-[0.3em] text-kincha-400/90">
            amber
          </div>
          <h1 className="mt-1 font-serif-display text-3xl font-semibold text-white sm:text-4xl">
            Âm Dương Giới
          </h1>
        </div>

        {buildings.map((b, i) => (
          <BuildingHotspot
            key={b.id}
            building={b}
            index={i}
            isHovered={hoveredId === b.id}
            isDimmed={hoveredId !== null && hoveredId !== b.id}
            onHoverStart={() => setHoveredId(b.id)}
            onHoverEnd={() =>
              setHoveredId((cur) => (cur === b.id ? null : cur))
            }
          />
        ))}

        <SceneForeground />

        <div
          className="pointer-events-none absolute bottom-[3.5%] left-1/2 z-20 -translate-x-1/2 text-xs tracking-wide text-white/55"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,.8)" }}
        >
          chạm vào công trình để vào từng khu vực
        </div>
      </div>
    </div>
  );
}
