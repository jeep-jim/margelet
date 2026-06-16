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
  label: string;
  theme: SpaceTheme;
  onOpen: () => void;
};

export function SpaceSignalButton({ signal, index, x, y, active, dimmed, highlighted, label, theme, onOpen }: Props) {
  const isLight = theme === "light";
  const depth = depthForIndex(index);
  const baseSize = signal.id.startsWith("demo-") ? 42 : 58;
  const size = (active ? 70 : baseSize) * depth;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
      className={[
        "group absolute rounded-full text-left transition-[left,top,transform,opacity,filter] duration-1000 ease-out hover:z-30 hover:scale-110",
        dimmed ? "opacity-20 grayscale" : "opacity-100",
        active ? "z-30" : highlighted ? "z-20" : "z-10",
      ].join(" ")}
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, animation: `spaceFloat ${6 + (index % 6)}s ease-in-out infinite`, animationDelay: `${(index % 8) * 0.35}s` }}
    >
      <span className={`absolute inset-[-8px] rounded-full bg-gradient-to-br ${KIND_COLOR[signal.kind]} blur-md opacity-30`} style={{ animation: "spacePulse 4.6s ease-in-out infinite" }} />
      <span className={`relative grid h-full w-full place-items-center overflow-hidden rounded-full border shadow-xl bg-gradient-to-br ${KIND_COLOR[signal.kind]} ${isLight ? "border-white/80" : "border-white/18"}`}>
        {signal.authorAvatar ? <img src={signal.authorAvatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <span className="text-xl">{KIND_EMOJI[signal.kind]}</span>}
      </span>
      <span className={`pointer-events-none absolute left-1/2 top-[calc(100%+8px)] hidden w-[230px] -translate-x-1/2 rounded-2xl px-3 py-2 text-xs font-bold shadow-2xl group-hover:block ${isLight ? "bg-white text-[#152235]" : "bg-[#101d2c] text-white"}`}>
        <span className="block text-[11px] opacity-55">{label} · {signal.authorName}</span>
        <span className="mt-1 line-clamp-2 block">{signal.text}</span>
      </span>
    </button>
  );
}
