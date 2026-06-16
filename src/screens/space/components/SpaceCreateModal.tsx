import { Sparkles, X } from "lucide-react";
import { KIND_EMOJI } from "../lib/space-engine";
import type { SpaceCopy } from "../i18n";
import type { SpaceSignalKind, SpaceTheme } from "../types";

type Props = {
  theme: SpaceTheme;
  copy: SpaceCopy;
  kind: SpaceSignalKind;
  setKind: (kind: SpaceSignalKind) => void;
  text: string;
  setText: (value: string) => void;
  onCreate: () => void;
  onClose: () => void;
};

export function SpaceCreateModal({ theme, copy, kind, setKind, text, setText, onCreate, onClose }: Props) {
  const isLight = theme === "light";
  const kindLabels = copy.kind as Record<SpaceSignalKind, string>;
  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/25 p-3 sm:items-center">
      <div className={`w-full max-w-[430px] rounded-[32px] border p-4 shadow-2xl ${isLight ? "border-[#d8e3ef] bg-white text-[#07111d]" : "border-white/10 bg-[#101d2c] text-white"}`}>
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-lg font-black"><Sparkles className="h-5 w-5" />{copy.newThought}</div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-black/5"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {(Object.keys(kindLabels) as SpaceSignalKind[]).map((item) => (
            <button key={item} type="button" onClick={() => setKind(item)} className={`rounded-2xl px-3 py-2 text-xs font-black transition ${kind === item ? isLight ? "bg-[#111827] text-white" : "bg-white text-[#07111d]" : isLight ? "bg-[#eef4fb] text-[#40566e]" : "bg-white/8 text-white/70"}`}>{KIND_EMOJI[item]} {kindLabels[item]}</button>
          ))}
        </div>

        <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={140} placeholder="например: кто знает как купить bitcoin без паники?" className={`mt-4 min-h-[120px] w-full resize-none rounded-[24px] px-4 py-4 text-base font-bold outline-none ${isLight ? "bg-[#eef4fb]" : "bg-white/8"}`} />

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-xs font-bold opacity-50">{text.length}/140 · {copy.local}</div>
          <button type="button" onClick={onCreate} disabled={!text.trim()} className={`rounded-full px-5 py-3 text-sm font-black transition disabled:opacity-40 ${isLight ? "bg-[#111827] text-white" : "bg-white text-[#07111d]"}`}>{copy.releaseThought}</button>
        </div>
      </div>
    </div>
  );
}
