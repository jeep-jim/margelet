import { ChevronLeft, ChevronRight, Magnet, Send, X } from "lucide-react";
import { useMemo, useState } from "react";
import { KIND_EMOJI } from "../lib/space-engine";
import type { SpaceSignal, SpaceTheme } from "../types";

type HeatContact = {
  signal: SpaceSignal;
  score: number;
  rank: number;
};

type Props = {
  theme: SpaceTheme;
  title: string;
  magnet: SpaceSignal;
  contacts: HeatContact[];
  selectedId: string | null;
  replyText: string;
  setReplyText: (value: string) => void;
  onOpen: (signal: SpaceSignal) => void;
  onClose: () => void;
  onReply: () => void;
};

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "•";
}

function Avatar({ signal, isLight, size = "h-11 w-11" }: { signal: SpaceSignal; isLight: boolean; size?: string }) {
  return signal.authorAvatar ? (
    <img src={signal.authorAvatar} alt="" className={`${size} rounded-full object-cover ring-2 ring-white/20`} referrerPolicy="no-referrer" />
  ) : (
    <span className={`grid ${size} place-items-center rounded-full text-sm font-black ${isLight ? "bg-white text-[#40566e]" : "bg-white/12 text-white/75"}`}>
      {initials(signal.authorName)}
    </span>
  );
}

function matchPercent(score: number) {
  return Math.max(12, Math.min(99, Math.round(score * 12)));
}

function demoReplies(signal: SpaceSignal) {
  const own = signal.replies || [];
  if (own.length) return own;

  return [
    {
      id: `${signal.id}-demo-reply-1`,
      text: "Вижу мысль. Можно обсудить детали и понять, чем я могу помочь.",
      createdAt: Date.now() - 1000 * 60 * 7,
      authorName: signal.authorName,
      authorAvatar: signal.authorAvatar,
    },
    {
      id: `${signal.id}-demo-reply-2`,
      text: "Это демо-чат: сейчас он локальный, потом подключим живые ответы.",
      createdAt: Date.now() - 1000 * 60 * 2,
      authorName: "Space",
      authorAvatar: null,
    },
  ];
}

export function SpaceHeatContactsPanel({ theme, title, magnet, contacts, selectedId, replyText, setReplyText, onOpen, onClose, onReply }: Props) {
  const isLight = theme === "light";
  const [collapsed, setCollapsed] = useState(false);
  const items = contacts.length ? contacts : [{ signal: magnet, score: 100, rank: 0 }];
  const active = useMemo(() => items.find((item) => item.signal.id === selectedId)?.signal || items[0]?.signal || magnet, [items, magnet, selectedId]);
  const activeReplies = active ? demoReplies(active) : [];

  const shellClass = isLight ? "border-[#d8e3ef] bg-white/90 text-[#07111d]" : "border-white/10 bg-[#101d2c]/90 text-white";
  const softClass = isLight ? "bg-[#eef4fb]/86" : "bg-white/7";
  const activeClass = isLight ? "bg-sky-100 shadow-inner" : "bg-sky-400/14 shadow-[inset_0_0_0_1px_rgba(125,211,252,.22)]";

  return (
    <aside
      onClick={(event) => event.stopPropagation()}
      className={`absolute left-3 top-[calc(5.1rem+env(safe-area-inset-top))] z-[35] max-h-[calc(100vh-6.3rem)] overflow-hidden rounded-[28px] border shadow-2xl backdrop-blur-2xl transition-all duration-200 sm:left-4 ${shellClass} ${collapsed ? "w-[76px]" : "w-[min(340px,calc(100vw-24px))] sm:w-[360px]"}`}
    >
      <div className={`flex items-center border-b ${isLight ? "border-[#d8e3ef]" : "border-white/10"} ${collapsed ? "justify-center p-2" : "justify-between gap-3 px-4 py-3"}`}>
        {collapsed ? null : (
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-black">
              <Magnet className="h-4 w-4 text-sky-400" />
              <span>{title}</span>
            </div>
            <div className="mt-0.5 truncate text-xs font-bold opacity-60">{items.length} рядом · выбери контакт</div>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/8 transition hover:bg-white/12 active:scale-95"
            aria-label={collapsed ? "Expand heat contacts" : "Collapse heat contacts"}
            title={collapsed ? "Развернуть" : "Свернуть"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
          {!collapsed ? (
            <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-white/8 transition hover:bg-white/12 active:scale-95" aria-label="Close heat contacts">
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {collapsed ? (
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto p-2">
          {items.map(({ signal }) => {
            const isActive = selectedId === signal.id;
            return (
              <button
                key={`heat-contact-rail-${signal.id}`}
                type="button"
                onClick={() => onOpen(signal)}
                className={`mb-2 grid h-14 w-full place-items-center rounded-2xl transition active:scale-[.98] ${isActive ? activeClass : softClass}`}
                title={signal.text}
              >
                <div className="relative h-10 w-10">
                  <Avatar signal={signal} isLight={isLight} size="h-10 w-10" />
                  <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-rose-400 via-violet-500 to-sky-500 text-[10px] shadow-lg">
                    {KIND_EMOJI[signal.kind]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex max-h-[calc(100vh-10rem)] flex-col overflow-hidden">
          <div className={`border-b px-3 py-2 ${isLight ? "border-[#d8e3ef]" : "border-white/10"}`}>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {items.map(({ signal }) => {
                const isActive = selectedId === signal.id;
                return (
                  <button
                    key={`heat-contact-strip-${signal.id}`}
                    type="button"
                    onClick={() => onOpen(signal)}
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition active:scale-[.98] ${isActive ? activeClass : softClass}`}
                    title={signal.text}
                  >
                    <div className="relative h-9 w-9">
                      <Avatar signal={signal} isLight={isLight} size="h-9 w-9" />
                      <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-gradient-to-br from-rose-400 via-violet-500 to-sky-500 text-[10px] shadow-lg">
                        {KIND_EMOJI[signal.kind]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto p-3">
            <div className={`rounded-[24px] p-3 ${isLight ? "bg-[#eef4fb]/88" : "bg-white/7"}`}>
              <div className="flex items-start gap-3">
                <Avatar signal={active} isLight={isLight} size="h-12 w-12" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-black opacity-65">{active.authorName}</span>
                    <span className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-black opacity-55">
                      {matchPercent(items.find((item) => item.signal.id === active.id)?.score || 1)}%
                    </span>
                  </div>
                  <div className="mt-1 text-base font-black leading-tight">{active.text}</div>
                </div>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {activeReplies.slice(0, 5).map((reply, index) => (
                <div key={reply.id} className={`rounded-2xl px-3 py-2 text-xs leading-snug ${index % 2 === 0 ? (isLight ? "bg-white/88" : "bg-white/8") : (isLight ? "bg-sky-100/80" : "bg-sky-400/12")}`}>
                  <div className="mb-1 text-[10px] font-black opacity-55">{reply.authorName}</div>
                  <div className="font-bold opacity-85">{reply.text}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onReply();
                }}
                placeholder="локальный ответ..."
                className={`min-w-0 flex-1 rounded-full px-4 py-3 text-sm font-bold outline-none ${isLight ? "bg-white text-[#07111d] placeholder:text-[#75889b]" : "bg-white/10 text-white placeholder:text-white/38"}`}
              />
              <button type="button" onClick={onReply} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-[#07111d] shadow-lg transition active:scale-95" aria-label="Send reply">
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
