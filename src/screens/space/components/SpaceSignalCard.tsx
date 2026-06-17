import { Magnet, Send, X } from "lucide-react";
import { getUserName, KIND_EMOJI } from "../lib/space-engine";
import type { SpaceCopy } from "../i18n";
import type { SpaceSignal, SpaceTelegramUser, SpaceTheme } from "../types";

type Props = {
  theme: SpaceTheme;
  copy: SpaceCopy;
  selected: SpaceSignal;
  telegramUser: SpaceTelegramUser | null;
  replyText: string;
  setReplyText: (value: string) => void;
  onClose: () => void;
  onPullSimilar: () => void;
  onReply: () => void;
  onHide: () => void;
  dockRight?: boolean;
};

export function SpaceSignalCard({ theme, copy, selected, telegramUser, replyText, setReplyText, onClose, onPullSimilar, onReply, onHide, dockRight = false }: Props) {
  const isLight = theme === "light";
  const kindLabels = copy.kind as Record<string, string>;
  const isMine = Boolean(telegramUser && selected.authorName === getUserName(telegramUser));

  return (
    <div className={`absolute inset-0 z-30 flex items-end p-3 pointer-events-none sm:items-center ${dockRight ? "justify-center sm:justify-end sm:pr-6" : "justify-center"}`}>
      <div className={`pointer-events-auto w-full max-w-[430px] rounded-[32px] border p-4 shadow-2xl ${isLight ? "border-[#d8e3ef] bg-white text-[#07111d]" : "border-white/10 bg-[#101d2c] text-white"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-[.18em] opacity-50">{KIND_EMOJI[selected.kind]} {kindLabels[selected.kind]}</div>
            <div className="mt-2 text-xl font-black leading-tight">{selected.text}</div>
            <div className="mt-3 flex items-center gap-2 text-sm opacity-75">
              {selected.authorAvatar ? (
                <img src={selected.authorAvatar} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-white/15" referrerPolicy="no-referrer" />
              ) : (
                <span className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-black ${isLight ? "bg-[#eef4fb] text-[#40566e]" : "bg-white/10 text-white/70"}`}>
                  {selected.authorName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span>{selected.authorName}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/5"><X className="h-5 w-5" /></button>
        </div>

        <button
          type="button"
          onClick={onPullSimilar}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-violet-500 to-sky-500 px-4 py-3 text-sm font-black text-white shadow-[0_14px_36px_rgba(59,130,246,.22)] transition hover:brightness-110 active:scale-[.98]"
        >
          <Magnet className="h-4 w-4" />
          {copy.pullSimilar}
        </button>

        {selected.id.startsWith("demo-") ? (
          <div className={`mt-4 rounded-2xl px-3 py-3 text-sm font-bold ${isLight ? "bg-[#eef4fb] text-[#40566e]" : "bg-white/8 text-white/68"}`}>{copy.demoHint}</div>
        ) : (
          <div className="mt-4 flex gap-2">
            <input value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder={copy.localReply} className={`min-w-0 flex-1 rounded-full px-4 py-3 text-sm font-bold outline-none ${isLight ? "bg-[#eef4fb]" : "bg-white/8"}`} />
            <button type="button" onClick={onReply} className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${isLight ? "bg-[#111827] text-white" : "bg-white text-[#07111d]"}`}><Send className="h-4 w-4" /></button>
          </div>
        )}

        <button
          type="button"
          onClick={onHide}
          className={`mt-4 w-full rounded-full px-4 py-3 text-sm font-black text-white transition active:scale-[.98] ${isMine ? "bg-rose-500" : "bg-gradient-to-r from-slate-700 via-slate-800 to-black"}`}
        >
          {isMine ? copy.deleteSignal : "👽 скрыть сигнал"}
        </button>
      </div>
    </div>
  );
}
