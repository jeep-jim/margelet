import {
  ArrowLeft,
  Magnet,
  Moon,
  Plus,
  Search,
  Send,
  Sparkles,
  Sun,
  User,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";

import type { IngestedPost, Locale } from "../../types/app";
import type { SpaceSignal, SpaceSignalKind, SpaceTelegramUser, SpaceTheme } from "./types";

const TG_USER_KEY = "margelet_tg_user";
const SPACE_SIGNALS_KEY = "margelet_space_local_signals_v1";

type ViewportState = { x: number; y: number; scale: number };

const KIND_LABEL: Record<SpaceSignalKind, string> = {
  want: "хочу",
  ask: "спросить",
  buy: "куплю",
  talk: "обсудить",
  help: "помогу",
  sell: "продам",
};

const KIND_EMOJI: Record<SpaceSignalKind, string> = {
  want: "✨",
  ask: "?",
  buy: "🛒",
  talk: "💬",
  help: "🛠️",
  sell: "🏷️",
};

const KIND_COLOR: Record<SpaceSignalKind, string> = {
  want: "from-violet-400 to-fuchsia-500",
  ask: "from-sky-300 to-blue-500",
  buy: "from-amber-300 to-orange-500",
  talk: "from-fuchsia-300 to-violet-500",
  help: "from-emerald-300 to-green-500",
  sell: "from-rose-300 to-pink-500",
};

const WORLD_W = 2600;
const WORLD_H = 1600;

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
  localStorage.setItem(SPACE_SIGNALS_KEY, JSON.stringify(signals.slice(0, 120)));
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

function toWorldPercent(value: number, max: number) {
  return Math.max(5, Math.min(95, (value / max) * 100));
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
    ["buy", "куплю совет по запуску проекта"],
    ["ask", "как не выгореть за неделю?"],
    ["talk", "поговорю про жизнь в Германии"],
  ] as Array<[SpaceSignalKind, string]>;

  return items.map(([kind, text], index) => ({
    id: `demo-${index}`,
    kind,
    text,
    x: toWorldPercent(220 + ((index * 337) % (WORLD_W - 440)), WORLD_W),
    y: toWorldPercent(180 + ((index * 271) % (WORLD_H - 360)), WORLD_H),
    createdAt: now - index * 1000 * 60 * 7,
    authorName: ["Elisey", "Mira", "Arseniy", "Pasha", "Nika", "Alex"][index % 6],
    authorAvatar: null,
    replies: [],
  }));
}

