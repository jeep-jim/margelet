import { SPACE_PLANETS } from "../lib/space-engine";
import type { SpacePlanetId, SpaceTheme } from "../types";

type Props = {
  theme: SpaceTheme;
  activePlanet: SpacePlanetId;
  setActivePlanet: (planet: SpacePlanetId) => void;
};

export function SpacePlanetPicker({ theme, activePlanet, setActivePlanet }: Props) {
  const isLight = theme === "light";
  return (
    <div className={`absolute bottom-4 left-4 z-30 hidden rounded-[26px] border p-2 shadow-2xl backdrop-blur-xl sm:flex ${isLight ? "border-[#d8e3ef] bg-white/72" : "border-white/10 bg-[#101d2c]/72"}`}>
      {SPACE_PLANETS.map((planet) => (
        <button
          key={planet.id}
          type="button"
          onClick={() => setActivePlanet(planet.id)}
          className={`grid h-10 w-10 place-items-center rounded-full text-lg transition ${activePlanet === planet.id ? `bg-gradient-to-br ${planet.gradient} text-white shadow-lg` : "opacity-60 hover:opacity-100"}`}
          title={planet.title}
        >
          {planet.emoji}
        </button>
      ))}
    </div>
  );
}
