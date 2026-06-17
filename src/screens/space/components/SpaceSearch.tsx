import { Search, X } from "lucide-react";
import { SPACE_PLANETS } from "../lib/space-engine";
import type { SpaceCopy } from "../i18n";
import type { SpacePlanetId } from "../types";

type Props = {
  isLight: boolean;
  copy: SpaceCopy;
  value: string;
  setValue: (value: string) => void;
  activePlanet: SpacePlanetId;
  setActivePlanet: (planet: SpacePlanetId) => void;
  onApply: () => void;
  onClose: () => void;
};

export function SpaceSearch({ isLight, copy, value, setValue, activePlanet, setActivePlanet, onApply, onClose }: Props) {
  const hasValue = value.trim().length > 0;

  return (
    <div
      className="absolute inset-x-0 bottom-0 top-[calc(4rem+env(safe-area-inset-top))] z-30 flex items-start justify-center bg-black/20 p-3 pt-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onTouchStart={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onApply();
        }}
        className="w-full max-w-[620px]"
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      >
        <div
          className={`flex h-[54px] items-center gap-3 rounded-[30px] border-2 px-4 shadow-2xl transition ${
            isLight
              ? "border-[#2b5575] bg-white/90 text-[#07111d] focus-within:border-emerald-400"
              : "border-[#31516e] bg-[#132334]/96 text-white focus-within:border-emerald-400"
          }`}
        >
          <Search className="h-5 w-5 shrink-0 opacity-70" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-base font-bold outline-none placeholder:text-current/45"
          />
          {hasValue ? (
            <button
              type="button"
              onClick={() => setValue("")}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition active:scale-95 ${
                isLight ? "bg-[#dfeaf5] text-[#26394d] hover:bg-[#d1deeb]" : "bg-white/10 text-white/80 hover:bg-white/16"
              }`}
              aria-label={copy.clearSearch}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className={`mt-3 grid grid-cols-4 gap-2 rounded-[26px] border p-3 shadow-2xl backdrop-blur-xl sm:grid-cols-7 ${isLight ? "border-[#d8e3ef] bg-white/82" : "border-white/10 bg-[#101d2c]/88"}`}>
          {SPACE_PLANETS.map((planet) => (
            <button
              key={planet.id}
              type="button"
              onClick={() => setActivePlanet(planet.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black transition active:scale-95 ${activePlanet === planet.id ? `bg-gradient-to-br ${planet.gradient} text-white shadow-lg` : isLight ? "bg-[#edf4fb] text-[#40566e] hover:bg-[#e1ebf5]" : "bg-white/8 text-white/70 hover:bg-white/12"}`}
              title={planet.title}
            >
              <span className="text-xl">{planet.emoji}</span>
              <span className="max-w-[64px] truncate">{planet.title}</span>
            </button>
          ))}
        </div>

        <div className={`mx-4 mt-3 rounded-2xl px-4 py-2 text-xs font-bold shadow-xl ${isLight ? "bg-white/84 text-[#40566e]" : "bg-[#101d2c]/90 text-white/65"}`}>
          {copy.searchHint}
        </div>
      </form>
    </div>
  );
}