function depthForIndex(index: number) {
  return [0.72, 0.86, 1, 1.16, 1.32][index % 5];
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
  const [composerOpen, setComposerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [kind, setKind] = useState<SpaceSignalKind>("ask");
  const [text, setText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [viewport, setViewport] = useState<ViewportState>({ x: -760, y: -470, scale: 1 });
  const [dragging, setDragging] = useState(false);

  const dragStart = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

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

  const toggleTheme = () => {
    const next = isLight ? "dark" : "light";
    applyTheme(next);
    setTheme(next);
  };

  const focusTo = (signal: SpaceSignal, scale = 1.22) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const wx = (signal.x / 100) * WORLD_W;
    const wy = (signal.y / 100) * WORLD_H;

    setViewport({
      scale,
      x: rect.width / 2 - wx * scale,
      y: rect.height / 2 - wy * scale,
    });
  };

  const createSignal = () => {
    const clean = text.trim().slice(0, 140);
    if (!clean || !telegramUser) return;

    const next: SpaceSignal = {
      id: makeId("signal"),
      kind,
      text: clean,
      x: toWorldPercent(WORLD_W / 2 + Math.random() * 240 - 120, WORLD_W),
      y: toWorldPercent(WORLD_H / 2 + Math.random() * 180 - 90, WORLD_H),
      createdAt: Date.now(),
      authorName: getUserName(telegramUser),
      authorAvatar: getUserAvatar(telegramUser),
      replies: [],
    };

    setSignals((prev) => [next, ...prev]);
    setText("");
    setComposerOpen(false);
    setSelectedId(null);
    setMagnetId(next.id);
    setTimeout(() => focusTo(next, 1.35), 80);
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
    setSelectedId(null);
    if (magnetId === id) setMagnetId(null);
  };

  const getMagnetPosition = (signal: SpaceSignal, index: number) => {
    if (!magnet || signal.id === magnet.id) return { x: signal.x, y: signal.y, related: false };

    const score = signal.kind === magnet.kind ? 2 + similarity(signal.text, magnet.text) : similarity(signal.text, magnet.text);
    if (score <= 0) return { x: signal.x, y: signal.y, related: false };

    const ring = 9 + Math.min(score, 4) * 4;
    const angle = index * 1.95;

    return {
      x: Math.max(7, Math.min(93, magnet.x + Math.cos(angle) * ring)),
      y: Math.max(12, Math.min(88, magnet.y + Math.sin(angle) * ring * 0.72)),
      related: true,
    };
  };

  const searchMatchedIds = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return new Set<string>();
    return new Set(
      visibleSignals
        .filter((signal) => similarity(q, signal.text) > 0 || signal.text.toLowerCase().includes(q.toLowerCase()))
        .map((signal) => signal.id)
    );
  }, [searchQuery, visibleSignals]);

  const zoomTo = (nextScaleRaw: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;

    const nextScale = Math.max(0.55, Math.min(2.4, nextScaleRaw));
    const mx = rect.width / 2;
    const my = rect.height / 2;
    const worldX = (mx - viewport.x) / viewport.scale;
    const worldY = (my - viewport.y) / viewport.scale;

    setViewport({
      scale: nextScale,
      x: mx - worldX * nextScale,
      y: my - worldY * nextScale,
    });
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const nextScale = Math.max(0.55, Math.min(2.4, viewport.scale - event.deltaY * 0.0012));
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const worldX = (mx - viewport.x) / viewport.scale;
    const worldY = (my - viewport.y) / viewport.scale;

    setViewport({
      scale: nextScale,
      x: mx - worldX * nextScale,
      y: my - worldY * nextScale,
    });
  };

  const applySearch = () => {
    const firstMatch = visibleSignals.find((signal) => searchMatchedIds.has(signal.id));
    setSearchOpen(false);

    if (firstMatch) {
      setSelectedId(null);
      setMagnetId(null);
      setTimeout(() => focusTo(firstMatch, 1.25), 40);
    }
  };

  const resetSpace = () => {
    setSelectedId(null);
    setMagnetId(null);
    setViewport({ x: -760, y: -470, scale: 1 });
  };

  return createPortal(
    <div className={`fixed inset-0 z-[1000] overflow-hidden ${isLight ? "bg-[#edf3fa] text-[#08111d]" : "bg-[#02060d] text-white"}`}>
      <style>{`
        @keyframes spaceFloat { 0%,100%{transform:translate3d(0,0,0) scale(1)} 50%{transform:translate3d(0,-10px,0) scale(1.035)} }
        @keyframes spacePulse { 0%,100%{opacity:.06; transform:scale(.90)} 50%{opacity:.16; transform:scale(1.05)} }
        @keyframes spaceDrift { 0%{transform:translate3d(-1%,-.7%,0) scale(1.02)} 50%{transform:translate3d(1%,.7%,0) scale(1.045)} 100%{transform:translate3d(-.7%,1%,0) scale(1.035)} }
        @keyframes spaceWave { 0%{opacity:.34; transform:translate(-50%,-50%) scale(.25)} 100%{opacity:0; transform:translate(-50%,-50%) scale(3.1)} }
        @keyframes spaceComet { 0%{transform:translate3d(-20vw,18vh,0) rotate(-12deg); opacity:0} 12%,70%{opacity:.38} 100%{transform:translate3d(120vw,-22vh,0) rotate(-12deg); opacity:0} }
        @keyframes spaceWhisper { 0%,75%,100%{opacity:0; transform:translateY(8px)} 82%,94%{opacity:1; transform:translateY(0)} }
        .space-stage { touch-action: none; overscroll-behavior: none; }
        .space-stage:active { cursor: grabbing; }
      `}</style>

      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? `radial-gradient(circle at 50% 0%, rgba(108,170,255,.34), transparent 42%), radial-gradient(circle at 26% 32%, rgba(161,211,255,.28), transparent 36%), linear-gradient(180deg,#f6f9fd 0%,#edf3fa 60%,#e7eef6 100%)`
            : `radial-gradient(circle at 50% 0%, rgba(40,120,220,.24), transparent 42%), radial-gradient(circle at 70% 75%, rgba(5,125,170,.14), transparent 38%), linear-gradient(180deg,#07111d 0%,#020711 60%,#01050c 100%)`,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage: isLight
            ? `
              radial-gradient(circle at 12% 18%, rgba(68,138,255,.34) 0 2px, transparent 3px),
              radial-gradient(circle at 28% 72%, rgba(139,92,246,.22) 0 1px, transparent 2px),
              radial-gradient(circle at 52% 28%, rgba(14,165,233,.30) 0 1.5px, transparent 2.5px),
              radial-gradient(circle at 78% 62%, rgba(34,197,94,.20) 0 1px, transparent 2px),
              radial-gradient(circle at 92% 20%, rgba(244,114,182,.24) 0 1.5px, transparent 2.5px)
            `
            : `
              radial-gradient(circle at 4% 82%, rgba(255,255,255,.65) 0 1px, transparent 2px),
              radial-gradient(circle at 13% 23%, rgba(255,255,255,.50) 0 1px, transparent 2px),
              radial-gradient(circle at 27% 16%, rgba(125,211,252,.70) 0 1px, transparent 2px),
              radial-gradient(circle at 41% 74%, rgba(255,255,255,.58) 0 1px, transparent 2px),
              radial-gradient(circle at 57% 30%, rgba(255,255,255,.68) 0 1px, transparent 2px),
              radial-gradient(circle at 69% 66%, rgba(147,197,253,.65) 0 1px, transparent 2px),
              radial-gradient(circle at 83% 17%, rgba(255,255,255,.56) 0 1px, transparent 2px),
              radial-gradient(circle at 95% 76%, rgba(125,211,252,.50) 0 1px, transparent 2px)
            `,
        }}
      />

      <header className={`absolute left-0 right-0 top-0 z-40 h-16 border-b ${isLight ? "border-[#d8e3ef] bg-[#f6f9fd]/88" : "border-white/10 bg-[#132233]/72"}`}>
        <div className="mx-auto flex h-full max-w-[980px] items-center justify-between px-4">
          <button
            type="button"
            onClick={() => {
              if (composerOpen) {
                setComposerOpen(false);
                return;
              }

              if (searchOpen) {
                setSearchOpen(false);
                return;
              }

              if (selectedId || magnetId || searchQuery.trim()) {
                resetSpace();
                setSearchQuery("");
                return;
              }

              onClose();
            }}
            className="grid h-11 w-11 place-items-center rounded-full"
          >
            {selectedId || magnetId || composerOpen || searchOpen || searchQuery.trim() ? (
              <X className="h-5 w-5" />
            ) : (
              <ArrowLeft className="h-5 w-5" />
            )}
          </button>

          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setSearchOpen(true)} className="grid h-11 w-11 place-items-center rounded-full">
              <Search className="h-5 w-5" />
            </button>
            <div className="select-none text-lg font-black tracking-[-0.055em]">
              <span className={`${isLight ? "bg-[linear-gradient(90deg,#d48cff,#6487ff,#2e8ddf,#6adb5d,#f4e83f)]" : "bg-[linear-gradient(90deg,#2ec3ff,#57a6ff,#ffffff)]"} bg-clip-text text-transparent`}>
                Space
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={toggleTheme} className="grid h-10 w-10 place-items-center rounded-full">
              {isLight ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            {telegramUser?.photo_url ? (
              <img src={telegramUser.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full"><User className="h-5 w-5" /></div>
            )}
          </div>
        </div>
      </header>

      <div
        ref={stageRef}
        className="space-stage absolute inset-0 z-10 overflow-hidden pt-16"
        onWheel={onWheel}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("button,input,textarea")) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture?.(event.pointerId);
          setDragging(true);
          dragStart.current = { x: event.clientX, y: event.clientY, vx: viewport.x, vy: viewport.y };
        }}
        onPointerMove={(event) => {
          if (!dragging || !dragStart.current) return;
          event.preventDefault();
          const dx = event.clientX - dragStart.current.x;
          const dy = event.clientY - dragStart.current.y;
          setViewport((prev) => ({ ...prev, x: dragStart.current!.vx + dx, y: dragStart.current!.vy + dy }));
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
      >
        <div
          className={`pointer-events-none absolute left-1/2 top-[48%] z-[9] -translate-x-1/2 -translate-y-1/2 select-none text-[82px] font-black tracking-[-0.06em] transition-all duration-700 sm:text-[104px] ${selectedId || magnetId || composerOpen || searchOpen || searchQuery.trim() ? "scale-75 opacity-0" : "scale-100 opacity-95"}`}
        >
          <span className={`${isLight ? "bg-[linear-gradient(90deg,#d48cff,#6487ff,#2e8ddf,#6adb5d,#f4e83f)]" : "bg-[linear-gradient(90deg,#2ec3ff,#57a6ff,#ffffff)]"} bg-clip-text text-transparent`}>
            Space
          </span>
        </div>

        <div
          className="absolute left-0 top-16 origin-top-left transition-transform duration-700 ease-out"
          style={{ width: WORLD_W, height: WORLD_H, transform: `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.scale})` }}
        >
          <div className="absolute inset-0 opacity-80" style={{ animation: "spaceDrift 44s ease-in-out infinite" }}>
            <div className={`absolute left-[7%] top-[17%] h-28 w-28 rounded-full ${isLight ? "bg-[radial-gradient(circle_at_35%_30%,#ffffff99,#8ecbff88_42%,#4388ff44_70%,transparent_72%)]" : "bg-[radial-gradient(circle_at_35%_30%,#8ad9ff66,#173c5f88_48%,#07142100_72%)]"}`} />
            <div className={`absolute left-[80%] top-[19%] h-20 w-20 rounded-full ${isLight ? "bg-[radial-gradient(circle_at_35%_30%,#fff7cc,#d9a84f99_48%,#8a5f2244_70%,transparent_72%)]" : "bg-[radial-gradient(circle_at_35%_30%,#ffe7a877,#9b7b3c77_48%,#33241000_72%)]"}`} />
            <div className={`absolute left-[78%] top-[20.5%] h-2 w-32 -rotate-[18deg] rounded-full ${isLight ? "bg-[#8aa2bd]/45" : "bg-white/18"}`} />
            <div className={`absolute left-[88%] top-[29%] h-32 w-32 rounded-full ${isLight ? "bg-[radial-gradient(circle_at_35%_30%,#d6fff7,#2dd4bf88_48%,#166b7a44_72%,transparent_74%)]" : "bg-[radial-gradient(circle_at_35%_30%,#62e6ff77,#145d7599_46%,#06172300_72%)]"}`} />
            <div className={`absolute left-[69%] top-[72%] h-36 w-36 rounded-full ${isLight ? "bg-[radial-gradient(circle_at_35%_28%,#f4d7ff,#a78bfa77_48%,#39236e33_72%,transparent_74%)]" : "bg-[radial-gradient(circle_at_35%_28%,#e9b8ff55,#542d7e99_48%,#140b2e00_72%)]"}`} />
            <div className={`absolute left-[17%] top-[76%] h-10 w-32 rotate-[-18deg] rounded-full ${isLight ? "bg-white/48" : "bg-white/7"}`} />
            <div className={`absolute left-[44%] top-[27%] h-2.5 w-2.5 rounded-full shadow-[0_0_18px_currentColor] ${isLight ? "bg-sky-500 text-sky-400" : "bg-sky-300 text-sky-300"}`} />
            <div className={`absolute left-[58%] top-[61%] h-1.5 w-1.5 rounded-full shadow-[0_0_14px_currentColor] ${isLight ? "bg-violet-500 text-violet-400" : "bg-white text-white"}`} />
            <div className={`absolute left-[63%] top-[38%] h-[120px] w-[240px] rotate-[-18deg] rounded-[50%] blur-sm ${isLight ? "bg-sky-200/24" : "bg-sky-400/8"}`} />
            <div className={`absolute left-[73%] top-[50%] h-[180px] w-[220px] rotate-[24deg] rounded-[50%] blur-md ${isLight ? "bg-violet-200/24" : "bg-violet-500/10"}`} />
          </div>

          <div className="absolute left-0 top-[34%] z-10 flex items-center gap-2 rounded-r-full bg-white/12 px-4 py-2 text-xs font-black backdrop-blur-md" style={{ animation: "spaceComet 30s linear infinite" }}>
            ☄️ ardent intention
          </div>

          {magnet ? <div className="pointer-events-none absolute inset-0 z-[4] bg-black/32 transition" /> : null}

          {magnet ? (
            <>
              <span className="pointer-events-none absolute z-[6] rounded-full border border-white/20" style={{ left: `${magnet.x}%`, top: `${magnet.y}%`, width: 180, height: 180, transform: "translate(-50%, -50%)", animation: "spaceWave 2.6s ease-out infinite" }} />
              <span className="pointer-events-none absolute z-[6] rounded-full border border-white/12" style={{ left: `${magnet.x}%`, top: `${magnet.y}%`, width: 260, height: 260, transform: "translate(-50%, -50%)", animation: "spaceWave 2.6s ease-out infinite .65s" }} />
            </>
          ) : null}

          {visibleSignals.map((signal, index) => {
            const pos = getMagnetPosition(signal, index);
            const active = selectedId === signal.id || magnetId === signal.id;
            const matched = searchMatchedIds.has(signal.id);
            const dimmed = (Boolean(magnetId) && !pos.related && magnetId !== signal.id) || (searchQuery.trim() && !matched);
            const depth = depthForIndex(index);
            const baseSize = signal.id.startsWith("demo-") ? 42 : 58;
            const size = (active ? 70 : baseSize) * depth;

            return (
              <button
                key={signal.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedId(signal.id);
                  focusTo(signal, Math.max(1.05, 1.42 / depth));
                }}
                className={["group absolute rounded-full text-left transition-[left,top,transform,opacity,filter] duration-1000 ease-out hover:z-30 hover:scale-110", dimmed ? "opacity-20 grayscale" : "opacity-100", active ? "z-30" : pos.related || matched ? "z-20" : "z-10"].join(" ")}
                style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: size, height: size, animation: `spaceFloat ${6 + (index % 6)}s ease-in-out infinite`, animationDelay: `${(index % 8) * 0.35}s` }}
              >
                <span className={`absolute inset-[-8px] rounded-full bg-gradient-to-br ${KIND_COLOR[signal.kind]} blur-md opacity-50`} style={{ animation: "spacePulse 4.2s ease-in-out infinite" }} />
                <span className={`relative grid h-full w-full place-items-center overflow-hidden rounded-full border shadow-xl bg-gradient-to-br ${KIND_COLOR[signal.kind]} ${isLight ? "border-white/80" : "border-white/18"}`}>
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

        <div className="absolute left-4 top-24 z-30 flex flex-col gap-2 sm:left-6 sm:top-28">
          <button
            type="button"
            onClick={() => zoomTo(viewport.scale + 0.18)}
            className={`grid h-12 w-12 place-items-center rounded-full text-2xl font-black shadow-2xl backdrop-blur-xl active:scale-95 ${isLight ? "bg-white/82 text-[#07111d]" : "bg-white/12 text-white"}`}
            aria-label="Приблизить карту"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => zoomTo(viewport.scale - 0.18)}
            className={`grid h-12 w-12 place-items-center rounded-full text-2xl font-black shadow-2xl backdrop-blur-xl active:scale-95 ${isLight ? "bg-white/82 text-[#07111d]" : "bg-white/12 text-white"}`}
            aria-label="Отдалить карту"
          >
            −
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/12 px-4 py-2 text-xs font-black backdrop-blur-md" style={{ animation: "spaceWhisper 18s ease-in-out infinite" }}>
          🌌 space has noticed you
        </div>

        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          disabled={!telegramUser}
          className={`absolute bottom-5 left-1/2 z-30 flex h-14 -translate-x-1/2 items-center justify-center gap-2 rounded-full px-5 text-sm font-black shadow-2xl transition active:scale-95 disabled:opacity-45 sm:px-6 ${isLight ? "bg-[#111827] text-white" : "bg-white text-[#07111d]"}`}
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">выпустить мысль</span>
        </button>

        {!telegramUser ? (
          <div className={`absolute bottom-24 left-1/2 z-30 w-[320px] -translate-x-1/2 rounded-[26px] px-4 py-3 text-center text-sm font-bold shadow-2xl ${isLight ? "bg-white/86 text-[#40566e]" : "bg-[#101d2c]/90 text-white/72"}`}>
            Авторизуйся через Telegram, чтобы увидеть себя и создать свой сигнал.
          </div>
        ) : null}
      </div>

      {selected ? (
        <div className="absolute inset-0 z-30 flex items-end justify-center p-3 sm:items-center pointer-events-none">
          <div className={`pointer-events-auto w-full max-w-[430px] rounded-[32px] border p-4 shadow-2xl ${isLight ? "border-[#d8e3ef] bg-white text-[#07111d]" : "border-white/10 bg-[#101d2c] text-white"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-[.18em] opacity-50">{KIND_EMOJI[selected.kind]} {KIND_LABEL[selected.kind]}</div>
                <div className="mt-2 text-xl font-black leading-tight">{selected.text}</div>
                <div className="mt-2 text-sm opacity-60">{selected.authorName}</div>
              </div>
              <button type="button" onClick={resetSpace} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/5"><X className="h-5 w-5" /></button>
            </div>

            <button
              type="button"
              onClick={() => {
                setMagnetId(selected.id);
                setSelectedId(null);
              }}
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-black ${isLight ? "bg-[#111827] text-white" : "bg-white text-[#07111d]"}`}
            >
              <Magnet className="h-4 w-4" />
              притянуть похожее
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

      {searchOpen ? (
        <div className="absolute inset-0 z-50 flex items-start justify-center bg-black/30 p-3 pt-20">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              applySearch();
            }}
            className={`w-full max-w-[520px] rounded-[28px] border p-3 shadow-2xl ${isLight ? "border-[#d8e3ef] bg-white text-[#07111d]" : "border-white/10 bg-[#101d2c] text-white"}`}
          >
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 opacity-60" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="найти намерение..."
                className="min-w-0 flex-1 bg-transparent px-2 py-3 text-base font-black outline-none"
              />

              {searchQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedId(null);
                    setMagnetId(null);
                  }}
                  className="grid h-10 w-10 place-items-center rounded-full bg-black/5"
                  aria-label="Стереть поиск"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}

              <button
                type="submit"
                className={`rounded-full px-4 py-2 text-sm font-black ${isLight ? "bg-[#111827] text-white" : "bg-white text-[#07111d]"}`}
              >
                найти
              </button>

              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full bg-black/5"
                aria-label="Закрыть поиск"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-2 pb-2 text-xs font-bold opacity-55">Enter/Найти подсветит шары на карте. Тапни шар, чтобы раскрыть.</div>
          </form>
        </div>
      ) : null}

      {composerOpen ? (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/25 p-3 sm:items-center">
          <div className={`w-full max-w-[430px] rounded-[32px] border p-4 shadow-2xl ${isLight ? "border-[#d8e3ef] bg-white text-[#07111d]" : "border-white/10 bg-[#101d2c] text-white"}`}>
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-lg font-black"><Sparkles className="h-5 w-5" />Новая мысль</div>
              <button type="button" onClick={() => setComposerOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-black/5"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {(Object.keys(KIND_LABEL) as SpaceSignalKind[]).map((item) => (
                <button key={item} type="button" onClick={() => setKind(item)} className={`rounded-2xl px-3 py-2 text-xs font-black transition ${kind === item ? isLight ? "bg-[#111827] text-white" : "bg-white text-[#07111d]" : isLight ? "bg-[#eef4fb] text-[#40566e]" : "bg-white/8 text-white/70"}`}>{KIND_EMOJI[item]} {KIND_LABEL[item]}</button>
              ))}
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
