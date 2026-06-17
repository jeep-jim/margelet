import { useMemo } from "react";
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

const MAX_RELATED_SIGNALS = 6;
const MAX_RELATED_LINES = 4;

function magnetScore(signal: SpaceSignal, magnet: SpaceSignal | null) {
  if (!magnet || signal.id === magnet.id) return 0;
  const wordScore = similarity(signal.text, magnet.text);
  const kindScore = signal.kind === magnet.kind ? 2 : 0;
  const planetScore = signal.planetId === magnet.planetId ? 1 : 0;
  return wordScore + kindScore + planetScore;
}

function getMagnetPosition(
  signal: SpaceSignal,
  magnet: SpaceSignal | null,
  related: Map<string, { rank: number; score: number }>
): Position {
  if (!magnet || signal.id === magnet.id) return { x: signal.x, y: signal.y, related: false };

  const hit = related.get(signal.id);
  if (!hit) return { x: signal.x, y: signal.y, related: false };

  const rank = hit.rank;
  const score = hit.score;
  const ring = rank < 3 ? 5.2 + rank * 1.9 : rank < 6 ? 11 + (rank - 3) * 2.2 : 17;
  const angle = rank * 2.399963 + (score % 3) * 0.12;

  return {
    x: Math.max(7, Math.min(93, magnet.x + Math.cos(angle) * ring)),
    y: Math.max(12, Math.min(88, magnet.y + Math.sin(angle) * ring * 0.68)),
    related: true,
    rank,
    score,
  };
}

export function SpaceWorld({
  theme,
  copy,
  viewport,
  activePlanet,
  signals,
  selectedId,
  magnet,
  searchQuery,
  searchMatchedIds,
  focusTo,
  setSelectedId,
  resetMagnet,
}: Props) {
  const isLight = theme === "light";
  const visibleSignals = useMemo(
    () =>
      activePlanet === "all"
        ? signals
        : signals.filter((signal) => (signal.planetId || "all") === activePlanet || signal.id.startsWith("demo-")),
    [activePlanet, signals]
  );
  const kindLabels = copy.kind as Record<string, string>;

  const related = useMemo(() => {
    if (!magnet) return new Map<string, { rank: number; score: number }>();

    return new Map(
      visibleSignals
        .filter((signal) => signal.id !== magnet.id)
        .map((signal) => ({ signal, score: magnetScore(signal, magnet) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_RELATED_SIGNALS)
        .map((item, rank) => [item.signal.id, { rank, score: item.score }] as const)
    );
  }, [magnet, visibleSignals]);

  const relatedLines = useMemo(() => {
    if (!magnet) return [];

    return Array.from(related.entries())
      .slice(0, MAX_RELATED_LINES)
      .map(([id, info]) => {
        const signal = visibleSignals.find((item) => item.id === id);
        if (!signal) return null;
        const pos = getMagnetPosition(signal, magnet, related);
        return { id, info, pos };
      })
      .filter(Boolean) as Array<{ id: string; info: { rank: number; score: number }; pos: Position }>;
  }, [magnet, related, visibleSignals]);

  const lineColor = isLight ? "rgba(14,165,233,.38)" : "rgba(125,211,252,.26)";

  return (
    <div
      className="absolute left-0 top-[calc(4rem+env(safe-area-inset-top))] origin-top-left transform-gpu"
      style={{ width: WORLD_W, height: WORLD_H, transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})` }}
      onClick={(event) => {
        if (!(event.target as HTMLElement).closest("button")) resetMagnet();
      }}
    >
      <div
        className="absolute left-0 top-[34%] z-10 flex items-center gap-2 rounded-r-full bg-white/10 px-4 py-2 text-xs font-black backdrop-blur-md"
        style={{ animation: "spaceComet 48s linear infinite" }}
      >
        ☄️ ardent intention
      </div>

      {magnet ? (
        <>
          <span
            key={`wave-a-${magnet.id}`}
            className="pointer-events-none absolute z-[6] rounded-full border border-cyan-200/42 shadow-[0_0_28px_rgba(125,211,252,.18)]"
            style={{ left: `${magnet.x}%`, top: `${magnet.y}%`, width: 90, height: 90, transform: "translate(-50%, -50%)", animation: "spaceWave 900ms ease-out 1 forwards" }}
          />
          <span
            key={`wave-b-${magnet.id}`}
            className="pointer-events-none absolute z-[6] rounded-full border border-sky-200/22 shadow-[0_0_42px_rgba(56,189,248,.14)]"
            style={{ left: `${magnet.x}%`, top: `${magnet.y}%`, width: 155, height: 155, transform: "translate(-50%, -50%)", animation: "spaceWave 1050ms ease-out 1 .16s forwards" }}
          />
          <span
            key={`wave-c-${magnet.id}`}
            className="pointer-events-none absolute z-[6] rounded-full border border-violet-200/14"
            style={{ left: `${magnet.x}%`, top: `${magnet.y}%`, width: 220, height: 220, transform: "translate(-50%, -50%)", animation: "spaceWave 1150ms ease-out 1 .28s forwards" }}
          />
          {relatedLines.length ? (
            <svg className="pointer-events-none absolute inset-0 z-[7] h-full w-full overflow-visible opacity-55">
              {relatedLines.map(({ id, info, pos }) => (
                <line
                  key={`link-${magnet.id}-${id}`}
                  x1={`${magnet.x}%`}
                  y1={`${magnet.y}%`}
                  x2={`${pos.x}%`}
                  y2={`${pos.y}%`}
                  stroke={lineColor}
                  strokeWidth={Math.max(0.8, 1.5 - info.rank * 0.12)}
                  strokeDasharray="2 12"
                  strokeLinecap="round"
                />
              ))}
            </svg>
          ) : null}
        </>
      ) : null}

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
              focusTo(signal, 1.12);
            }}
          />
        );
      })}

      <div className={`pointer-events-none absolute left-[44%] top-[27%] h-2.5 w-2.5 rounded-full shadow-[0_0_18px_currentColor] ${isLight ? "bg-sky-500 text-sky-400" : "bg-sky-300 text-sky-300"}`} />
      <div className={`pointer-events-none absolute left-[58%] top-[61%] h-1.5 w-1.5 rounded-full shadow-[0_0_14px_currentColor] ${isLight ? "bg-violet-500 text-violet-400" : "bg-white text-white"}`} />
    </div>
  );
}
