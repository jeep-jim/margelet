import type { SpacePlanet, SpacePlanetId, SpaceSignal, SpaceSignalKind, SpaceTelegramUser } from "../types";

export const TG_USER_KEY = "margelet_tg_user";
export const SPACE_SIGNALS_KEY = "margelet_space_local_signals_v1";

export const WORLD_W = 2600;
export const WORLD_H = 1600;

export const KIND_EMOJI: Record<SpaceSignalKind, string> = {
  want: "✨",
  ask: "?",
  buy: "🛒",
  talk: "💬",
  help: "🛠️",
  sell: "🏷️",
};

export const KIND_COLOR: Record<SpaceSignalKind, string> = {
  want: "from-violet-400 to-fuchsia-500",
  ask: "from-sky-300 to-blue-500",
  buy: "from-amber-300 to-orange-500",
  talk: "from-fuchsia-300 to-violet-500",
  help: "from-emerald-300 to-green-500",
  sell: "from-rose-300 to-pink-500",
};

export const SPACE_PLANETS = [
  { id: "all", emoji: "🌌", title: "All", gradient: "from-sky-400 to-violet-500", keywords: [] },
  { id: "tech", emoji: "💻", title: "Tech", gradient: "from-sky-400 to-blue-600", keywords: ["ai", "react", "vercel", "telegram", "bot", "python", "код", "нейро", "разработ", "tech"] },
  { id: "finance", emoji: "₿", title: "Money", gradient: "from-emerald-300 to-amber-400", keywords: ["bitcoin", "btc", "ton", "usdt", "крипт", "доллар", "инвест", "деньг", "актив"] },
  { id: "world", emoji: "🌍", title: "World", gradient: "from-cyan-300 to-emerald-500", keywords: ["герман", "европ", "переезд", "страна", "город", "world", "berlin"] },
  { id: "startup", emoji: "🚀", title: "Startup", gradient: "from-violet-300 to-fuchsia-500", keywords: ["стартап", "проект", "запуск", "саас", "startup", "команд"] },
  { id: "creative", emoji: "🎨", title: "Creative", gradient: "from-pink-300 to-orange-400", keywords: ["видео", "дизайн", "музык", "контент", "монтаж", "creative"] },
  { id: "community", emoji: "🤝", title: "People", gradient: "from-orange-300 to-rose-500", keywords: ["помог", "обсуж", "найти", "людей", "друг", "совет", "газон"] },
] satisfies SpacePlanet[];

export function readTheme(): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export function applyTheme(theme: "dark" | "light") {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem("margelet_theme", theme);
}

export function readTelegramUser(): SpaceTelegramUser | null {
  try {
    const raw = localStorage.getItem(TG_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SpaceTelegramUser;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function readSignals(): SpaceSignal[] {
  try {
    const raw = localStorage.getItem(SPACE_SIGNALS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.text) : [];
  } catch {
    return [];
  }
}

export function writeSignals(signals: SpaceSignal[]) {
  localStorage.setItem(SPACE_SIGNALS_KEY, JSON.stringify(signals.slice(0, 120)));
}

export function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getUserName(user: SpaceTelegramUser | null) {
  return user?.first_name || user?.username || "You";
}

export function getUserAvatar(user: SpaceTelegramUser | null) {
  return user?.photo_url || null;
}

export function getWords(text: string) {
  return String(text)
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9\s]/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

export function similarity(a: string, b: string) {
  const aw = new Set(getWords(a));
  const bw = getWords(b);
  if (!aw.size || !bw.length) return 0;
  return bw.reduce((sum, word) => sum + (aw.has(word) ? 1 : 0), 0);
}

export function toWorldPercent(value: number, max: number) {
  return Math.max(5, Math.min(95, (value / max) * 100));
}

export function inferPlanetId(text: string, fallback: SpacePlanetId = "all"): SpacePlanetId {
  const words = getWords(text).join(" ");
  const planet = SPACE_PLANETS.find((item) => item.id !== "all" && item.keywords.some((keyword: string) => words.includes(keyword)));
  return planet?.id || fallback;
}

export function pickDemoSignals(): SpaceSignal[] {
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
    planetId: inferPlanetId(text),
  }));
}

export function depthForIndex(index: number) {
  return [0.72, 0.86, 1, 1.16, 1.32][index % 5];
}
