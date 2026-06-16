import { Crosshair } from "lucide-react";
import { SPACE_PLANETS } from "../lib/space-engine";
import type { SpacePlanetId, SpaceTheme } from "../types";

type Props = {
  theme: SpaceTheme;
  activePlanet: SpacePlanetId;
  setActivePlanet: (planet: SpacePlanetId) => void;
  onMySignals: () => void;
};

export function SpacePlanetPicker({ theme, activePlanet, setActivePlanet, onMySignals }: Props) {
  const isLight = theme === "light";
  return (
    <div className={`absolute bottom-4 left-4 z-30 flex max-w-[calc(100vw-2rem)] items-center gap-2 overflow-x-auto rounded-[26px] border p-2 shadow-2xl backdrop-blur-xl ${isLight ? "border-[#d8e3ef] bg-white/72" : "border-white/10 bg-[#101d2c]/72"}`}>
      <button
        type="button"
        onClick={onMySignals}
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${isLight ? "bg-[#111827] text-white" : "bg-white text-[#07111d]"}`}
        title="My signals"
        aria-label="My signals"
      >
        <Crosshair className="h-5 w-5" />
      </button>
      {SPACE_PLANETS.map((planet) => (
        <button
          key={planet.id}
          type="button"
          onClick={() => setActivePlanet(planet.id)}
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg transition ${activePlanet === planet.id ? `bg-gradient-to-br ${planet.gradient} text-white shadow-lg` : "opacity-60 hover:opacity-100"}`}
          title={planet.title}
        >
          {planet.emoji}
        </button>
      ))}
    </div>
  );
}
