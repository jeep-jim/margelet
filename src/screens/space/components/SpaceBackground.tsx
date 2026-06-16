import type { SpacePlanetId, SpaceTheme, SpaceViewport } from "../types";

type Props = {
  theme: SpaceTheme;
  viewport: SpaceViewport;
  planetId: SpacePlanetId;
};

function planetTheme(planetId: SpacePlanetId, isLight: boolean) {
  if (isLight) {
    return {
      base: "linear-gradient(180deg,#f6f9fd 0%,#edf3fa 60%,#e7eef6 100%)",
      aura: "rgba(108,170,255,.34)",
      dust: "rgba(161,211,255,.28)",
    };
  }

  if (planetId === "tech") {
    return { base: "linear-gradient(180deg,#041527 0%,#020711 62%,#01040a 100%)", aura: "rgba(56,189,248,.22)", dust: "rgba(96,165,250,.13)" };
  }
  if (planetId === "finance") {
    return { base: "linear-gradient(180deg,#061710 0%,#020b08 62%,#020403 100%)", aura: "rgba(34,197,94,.21)", dust: "rgba(245,158,11,.11)" };
  }
  if (planetId === "world") {
    return { base: "linear-gradient(180deg,#061c24 0%,#020b11 60%,#020509 100%)", aura: "rgba(45,212,191,.20)", dust: "rgba(56,189,248,.12)" };
  }
  if (planetId === "startup") {
    return { base: "linear-gradient(180deg,#170a2a 0%,#070611 62%,#03020a 100%)", aura: "rgba(168,85,247,.22)", dust: "rgba(244,114,182,.12)" };
  }
  if (planetId === "creative") {
    return { base: "linear-gradient(180deg,#25101e 0%,#0b0611 62%,#03020a 100%)", aura: "rgba(251,113,133,.20)", dust: "rgba(251,191,36,.12)" };
  }
  if (planetId === "community") {
    return { base: "linear-gradient(180deg,#241209 0%,#0c0705 62%,#030201 100%)", aura: "rgba(251,146,60,.20)", dust: "rgba(244,63,94,.10)" };
  }
  return { base: "linear-gradient(180deg,#07111d 0%,#020711 60%,#01050c 100%)", aura: "rgba(40,120,220,.24)", dust: "rgba(5,125,170,.14)" };
}

