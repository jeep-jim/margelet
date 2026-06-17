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
  destroying?: boolean;
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
  destroying,
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
        if (!destroying) onOpen();
      }}
      className={[
        "group absolute rounded-full text-left transition-[left,top,opacity,filter,transform] duration-200 ease-out hover:z-30 hover:scale-105",
        "will-change-[left,top,opacity]",
        destroying ? "pointer-events-none z-40" : "",
        dimmed && !destroying ? "opacity-20 grayscale" : "opacity-100",
        active ? "z-30" : highlighted ? "z-20" : "z-10",
      ].join(" ")}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
      }}
    >
      {destroying ? (
        <>
          <span className="pointer-events-none absolute -left-16 -top-12 text-3xl" style={{ animation: "spaceUfoStrike 780ms ease-in-out forwards" }}>🛸</span>
          <span className="pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-24 origin-left -translate-y-1/2 rotate-[26deg] rounded-full bg-cyan-200 shadow-[0_0_22px_rgba(125,211,252,.9)]" style={{ animation: "spaceLaser 640ms ease-out forwards" }} />
          <span className="pointer-events-none absolute inset-[-16px] rounded-full bg-[radial-gradient(circle,#fff_0_8%,#facc15_16%,#fb7185_35%,transparent_62%)]" style={{ animation: "spaceBoom 820ms ease-out forwards" }} />
        </>
      ) : null}

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
        } ${destroying ? "opacity-0 scale-75 transition duration-300" : ""}`}
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
