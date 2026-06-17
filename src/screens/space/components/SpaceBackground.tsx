import type { SpacePlanetId, SpaceTheme, SpaceViewport } from "../types";

type Props = {
  theme: SpaceTheme;
  viewport: SpaceViewport;
  planetId: SpacePlanetId;
};

type Decoration = {
  left: string;
  top: string;
  className: string;
  ring?: boolean;
  emoji?: string;
  label?: string;
};

function planetTheme(planetId: SpacePlanetId, isLight: boolean) {
  if (isLight) {
    const lightBase = "linear-gradient(180deg,#f6f9fd 0%,#edf3fa 60%,#e7eef6 100%)";
    if (planetId === "finance") return { base: lightBase, aura: "rgba(16,185,129,.26)", dust: "rgba(245,158,11,.18)" };
    if (planetId === "tech") return { base: lightBase, aura: "rgba(59,130,246,.28)", dust: "rgba(14,165,233,.18)" };
    if (planetId === "world") return { base: lightBase, aura: "rgba(45,212,191,.28)", dust: "rgba(34,197,94,.16)" };
    if (planetId === "startup") return { base: lightBase, aura: "rgba(168,85,247,.26)", dust: "rgba(244,114,182,.16)" };
    if (planetId === "creative") return { base: lightBase, aura: "rgba(251,113,133,.24)", dust: "rgba(251,191,36,.18)" };
    if (planetId === "community") return { base: lightBase, aura: "rgba(251,146,60,.24)", dust: "rgba(244,63,94,.14)" };
    return { base: lightBase, aura: "rgba(108,170,255,.34)", dust: "rgba(161,211,255,.28)" };
  }

  if (planetId === "tech") return { base: "linear-gradient(180deg,#041527 0%,#020711 62%,#01040a 100%)", aura: "rgba(56,189,248,.22)", dust: "rgba(96,165,250,.13)" };
  if (planetId === "finance") return { base: "linear-gradient(180deg,#061710 0%,#020b08 62%,#020403 100%)", aura: "rgba(34,197,94,.21)", dust: "rgba(245,158,11,.11)" };
  if (planetId === "world") return { base: "linear-gradient(180deg,#061c24 0%,#020b11 60%,#020509 100%)", aura: "rgba(45,212,191,.20)", dust: "rgba(56,189,248,.12)" };
  if (planetId === "startup") return { base: "linear-gradient(180deg,#170a2a 0%,#070611 62%,#03020a 100%)", aura: "rgba(168,85,247,.22)", dust: "rgba(244,114,182,.12)" };
  if (planetId === "creative") return { base: "linear-gradient(180deg,#25101e 0%,#0b0611 62%,#03020a 100%)", aura: "rgba(251,113,133,.20)", dust: "rgba(251,191,36,.12)" };
  if (planetId === "community") return { base: "linear-gradient(180deg,#241209 0%,#0c0705 62%,#030201 100%)", aura: "rgba(251,146,60,.20)", dust: "rgba(244,63,94,.10)" };
  return { base: "linear-gradient(180deg,#07111d 0%,#020711 60%,#01050c 100%)", aura: "rgba(40,120,220,.24)", dust: "rgba(5,125,170,.14)" };
}

