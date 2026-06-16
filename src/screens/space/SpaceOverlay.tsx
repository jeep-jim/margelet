import { ArrowLeft, Magnet, Moon, Plus, Send, Sparkles, Sun, User, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";

import type { IngestedPost, Locale } from "../../types/app";
import type { SpaceSignal, SpaceSignalKind, SpaceTelegramUser, SpaceTheme } from "./types";

const TG_USER_KEY = "margelet_tg_user";
const SPACE_SIGNALS_KEY = "margelet_space_local_signals_v1";

const KIND_LABEL: Record<SpaceSignalKind, string> = {
  want: "хочу",
  ask: "спросить",
  buy: "куплю",
  talk: "поговорю",
  help: "помогу",
  sell: "продам",
};

const KIND_EMOJI: Record<SpaceSignalKind, string> = {
  want: "✨",
  ask: "❔",
  buy: "🛒",
  talk: "💬",
  help: "🛠️",
  sell: "🏷️",
};

const KIND_COLOR: Record<SpaceSignalKind, string> = {
  want: "from-fuchsia-400 to-violet-500",
  ask: "from-sky-300 to-blue-500",
  buy: "from-amber-300 to-orange-500",
  talk: "from-violet-300 to-fuchsia-500",
  help: "from-emerald-300 to-green-500",
  sell: "from-rose-300 to-pink-500",
};

function readTheme(): SpaceTheme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function applyTheme(theme: SpaceTheme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem("margelet_theme", theme);
}

function readTelegramUser(): SpaceTelegramUser | null {
  try {
    const raw = localStorage.getItem(TG_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SpaceTelegramUser;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function readSignals(): SpaceSignal[] {
  try {
    const raw = localStorage.getItem(SPACE_SIGNALS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.text) : [];
  } catch {
    return [];
  }
}

function writeSignals(signals: SpaceSignal[]) {
  localStorage.setItem(SPACE_SIGNALS_KEY, JSON.stringify(signals.slice(0, 80)));
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getUserName(user: SpaceTelegramUser | null) {
  return user?.first_name || user?.username || "You";
}

function getUserAvatar(user: SpaceTelegramUser | null) {
  return user?.photo_url || null;
}

function getWords(text: string) {
  return String(text)
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function similarity(a: string, b: string) {
  const aw = new Set(getWords(a));
  const bw = getWords(b);
  if (!aw.size || !bw.length) return 0;
  return bw.reduce((sum, word) => sum + (aw.has(word) ? 1 : 0), 0);
}

function pickDemoSignals(): SpaceSignal[] {
  const now = Date.now();
  const items = [
    ["ask", "как купить bitcoin без паники?"],
    ["want", "хочу понять куда движется крипта"],
    ["talk", "поговорю про переезд в Европу"],
    ["help", "помогу с React и Telegram bot"],
    ["buy", "куплю консультацию по TON"],
    ["ask", "как вырастить газон после зимы?"],
    ["want", "ищу идею для маленького бизнеса"],
    ["talk", "кто сейчас в Берлине?"],
    ["help", "помогу настроить Vercel"],
    ["sell", "продам домен для проекта"],
    ["ask", "кто такой Эрик Вейнштейн?"],
    ["want", "хочу найти людей в AI"],
    ["ask", "как хранить USDT безопасно?"],
    ["talk", "обсужу стартап без инвесторов"],
    ["help", "помогу проверить лендинг"],
    ["want", "хочу научиться монтировать видео"],
  ] as Array<[SpaceSignalKind, string]>;

  return items.map(([kind, text], index) => ({
    id: `demo-${index}`,
    kind,
    text,
    x: 8 + ((index * 27) % 86),
    y: 14 + ((index * 41) % 72),
    createdAt: now - index * 1000 * 60 * 7,
    authorName: ["Elisey", "Mira", "Arseniy", "Pasha", "Nika", "Alex"][index % 6],
    authorAvatar: null,
    replies: [],
  }));
}

export function SpaceOverlay({
  locale: _locale,
  posts: _posts,
  onClose,
}: {
  locale: Locale;
  posts: IngestedPost[];
  onClose: () => void;
}) {
  const [theme, setTheme] = useState<SpaceTheme>(() => readTheme());
  const [telegramUser, setTelegramUser] = useState<SpaceTelegramUser | null>(() => readTelegramUser());
  const [signals, setSignals] = useState<SpaceSignal[]>(() => readSignals());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [magnetId, setMagnetId] = useState<string | null>(null);
  const [planetMode, setPlanetMode] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [kind, setKind] = useState<SpaceSignalKind>("ask");
  const [text, setText] = useState("");
  const [replyText, setReplyText] = useState("");

  const isLight = theme === "light";
  const demoSignals = useMemo(() => pickDemoSignals(), []);
  const visibleSignals = useMemo(() => [...demoSignals, ...signals], [demoSignals, signals]);
  const selected = visibleSignals.find((item) => item.id === selectedId) || null;
  const magnet = visibleSignals.find((item) => item.id === magnetId) || null;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const sync = () => {
      setTheme(readTheme());
      setTelegramUser(readTelegramUser());
    };

    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    writeSignals(signals);
  }, [signals]);

  const closeCard = () => {
    setSelectedId(null);
    setMagnetId(null);
    setPlanetMode(false);
  };

  const toggleTheme = () => {
    const next = isLight ? "dark" : "light";
    applyTheme(next);
    setTheme(next);
  };

  const createSignal = () => {
    const clean = text.trim().slice(0, 140);
    if (!clean || !telegramUser) return;

    const next: SpaceSignal = {
      id: makeId("signal"),
      kind,
      text: clean,
      x: 20 + Math.random() * 60,
      y: 22 + Math.random() * 56,
      createdAt: Date.now(),
      authorName: getUserName(telegramUser),
      authorAvatar: getUserAvatar(telegramUser),
      replies: [],
    };

    setSignals((prev) => [next, ...prev]);
    setText("");
    setComposerOpen(false);
    setSelectedId(next.id);
    setMagnetId(next.id);
  };

  const replyToSignal = () => {
    const clean = replyText.trim().slice(0, 160);
    if (!clean || !selected || !telegramUser || selected.id.startsWith("demo-")) return;

    setSignals((prev) =>
      prev.map((signal) =>
        signal.id === selected.id
          ? {
              ...signal,
              replies: [
                {
                  id: makeId("reply"),
                  text: clean,
                  createdAt: Date.now(),
                  authorName: getUserName(telegramUser),
                  authorAvatar: getUserAvatar(telegramUser),
                },
                ...signal.replies,
              ].slice(0, 12),
            }
          : signal
      )
    );

    setReplyText("");
  };

  const removeSignal = (id: string) => {
    setSignals((prev) => prev.filter((signal) => signal.id !== id));
    closeCard();
  };

  const getMagnetPosition = (signal: SpaceSignal, index: number) => {
    if (!magnet || signal.id === magnet.id) return { x: signal.x, y: signal.y, related: false };

    const score = signal.kind === magnet.kind ? 2 + similarity(signal.text, magnet.text) : similarity(signal.text, magnet.text);
    if (score <= 0) return { x: signal.x, y: signal.y, related: false };

    const ring = 14 + Math.min(score, 4) * 4;
    const angle = index * 1.95;
    const x = magnet.x + Math.cos(angle) * ring;
    const y = magnet.y + Math.sin(angle) * ring * 0.72;

    return {
      x: Math.max(7, Math.min(91, x)),
      y: Math.max(14, Math.min(84, y)),
      related: true,
    };
  };

  return createPortal(
    <div className={`fixed inset-0 z-[1000] overflow-hidden ${isLight ? "bg-[#edf3fa] text-[#08111d]" : "bg-[#02060d] text-white"}`}>
      <style>{`
        @keyframes spaceFloat { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(0,-10px,0) scale(1.035)} }
        @keyframes spacePulse { 0%,100%{opacity:.18;transform:scale(.88)} 50%{opacity:.48;transform:scale(1.18)} }
        @keyframes spaceDrift { 0%{transform:translate3d(-1.2%,-.8%,0) scale(1.03)} 50%{transform:translate3d(1.2%,.8%,0) scale(1.06)} 100%{transform:translate3d(-.8%,1.2%,0) scale(1.04)} }
        @keyframes spaceWave { 0%{opacity:.42;transform:translate(-50%,-50%) scale(.2)} 100%{opacity:0;transform:translate(-50%,-50%) scale(3.15)} }
        @keyframes spaceComet { 0%{transform:translate3d(-20vw,18vh,0) rotate(-12deg);opacity:0} 12%{opacity:.75} 70%{opacity:.75} 100%{transform:translate3d(120vw,-22vh,0) rotate(-12deg);opacity:0} }
        @keyframes spaceWhisper { 0%,75%,100%{opacity:0;transform:translateY(8px)} 82%,94%{opacity:1;transform:translateY(0)} }
        @keyframes planetZoom { from{transform:translate(-50%,-50%) scale(.35);opacity:0} to{transform:translate(-50%,-50%) scale(1);opacity:1} }
      `}</style>

      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? `radial-gradient(circle at 50% 0%, rgba(108,170,255,.34), transparent 42%),radial-gradient(circle at 26% 32%, rgba(161,211,255,.28), transparent 36%),linear-gradient(180deg,#f6f9fd 0%,#edf3fa 60%,#e7eef6 100%)`
            : `radial-gradient(circle at 50% 0%, rgba(40,120,220,.24), transparent 42%),radial-gradient(circle at 70% 75%, rgba(5,125,170,.14), transparent 38%),linear-gradient(180deg,#07111d 0%,#020711 60%,#01050c 100%)`,
        }}
      />

      <div className={`absolute inset-0 transition duration-700 ${planetMode ? "scale-[1.18] opacity-95" : "opacity-80"}`} style={{ animation: "spaceDrift 38s ease-in-out infinite" }}>
        <button type="button" onClick={() => setPlanetMode(true)} className={`absolute left-[8%] top-[18%] h-24 w-24 rounded-full ${isLight ? "bg-[#ffe5a8]/45" : "bg-[#17314d]/60"} blur-[.5px] transition hover:scale-110`} />
        <button type="button" onClick={() => setPlanetMode(true)} className={`absolute left-[78%] top-[22%] h-16 w-16 rounded-full ${isLight ? "bg-[#b9e7ff]/70" : "bg-[#14425f]/70"} transition hover:scale-110`} />
        <button type="button" onClick={() => setPlanetMode(true)} className={`absolute left-[68%] top-[72%] h-32 w-32 rounded-full ${isLight ? "bg-[#d7c8ff]/45" : "bg-[#211a4a]/80"} transition hover:scale-110`} />
        <div className={`absolute left-[22%] top-[76%] h-10 w-28 rotate-[-18deg] rounded-full ${isLight ? "bg-white/55" : "bg-white/8"}`} />
        <div className={`absolute left-[86%] top-[30%] h-36 w-36 rounded-full border ${isLight ? "border-sky-200/50 bg-sky-300/25" : "border-sky-300/10 bg-sky-400/10"}`} />
        <div className={`absolute left-[46%] top-[28%] h-2 w-2 rounded-full ${isLight ? "bg-sky-500" : "bg-sky-300"}`} />
        <div className={`absolute left-[58%] top-[61%] h-1.5 w-1.5 rounded-full ${isLight ? "bg-violet-500" : "bg-white"}`} />
      </div>

      {planetMode ? (
        <button
          type="button"
          onClick={() => setPlanetMode(false)}
          className="absolute left-1/2 top-1/2 z-[8] grid h-[320px] w-[320px] place-items-center rounded-full border border-sky-200/20 bg-[radial-gradient(circle_at_35%_30%,#74d2ff,#2477b9_45%,#0a3158_72%,#05101f)] text-center shadow-[0_0_90px_rgba(51,171,255,.34)]"
          style={{ animation: "planetZoom .55s ease-out both" }}
        >
          <span className="rounded-full bg-black/20 px-5 py-3 text-sm font-black text-white backdrop-blur-md">планета намерений</span>
        </button>
      ) : null}

      <div className="absolute left-0 top-[34%] z-10 flex items-center gap-2 rounded-r-full bg-white/12 px-4 py-2 text-xs font-black backdrop-blur-md" style={{ animation: "spaceComet 30s linear infinite" }}>
        ☄️ горячее намерение
      </div>

      <header className={`absolute left-0 right-0 top-0 z-30 h-16 border-b ${isLight ? "border-[#d8e3ef] bg-[#f6f9fd]/88" : "border-white/10 bg-[#132233]/72"}`}>
        <div className="mx-auto flex h-full max-w-[980px] items-center justify-between px-4">
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full"><ArrowLeft className="h-5 w-5" /></button>
          <div className="text-lg font-semibold">Space</div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-full">{isLight ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}</button>
            {telegramUser?.photo_url ? <img src={telegramUser.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" referrerPolicy="no-referrer" /> : <div className="grid h-10 w-10 place-items-center rounded-full"><User className="h-5 w-5" /></div>}
          </div>
        </div>
      </header>

      <div className="absolute inset-0 z-10 overflow-hidden pt-16">
        <div className={`absolute inset-0 transition duration-500 ${magnet || selected ? "bg-black/32" : "bg-transparent"}`} />

        {magnet ? (
          <>
            <span className="pointer-events-none absolute z-[6] rounded-full border border-white/28" style={{ left: `${magnet.x}%`, top: `${magnet.y}%`, width: 180, height: 180, transform: "translate(-50%, -50%)", animation: "spaceWave 2.5s ease-out infinite" }} />
            <span className="pointer-events-none absolute z-[6] rounded-full border border-white/16" style={{ left: `${magnet.x}%`, top: `${magnet.y}%`, width: 260, height: 260, transform: "translate(-50%, -50%)", animation: "spaceWave 2.5s ease-out infinite .65s" }} />
          </>
        ) : null}

        <div className="absolute inset-[-10%] cursor-grab overflow-hidden" style={{ animation: "spaceDrift 48s ease-in-out infinite" }}>
          {visibleSignals.map((signal, index) => {
            const pos = getMagnetPosition(signal, index);
            const active = selectedId === signal.id || magnetId === signal.id;
            const dimmed = Boolean(magnetId) && !pos.related && magnetId !== signal.id;
            const size = active ? 72 : signal.id.startsWith("demo-") ? 42 : 56;

            return (
              <button
                key={signal.id}
                type="button"
                onClick={() => setSelectedId(signal.id)}
                className={["group absolute rounded-full text-left transition-[left,top,transform,opacity,filter] duration-1000 ease-out hover:z-30 hover:scale-110", dimmed ? "opacity-25 grayscale" : "opacity-100", active ? "z-30" : pos.related ? "z-20" : "z-10"].join(" ")}
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: size, height: size, animation: `spaceFloat ${5 + (index % 5)}s ease-in-out infinite`, animationDelay: `${(index % 8) * 0.35}s` }}
              >
                <span className={`absolute inset-[-12px] rounded-full bg-gradient-to-br ${KIND_COLOR[signal.kind]} blur-md`} style={{ animation: "spacePulse 2.8s ease-in-out infinite" }} />
                <span className={`relative grid h-full w-full place-items-center overflow-hidden rounded-full border shadow-xl bg-gradient-to-br ${KIND_COLOR[signal.kind]} ${isLight ? "border-white/80" : "border-white/20"}`}>
                  {signal.authorAvatar ? <img src={signal.authorAvatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <span className="text-xl">{KIND_EMOJI[signal.kind]}</span>}
                </span>
                <span className={`pointer-events-none absolute left-1/2 top-[calc(100%+8px)] hidden w-[230px] -translate-x-1/2 rounded-2xl px-3 py-2 text-xs font-bold shadow-2xl group-hover:block ${isLight ? "bg-white text-[#152235]" : "bg-[#101d2c] text-white"}`}>
                  <span className="block text-[11px] opacity-55">{KIND_LABEL[signal.kind]} · {signal.authorName}</span>
                  <span className="mt-1 line-clamp-2 block">{signal.text}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3">
          <button type="button" onClick={() => setComposerOpen(true)} disabled={!telegramUser} className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black shadow-2xl transition active:scale-95 disabled:opacity-45 ${isLight ? "bg-[#111827] text-white" : "bg-white text-[#07111d]"}`}>
            <Plus className="h-4 w-4" /> выпустить мысль
          </button>
        </div>

        {!telegramUser ? <div className={`absolute bottom-24 left-1/2 z-30 w-[320px] -translate-x-1/2 rounded-[26px] px-4 py-3 text-center text-sm font-bold shadow-2xl ${isLight ? "bg-white/86 text-[#40566e]" : "bg-[#101d2c]/90 text-white/72"}`}>Авторизуйся через Telegram, чтобы увидеть себя и создать свой сигнал.</div> : null}
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/12 px-4 py-2 text-xs font-black backdrop-blur-md" style={{ animation: "spaceWhisper 18s ease-in-out infinite" }}>🌌 пространство заметило вас</div>
      </div>

      {selected ? (
        <div className="absolute inset-0 z-40 flex items-end justify-center p-3 sm:items-center">
          <div className={`w-full max-w-[430px] rounded-[32px] border p-4 shadow-2xl ${isLight ? "border-[#d8e3ef] bg-white text-[#07111d]" : "border-white/10 bg-[#101d2c] text-white"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-[.18em] opacity-50">{KIND_EMOJI[selected.kind]} {KIND_LABEL[selected.kind]}</div>
                <div className="mt-2 text-xl font-black leading-tight">{selected.text}</div>
                <div className="mt-2 text-sm opacity-60">{selected.authorName}</div>
              </div>
              <button type="button" onClick={closeCard} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/5"><X className="h-5 w-5" /></button>
            </div>

            <button type="button" onClick={() => setMagnetId(selected.id)} className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-black ${isLight ? "bg-[#111827] text-white" : "bg-white text-[#07111d]"}`}>
              <Magnet className="h-4 w-4" /> притянуть похожее
            </button>

            {selected.id.startsWith("demo-") ? (
              <div className={`mt-4 rounded-2xl px-3 py-3 text-sm font-bold ${isLight ? "bg-[#eef4fb] text-[#40566e]" : "bg-white/8 text-white/68"}`}>Это демо-магнит. Свои мысли и ответы хранятся только на этом устройстве.</div>
            ) : (
              <>
                <div className="mt-4 flex gap-2">
                  <input value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="локальный ответ..." className={`min-w-0 flex-1 rounded-full px-4 py-3 text-sm font-bold outline-none ${isLight ? "bg-[#eef4fb]" : "bg-white/8"}`} />
                  <button type="button" onClick={replyToSignal} className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${isLight ? "bg-[#111827] text-white" : "bg-white text-[#07111d]"}`}><Send className="h-4 w-4" /></button>
                </div>
                {telegramUser && selected.authorName === getUserName(telegramUser) ? <button type="button" onClick={() => removeSignal(selected.id)} className="mt-4 w-full rounded-full bg-rose-500 px-4 py-3 text-sm font-black text-white">удалить мой сигнал</button> : null}
              </>
            )}
          </div>
        </div>
      ) : null}

      {composerOpen ? (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/25 p-3 sm:items-center">
          <div className={`w-full max-w-[430px] rounded-[32px] border p-4 shadow-2xl ${isLight ? "border-[#d8e3ef] bg-white text-[#07111d]" : "border-white/10 bg-[#101d2c] text-white"}`}>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-lg font-black"><Sparkles className="h-5 w-5" /> Новая мысль</div>
              <button type="button" onClick={() => setComposerOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-black/5"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {(Object.keys(KIND_LABEL) as SpaceSignalKind[]).map((item) => <button key={item} type="button" onClick={() => setKind(item)} className={`rounded-2xl px-3 py-2 text-xs font-black transition ${kind === item ? isLight ? "bg-[#111827] text-white" : "bg-white text-[#07111d]" : isLight ? "bg-[#eef4fb] text-[#40566e]" : "bg-white/8 text-white/70"}`}>{KIND_EMOJI[item]} {KIND_LABEL[item]}</button>)}
            </div>
            <textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={140} placeholder="например: кто знает как купить bitcoin без паники?" className={`mt-4 min-h-[120px] w-full resize-none rounded-[24px] px-4 py-4 text-base font-bold outline-none ${isLight ? "bg-[#eef4fb]" : "bg-white/8"}`} />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-xs font-bold opacity-50">{text.length}/140 · локально</div>
              <button type="button" onClick={createSignal} disabled={!text.trim()} className={`rounded-full px-5 py-3 text-sm font-black transition disabled:opacity-40 ${isLight ? "bg-[#111827] text-white" : "bg-white text-[#07111d]"}`}>выпустить</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body
  );
}
