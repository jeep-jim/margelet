import type { SpacePlanetId, SpaceTheme, SpaceViewport } from "../types";

type Props = {
  theme: SpaceTheme;
  viewport: SpaceViewport;
  planetId: SpacePlanetId;
};

export function SpaceBackground({ theme, viewport, planetId }: Props) {
  const isLight = theme === "light";
  const tint = planetId === "finance" ? "rgba(34,197,94,.16)" : planetId === "startup" ? "rgba(168,85,247,.18)" : planetId === "world" ? "rgba(45,212,191,.16)" : "rgba(40,120,220,.24)";

  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? `radial-gradient(circle at 50% 0%, rgba(108,170,255,.34), transparent 42%), radial-gradient(circle at 26% 32%, rgba(161,211,255,.28), transparent 36%), linear-gradient(180deg,#f6f9fd 0%,#edf3fa 60%,#e7eef6 100%)`
            : `radial-gradient(circle at 50% 0%, ${tint}, transparent 42%), radial-gradient(circle at 70% 75%, rgba(5,125,170,.14), transparent 38%), linear-gradient(180deg,#07111d 0%,#020711 60%,#01050c 100%)`,
        }}
      />

      <div
        className="pointer-events-none absolute inset-[-6%] opacity-80 transition-transform duration-700"
        style={{ transform: `translate3d(${viewport.x * 0.025}px, ${viewport.y * 0.025}px, 0)` }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: isLight
              ? `radial-gradient(circle at 12% 18%, rgba(68,138,255,.34) 0 2px, transparent 3px), radial-gradient(circle at 28% 72%, rgba(139,92,246,.22) 0 1px, transparent 2px), radial-gradient(circle at 52% 28%, rgba(14,165,233,.30) 0 1.5px, transparent 2.5px), radial-gradient(circle at 78% 62%, rgba(34,197,94,.20) 0 1px, transparent 2px), radial-gradient(circle at 92% 20%, rgba(244,114,182,.24) 0 1.5px, transparent 2.5px)`
              : `radial-gradient(circle at 4% 82%, rgba(255,255,255,.65) 0 1px, transparent 2px), radial-gradient(circle at 13% 23%, rgba(255,255,255,.50) 0 1px, transparent 2px), radial-gradient(circle at 27% 16%, rgba(125,211,252,.70) 0 1px, transparent 2px), radial-gradient(circle at 41% 74%, rgba(255,255,255,.58) 0 1px, transparent 2px), radial-gradient(circle at 57% 30%, rgba(255,255,255,.68) 0 1px, transparent 2px), radial-gradient(circle at 69% 66%, rgba(147,197,253,.65) 0 1px, transparent 2px), radial-gradient(circle at 83% 17%, rgba(255,255,255,.56) 0 1px, transparent 2px), radial-gradient(circle at 95% 76%, rgba(125,211,252,.50) 0 1px, transparent 2px)`,
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-90" style={{ transform: `translate3d(${viewport.x * 0.10}px, ${viewport.y * 0.10}px, 0)`, transition: "transform .7s ease-out" }}>
        <div className="absolute inset-0" style={{ animation: "spaceDrift 72s ease-in-out infinite" }}>
          <div className={`absolute left-[7%] top-[17%] h-28 w-28 rounded-full ${isLight ? "bg-[radial-gradient(circle_at_35%_30%,#ffffff99,#8ecbff88_42%,#4388ff44_70%,transparent_72%)]" : "bg-[radial-gradient(circle_at_35%_30%,#8ad9ff66,#173c5f88_48%,#07142100_72%)]"}`} />
          <div className={`absolute left-[80%] top-[19%] h-20 w-20 rounded-full ${isLight ? "bg-[radial-gradient(circle_at_35%_30%,#fff7cc,#d9a84f99_48%,#8a5f2244_70%,transparent_72%)]" : "bg-[radial-gradient(circle_at_35%_30%,#ffe7a877,#9b7b3c77_48%,#33241000_72%)]"}`} />
          <div className={`absolute left-[78%] top-[20.5%] h-2 w-32 -rotate-[18deg] rounded-full ${isLight ? "bg-[#8aa2bd]/45" : "bg-white/18"}`} />
          <div className={`absolute left-[88%] top-[29%] h-32 w-32 rounded-full ${isLight ? "bg-[radial-gradient(circle_at_35%_30%,#d6fff7,#2dd4bf88_48%,#166b7a44_72%,transparent_74%)]" : "bg-[radial-gradient(circle_at_35%_30%,#62e6ff77,#145d7599_46%,#06172300_72%)]"}`} />
          <div className={`absolute left-[69%] top-[72%] h-36 w-36 rounded-full ${isLight ? "bg-[radial-gradient(circle_at_35%_28%,#f4d7ff,#a78bfa77_48%,#39236e33_72%,transparent_74%)]" : "bg-[radial-gradient(circle_at_35%_28%,#e9b8ff55,#542d7e99_48%,#140b2e00_72%)]"}`} />
          <div className={`absolute left-[17%] top-[76%] h-10 w-32 rotate-[-18deg] rounded-full ${isLight ? "bg-white/48" : "bg-white/7"}`} />
          <div className={`absolute left-[63%] top-[38%] h-[120px] w-[240px] rotate-[-18deg] rounded-[50%] blur-sm ${isLight ? "bg-sky-200/24" : "bg-sky-400/8"}`} />
          <div className={`absolute left-[73%] top-[50%] h-[180px] w-[220px] rotate-[24deg] rounded-[50%] blur-md ${isLight ? "bg-violet-200/24" : "bg-violet-500/10"}`} />
        </div>
      </div>
    </>
  );
}
