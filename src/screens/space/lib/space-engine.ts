import type { SpacePlanet, SpacePlanetId, SpaceSignal, SpaceSignalKind, SpaceTelegramUser } from "../types";

export const TG_USER_KEY = "margelet_tg_user";
export const SPACE_SIGNALS_KEY = "margelet_space_local_signals_v1";
export const TELEGRAM_BOT_ID = "8298054487";

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
  { id: "all", emoji: "🌌", title: "All", gradient: "from-sky-400 to-violet-500", keywords: [], description: "Общий космос: все короткие человеческие сигналы сразу." },
  { id: "tech", emoji: "💻", title: "Tech", gradient: "from-sky-400 to-blue-600", keywords: ["ai", "react", "vercel", "telegram", "bot", "python", "код", "нейро", "разработ", "tech"], description: "Ледяная галактика технологий: код, AI, Telegram, боты и инструменты." },
  { id: "finance", emoji: "₿", title: "Money", gradient: "from-emerald-300 to-amber-400", keywords: ["bitcoin", "btc", "ton", "usdt", "крипт", "доллар", "инвест", "деньг", "актив"], description: "Орбита денег: крипта, TON, активы, обмен, риски и вопросы про заработок." },
  { id: "world", emoji: "🌍", title: "World", gradient: "from-cyan-300 to-emerald-500", keywords: ["герман", "европ", "переезд", "страна", "город", "world", "berlin"], description: "Живая планета мира: страны, переезд, события, города и люди рядом." },
  { id: "startup", emoji: "🚀", title: "Startup", gradient: "from-violet-300 to-fuchsia-500", keywords: ["стартап", "проект", "запуск", "саас", "startup", "команд"], description: "Туманность запусков: проекты, команды, тесты, первые пользователи и идеи." },
  { id: "creative", emoji: "🎨", title: "Creative", gradient: "from-pink-300 to-orange-400", keywords: ["видео", "дизайн", "музык", "контент", "монтаж", "creative"], description: "Тропики креатива: дизайн, видео, музыка, контент и авторские штуки." },
  { id: "community", emoji: "🤝", title: "People", gradient: "from-orange-300 to-rose-500", keywords: ["помог", "обсуж", "найти", "людей", "друг", "совет", "газон"], description: "Галактика людей: помощь, вопросы, обсуждения, знакомства и живые советы." },
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

export function getTelegramAuthUrl() {
  const origin = window.location.origin;
  return `https://oauth.telegram.org/auth?bot_id=${TELEGRAM_BOT_ID}&origin=${origin}&request_access=write`;
}

export function readTelegramUser(): SpaceTelegramUser | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (id) {
      const urlUser: SpaceTelegramUser = {
        id,
        first_name: params.get("first_name") || "",
        username: params.get("username") || "",
        photo_url: params.get("photo_url") || "",
      };
      localStorage.setItem(TG_USER_KEY, JSON.stringify(urlUser));
      window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      return urlUser;
    }

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
    ["ask", "как хранить USDT безопасно?"],
    ["buy", "куплю консультацию по TON"],
    ["talk", "обсужу bitcoin и ETF"],
    ["ask", "куда вложить первые 100 евро?"],
    ["talk", "поговорю про переезд в Европу"],
    ["talk", "кто сейчас в Берлине?"],
    ["talk", "поговорю про жизнь в Германии"],
    ["ask", "как найти квартиру в Берлине?"],
    ["help", "помогу с React и Telegram bot"],
    ["help", "помогу настроить Vercel"],
    ["help", "помогу проверить лендинг"],
    ["ask", "почему Vercel сборка падает?"],
    ["want", "хочу найти людей в AI"],
    ["ask", "кто такой Эрик Вейнштейн?"],
    ["talk", "обсужу стартап без инвесторов"],
    ["want", "ищу идею для маленького бизнеса"],
    ["buy", "куплю совет по запуску проекта"],
    ["sell", "продам домен для проекта"],
    ["ask", "как вырастить газон после зимы?"],
    ["ask", "чем удобрять газон весной?"],
    ["help", "помогу с садом и растениями"],
    ["want", "хочу научиться монтировать видео"],
    ["talk", "обсужу музыку и монтаж"],
    ["ask", "как не выгореть за неделю?"],
    ["help", "помогу разобрать тревогу перед запуском"],
    ["want", "ищу команду для Telegram проекта"],
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


export function signalHeatScore(signal: SpaceSignal, magnet: SpaceSignal | null) {
  if (!magnet || signal.id === magnet.id) return 0;
  const wordScore = similarity(signal.text, magnet.text);
  const kindScore = signal.kind === magnet.kind ? 2 : 0;
  const planetScore = signal.planetId === magnet.planetId ? 1 : 0;
  const authorScore = signal.authorName && signal.authorName === magnet.authorName ? 12 : 0;
  return wordScore + kindScore + planetScore + authorScore;
}

export function getHeatContacts(signals: SpaceSignal[], magnet: SpaceSignal | null, limit = 7) {
  if (!magnet) return [] as Array<{ signal: SpaceSignal; score: number; rank: number }>;

  return signals
    .filter((signal) => signal.id !== magnet.id)
    .map((signal) => ({ signal, score: signalHeatScore(signal, magnet) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item, rank) => ({ ...item, rank }));
}
