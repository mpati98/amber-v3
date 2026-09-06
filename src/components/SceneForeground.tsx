export default function SceneForeground() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-3 h-[34%]"
        style={{
          backgroundImage: [
            "linear-gradient(90deg,rgba(190,206,240,0),rgba(190,206,240,.16),rgba(190,206,240,0))",
            "linear-gradient(90deg,rgba(190,206,240,0),rgba(190,206,240,.1),rgba(190,206,240,0))",
          ].join(","),
          backgroundSize: "60% 1px, 42% 1px",
          backgroundPosition: "14% 22%, 50% 46%",
          backgroundRepeat: "no-repeat",
        }}
      />

      {[
        {
          left: "6%",
          top: "57%",
          width: "34%",
          height: "15%",
          z: 3,
          o1: 0.34,
          o2: 0.187,
        },
        {
          left: "50%",
          top: "55%",
          width: "40%",
          height: "15%",
          z: 3,
          o1: 0.32,
          o2: 0.176,
        },
        {
          left: "27%",
          top: "74%",
          width: "48%",
          height: "15%",
          z: 5,
          o1: 0.3,
          o2: 0.165,
        },
        {
          left: "62%",
          top: "84%",
          width: "46%",
          height: "18%",
          z: 5,
          o1: 0.44,
          o2: 0.24,
        },
      ].map((r, i) => (
        <div
          key={i}
          className="pointer-events-none absolute blur-[28px]"
          style={{
            left: r.left,
            top: r.top,
            width: r.width,
            height: r.height,
            zIndex: r.z,
            background: `radial-gradient(closest-side ellipse, rgba(198,212,242,${r.o1}) 0%, rgba(198,212,242,${r.o2}) 45%, rgba(198,212,242,0) 100%)`,
          }}
        />
      ))}

      <div
        className="pointer-events-none absolute inset-x-[-4%] bottom-0 z-5 h-[26%] blur-[26px]"
        style={{
          background:
            "linear-gradient(180deg,rgba(178,196,232,0) 0%,rgba(178,196,232,.18) 55%,rgba(178,196,232,.3) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 z-6"
        style={{
          background:
            "radial-gradient(120% 82% at 45% 42%, rgba(0,0,0,0) 42%, rgba(4,6,14,.6) 100%)",
        }}
      />
    </>
  );
}
