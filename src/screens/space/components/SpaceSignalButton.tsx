import { depthForIndex, KIND_COLOR, KIND_EMOJI } from "../lib/space-engine";
import type { SpaceSignal, SpaceTheme } from "../types";

type Props = {
  signal: SpaceSignal;
  index: number;
  x: number;
  y: number;
  active: boolean;
  dimmed: boolean;
  highlighted: boolean;
  magnetRank?: number;
  label: string;
  theme: SpaceTheme;
  onOpen: () => void;
};

export function SpaceSignalButton({ signal, index, x, y, active, dimmed, highlighted, magnetRank, label, theme, onOpen }: Props) {
  const isLight = theme === "light";
  const depth = depthForIndex(index);
  const baseSize = signal.id.startsWith("demo-") ? 38 : 50;
  const rankBoost = typeof magnetRank === "number" ? Math.max(0.88, 1.08 - magnetRank * 0.025) : 1;
  const size = (active ? 58 : baseSize) * depth * rankBoost;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      className={[
        "group absolute rounded-full text-left transition-[left,top,opacity,filter] duration-500 ease-out hover:z-30 hover:scale-105",
        dimmed ? "opacity-18 grayscale" : "opacity-100",
        active ? "z-30" : highlighted ? "z-20" : "z-10",
      ].join(" ")}
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, animation: `spaceFloat ${8 + (index % 5)}s ease-in-out infinite`, animationDelay: `${(index % 8) * 0.28}s` }}
    >
      <span
        className={`absolute rounded-full bg-gradient-to-br ${KIND_COLOR[signal.kind]} blur-md ${highlighted ? "opacity-28" : "opacity-12"}`}
        style={{
          inset: highlighted ? "-10px" : "-6px",
          animation: highlighted ? "spacePulse 4.8s ease-in-out infinite" : "spacePulse 7s ease-in-out infinite",
        }}
      />
      {highlighted ? <span className="absolute inset-[-13px] rounded-full border border-cyan-200/18" style={{ animation: "spaceMiniWave 3s ease-out infinite" }} /> : null}
      <span className={`relative grid h-full w-full place-items-center overflow-hidden rounded-full border shadow-lg bg-gradient-to-br ${KIND_COLOR[signal.kind]} ${isLight ? "border-white/80" : "border-white/14"}`}>
        {signal.authorAvatar ? <img src={signal.authorAvatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <span className="text-xl">{KIND_EMOJI[signal.kind]}</span>}
      </span>
      <span className={`pointer-events-none absolute left-1/2 top-[calc(100%+8px)] hidden w-[230px] -translate-x-1/2 rounded-2xl px-3 py-2 text-xs font-bold shadow-2xl group-hover:block ${isLight ? "bg-white text-[#152235]" : "bg-[#101d2c] text-white"}`}>
        <span className="block text-[11px] opacity-55">{label} · {signal.authorName}</span>
        <span className="mt-1 line-clamp-2 block">{signal.text}</span>
      </span>
    </button>
  );
}
