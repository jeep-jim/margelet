import type { IngestedPost, Locale } from "../../types/app";

type SpaceIntent =
  | "greeting"
  | "thanks"
  | "recipe"
  | "weather"
  | "images"
  | "video"
  | "trend"
  | "source"
  | "chat"
  | "search";

type SpaceMode = "talk" | "clarify" | "answer" | "show";

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
  mode: SpaceMode;
};

type SpaceMemory = {
  turns: number;
  lastIntent: SpaceIntent | null;
  favoriteSources: Record<string, number>;
  topics: Record<string, number>;
  languageHints: Record<string, number>;
  lastUserWords: string[];
};

const SPACE_MEMORY_KEY = "margelet_space_local_brain_v2";

const STOP_WORDS = new Set([
  "дай", "найди", "покажи", "что", "как", "где", "кто", "про", "для", "это", "есть", "мне", "нам", "или", "еще", "ещё", "сейчас", "сегодня", "вот", "там", "тут", "на", "по", "из", "от", "за", "без", "при", "под", "над", "тебе", "меня", "будет", "быть", "очень", "просто", "можно", "надо", "нужно",
  "the", "and", "for", "with", "about", "show", "find", "give", "what", "how", "where", "who", "please", "now", "today",
  "el", "la", "los", "las", "que", "como", "para", "por", "con", "sobre",
  "de", "der", "die", "das", "und", "was", "wie", "wo", "über",
]);

const INTENT_KEYWORDS: Record<SpaceIntent, string[]> = {
  greeting: ["привет", "здравств", "салам", "hello", "hi", "hey", "hola", "bonjour", "hallo", "ciao", "привіт"],
  thanks: ["спасибо", "благодар", "thanks", "thank you", "merci", "gracias", "danke"],
  recipe: ["рецепт", "готов", "пирог", "капуст", "салат", "суп", "кухн", "еда", "recipe", "cook", "food", "cooking", "receta"],
  weather: ["погода", "прогноз", "градус", "дожд", "снег", "ветер", "weather", "forecast", "lluvia", "wetter"],
  images: ["картин", "фото", "изображ", "галере", "покажи картинки", "images", "photos", "gallery", "picture", "bilder"],
  video: ["видео", "ролик", "смотреть", "video", "clip"],
  trend: ["тренд", "раст", "обсужда", "говорят", "происходит", "сигнал", "attention", "trend", "happening", "discuss"],
  source: ["канал", "источник", "автор", "source", "channel"],
  chat: ["бро", "друг", "как ты", "что умеешь", "расскажи", "помоги", "можешь"],
  search: ["найди", "покажи", "дай", "что пишут", "ищи", "search", "find", "show", "give me"],
};

const UI: Record<string, {
  hello: string[];
  thanks: string[];
  clarify: string;
  noExact: string;
  foundOne: string;
  foundGallery: string;
  foundVideo: string;
  recipeFound: string;
  weatherClarify: string;
  trendClarify: string;
  continueTitle: string;
  chipsGeneral: string[];
  chipsRecipe: string[];
  chipsImage: string[];
  chipsTrend: string[];
  galleryTitle: string;
  videoTitle: string;
}> = {
  ru: {
    hello: [
      "Я тут, бро 🙂 Пиши как человеку: что найти, объяснить или собрать из Telegram-потока margeleT.",
      "На связи 🐙 Напиши тему, страну, канал, рецепт, фото или видео — сначала уточню смысл, потом покажу только точное.",
    ],
    thanks: ["Всегда рядом, бро 🤝", "Готово, бро. Продолжай мысль — я подстроюсь."],
    clarify: "Понял. Чтобы не вываливать лишнее, уточни чуть-чуть: тебе нужен короткий ответ, посты-источники, фото/видео или анализ тренда?",
    noExact: "Понял запрос, но точного совпадения в текущей базе не вижу. Дай ещё одно слово или страну — сузим.",
    foundOne: "Нашёл близкое. Покажу аккуратно один вариант, а дальше можно расширить 👇",
    foundGallery: "Да, собрал медиа по смыслу. Сначала покажу подборку, без лишней ленты 👇",
    foundVideo: "Нашёл видео по запросу. Показываю самые близкие 👇",
    recipeFound: "Да, нашёл живой вариант. Сначала один самый близкий, без простыни 👇",
    weatherClarify: "По погоде лучше уточнить город и период: сегодня, завтра или неделя? Тогда соберу красиво.",
    trendClarify: "Тему понял. Уточни страну или объект — и я соберу сигнал по Telegram-потоку.",
    continueTitle: "Можно продолжить",
    chipsGeneral: ["Показать источники", "Найти фото", "Коротко объясни"],
    chipsRecipe: ["Показать ещё рецепт", "Найти с видео", "Сделай инструкцию"],
    chipsImage: ["Ещё картинки", "Только видео", "Открыть источники"],
    chipsTrend: ["Что растёт?", "По странам", "Дай кратко"],
    galleryTitle: "Медиа из Telegram",
    videoTitle: "Видео и превью",
  },
  us: {
    hello: [
      "I’m here 🙂 Write naturally: a topic, country, channel, recipe, photo, or video. I’ll search margeleT’s live Telegram base.",
      "Ready 🐙 Tell me what you want to find or understand — I’ll ask if the request is too broad.",
    ],
    thanks: ["Anytime 🤝", "Got you. Keep going — I’ll adapt."],
    clarify: "Got it. To avoid dumping random posts, tell me what you want: a short answer, source posts, photos/videos, or trend analysis?",
    noExact: "I understand the request, but I don’t see an exact match in the current base. Add one more word or country and I’ll narrow it down.",
    foundOne: "I found a close match. I’ll show one clean result first, then we can expand 👇",
    foundGallery: "I found media by meaning. Showing a small set first, not the whole feed 👇",
    foundVideo: "I found video posts close to the request 👇",
    recipeFound: "Yes — I found a real Telegram recipe. Showing the closest one first 👇",
    weatherClarify: "For weather, tell me the city and period: today, tomorrow, or week? Then I’ll format it nicely.",
    trendClarify: "I get the topic. Add a country or object and I’ll collect the Telegram signal.",
    continueTitle: "You can continue",
    chipsGeneral: ["Show sources", "Find photos", "Explain shortly"],
    chipsRecipe: ["More recipes", "Find video", "Make steps"],
    chipsImage: ["More images", "Only video", "Open sources"],
    chipsTrend: ["What is growing?", "By countries", "Short summary"],
    galleryTitle: "Telegram media",
    videoTitle: "Videos and previews",
  },
};

