export default function SceneBackground() {
  return (
    <>
      {/* night sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg,#05070f 0%,#0c1128 24%,#18204a 44%,#2b3462 56%,#3c4470 62%,#252d4e 66%,#111731 78%,#070a15 100%)",
        }}
      />

      {/* stars */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(1.4px 1.4px at 12% 8%,rgba(255,255,255,.75),transparent)",
            "radial-gradient(1.2px 1.2px at 31% 15%,rgba(255,255,255,.5),transparent)",
            "radial-gradient(1.6px 1.6px at 47% 6%,rgba(255,255,255,.7),transparent)",
            "radial-gradient(1.2px 1.2px at 63% 13%,rgba(255,255,255,.45),transparent)",
            "radial-gradient(1.5px 1.5px at 78% 7%,rgba(255,255,255,.65),transparent)",
            "radial-gradient(1.2px 1.2px at 88% 18%,rgba(255,255,255,.4),transparent)",
            "radial-gradient(1.3px 1.3px at 22% 24%,rgba(255,255,255,.3),transparent)",
            "radial-gradient(1.4px 1.4px at 70% 27%,rgba(255,255,255,.3),transparent)",
            "radial-gradient(1.2px 1.2px at 55% 21%,rgba(255,255,255,.3),transparent)",
            "radial-gradient(1.3px 1.3px at 40% 11%,rgba(255,255,255,.4),transparent)",
          ].join(","),
        }}
      />

      {/* moon */}
      <div
        className="absolute left-[7%] top-[7%] h-[170px] w-[170px] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 38% 34%,#fdf6e3 0%,#f2e3bf 55%,#d6c396 100%)",
          boxShadow:
            "0 0 110px 55px rgba(233,214,170,.25), 0 0 280px 150px rgba(120,140,200,.16)",
        }}
      />
      <div
        className="absolute left-[2.5%] top-[2.5%] h-[310px] w-[310px] rounded-full animate-[glow_9s_ease-in-out_infinite]"
        style={{
          background:
            "radial-gradient(circle,rgba(240,226,190,.2) 0%,rgba(240,226,190,0) 70%)",
        }}
      />

      {/* distant mountains */}
      <div
        className="absolute left-[-6%] top-[30%] h-[36%] w-[64%] opacity-90"
        style={{
          background: "linear-gradient(180deg,#1a2447 0%,#131a34 100%)",
          clipPath:
            "polygon(0% 100%,0% 62%,7% 48%,13% 55%,21% 33%,28% 46%,34% 30%,42% 52%,50% 40%,58% 58%,68% 46%,79% 64%,90% 54%,100% 70%,100% 100%)",
        }}
      />
      <div
        className="absolute right-[-8%] top-[35%] h-[31%] w-[64%] opacity-80"
        style={{
          background: "linear-gradient(180deg,#1d2649 0%,#141b36 100%)",
          clipPath:
            "polygon(0% 100%,0% 74%,10% 58%,19% 68%,27% 44%,36% 60%,45% 38%,54% 56%,64% 42%,74% 62%,85% 50%,100% 66%,100% 100%)",
        }}
      />

      {/* mid mist band */}
      <div
        className="absolute left-[-4%] top-[46%] h-[16%] w-[108%] blur-[16px] animate-[drift_40s_ease-in-out_infinite_alternate]"
        style={{
          background:
            "linear-gradient(180deg,rgba(196,210,240,0) 0%,rgba(196,210,240,.22) 55%,rgba(196,210,240,0) 100%)",
        }}
      />

      {/* water */}
      <div
        className="absolute inset-x-0 bottom-0 top-[65%] z-[1]"
        style={{
          background:
            "linear-gradient(180deg,#303a63 0%,#1a2242 30%,#0b1020 72%,#070a14 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-[64.7%] z-[1] h-[2px]"
        style={{
          background:
            "linear-gradient(90deg,rgba(210,220,245,0),rgba(210,220,245,.4) 45%,rgba(210,220,245,0))",
        }}
      />
      <div
        className="absolute left-[5%] top-[65%] z-[1] h-[26%] w-[12%] blur-[12px]"
        style={{
          background:
            "linear-gradient(180deg,rgba(240,226,190,.26),rgba(240,226,190,0))",
        }}
      />
    </>
  );
}
