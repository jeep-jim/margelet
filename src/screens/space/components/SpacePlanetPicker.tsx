import { ChevronDown, Orbit } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SPACE_PLANETS } from "../lib/space-engine";
import type { SpacePlanetId, SpaceTheme } from "../types";

type Props = {
  theme: SpaceTheme;
  activePlanet: SpacePlanetId;
  setActivePlanet: (planet: SpacePlanetId) => void;
  onOpenChange?: (open: boolean) => void;
};

export function SpacePlanetPicker({
  theme,
  activePlanet,
  setActivePlanet,
  onOpenChange,
}: Props) {
  const isLight = theme === "light";
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState<SpacePlanetId | null>(null);
  const active = useMemo(
    () =>
      SPACE_PLANETS.find((planet) => planet.id === activePlanet) ||
      SPACE_PLANETS[0],
    [activePlanet],
  );
  const noticePlanet = useMemo(
    () => SPACE_PLANETS.find((planet) => planet.id === notice),
    [notice],
  );

  useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const choose = (planet: SpacePlanetId) => {
    setActivePlanet(planet);
    setNotice(planet);
    setOpen(false);
  };

  return (
    <div className="absolute left-4 top-4 z-50">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex h-12 items-center gap-2 rounded-full border px-3 shadow-2xl backdrop-blur-xl transition active:scale-95 ${isLight ? "border-[#d8e3ef] bg-white/78 text-[#07111d]" : "border-white/10 bg-[#101d2c]/78 text-white"}`}
        aria-label="Planets"
      >
        <span
          className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br ${active.gradient} text-base shadow-lg`}
        >
          {active.emoji}
        </span>
        <Orbit className="h-4 w-4 opacity-70" />
        <ChevronDown
          className={`h-4 w-4 opacity-70 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          className={`mt-2 w-[min(340px,calc(100vw-2rem))] rounded-[28px] border p-2 shadow-2xl backdrop-blur-2xl sm:w-auto sm:max-w-none ${isLight ? "border-[#d8e3ef] bg-white/88" : "border-white/10 bg-[#101d2c]/88"}`}
        >
          <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-nowrap">
            {SPACE_PLANETS.map((planet) => (
              <button
                key={planet.id}
                type="button"
                onClick={() => choose(planet.id)}
                className={`flex min-w-[68px] flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-black transition sm:min-w-[78px] ${activePlanet === planet.id ? `bg-gradient-to-br ${planet.gradient} text-white shadow-lg` : isLight ? "bg-[#eef4fb] text-[#40566e] hover:bg-white" : "bg-white/7 text-white/70 hover:bg-white/12"}`}
                title={planet.title}
              >
                <span className="text-lg">{planet.emoji}</span>
                <span className="max-w-[62px] truncate sm:max-w-[70px]">
                  {planet.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {noticePlanet ? (
        <div
          className={`mt-2 w-[min(320px,calc(100vw-2rem))] rounded-[26px] border p-4 shadow-2xl backdrop-blur-2xl ${isLight ? "border-[#d8e3ef] bg-white/90 text-[#07111d]" : "border-white/10 bg-[#101d2c]/90 text-white"}`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${noticePlanet.gradient} text-xl shadow-lg`}
            >
              {noticePlanet.emoji}
            </span>
            <div>
              <div className="text-sm font-black">{noticePlanet.title}</div>
              <div className="mt-1 text-xs font-bold opacity-65">
                {noticePlanet.description}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
