import { useMemo } from "react";
import { getHeatContacts, SPACE_PLANETS, WORLD_H, WORLD_W } from "../lib/space-engine";
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
  destroyingId: string | null;
  focusTo: (signal: SpaceSignal, scale?: number) => void;
  setSelectedId: (id: string | null) => void;
  setActivePlanet: (planet: SpacePlanetId) => void;
  resetMagnet: () => void;
};

const MAX_RELATED_SIGNALS = 7;
const MAX_RELATED_LINES = 5;

const PLANET_NODES: Record<SpacePlanetId, { x: number; y: number; size: number }> = {
  all: { x: 9, y: 18, size: 118 },
  tech: { x: 82, y: 18, size: 82 },
  finance: { x: 88, y: 33, size: 142 },
  world: { x: 70, y: 73, size: 156 },
  startup: { x: 23, y: 76, size: 96 },
  creative: { x: 56, y: 22, size: 76 },
  community: { x: 35, y: 34, size: 88 },
};

function getMagnetPosition(signal: SpaceSignal, magnet: SpaceSignal | null, related: Map<string, { rank: number; score: number }>): Position {
  if (!magnet || signal.id === magnet.id) return { x: signal.x, y: signal.y, related: false };

  const hit = related.get(signal.id);
  if (!hit) return { x: signal.x, y: signal.y, related: false };

  const heatPattern = [
    { x: 6.2, y: -1.2 },
    { x: -5.6, y: -1.8 },
    { x: 0.2, y: -5.2 },
    { x: 0.5, y: 4.9 },
    { x: 7.8, y: 4.1 },
    { x: -7.3, y: 4.2 },
    { x: -8.8, y: -6.1 },
  ];

  const point = heatPattern[hit.rank] || { x: 10 + hit.rank * 1.5, y: 4 + hit.rank };

  return {
    x: Math.max(7, Math.min(93, magnet.x + point.x)),
    y: Math.max(12, Math.min(88, magnet.y + point.y)),
    related: true,
    rank: hit.rank,
    score: hit.score,
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
  destroyingId,
  focusTo,
  setSelectedId,
  setActivePlanet,
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
    return new Map(
      getHeatContacts(visibleSignals, magnet, MAX_RELATED_SIGNALS).map((item) => [item.signal.id, { rank: item.rank, score: item.score }] as const)
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

  const lineColor = isLight ? "rgba(2,132,199,.86)" : "rgba(125,211,252,.36)";
  const relatedCount = related.size;

  return (
    <div
      className="absolute left-0 top-[calc(4rem+env(safe-area-inset-top))] origin-top-left transform-gpu"
      style={{ width: WORLD_W, height: WORLD_H, transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})` }}
      onClick={(event) => {
        if (!(event.target as HTMLElement).closest("button")) setSelectedId(null);
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
            style={{ left: `${magnet.x}%`, top: `${magnet.y}%`, width: 92, height: 92, transform: "translate(-50%, -50%)", animation: "spaceWave 900ms ease-out 1 forwards" }}
          />
          <span
            key={`wave-b-${magnet.id}`}
            className="pointer-events-none absolute z-[6] rounded-full border border-sky-200/22 shadow-[0_0_42px_rgba(56,189,248,.14)]"
            style={{ left: `${magnet.x}%`, top: `${magnet.y}%`, width: 158, height: 158, transform: "translate(-50%, -50%)", animation: "spaceWave 1050ms ease-out 1 .16s forwards" }}
          />
          <div
            className={`pointer-events-none absolute z-[8] -translate-x-1/2 rounded-full px-3 py-1.5 text-[11px] font-black shadow-2xl backdrop-blur-xl ${isLight ? "bg-white/86 text-[#0f3655]" : "bg-[#101d2c]/86 text-sky-100"}`}
            style={{ left: `${magnet.x}%`, top: `${Math.max(8, magnet.y - 10)}%` }}
          >
            🧲 {relatedCount || 0} {relatedCount === 1 ? "контакт" : "контактов"}
          </div>
          {relatedLines.length ? (
            <svg className={`pointer-events-none absolute inset-0 z-[7] h-full w-full overflow-visible ${isLight ? "opacity-95" : "opacity-62"}`}>
              {relatedLines.map(({ id, info, pos }) => (
                <line
                  key={`link-${magnet.id}-${id}`}
                  x1={`${magnet.x}%`}
                  y1={`${magnet.y}%`}
                  x2={`${pos.x}%`}
                  y2={`${pos.y}%`}
                  stroke={lineColor}
                  strokeWidth={Math.max(isLight ? 1.35 : 0.85, (isLight ? 2.35 : 1.55) - info.rank * 0.12)}
                  strokeDasharray={isLight ? "3 8" : "2 12"}
                  strokeLinecap="round"
                />
              ))}
            </svg>
          ) : null}
        </>
      ) : null}


      <div className="pointer-events-none absolute inset-0 z-[4]">
        {SPACE_PLANETS.map((planet) => {
          const node = PLANET_NODES[planet.id];
          const activePlanetNode = planet.id === activePlanet;
          const size = activePlanetNode ? node.size * 1.14 : node.size * 0.56;
          return (
            <button
              key={`planet-node-${planet.id}`}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setActivePlanet(planet.id);
                resetMagnet();
              }}
              className={`pointer-events-auto absolute grid place-items-center rounded-full transition duration-300 hover:scale-110 ${activePlanetNode ? "opacity-78" : "opacity-30 hover:opacity-70"}`}
              style={{ left: `${node.x}%`, top: `${node.y}%`, width: size, height: size, transform: "translate(-50%, -50%)" }}
              aria-label={`Open ${planet.title}`}
              title={`${planet.title}: ${planet.description}`}
            >
              <span className={`absolute inset-0 rounded-full bg-gradient-to-br ${planet.gradient} blur-sm`} />
              <span className={`absolute inset-[14%] rounded-full bg-gradient-to-br ${planet.gradient} shadow-[inset_18px_18px_32px_rgba(255,255,255,.18),inset_-20px_-20px_36px_rgba(0,0,0,.38)]`} />
              <span className="absolute -inset-3 rounded-full border border-white/10" />
              <span className="relative text-lg opacity-75">{activePlanetNode ? planet.emoji : ""}</span>
              <span className="absolute -right-2 top-1 h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,.8)]" />
            </button>
          );
        })}
      </div>

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
            destroying={destroyingId === signal.id}
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