function decorations(planetId: SpacePlanetId, isLight: boolean): Decoration[] {
  const soft = isLight ? "opacity-45" : "opacity-75";

  if (planetId === "finance") {
    return [
      { left: "7%", top: "17%", ring: true, className: "h-28 w-28 bg-[radial-gradient(circle_at_35%_30%,#eaff9caa,#22c55e88_42%,#064e3b44_70%,transparent_72%)]" },
      { left: "79%", top: "18%", className: "h-20 w-20 bg-[radial-gradient(circle_at_35%_30%,#fff4b8aa,#f59e0b88_48%,#78350f44_70%,transparent_72%)]" },
      { left: "86%", top: "29%", className: "h-36 w-36 bg-[radial-gradient(circle_at_35%_30%,#d9f99daa,#10b98188_42%,#065f4644_72%,transparent_74%)]" },
      { left: "70%", top: "72%", className: "h-36 w-36 bg-[radial-gradient(circle_at_35%_28%,#fde68aaa,#7c3aed66_48%,transparent_72%)]" },
      { left: "23%", top: "31%", emoji: "₿", className: `text-5xl ${soft}` },
      { left: "61%", top: "21%", emoji: "💎", className: `text-4xl ${soft}` },
    ];
  }

  if (planetId === "tech") {
    return [
      { left: "8%", top: "15%", className: "h-28 w-28 rounded-[34%] bg-[radial-gradient(circle_at_35%_30%,#d6f5ff99,#38bdf888_42%,#1d4ed844_70%,transparent_72%)]" },
      { left: "80%", top: "18%", ring: true, className: "h-20 w-20 bg-[radial-gradient(circle_at_35%_30%,#bfdbfeaa,#1d4ed888_48%,#0f172a44_70%,transparent_72%)]" },
      { left: "87%", top: "30%", className: "h-32 w-32 rounded-[38%] rotate-12 bg-[radial-gradient(circle_at_35%_30%,#67e8f9aa,#0369a199_46%,transparent_72%)]" },
      { left: "21%", top: "33%", emoji: "🛰️", className: `text-4xl ${soft}` },
      { left: "64%", top: "26%", emoji: "📡", className: `text-4xl ${soft}` },
    ];
  }

  if (planetId === "world") {
    return [
      { left: "7%", top: "16%", className: "h-28 w-28 bg-[radial-gradient(circle_at_35%_30%,#bfdbfe99,#22c55e66_38%,#0284c744_68%,transparent_72%)]" },
      { left: "79%", top: "18%", ring: true, className: "h-20 w-20 bg-[radial-gradient(circle_at_35%_30%,#fde68a99,#9b7b3c77_48%,transparent_72%)]" },
      { left: "87%", top: "31%", className: "h-36 w-36 bg-[radial-gradient(circle_at_35%_30%,#e0fff4aa,#22c55e88_42%,#0284c744_72%,transparent_74%)]" },
      { left: "66%", top: "73%", className: "h-32 w-40 rounded-[46%] bg-[radial-gradient(circle_at_35%_28%,#c4b5f5aa,#0ea5e955_48%,transparent_72%)]" },
      { left: "25%", top: "29%", emoji: "✈️", className: `text-4xl ${soft}` },
    ];
  }

  if (planetId === "startup") {
    return [
      { left: "7%", top: "17%", className: "h-24 w-36 rotate-[-12deg] rounded-full bg-[radial-gradient(circle_at_35%_30%,#f0abfc99,#7c3aed77_45%,transparent_72%)]" },
      { left: "78%", top: "18%", ring: true, className: "h-20 w-20 bg-[radial-gradient(circle_at_35%_30%,#fef3c799,#fb923c77_48%,transparent_72%)]" },
      { left: "86%", top: "31%", className: "h-32 w-32 rounded-[42%] bg-[radial-gradient(circle_at_35%_30%,#c4b5f5aa,#a855f799_48%,transparent_72%)]" },
      { left: "13%", top: "57%", emoji: "🚀", className: `text-5xl ${soft}` },
      { left: "62%", top: "20%", emoji: "☄️", className: `text-4xl ${soft}` },
    ];
  }

  if (planetId === "creative") {
    return [
      { left: "7%", top: "17%", className: "h-28 w-28 rounded-[42%] rotate-12 bg-[radial-gradient(circle_at_35%_30%,#fbcfe899,#f472b688_42%,#7c2d1244_70%,transparent_72%)]" },
      { left: "79%", top: "17%", className: "h-20 w-24 rounded-[45%] bg-[radial-gradient(circle_at_35%_30%,#fde68aaa,#fb923c77_48%,transparent_72%)]" },
      { left: "88%", top: "30%", ring: true, className: "h-36 w-36 bg-[radial-gradient(circle_at_35%_30%,#a7f3d0aa,#14b8a677_48%,transparent_74%)]" },
      { left: "69%", top: "72%", className: "h-36 w-36 rounded-[44%] bg-[radial-gradient(circle_at_35%_28%,#f5d0fe99,#8b5cf677_48%,transparent_72%)]" },
      { left: "58%", top: "21%", emoji: "🎈", className: `text-5xl ${soft}` },
      { left: "27%", top: "30%", emoji: "✨", className: `text-4xl ${soft}` },
    ];
  }

  if (planetId === "community") {
    return [
      { left: "7%", top: "17%", ring: true, className: "h-28 w-28 bg-[radial-gradient(circle_at_35%_30%,#fed7aa99,#fb923c88_42%,#7c2d1244_70%,transparent_72%)]" },
      { left: "80%", top: "19%", className: "h-20 w-20 bg-[radial-gradient(circle_at_35%_30%,#fecdd399,#fb718577_48%,transparent_72%)]" },
      { left: "87%", top: "31%", className: "h-36 w-36 bg-[radial-gradient(circle_at_35%_30%,#fef3c7aa,#f9731677_48%,transparent_74%)]" },
      { left: "24%", top: "30%", emoji: "👽", className: `text-5xl ${soft}` },
      { left: "61%", top: "23%", emoji: "🤝", className: `text-4xl ${soft}` },
    ];
  }

  return [
    { left: "7%", top: "17%", className: "h-28 w-28 bg-[radial-gradient(circle_at_35%_30%,#8ad9ff66,#173c5f88_48%,transparent_72%)]" },
    { left: "80%", top: "19%", ring: true, className: "h-20 w-20 bg-[radial-gradient(circle_at_35%_30%,#ffe7a877,#9b7b3c77_48%,transparent_72%)]" },
    { left: "88%", top: "29%", className: "h-32 w-32 bg-[radial-gradient(circle_at_35%_30%,#62e6ff77,#145d7599_46%,transparent_72%)]" },
    { left: "69%", top: "72%", className: "h-36 w-36 bg-[radial-gradient(circle_at_35%_28%,#e9b8ff55,#542d7e99_48%,transparent_72%)]" },
  ];
}

