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
  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center bg-black/30 p-3 pt-[calc(5.5rem+env(safe-area-inset-top))]">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onApply();
        }}
        className="w-full max-w-[620px]"
      >
        <div className={`flex h-[52px] items-center gap-2 rounded-[28px] border-2 px-4 shadow-2xl transition ${isLight ? "border-[#31516e] bg-[#eef4fb] text-[#07111d] focus-within:border-pink-500" : "border-[#31516e] bg-[#132334] text-white focus-within:border-pink-500"}`}>
          <Search className="h-5 w-5 opacity-70" />
          <input
            type="search"
            enterKeyHint="search"
            autoFocus
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={copy.searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-base font-bold outline-none placeholder:text-current/45"
          />
          {value.trim() ? (
            <button type="button" onClick={() => setValue("")} className="grid h-9 w-9 place-items-center rounded-full bg-black/5" aria-label={copy.clearSearch}>
              <X className="h-4 w-4" />
            </button>
          ) : null}
          <button type="submit" className={`rounded-full px-4 py-2 text-sm font-black ${isLight ? "bg-[#111827] text-white" : "bg-white text-[#07111d]"}`}>
            {copy.find}
          </button>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-black/5" aria-label={copy.closeSearch}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={`mt-3 grid grid-cols-4 gap-2 rounded-[26px] border p-3 shadow-2xl backdrop-blur-xl sm:grid-cols-7 ${isLight ? "border-[#d8e3ef] bg-white/82" : "border-white/10 bg-[#101d2c]/88"}`}>
          {SPACE_PLANETS.map((planet) => (
            <button
              key={planet.id}
              type="button"
              onClick={() => setActivePlanet(planet.id)}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black transition ${activePlanet === planet.id ? `bg-gradient-to-br ${planet.gradient} text-white shadow-lg` : isLight ? "bg-[#edf4fb] text-[#40566e]" : "bg-white/8 text-white/70"}`}
              title={planet.title}
            >
              <span className="text-xl">{planet.emoji}</span>
              <span className="max-w-[64px] truncate">{planet.title}</span>
            </button>
          ))}
        </div>

        <div className={`mx-4 mt-3 rounded-2xl px-4 py-2 text-xs font-bold shadow-xl ${isLight ? "bg-white/80 text-[#40566e]" : "bg-[#101d2c]/90 text-white/65"}`}>
          {copy.searchHint}
        </div>
      </form>
    </div>
  );
}
