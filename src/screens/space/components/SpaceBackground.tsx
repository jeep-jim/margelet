import type { SpacePlanetId, SpaceTheme, SpaceViewport } from "../types";

type Props = {
  theme: SpaceTheme;
  viewport: SpaceViewport;
  planetId: SpacePlanetId;
};

function planetTheme(planetId: SpacePlanetId, isLight: boolean) {
  if (isLight) {
    const lightBase = "linear-gradient(180deg,#f6f9fd 0%,#edf3fa 60%,#e7eef6 100%)";
    if (planetId === "finance") return { base: lightBase, aura: "rgba(16,185,129,.22)", dust: "rgba(245,158,11,.14)", mist: "rgba(250,204,21,.18)" };
    if (planetId === "tech") return { base: lightBase, aura: "rgba(59,130,246,.24)", dust: "rgba(14,165,233,.16)", mist: "rgba(96,165,250,.16)" };
    if (planetId === "world") return { base: lightBase, aura: "rgba(45,212,191,.23)", dust: "rgba(34,197,94,.13)", mist: "rgba(125,211,252,.16)" };
    if (planetId === "startup") return { base: lightBase, aura: "rgba(168,85,247,.22)", dust: "rgba(244,114,182,.13)", mist: "rgba(192,132,252,.15)" };
    if (planetId === "creative") return { base: lightBase, aura: "rgba(251,113,133,.20)", dust: "rgba(251,191,36,.15)", mist: "rgba(244,114,182,.16)" };
    if (planetId === "community") return { base: lightBase, aura: "rgba(251,146,60,.20)", dust: "rgba(244,63,94,.12)", mist: "rgba(253,186,116,.16)" };
    return { base: lightBase, aura: "rgba(108,170,255,.30)", dust: "rgba(161,211,255,.22)", mist: "rgba(125,211,252,.14)" };
  }

  if (planetId === "tech") return { base: "linear-gradient(180deg,#041527 0%,#020711 62%,#01040a 100%)", aura: "rgba(56,189,248,.20)", dust: "rgba(96,165,250,.11)", mist: "rgba(59,130,246,.09)" };
  if (planetId === "finance") return { base: "linear-gradient(180deg,#061710 0%,#020b08 62%,#020403 100%)", aura: "rgba(34,197,94,.19)", dust: "rgba(245,158,11,.10)", mist: "rgba(250,204,21,.08)" };
  if (planetId === "world") return { base: "linear-gradient(180deg,#061c24 0%,#020b11 60%,#020509 100%)", aura: "rgba(45,212,191,.18)", dust: "rgba(56,189,248,.10)", mist: "rgba(34,197,94,.08)" };
  if (planetId === "startup") return { base: "linear-gradient(180deg,#170a2a 0%,#070611 62%,#03020a 100%)", aura: "rgba(168,85,247,.20)", dust: "rgba(244,114,182,.10)", mist: "rgba(139,92,246,.10)" };
  if (planetId === "creative") return { base: "linear-gradient(180deg,#25101e 0%,#0b0611 62%,#03020a 100%)", aura: "rgba(251,113,133,.18)", dust: "rgba(251,191,36,.10)", mist: "rgba(244,114,182,.10)" };
  if (planetId === "community") return { base: "linear-gradient(180deg,#241209 0%,#0c0705 62%,#030201 100%)", aura: "rgba(251,146,60,.18)", dust: "rgba(244,63,94,.09)", mist: "rgba(251,113,133,.08)" };
  return { base: "linear-gradient(180deg,#07111d 0%,#020711 60%,#01050c 100%)", aura: "rgba(40,120,220,.22)", dust: "rgba(5,125,170,.12)", mist: "rgba(56,189,248,.08)" };
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

      <div className="pointer-events-none absolute inset-0 opacity-90" style={{ transform: `translate3d(${viewport.x * 0.04}px, ${viewport.y * 0.04}px, 0)`, transition: "transform .7s ease-out" }}>
        <div className="absolute inset-0" style={{ animation: "spaceDrift 92s ease-in-out infinite" }}>
          <div className={`absolute left-[18%] top-[76%] h-10 w-32 rotate-[-18deg] rounded-full ${isLight ? "bg-white/34" : "bg-white/6"}`} />
          <div className="absolute left-[62%] top-[38%] h-[110px] w-[240px] rotate-[-18deg] rounded-[50%] blur-sm" style={{ background: palette.mist }} />
          <div className="absolute left-[72%] top-[50%] h-[170px] w-[220px] rotate-[24deg] rounded-[50%] blur-md" style={{ background: palette.dust }} />
        </div>
      </div>
    </>
  );
}