function getUi(locale: Locale) {
  return UI[locale] || UI.us;
}

function readMemory(): SpaceMemory {
  try {
    const parsed = JSON.parse(localStorage.getItem(SPACE_MEMORY_KEY) || "null") as SpaceMemory | null;
    if (parsed && typeof parsed === "object") {
      return {
        turns: Number(parsed.turns || 0),
        lastIntent: parsed.lastIntent || null,
        favoriteSources: parsed.favoriteSources || {},
        topics: parsed.topics || {},
        languageHints: parsed.languageHints || {},
        lastUserWords: Array.isArray(parsed.lastUserWords) ? parsed.lastUserWords : [],
      };
    }
  } catch {
    // local brain memory is optional.
  }

  return { turns: 0, lastIntent: null, favoriteSources: {}, topics: {}, languageHints: {}, lastUserWords: [] };
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
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, 16);
}

function pick<T>(items: T[], seed: number) {
  return items[Math.abs(seed) % items.length];
}

function detectIntent(query: string): { intent: SpaceIntent; strength: number } {
  const lower = normalize(query);
  const tokens = tokenize(query);
  let best: { intent: SpaceIntent; strength: number } = { intent: "search", strength: 0 };

  (Object.keys(INTENT_KEYWORDS) as SpaceIntent[]).forEach((intent) => {
    const strength = INTENT_KEYWORDS[intent].reduce((sum, keyword) => {
      return lower.includes(normalize(keyword)) ? sum + 1 : sum;
    }, 0);

    if (strength > best.strength) best = { intent, strength };
  });

  const onlyGreeting = tokens.length === 0 && best.intent === "greeting";
  if (onlyGreeting) return { intent: "greeting", strength: 5 };
  if (best.strength === 0 && lower.endsWith("?")) return { intent: "trend", strength: 1 };
  return best;
}

function isShortSocial(query: string, intent: SpaceIntent) {
  const tokens = tokenize(query);
  return tokens.length <= 1 && (intent === "greeting" || intent === "thanks" || intent === "chat");
}

