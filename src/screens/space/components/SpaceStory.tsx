import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { SpaceCopy } from "../i18n";

type Props = {
  copy: SpaceCopy;
  onClose: () => void;
};

export function SpaceStory({ copy, onClose }: Props) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(onClose, 30000);
    return () => window.clearTimeout(timer);
  }, [onClose, paused]);

  return (
    <div onClick={() => setPaused(true)} className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/72 p-4 pt-[calc(5rem+env(safe-area-inset-top))]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(46,195,255,.20),transparent_36%),linear-gradient(180deg,rgba(2,6,13,.35),rgba(0,0,0,.88))]" />
      <button type="button" onClick={(event) => { event.stopPropagation(); onClose(); }} className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-20 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur-xl" aria-label="Close">
        <X className="h-5 w-5" />
      </button>

      <div className="relative z-10 flex max-h-[78vh] w-full max-w-[760px] flex-col items-center text-center text-white [perspective:420px]">
        <div className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_28%,#d6fff7,#2ec3ff_42%,#3f2cff_78%)] text-4xl shadow-[0_0_60px_rgba(46,195,255,.42)]">🧙‍♂️</div>
        <div
          onAnimationEnd={() => window.setTimeout(onClose, 1000)}
          className="origin-bottom animate-[spaceIntroCrawl_28s_linear_forwards] px-3"
          style={{ animationPlayState: paused ? "paused" : "running" }}
        >
          <div className="text-[30px] font-black leading-tight tracking-[-.04em] text-white sm:text-[44px]">{copy.forceTitle}</div>
          <div className="mt-5 text-xl font-black text-white sm:text-3xl">{copy.forceIntro}</div>
          <p className="mx-auto mt-7 max-w-[620px] text-lg font-bold leading-relaxed text-white sm:text-2xl">{copy.forceBody}</p>
          <div className="mt-8 text-2xl font-black text-white sm:text-4xl">{copy.forceFooter}</div>
          <div className="mx-auto mt-10 max-w-[420px] rounded-[28px] bg-white/10 px-5 py-4 text-sm font-bold text-white backdrop-blur-xl sm:text-base">{copy.yoda}</div>
        </div>
      </div>
    </div>
  );
}
