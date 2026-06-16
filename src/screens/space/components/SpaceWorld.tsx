import { similarity, WORLD_H, WORLD_W } from "../lib/space-engine";
import type { SpaceCopy } from "../i18n";
import type { SpacePlanetId, SpaceSignal, SpaceTheme, SpaceViewport } from "../types";
import { SpaceSignalButton } from "./SpaceSignalButton";

type Position = { x: number; y: number; related: boolean; rank?: number; score?: number };

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
  resetMagnet: () => void;
};

function magnetScore(signal: SpaceSignal, magnet: SpaceSignal | null) {
  if (!magnet || signal.id === magnet.id) return 0;
  const wordScore = similarity(signal.text, magnet.text);
  const kindScore = signal.kind === magnet.kind ? 2 : 0;
  const planetScore = signal.planetId === magnet.planetId ? 1 : 0;
  return wordScore + kindScore + planetScore;
}

function getMagnetPosition(signal: SpaceSignal, magnet: SpaceSignal | null, related: Map<string, { rank: number; score: number }>): Position {
  if (!magnet || signal.id === magnet.id) return { x: signal.x, y: signal.y, related: false };

  const hit = related.get(signal.id);
  if (!hit) return { x: signal.x, y: signal.y, related: false };

  const rank = hit.rank;
  const score = hit.score;
  const ring = rank < 4 ? 8 + rank * 4 : rank < 10 ? 24 + (rank - 4) * 4 : 48 + (rank - 10) * 3;
  const angle = rank * 2.399963 + (score % 3) * 0.18;

  return {
    x: Math.max(5, Math.min(95, magnet.x + Math.cos(angle) * ring)),
    y: Math.max(9, Math.min(91, magnet.y + Math.sin(angle) * ring * 0.72)),
    related: true,
    rank,
    score,
  };
}

export function SpaceWorld({ theme, copy, viewport, activePlanet, signals, selectedId, magnet, searchQuery, searchMatchedIds, focusTo, setSelectedId, resetMagnet }: Props) {
  const isLight = theme === "light";
  const visibleSignals = activePlanet === "all" ? signals : signals.filter((signal) => (signal.planetId || "all") === activePlanet || signal.id.startsWith("demo-"));
  const kindLabels = copy.kind as Record<string, string>;
  const related = new Map(
    visibleSignals
      .filter((signal) => magnet && signal.id !== magnet.id)
      .map((signal) => ({ signal, score: magnetScore(signal, magnet) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 16)
      .map((item, rank) => [item.signal.id, { rank, score: item.score }] as const)
  );

  return (
    <div
      className="absolute left-0 top-[calc(4rem+env(safe-area-inset-top))] origin-top-left transition-transform duration-700 ease-out"
      style={{ width: WORLD_W, height: WORLD_H, transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})` }}
      onClick={(event) => {
        if (event.target === event.currentTarget) resetMagnet();
      }}
    >
      <div className="absolute left-0 top-[34%] z-10 flex items-center gap-2 rounded-r-full bg-white/12 px-4 py-2 text-xs font-black backdrop-blur-md" style={{ animation: "spaceComet 30s linear infinite" }}>
        ☄️ ardent intention
      </div>


      {magnet ? (
        <>
          <span className="pointer-events-none absolute z-[6] rounded-full border border-cyan-200/40 shadow-[0_0_34px_rgba(125,211,252,.20)]" style={{ left: `${magnet.x}%`, top: `${magnet.y}%`, width: 180, height: 180, transform: "translate(-50%, -50%)", animation: "spaceWave 2.8s ease-out infinite" }} />
          <span className="pointer-events-none absolute z-[6] rounded-full border border-sky-200/24 shadow-[0_0_54px_rgba(56,189,248,.16)]" style={{ left: `${magnet.x}%`, top: `${magnet.y}%`, width: 310, height: 310, transform: "translate(-50%, -50%)", animation: "spaceWave 2.8s ease-out infinite .62s" }} />
          <span className="pointer-events-none absolute z-[6] rounded-full border border-violet-200/18" style={{ left: `${magnet.x}%`, top: `${magnet.y}%`, width: 430, height: 430, transform: "translate(-50%, -50%)", animation: "spaceWave 2.8s ease-out infinite 1.18s" }} />
        </>
      ) : null}


      {magnet
        ? Array.from(related.entries()).slice(0, 8).map(([id, info]) => {
            const signal = visibleSignals.find((item) => item.id === id);
            if (!signal) return null;
            const pos = getMagnetPosition(signal, magnet, related);
            const x1 = `${magnet.x}%`;
            const y1 = `${magnet.y}%`;
            const x2 = `${pos.x}%`;
            const y2 = `${pos.y}%`;
            return (
              <svg key={`link-${id}`} className="pointer-events-none absolute inset-0 z-[7] h-full w-full overflow-visible opacity-60">
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(125,211,252,.32)" strokeWidth={Math.max(1, 2.8 - info.rank * 0.18)} strokeDasharray="4 8" />
              </svg>
            );
          })
        : null}

      {visibleSignals.map((signal, index) => {
        const pos = getMagnetPosition(signal, magnet, related);
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
            magnetRank={pos.rank}
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