function isBroadQuery(query: string, intent: SpaceIntent, strength: number) {
  const tokens = tokenize(query);
  if (isShortSocial(query, intent)) return false;
  if (intent === "weather" && tokens.length <= 1) return true;
  if (intent === "trend" && tokens.length <= 1) return true;
  if (intent === "search" && tokens.length <= 1 && strength < 2) return true;
  return false;
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

function hasIntentMedia(post: IngestedPost, intent: SpaceIntent) {
  if (intent === "images") return post.media.some((item) => item.kind === "image");
  if (intent === "video") return post.media.some((item) => item.kind === "video");
  return true;
}

function rankPost(post: IngestedPost, queryTokens: string[], intent: SpaceIntent, memory: SpaceMemory) {
  const haystack = getPostSearchText(post);
  let score = 0;

  queryTokens.forEach((token) => {
    if (haystack.includes(token)) score += token.length > 4 ? 5 : 2.5;
  });

  const tagText = normalize([post.tag, ...(post.tags || [])].join(" "));
  if (intent === "recipe" && /(recipe|food|cook|еда|кухн|готов|рецепт)/.test(tagText + " " + haystack)) score += 7;
  if (intent === "images" && post.media.some((item) => item.kind === "image")) score += 7;
  if (intent === "video" && post.media.some((item) => item.kind === "video")) score += 7;
  if (intent === "weather" && /(погод|weather|forecast|дожд|снег|ветер)/.test(haystack)) score += 8;
  if (intent === "trend") score += Math.min(5, Math.max(0, post.links?.length || 0));

  const sourceBoost = memory.favoriteSources[post.source.handle] || 0;
  score += Math.min(3, sourceBoost * 0.35);

  const created = Date.parse(post.createdAt || "");
  if (Number.isFinite(created)) {
    const ageHours = Math.max(0, (Date.now() - created) / 36e5);
    score += Math.max(0, 4 - ageHours / 10);
  }

  if (post.source.verified) score += 1;
  if (post.media.length) score += 0.8;

  if (!hasIntentMedia(post, intent)) score -= 12;
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
    title: post.source.title || post.source.handle || "Telegram",
    subtitle: post.source.handle ? `@${post.source.handle.replace(/^@/, "")}` : "Telegram",
    text: compactText(post.text, 420),
    url: post.postUrl,
    sourceHandle: post.source.handle,
    sourceAvatar: post.source.avatar,
    media: post.media.slice(0, 4).map((item) => ({
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
        .slice(0, 3)
        .map((item) => ({
          url: item.url,
          poster: item.poster || null,
          kind: item.kind,
          sourceTitle: post.source.title || post.source.handle || "Telegram",
          postUrl: post.postUrl,
        })),
    )
    .slice(0, 6);

  if (!items.length) return null;
  return { type: "gallery", title, items };
}

function makeChips(ui: ReturnType<typeof getUi>, intent: SpaceIntent, tokens: string[]): SpaceBlock {
  let items = ui.chipsGeneral;
  if (intent === "recipe") items = ui.chipsRecipe;
  if (intent === "images" || intent === "video") items = ui.chipsImage;
  if (intent === "trend") items = ui.chipsTrend;

  if (tokens.length && intent === "search") {
    items = [tokens.slice(0, 3).join(" "), ...ui.chipsGeneral].filter(Boolean).slice(0, 3);
  }

  return { type: "chips", title: ui.continueTitle, items };
}

function updateMemory(memory: SpaceMemory, query: string, intent: SpaceIntent, found: IngestedPost[], locale: Locale) {
  memory.turns += 1;
  memory.lastIntent = intent;
  memory.languageHints[locale] = (memory.languageHints[locale] || 0) + 1;
  memory.lastUserWords = tokenize(query).slice(0, 8);

  memory.lastUserWords.forEach((token) => {
    memory.topics[token] = (memory.topics[token] || 0) + 1;
  });

  found.slice(0, 2).forEach((post) => {
    if (!post.source.handle) return;
    memory.favoriteSources[post.source.handle] = (memory.favoriteSources[post.source.handle] || 0) + 0.35;
  });

  writeMemory(memory);
}

export function buildSpaceAnswer(params: {
  query: string;
  posts: IngestedPost[];
  locale: Locale;
}): SpaceAnswer {
  const { query, posts, locale } = params;
  const ui = getUi(locale);
  const { intent, strength } = detectIntent(query);
  const memory = readMemory();
  const tokens = tokenize(query);
  const seed = query.length + memory.turns + tokens.join("").length;

  if (intent === "greeting" || isShortSocial(query, intent)) {
    updateMemory(memory, query, intent, [], locale);
    return { text: pick(ui.hello, seed), blocks: [makeChips(ui, "chat", tokens)], mode: "talk" };
  }

  if (intent === "thanks") {
    updateMemory(memory, query, intent, [], locale);
    return { text: pick(ui.thanks, seed), blocks: [], mode: "talk" };
  }

  if (isBroadQuery(query, intent, strength)) {
    updateMemory(memory, query, intent, [], locale);
    const text = intent === "weather" ? ui.weatherClarify : intent === "trend" ? ui.trendClarify : ui.clarify;
    return { text, blocks: [makeChips(ui, intent, tokens)], mode: "clarify" };
  }

  const ranked = posts
    .map((post) => ({ post, score: rankPost(post, tokens, intent, memory) }))
    .filter(({ score }) => score >= 7)
    .sort((a, b) => b.score - a.score)
    .slice(0, intent === "images" || intent === "video" ? 8 : 3);

  const found = ranked.map((item) => item.post);
  updateMemory(memory, query, intent, found, locale);

  if (!ranked.length) {
    return { text: ui.noExact, blocks: [makeChips(ui, intent, tokens)], mode: "clarify" };
  }

  const blocks: SpaceBlock[] = [];
  const best = ranked[0];

  if (intent === "images" || intent === "video") {
    const gallery = buildGallery(found, intent === "video" ? ui.videoTitle : ui.galleryTitle);
    if (gallery) blocks.push(gallery);
    ranked.slice(0, 1).forEach(({ post, score }) => blocks.push(postToBlock(post, score)));
  } else {
    blocks.push(postToBlock(best.post, best.score));
  }

  blocks.push(makeChips(ui, intent, tokens));

  let text = ui.foundOne;
  if (intent === "recipe") text = ui.recipeFound;
  if (intent === "images") text = ui.foundGallery;
  if (intent === "video") text = ui.foundVideo;

  return { text, blocks, mode: blocks.length > 1 ? "show" : "answer" };
}
