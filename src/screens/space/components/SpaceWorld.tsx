import { similarity, WORLD_H, WORLD_W } from "../lib/space-engine";
import type { SpaceCopy } from "../i18n";
import type { SpacePlanetId, SpaceSignal, SpaceTheme, SpaceViewport } from "../types";
import { SpaceSignalButton } from "./SpaceSignalButton";

type Position = { x: number; y: number; related: boolean };

type Props = {
  theme: SpaceTheme;
  copy: SpaceCopy;
  viewport: SpaceViewport;
  activePlanet: SpacePlanetId;
  signals: SpaceSignal[];
  selectedId: string | null;
  magnet: SpaceSignal | null;
  searchQuery: string;
  searchMatchedIds: Set<string>;
  focusTo: (signal: SpaceSignal, scale?: number) => void;
  setSelectedId: (id: string | null) => void;
};

function getMagnetPosition(signal: SpaceSignal, index: number, magnet: SpaceSignal | null): Position {
  if (!magnet || signal.id === magnet.id) return { x: signal.x, y: signal.y, related: false };

  const score = signal.kind === magnet.kind ? 2 + similarity(signal.text, magnet.text) : similarity(signal.text, magnet.text);
  if (score <= 0) return { x: signal.x, y: signal.y, related: false };

  const ring = 9 + Math.min(score, 4) * 4;
  const angle = index * 1.95;
  return {
    x: Math.max(7, Math.min(93, magnet.x + Math.cos(angle) * ring)),
    y: Math.max(12, Math.min(88, magnet.y + Math.sin(angle) * ring * 0.72)),
    related: true,
  };
}

export function SpaceWorld({ theme, copy, viewport, activePlanet, signals, selectedId, magnet, searchQuery, searchMatchedIds, focusTo, setSelectedId }: Props) {
  const isLight = theme === "light";
  const visibleSignals = activePlanet === "all" ? signals : signals.filter((signal) => (signal.planetId || "all") === activePlanet || signal.id.startsWith("demo-"));
  const kindLabels = copy.kind as Record<string, string>;

  return (
    <div
      className="absolute left-0 top-[calc(4rem+env(safe-area-inset-top))] origin-top-left transition-transform duration-700 ease-out"
      style={{ width: WORLD_W, height: WORLD_H, transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})` }}
    >
      <div className="absolute left-0 top-[34%] z-10 flex items-center gap-2 rounded-r-full bg-white/12 px-4 py-2 text-xs font-black backdrop-blur-md" style={{ animation: "spaceComet 30s linear infinite" }}>
        ☄️ ardent intention
      </div>

      {magnet ? <div className="pointer-events-none absolute inset-0 z-[4] bg-black/32 transition" /> : null}

      {magnet ? (
        <>
          <span className="pointer-events-none absolute z-[6] rounded-full border border-white/20" style={{ left: `${magnet.x}%`, top: `${magnet.y}%`, width: 180, height: 180, transform: "translate(-50%, -50%)", animation: "spaceWave 2.6s ease-out infinite" }} />
          <span className="pointer-events-none absolute z-[6] rounded-full border border-white/12" style={{ left: `${magnet.x}%`, top: `${magnet.y}%`, width: 260, height: 260, transform: "translate(-50%, -50%)", animation: "spaceWave 2.6s ease-out infinite .65s" }} />
        </>
      ) : null}

      {visibleSignals.map((signal, index) => {
        const pos = getMagnetPosition(signal, index, magnet);
        const active = selectedId === signal.id || magnet?.id === signal.id;
        const matched = searchMatchedIds.has(signal.id);
        const dimmed = (Boolean(magnet) && !pos.related && magnet?.id !== signal.id) || (Boolean(searchQuery.trim()) && !matched);

        return (
          <SpaceSignalButton
            key={signal.id}
            signal={signal}
            index={index}
            x={pos.x}
            y={pos.y}
            active={active}
            dimmed={dimmed}
            highlighted={pos.related || matched}
            label={kindLabels[signal.kind] || signal.kind}
            theme={theme}
            onOpen={() => {
              setSelectedId(signal.id);
              focusTo(signal, 1.32);
            }}
          />
        );
      })}

      <div className={`pointer-events-none absolute left-[44%] top-[27%] h-2.5 w-2.5 rounded-full shadow-[0_0_18px_currentColor] ${isLight ? "bg-sky-500 text-sky-400" : "bg-sky-300 text-sky-300"}`} />
      <div className={`pointer-events-none absolute left-[58%] top-[61%] h-1.5 w-1.5 rounded-full shadow-[0_0_14px_currentColor] ${isLight ? "bg-violet-500 text-violet-400" : "bg-white text-white"}`} />
    </div>
  );
}
