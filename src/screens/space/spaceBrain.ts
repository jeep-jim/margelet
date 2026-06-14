import type { IngestedPost, Locale } from "../../types/app";

type SpaceIntent =
  | "recipe"
  | "weather"
  | "images"
  | "video"
  | "trend"
  | "source"
  | "chat"
  | "search";

export type SpaceBlock =
  | {
      type: "post";
      title: string;
      subtitle: string;
      text: string;
      url: string;
      sourceHandle: string;
      sourceAvatar: string | null;
      media: Array<{ kind: "image" | "video" | "audio" | "file"; url: string; poster?: string | null }>;
      createdAt: string;
      score: number;
    }
  | {
      type: "gallery";
      title: string;
      items: Array<{
        url: string;
        poster?: string | null;
        kind: "image" | "video" | "audio" | "file";
        sourceTitle: string;
        postUrl: string;
      }>;
    }
  | {
      type: "chips";
      title: string;
      items: string[];
    };

export type SpaceAnswer = {
  text: string;
  blocks: SpaceBlock[];
};

type SpaceMemory = {
  turns: number;
  lastIntent: SpaceIntent | null;
  favoriteSources: Record<string, number>;
  topics: Record<string, number>;
};

const SPACE_MEMORY_KEY = "margelet_space_local_brain_v1";

const RU_STOP = new Set([
  "дай",
  "найди",
  "покажи",
  "что",
  "как",
  "где",
  "кто",
  "про",
  "для",
  "это",
  "есть",
  "мне",
  "нам",
  "или",
  "еще",
  "ещё",
  "сейчас",
  "сегодня",
  "вот",
  "там",
  "тут",
  "на",
  "по",
  "из",
  "от",
  "за",
  "без",
  "при",
  "the",
  "and",
  "for",
  "with",
  "about",
  "show",
  "find",
]);

const INTENT_KEYWORDS: Record<SpaceIntent, string[]> = {
  recipe: ["рецепт", "готов", "пирог", "капуст", "салат", "суп", "кухн", "еда", "recipe", "cook", "food"],
  weather: ["погода", "прогноз", "градус", "дожд", "снег", "ветер", "weather", "forecast"],
  images: ["картин", "фото", "изображ", "галере", "покажи картинки", "images", "photos", "gallery"],
  video: ["видео", "ролик", "смотреть", "video", "clip"],
  trend: ["тренд", "раст", "обсужда", "говорят", "происходит", "сигнал", "attention", "trend"],
  source: ["канал", "источник", "автор", "source", "channel"],
  chat: ["привет", "как ты", "спасибо", "бро", "друг"],
  search: ["найди", "покажи", "дай", "что пишут", "ищи", "search", "find", "show"],
};

function readMemory(): SpaceMemory {
  try {
    const parsed = JSON.parse(localStorage.getItem(SPACE_MEMORY_KEY) || "null") as SpaceMemory | null;
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // local brain memory is optional.
  }

  return { turns: 0, lastIntent: null, favoriteSources: {}, topics: {} };
}

function writeMemory(memory: SpaceMemory) {
  try {
    localStorage.setItem(SPACE_MEMORY_KEY, JSON.stringify(memory));
  } catch {
    // stays fully local; if storage is full, Space still answers.
  }
}

function normalize(text: string) {
  return text.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9@#\s-]/gi, " ").replace(/\s+/g, " ").trim();
}

function tokenize(text: string) {
  return normalize(text)
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !RU_STOP.has(word))
    .slice(0, 14);
}

function detectIntent(query: string): SpaceIntent {
  const lower = normalize(query);
  let best: { intent: SpaceIntent; score: number } = { intent: "search", score: 0 };

  (Object.keys(INTENT_KEYWORDS) as SpaceIntent[]).forEach((intent) => {
    const score = INTENT_KEYWORDS[intent].reduce((sum, keyword) => {
      return lower.includes(normalize(keyword)) ? sum + 1 : sum;
    }, 0);

    if (score > best.score) best = { intent, score };
  });

  if (best.score === 0 && lower.endsWith("?")) return "trend";
  return best.intent;
}

function getPostSearchText(post: IngestedPost) {
  return normalize([
    post.text,
    post.source.title,
    post.source.handle,
    post.tag,
    ...(post.tags || []),
    post.sourceCountryCode || "",
  ].join(" "));
}

function rankPost(post: IngestedPost, queryTokens: string[], intent: SpaceIntent, memory: SpaceMemory) {
  const haystack = getPostSearchText(post);
  let score = 0;

  queryTokens.forEach((token) => {
    if (haystack.includes(token)) score += token.length > 4 ? 4 : 2;
  });

  if (intent === "recipe" && [post.tag, ...(post.tags || [])].some((tag) => String(tag).includes("recipe") || String(tag).includes("food"))) score += 8;
  if (intent === "images" && post.media.some((item) => item.kind === "image")) score += 8;
  if (intent === "video" && post.media.some((item) => item.kind === "video")) score += 8;
  if (intent === "weather" && haystack.includes("погод")) score += 8;
  if (intent === "trend") score += Math.min(6, Math.max(0, post.links?.length || 0));

  const sourceBoost = memory.favoriteSources[post.source.handle] || 0;
  score += Math.min(5, sourceBoost);

  const created = Date.parse(post.createdAt || "");
  if (Number.isFinite(created)) {
    const ageHours = Math.max(0, (Date.now() - created) / 36e5);
    score += Math.max(0, 5 - ageHours / 8);
  }

  if (post.source.verified) score += 1.5;
  if (post.media.length) score += 1;

  return score;
}