export function SpaceBackground({ theme, viewport, planetId }: Props) {
  const isLight = theme === "light";
  const palette = planetTheme(planetId, isLight);
  const items = decorations(planetId, isLight);

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
          {items.map((item, index) => (
            <div key={`${planetId}-${index}`} className="absolute" style={{ left: item.left, top: item.top }}>
              {item.emoji ? (
                <div className={item.className}>{item.emoji}</div>
              ) : (
                <div className={`rounded-full ${item.className}`} />
              )}
              {item.ring ? <div className={`absolute left-[-8%] top-[46%] h-2 w-[160%] -rotate-[18deg] rounded-full ${isLight ? "bg-[#8aa2bd]/45" : "bg-white/16"}`} /> : null}
            </div>
          ))}
          <div className={`absolute left-[17%] top-[76%] h-10 w-32 rotate-[-18deg] rounded-full ${isLight ? "bg-white/48" : "bg-white/7"}`} />
          <div className={`absolute left-[63%] top-[38%] h-[120px] w-[240px] rotate-[-18deg] rounded-[50%] blur-sm ${isLight ? "bg-sky-200/24" : "bg-sky-400/8"}`} />
          <div className={`absolute left-[73%] top-[50%] h-[180px] w-[220px] rotate-[24deg] rounded-[50%] blur-md ${isLight ? "bg-violet-200/24" : "bg-violet-500/10"}`} />
        </div>
      </div>
    </>
  );
}
