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

export function SpaceSignalButton({
  signal,
  index,
  x,
  y,
  active,
  dimmed,
  highlighted,
  magnetRank,
  label,
  theme,
  onOpen,
}: Props) {
  const isLight = theme === "light";
  const depth = depthForIndex(index);
  const baseSize = signal.id.startsWith("demo-") ? 34 : 46;
  const rankBoost = typeof magnetRank === "number" ? Math.max(0.82, 1.02 - magnetRank * 0.035) : 1;
  const size = Math.round((active ? 48 : baseSize) * depth * rankBoost);
  const iconSize = size < 38 ? "text-base" : "text-lg";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      className={[
        "group absolute rounded-full text-left transition-[left,top,opacity,filter,transform] duration-200 ease-out hover:z-30 hover:scale-105",
        "will-change-[left,top,opacity]",
        dimmed ? "opacity-20 grayscale" : "opacity-100",
        active ? "z-30" : highlighted ? "z-20" : "z-10",
      ].join(" ")}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
      }}
    >
      <span
        className={`absolute rounded-full bg-gradient-to-br ${KIND_COLOR[signal.kind]} blur-md ${highlighted ? "opacity-20" : "opacity-8"}`}
        style={{ inset: highlighted ? "-8px" : "-5px" }}
      />

      {highlighted ? (
        <span
          className="pointer-events-none absolute inset-[-9px] rounded-full border border-cyan-200/20"
          style={{ animation: "spaceMiniWave 900ms ease-out 1" }}
        />
      ) : null}

      <span
        className={`relative grid h-full w-full place-items-center overflow-hidden rounded-full border shadow-md bg-gradient-to-br ${KIND_COLOR[signal.kind]} ${
          isLight ? "border-white/75" : "border-white/12"
        }`}
      >
        {signal.authorAvatar ? (
          <img src={signal.authorAvatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span className={iconSize}>{KIND_EMOJI[signal.kind]}</span>
        )}
      </span>

      <span
        className={`pointer-events-none absolute left-1/2 top-[calc(100%+8px)] hidden w-[230px] -translate-x-1/2 rounded-2xl px-3 py-2 text-xs font-bold shadow-2xl group-hover:block ${
          isLight ? "bg-white text-[#152235]" : "bg-[#101d2c] text-white"
        }`}
      >
        <span className="block text-[11px] opacity-55">{label} · {signal.authorName}</span>
        <span className="mt-1 line-clamp-2 block">{signal.text}</span>
      </span>
    </button>
  );
}
