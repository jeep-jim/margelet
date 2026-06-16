import type { SpaceTheme } from "../types";

type Props = {
  theme: SpaceTheme;
  zoomIn: () => void;
  zoomOut: () => void;
};

export function SpaceZoomControls({ theme, zoomIn, zoomOut }: Props) {
  const isLight = theme === "light";
  const cls = `grid h-12 w-12 place-items-center rounded-full text-2xl font-black shadow-2xl backdrop-blur-xl active:scale-95 ${isLight ? "bg-white/82 text-[#07111d]" : "bg-white/12 text-white"}`;
  return (
    <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-2 sm:bottom-6 sm:right-6">
      <button type="button" onClick={zoomIn} className={cls} aria-label="Приблизить карту">+</button>
      <button type="button" onClick={zoomOut} className={cls} aria-label="Отдалить карту">−</button>
    </div>
  );
}