function compactText(text: string, max = 360) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trim()}…`;
}

function postToBlock(post: IngestedPost, score: number): SpaceBlock {
  return {
    type: "post",
    title: post.source.title || post.source.handle || "Telegram источник",
    subtitle: post.source.handle ? `@${post.source.handle.replace(/^@/, "")}` : "Telegram",
    text: compactText(post.text, 520),
    url: post.postUrl,
    sourceHandle: post.source.handle,
    sourceAvatar: post.source.avatar,
    media: post.media.slice(0, 6).map((item) => ({
      kind: item.kind,
      url: item.url,
      poster: item.poster || null,
    })),
    createdAt: post.createdAt,
    score,
  };
}

function buildGallery(posts: IngestedPost[], title: string): SpaceBlock | null {
  const items = posts
    .flatMap((post) =>
      post.media
        .filter((item) => item.kind === "image" || item.kind === "video")
        .slice(0, 4)
        .map((item) => ({
          url: item.url,
          poster: item.poster || null,
          kind: item.kind,
          sourceTitle: post.source.title || post.source.handle || "Telegram",
          postUrl: post.postUrl,
        })),
    )
    .slice(0, 9);

  if (!items.length) return null;
  return { type: "gallery", title, items };
}

function humanIntro(intent: SpaceIntent, query: string, found: IngestedPost[]) {
  const top = found[0];
  const source = top?.source?.title || top?.source?.handle;

  if (intent === "recipe") {
    return top
      ? `Да, нашёл живой вариант${source ? ` от «${source}»` : ""} — забирай, выглядит по-домашнему 👇`
      : "Понял, нужен рецепт. В текущей ленте я не нашёл точный пост, но могу поискать похожие блюда по словам или каналам.";
  }

  if (intent === "weather") {
    return top
      ? `Нашёл, где сейчас пишут про погоду. Собрал самое близкое к запросу 👇`
      : "По погоде в текущих Telegram-постах пока нет сильного совпадения. Можно уточнить город, и я попробую сузить поиск.";
  }

  if (intent === "images") {
    return found.length
      ? "Да, собрал картинки из свежих Telegram-постов. Можно открыть источник или попросить похожие 👇"
      : "Картинок по этому запросу в текущей ленте не зацепилось. Попробуй написать тему чуть проще.";
  }

  if (intent === "video") {
    return found.length
      ? "Нашёл видео-посты по смыслу запроса. Смотри, что ближе всего 👇"
      : "Видео по этому запросу пока не нашёл. Могу поискать обычные посты или картинки.";
  }

  if (intent === "trend") {
    return found.length
      ? `Смотрю по свежему Telegram-потоку: есть несколько сигналов по запросу «${query.trim()}». Вот самые близкие 👇`
      : "Пока не вижу сильного сигнала в текущих JSON margeleT. Но запрос понял — можно расширить страну или тему.";
  }

  if (intent === "chat") {
    return "Я тут, бро 🙂 Пиши как человеку: тему, страну, канал, событие, рецепт, фото или видео — я буду искать по живой базе margeleT.";
  }

  return found.length
    ? `Да, нашёл в Telegram-потоке margeleT. Вот самое близкое по смыслу 👇`
    : "Я понял запрос, но в текущей локальной базе не нашёл точного совпадения. Попробуй другое слово, страну или тему.";
}

function updateMemory(memory: SpaceMemory, query: string, intent: SpaceIntent, found: IngestedPost[]) {
  memory.turns += 1;
  memory.lastIntent = intent;

  tokenize(query).forEach((token) => {
    memory.topics[token] = (memory.topics[token] || 0) + 1;
  });

  found.slice(0, 3).forEach((post) => {
    if (!post.source.handle) return;
    memory.favoriteSources[post.source.handle] = (memory.favoriteSources[post.source.handle] || 0) + 1;
  });

  writeMemory(memory);
}

export function buildSpaceAnswer(params: {
  query: string;
  posts: IngestedPost[];
  locale: Locale;
}): SpaceAnswer {
  const { query, posts } = params;
  const intent = detectIntent(query);
  const memory = readMemory();
  const tokens = tokenize(query);

  const ranked = posts
    .map((post) => ({ post, score: rankPost(post, tokens, intent, memory) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, intent === "images" ? 12 : 6);

  const found = ranked.map((item) => item.post);
  updateMemory(memory, query, intent, found);

  const blocks: SpaceBlock[] = [];

  if (intent === "images" || intent === "video") {
    const gallery = buildGallery(found, intent === "video" ? "Видео и превью" : "Галерея из Telegram");
    if (gallery) blocks.push(gallery);
  }

  ranked.slice(0, intent === "images" ? 3 : 4).forEach(({ post, score }) => {
    blocks.push(postToBlock(post, score));
  });

  const chips = tokens.length
    ? tokens.slice(0, 5).map((token) => `Ещё про ${token}`)
    : ["Что сейчас обсуждают?", "Показать видео", "Показать источники"];

  blocks.push({ type: "chips", title: "Можно продолжить", items: chips });

  return {
    text: humanIntro(intent, query, found),
    blocks,
  };
}