export function SpaceBackground({ theme, viewport, planetId }: Props) {
  const isLight = theme === "light";
  const palette = planetTheme(planetId, isLight);

  return (
    <>
      <div
        className="absolute inset-0 transition-colors duration-700"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${palette.aura}, transparent 42%), radial-gradient(circle at 70% 75%, ${palette.dust}, transparent 38%), ${palette.base}`,
        }}
      />

      <div className="pointer-events-none absolute inset-[-8%] opacity-80 transition-transform duration-700" style={{ transform: `translate3d(${viewport.x * 0.012}px, ${viewport.y * 0.012}px, 0)` }}>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: isLight
              ? `radial-gradient(circle at 12% 18%, rgba(68,138,255,.34) 0 2px, transparent 3px), radial-gradient(circle at 28% 72%, rgba(139,92,246,.22) 0 1px, transparent 2px), radial-gradient(circle at 52% 28%, rgba(14,165,233,.30) 0 1.5px, transparent 2.5px), radial-gradient(circle at 78% 62%, rgba(34,197,94,.20) 0 1px, transparent 2px), radial-gradient(circle at 92% 20%, rgba(244,114,182,.24) 0 1.5px, transparent 2.5px)`
              : `radial-gradient(circle at 4% 82%, rgba(255,255,255,.58) 0 1px, transparent 2px), radial-gradient(circle at 13% 23%, rgba(255,255,255,.46) 0 1px, transparent 2px), radial-gradient(circle at 27% 16%, rgba(125,211,252,.62) 0 1px, transparent 2px), radial-gradient(circle at 41% 74%, rgba(255,255,255,.52) 0 1px, transparent 2px), radial-gradient(circle at 57% 30%, rgba(255,255,255,.60) 0 1px, transparent 2px), radial-gradient(circle at 69% 66%, rgba(147,197,253,.54) 0 1px, transparent 2px), radial-gradient(circle at 83% 17%, rgba(255,255,255,.50) 0 1px, transparent 2px), radial-gradient(circle at 95% 76%, rgba(125,211,252,.44) 0 1px, transparent 2px)`,
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-90" style={{ transform: `translate3d(${viewport.x * 0.055}px, ${viewport.y * 0.055}px, 0)`, transition: "transform .7s ease-out" }}>
        <div className="absolute inset-0" style={{ animation: "spaceDrift 78s ease-in-out infinite" }}>
          <div className={`absolute left-[7%] top-[17%] h-28 w-28 rounded-full ${planetId === "tech" ? "bg-[radial-gradient(circle_at_35%_30%,#d6f5ff99,#38bdf888_42%,#1d4ed844_70%,transparent_72%)]" : isLight ? "bg-[radial-gradient(circle_at_35%_30%,#ffffff99,#8ecbff88_42%,#4388ff44_70%,transparent_72%)]" : "bg-[radial-gradient(circle_at_35%_30%,#8ad9ff66,#173c5f88_48%,#07142100_72%)]"}`} />
          <div className={`absolute left-[80%] top-[19%] h-20 w-20 rounded-full ${planetId === "finance" ? "bg-[radial-gradient(circle_at_35%_30%,#eaff9c99,#22c55e88_45%,#064e3b33_72%,transparent_74%)]" : isLight ? "bg-[radial-gradient(circle_at_35%_30%,#fff7cc,#d9a84f99_48%,#8a5f2244_70%,transparent_72%)]" : "bg-[radial-gradient(circle_at_35%_30%,#ffe7a877,#9b7b3c77_48%,#33241000_72%)]"}`} />
          <div className={`absolute left-[78%] top-[20.5%] h-2 w-32 -rotate-[18deg] rounded-full ${isLight ? "bg-[#8aa2bd]/45" : "bg-white/16"}`} />
          <div className={`absolute left-[88%] top-[29%] h-32 w-32 rounded-full ${planetId === "world" ? "bg-[radial-gradient(circle_at_35%_30%,#e0fff4aa,#22c55e88_42%,#0284c744_72%,transparent_74%)]" : isLight ? "bg-[radial-gradient(circle_at_35%_30%,#d6fff7,#2dd4bf88_48%,#166b7a44_72%,transparent_74%)]" : "bg-[radial-gradient(circle_at_35%_30%,#62e6ff77,#145d7599_46%,#06172300_72%)]"}`} />
          <div className={`absolute left-[69%] top-[72%] h-36 w-36 rounded-full ${planetId === "startup" ? "bg-[radial-gradient(circle_at_35%_28%,#f5d0fe88,#a855f799_48%,#2e106500_72%)]" : isLight ? "bg-[radial-gradient(circle_at_35%_28%,#f4d7ff,#a78bfa77_48%,#39236e33_72%,transparent_74%)]" : "bg-[radial-gradient(circle_at_35%_28%,#e9b8ff55,#542d7e99_48%,#140b2e00_72%)]"}`} />
          <div className={`absolute left-[17%] top-[76%] h-10 w-32 rotate-[-18deg] rounded-full ${isLight ? "bg-white/48" : "bg-white/7"}`} />
          {planetId === "creative" ? <div className="absolute left-[58%] top-[21%] text-4xl opacity-40">🎈</div> : null}
          {planetId === "community" ? <div className="absolute left-[24%] top-[30%] text-4xl opacity-35">👽</div> : null}
          {planetId === "startup" ? <div className="absolute left-[12%] top-[58%] text-4xl opacity-40" style={{ animation: "spaceComet 36s linear infinite" }}>🚀</div> : null}
          <div className={`absolute left-[63%] top-[38%] h-[120px] w-[240px] rotate-[-18deg] rounded-[50%] blur-sm ${isLight ? "bg-sky-200/24" : "bg-sky-400/8"}`} />
          <div className={`absolute left-[73%] top-[50%] h-[180px] w-[220px] rotate-[24deg] rounded-[50%] blur-md ${isLight ? "bg-violet-200/24" : "bg-violet-500/10"}`} />
        </div>
      </div>
    </>
  );
}
