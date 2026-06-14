import type { IngestedPost, Locale } from "../../types/app";

type SpaceIntent =
  | "greeting"
  | "thanks"
  | "capabilities"
  | "identity"
  | "liveness"
  | "personalQuestion"
  | "abilityCheck"
  | "recipe"
  | "weather"
  | "images"
  | "video"
  | "trend"
  | "source"
  | "fact"
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

type LastResultMemory = {
  query: string;
  subject: string;
  intent: SpaceIntent;
  postTitle?: string;
  postText?: string;
  sourceTitle?: string;
  sourceHandle?: string;
  createdAt?: string;
  at: number;
};

type SpaceMemory = {
  turns: number;
  lastIntent: SpaceIntent | null;
  favoriteSources: Record<string, number>;
  topics: Record<string, number>;
  languageHints: Record<string, number>;
  lastUserWords: string[];
  lastSubject: string;
  lastResult: LastResultMemory | null;
  userStyle: {
    wantsShort: number;
    wantsSources: number;
    likesMedia: number;
    likesWarmTone: number;
  };
};

const SPACE_MEMORY_KEY = "margelet_space_local_brain_v3";

const STOP_WORDS = new Set([
  "дай", "найди", "покажи", "что", "как", "где", "кто", "про", "для", "это", "есть", "мне", "нам", "или", "еще", "ещё", "сейчас", "сегодня", "вот", "там", "тут", "на", "по", "из", "от", "за", "без", "при", "под", "над", "тебе", "меня", "будет", "быть", "очень", "просто", "можно", "надо", "нужно", "стал", "стала", "стали", "самый", "самая", "самое", "бро", "друг", "ок", "ладно", "ага",
  "the", "and", "for", "with", "about", "show", "find", "give", "what", "how", "where", "who", "please", "now", "today", "is", "are", "was", "were", "me", "you",
  "el", "la", "los", "las", "que", "como", "para", "por", "con", "sobre",
  "de", "der", "die", "das", "und", "was", "wie", "wo", "über",
]);

const PRONOUN_HINTS = ["он", "она", "они", "его", "ее", "её", "him", "her", "it", "they", "them", "he", "she"];

const INTENT_KEYWORDS: Record<SpaceIntent, string[]> = {
  greeting: ["привет", "здравств", "салам", "hello", "hi", "hey", "hola", "bonjour", "hallo", "ciao", "привіт"],
  thanks: ["спасибо", "благодар", "thanks", "thank you", "merci", "gracias", "danke"],
  capabilities: ["что умеешь", "что ты умеешь", "умеешь", "расскажи о себе", "как работаешь", "что можешь", "what can you do", "capabilities"],
  identity: ["как тебя зовут", "кто ты", "ты кто", "твое имя", "твоё имя", "what is your name", "who are you"],
  liveness: ["ты живой", "живой", "ты настоящий", "ты человек", "are you alive", "are you real", "are you human"],
  personalQuestion: ["как дела", "как ты", "что делаешь", "ты тут", "ты здесь", "тебя спрашивать", "что спрашивать", "о чем спросить", "о чём спросить", "can i ask", "what can i ask"],
  abilityCheck: ["ты ии", "ты ai", "ты бот", "ты найдешь", "ты найдёшь", "можешь найти", "сможешь найти", "если я попрошу", "are you ai", "can you find", "will you find"],
  recipe: ["рецепт", "готов", "пирог", "капуст", "салат", "суп", "кухн", "еда", "recipe", "cook", "food", "cooking", "receta"],
  weather: ["погода", "прогноз", "градус", "дожд", "снег", "ветер", "weather", "forecast", "lluvia", "wetter"],
  images: ["картин", "фото", "изображ", "галере", "покажи картинки", "images", "photos", "gallery", "picture", "bilder"],
  video: ["видео", "ролик", "смотреть", "video", "clip"],
  trend: ["тренд", "раст", "обсужда", "говорят", "происходит", "сигнал", "attention", "trend", "happening", "discuss"],
  source: ["канал", "источник", "автор", "source", "channel"],
  fact: ["правда", "это правда", "почему", "зачем", "значит", "получается", "стал", "стала", "самый", "кто такой", "что такое", "is it true", "why", "explain"],
  chat: ["бро", "друг", "как ты", "расскажи", "помоги", "можешь"],
  search: ["найди", "покажи", "дай", "что пишут", "ищи", "новости", "search", "find", "show", "give me", "news"],
};

type SpaceUi = {
  hello: string[];
  thanks: string[];
  capabilities: string;
  identity: string;
  liveness: string;
  askMe: string;
  abilityVideo: string;
  abilitySearch: string;
  clarify: string;
  noExact: string;
  factCareful: string;
  foundOne: string;
  foundGallery: string;
  foundVideo: string;
  recipeFound: string;
  weatherClarify: string;
  trendClarify: string;
  continueTitle: string;
  chipsGeneral: string[];
  chipsCapability: string[];
  chipsRecipe: string[];
  chipsImage: string[];
  chipsTrend: string[];
  galleryTitle: string;
  videoTitle: string;
};

const UI: Record<string, SpaceUi> = {
  ru: {
    hello: [
      "Я тут, бро 🙂 Что ищем или разбираем?",
      "На связи 🐙 Пиши как человеку — я сначала пойму смысл, потом аккуратно покажу данные.",
    ],
    thanks: ["Всегда рядом, бро 🤝", "Готово, бро. Продолжай мысль — я подстроюсь."],
    capabilities: "Я умею вести диалог и искать по живой базе margeleT: новости, темы, страны, каналы, фото, видео и посты. Если запрос широкий — лучше уточню, а не вывалю ленту.",
    identity: "Меня зовут Space. Я мозг-поиск margeleT: со мной можно говорить как с человеком, а я буду искать смысл в Telegram-потоке.",
    liveness: "Я не человек, бро 🙂 Я локальный мозг Space: разговариваю, запоминаю контекст на твоём устройстве и ищу по живой базе margeleT.",
    askMe: "Можно спрашивать как меня: новости, темы, страны, каналы, фото, видео, рецепты или просто «что происходит сейчас». Если вопрос широкий — я сначала уточню.",
    abilityVideo: "Да, найду 🙂 Могу искать видео по теме, стране, каналу или событию. Лучше напиши конкретно: например «видео про Москву» или «видео про Илона Маска».",
    abilitySearch: "Да, найду. Но я стараюсь не сыпать всё подряд: если запрос широкий, сначала уточню, потом покажу самое близкое.",
    clarify: "Понял. Уточни чуть-чуть: тебе нужен короткий ответ, источники, фото/видео или разбор темы?",
    noExact: "Понял запрос, но точного совпадения сейчас не вижу. Дай ещё одно слово, страну или источник — сузим.",
    factCareful: "Понял, ты продолжаешь прошлую тему. Я не хочу придумывать факт без точного источника. Могу показать найденный пост или поискать шире по этой теме.",
    foundOne: "Нашёл близкое. Покажу один вариант, без простыни 👇",
    foundGallery: "Собрал медиа по смыслу. Сначала небольшая подборка 👇",
    foundVideo: "Нашёл близкие видео. Показываю аккуратно 👇",
    recipeFound: "Да, нашёл живой вариант. Сначала один самый близкий 👇",
    weatherClarify: "По погоде уточни город и период: сегодня, завтра или неделя? Тогда соберу красиво.",
    trendClarify: "Тему понял. Уточни страну или объект — и я соберу сигнал по Telegram-потоку.",
    continueTitle: "Можно дальше",
    chipsGeneral: ["Коротко объясни", "Показать источники", "Найти фото"],
    chipsCapability: ["Найди новости про Илона Маска", "Что обсуждают в Индии?", "Покажи видео"],
    chipsRecipe: ["Показать ещё рецепт", "Найти с видео", "Сделай инструкцию"],
    chipsImage: ["Ещё картинки", "Только видео", "Открыть источники"],
    chipsTrend: ["Что растёт?", "По странам", "Дай кратко"],
    galleryTitle: "Медиа из Telegram",
    videoTitle: "Видео и превью",
  },
  us: {
    hello: [
      "I’m here 🙂 What should we find or unpack?",
      "Ready 🐙 Write naturally — I’ll understand the intent first, then show only relevant data.",
    ],
    thanks: ["Anytime 🤝", "Got you. Keep going — I’ll adapt."],
    capabilities: "I can chat and search margeleT’s live Telegram base: news, topics, countries, channels, photos, videos, and posts. If the request is broad, I’ll ask first instead of dumping the feed.",
    identity: "My name is Space. I’m margeleT’s search brain: you can talk to me naturally, and I’ll search meaning in the Telegram flow.",
    liveness: "I’m not a human 🙂 I’m Space: a local dialog brain that remembers context on your device and searches margeleT’s live Telegram base.",
    askMe: "You can ask me about news, topics, countries, channels, photos, videos, recipes, or simply what is happening now. If it’s broad, I’ll ask a follow-up first.",
    abilityVideo: "Yes 🙂 I can find videos by topic, country, channel, or event. Better give me a precise query, like “videos about Elon Musk”.",
    abilitySearch: "Yes, I can. I won’t dump everything at once: if the request is broad, I’ll ask first and then show the closest result.",
    clarify: "Got it. What do you want: a short answer, source posts, photos/videos, or topic analysis?",
    noExact: "I understand the request, but I don’t see an exact match right now. Add one more word, country, or source and I’ll narrow it down.",
    factCareful: "I get that you’re continuing the previous topic. I don’t want to invent a fact without a clear source. I can show the found post or search wider.",
    foundOne: "I found a close match. Showing one clean result first 👇",
    foundGallery: "I found media by meaning. Small set first 👇",
    foundVideo: "I found close video posts 👇",
    recipeFound: "Yes — I found a real Telegram recipe. Closest one first 👇",
    weatherClarify: "For weather, tell me the city and period: today, tomorrow, or week? Then I’ll format it nicely.",
    trendClarify: "I get the topic. Add a country or object and I’ll collect the Telegram signal.",
    continueTitle: "You can continue",
    chipsGeneral: ["Explain shortly", "Show sources", "Find photos"],
    chipsCapability: ["Find Elon Musk news", "What is discussed in India?", "Show videos"],
    chipsRecipe: ["More recipes", "Find video", "Make steps"],
    chipsImage: ["More images", "Only video", "Open sources"],
    chipsTrend: ["What is growing?", "By countries", "Short summary"],
    galleryTitle: "Telegram media",
    videoTitle: "Videos and previews",
  },
};

function detectLanguage(query: string, locale: Locale) {
  if (/[а-яёіїєґ]/i.test(query)) return "ru";
  if (/\b(hi|hello|news|show|find|what|why|how|video|photo|recipe)\b/i.test(query)) return "us";
  return UI[locale] ? locale : "us";
}

function getUi(locale: Locale, query = "") {
  return UI[detectLanguage(query, locale)] || UI.us;
}

function readOldMemory(): Partial<SpaceMemory> | null {
  try {
    const old = JSON.parse(localStorage.getItem("margelet_space_local_brain_v2") || "null") as Partial<SpaceMemory> | null;
    return old && typeof old === "object" ? old : null;
  } catch {
    return null;
  }
}

function readMemory(): SpaceMemory {
  try {
    const parsed = JSON.parse(localStorage.getItem(SPACE_MEMORY_KEY) || "null") as SpaceMemory | null;
    if (parsed && typeof parsed === "object") {
      return normalizeMemory(parsed);
    }
  } catch {
    // local brain memory is optional.
  }

  return normalizeMemory(readOldMemory() || {});
}

function normalizeMemory(memory: Partial<SpaceMemory>): SpaceMemory {
  return {
    turns: Number(memory.turns || 0),
    lastIntent: memory.lastIntent || null,
    favoriteSources: memory.favoriteSources || {},
    topics: memory.topics || {},
    languageHints: memory.languageHints || {},
    lastUserWords: Array.isArray(memory.lastUserWords) ? memory.lastUserWords : [],
    lastSubject: memory.lastSubject || "",
    lastResult: memory.lastResult || null,
    userStyle: {
      wantsShort: Number(memory.userStyle?.wantsShort || 1),
      wantsSources: Number(memory.userStyle?.wantsSources || 0),
      likesMedia: Number(memory.userStyle?.likesMedia || 0),
      likesWarmTone: Number(memory.userStyle?.likesWarmTone || 1),
    },
  };
}

function writeMemory(memory: SpaceMemory) {
  try {
    localStorage.setItem(SPACE_MEMORY_KEY, JSON.stringify(memory));
  } catch {
    // stays fully local; if storage is full, Space still answers.
  }
}

function normalize(text: string) {
  return text.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-яіїєґ0-9@#\s-]/gi, " ").replace(/\s+/g, " ").trim();
}

function tokenize(text: string) {
  return normalize(text)
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, 18);
}

function pick<T>(items: T[], seed: number) {
  return items[Math.abs(seed) % items.length];
}

function isTinyChatQuestion(lower: string) {
  return /^(ты живой|живой|ты человек|ты настоящий|ты ии|ты ai|ты бот|как ты|как дела|ты тут|ты здесь)$/i.test(lower.trim());
}

function detectIntent(query: string): { intent: SpaceIntent; strength: number } {
  const lower = normalize(query);
  const tokens = tokenize(query);

  // Dialog-first rules. These must win before search rules.
  if (/(что\s+(у\s+тебя\s+)?(можно\s+)?спрашивать|о\s+ч[её]м\s+спросить|что\s+ты\s+умеешь|что\s+умеешь|что\s+можешь|как\s+работаешь|расскажи\s+о\s+себе|what\s+can\s+i\s+ask|what\s+can\s+you\s+do)/.test(lower)) {
    return { intent: "capabilities", strength: 8 };
  }

  if (/(как\s+тебя\s+зовут|кто\s+ты|ты\s+кто|тво[её]\s+имя|what\s+is\s+your\s+name|who\s+are\s+you)/.test(lower)) {
    return { intent: "identity", strength: 8 };
  }

  if (/(ты\s+живой|ты\s+настоящий|ты\s+человек|are\s+you\s+alive|are\s+you\s+real|are\s+you\s+human)/.test(lower) || isTinyChatQuestion(lower)) {
    return { intent: "liveness", strength: 8 };
  }

  if (/(ты\s+ии|ты\s+ai|ты\s+бот|are\s+you\s+ai|are\s+you\s+a\s+bot)/.test(lower)) {
    return { intent: "liveness", strength: 7 };
  }

  if (/(если\s+я\s+попрошу|ты\s+найд[её]шь|можешь\s+найти|сможешь\s+найти|can\s+you\s+find|will\s+you\s+find)/.test(lower)) {
    return { intent: "abilityCheck", strength: 8 };
  }

  if (/(как\s+дела|как\s+ты|что\s+делаешь|ты\s+тут|ты\s+здесь|how\s+are\s+you)/.test(lower)) {
    return { intent: "personalQuestion", strength: 7 };
  }

  let best: { intent: SpaceIntent; strength: number } = { intent: "search", strength: 0 };

  (Object.keys(INTENT_KEYWORDS) as SpaceIntent[]).forEach((intent) => {
    const strength = INTENT_KEYWORDS[intent].reduce((sum, keyword) => {
      return lower.includes(normalize(keyword)) ? sum + 1 : sum;
    }, 0);

    if (strength > best.strength) best = { intent, strength };
  });

  if (tokens.length === 0 && best.intent === "greeting") return { intent: "greeting", strength: 5 };
  if (best.intent === "chat" && /умееш|можеш|можешь|can you|what can/.test(lower)) return { intent: "capabilities", strength: best.strength + 2 };
  if (best.strength === 0 && lower.endsWith("?")) return { intent: "chat", strength: 1 };
  return best;
}

function isShortSocial(query: string, intent: SpaceIntent) {
  const tokens = tokenize(query);
  return tokens.length <= 1 && (intent === "greeting" || intent === "thanks" || intent === "chat" || intent === "personalQuestion" || intent === "liveness");
}

function hasPronounFollowup(query: string, memory: SpaceMemory) {
  const lower = normalize(query);
  return Boolean(memory.lastSubject) && PRONOUN_HINTS.some((hint) => lower.split(" ").includes(hint));
}

function isBroadQuery(query: string, intent: SpaceIntent, strength: number) {
  const tokens = tokenize(query);
  if (isShortSocial(query, intent)) return false;
  if (intent === "capabilities" || intent === "identity" || intent === "liveness" || intent === "personalQuestion" || intent === "abilityCheck" || intent === "thanks") return false;
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

function extractSubject(query: string, tokens: string[], memory: SpaceMemory) {
  if (hasPronounFollowup(query, memory)) return memory.lastSubject;

  const explicit = query.match(/(?:про|about|о)\s+([^?.!,]+)/i)?.[1]?.trim();
  if (explicit) return compactText(explicit, 72).replace(/[?.!,]+$/g, "");

  const capitalized = query.match(/[A-ZА-ЯЁІЇЄҐ][a-zа-яёіїєґ]+(?:\s+[A-ZА-ЯЁІЇЄҐ][a-zа-яёіїєґ]+){0,3}/g);
  if (capitalized?.length) return capitalized[capitalized.length - 1].trim();

  return tokens.slice(0, 3).join(" ");
}

function buildEffectiveTokens(query: string, memory: SpaceMemory) {
  const tokens = tokenize(query);
  if (!hasPronounFollowup(query, memory)) return tokens;
  return Array.from(new Set([...tokens, ...tokenize(memory.lastSubject)])).slice(0, 18);
}

function countMatches(haystack: string, tokens: string[]) {
  return tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0);
}

function rankPost(post: IngestedPost, queryTokens: string[], intent: SpaceIntent, memory: SpaceMemory) {
  const haystack = getPostSearchText(post);
  let score = 0;
  let matched = 0;

  queryTokens.forEach((token) => {
    if (haystack.includes(token)) {
      matched += 1;
      score += token.length > 4 ? 5.5 : 2.8;
    }
  });

  if (!matched) return 0;

  const tagText = normalize([post.tag, ...(post.tags || [])].join(" "));
  if (intent === "recipe" && /(recipe|food|cook|еда|кухн|готов|рецепт|пирог|салат|суп)/.test(tagText + " " + haystack)) score += 8;
  if (intent === "images" && post.media.some((item) => item.kind === "image")) score += 8;
  if (intent === "video" && post.media.some((item) => item.kind === "video")) score += 8;
  if (intent === "weather" && /(погод|weather|forecast|дожд|снег|ветер)/.test(haystack)) score += 8;
  if (intent === "trend") score += Math.min(5, Math.max(0, post.links?.length || 0));

  const sourceBoost = memory.favoriteSources[post.source.handle] || 0;
  score += Math.min(2, sourceBoost * 0.25);

  const created = Date.parse(post.createdAt || "");
  if (Number.isFinite(created)) {
    const ageHours = Math.max(0, (Date.now() - created) / 36e5);
    score += Math.max(0, 3 - ageHours / 12);
  }

  if (post.source.verified) score += 0.8;
  if (post.media.length) score += 0.7;
  if (!hasIntentMedia(post, intent)) score -= 14;

  // не даём случайным постам пролезать по одному общему слову
  if (queryTokens.length >= 3 && matched < 2 && intent !== "images" && intent !== "video") score -= 9;
  return Math.max(0, score);
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
    text: compactText(post.text, 360),
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

function makeChips(ui: SpaceUi, intent: SpaceIntent, tokens: string[]): SpaceBlock {
  let items = ui.chipsGeneral;
  if (intent === "capabilities" || intent === "identity" || intent === "liveness" || intent === "personalQuestion" || intent === "abilityCheck" || intent === "chat") items = ui.chipsCapability;
  if (intent === "recipe") items = ui.chipsRecipe;
  if (intent === "images" || intent === "video") items = ui.chipsImage;
  if (intent === "trend" || intent === "fact") items = ui.chipsTrend;

  if (tokens.length && intent === "search") {
    items = [tokens.slice(0, 3).join(" "), ...ui.chipsGeneral].filter(Boolean).slice(0, 3);
  }

  return { type: "chips", title: ui.continueTitle, items };
}

function learnFromQuery(memory: SpaceMemory, query: string, intent: SpaceIntent, tokens: string[], locale: Locale) {
  memory.turns += 1;
  memory.lastIntent = intent;
  memory.languageHints[locale] = (memory.languageHints[locale] || 0) + 1;
  memory.lastUserWords = tokens.slice(0, 8);

  const lower = normalize(query);
  if (/корот|кратк|short|brief/.test(lower)) memory.userStyle.wantsShort += 0.6;
  if (/источник|source|пост|канал/.test(lower)) memory.userStyle.wantsSources += 0.5;
  if (/фото|картин|видео|image|photo|video/.test(lower)) memory.userStyle.likesMedia += 0.5;
  if (/бро|друг|родн|спасибо|thanks/.test(lower)) memory.userStyle.likesWarmTone += 0.3;

  tokens.forEach((token) => {
    memory.topics[token] = (memory.topics[token] || 0) + 1;
  });
}

function updateMemory(memory: SpaceMemory, query: string, intent: SpaceIntent, found: IngestedPost[], locale: Locale, subject: string, tokens: string[]) {
  learnFromQuery(memory, query, intent, tokens, locale);

  if (subject) memory.lastSubject = subject;

  const best = found[0];
  if (best) {
    memory.lastResult = {
      query,
      subject: subject || memory.lastSubject,
      intent,
      postTitle: best.source.title || best.source.handle,
      sourceTitle: best.source.title,
      sourceHandle: best.source.handle,
      postText: compactText(best.text, 420),
      createdAt: best.createdAt,
      at: Date.now(),
    };
  } else if (subject) {
    memory.lastResult = {
      query,
      subject,
      intent,
      at: Date.now(),
    };
  }

  found.slice(0, 2).forEach((post) => {
    if (!post.source.handle) return;
    memory.favoriteSources[post.source.handle] = (memory.favoriteSources[post.source.handle] || 0) + 0.25;
  });

  writeMemory(memory);
}

function answerFromPreviousFact(ui: SpaceUi, query: string, memory: SpaceMemory): string | null {
  if (!hasPronounFollowup(query, memory) || !memory.lastResult?.subject) return null;
  const lower = normalize(query);
  const last = memory.lastResult;

  if (/(богат|состояни|миллиард|rich|wealth)/.test(lower)) {
    return `Ты про ${last.subject}. В найденном посте речь была про состояние, но я не буду подтверждать рейтинг без точного источника. Могу показать этот пост или поискать шире.`;
  }

  if (last.postText) {
    return `Ты про ${last.subject}. По прошлому найденному посту смысл такой: ${compactText(last.postText, 180)}`;
  }

  return ui.factCareful;
}

function answerAbility(ui: SpaceUi, query: string) {
  const lower = normalize(query);
  if (/(видео|video|ролик|clip)/.test(lower)) return ui.abilityVideo;
  return ui.abilitySearch;
}

export function buildSpaceAnswer(params: {
  query: string;
  posts: IngestedPost[];
  locale: Locale;
}): SpaceAnswer {
  const { query, posts, locale } = params;
  const ui = getUi(locale, query);
  const memory = readMemory();
  const { intent, strength } = detectIntent(query);
  const tokens = buildEffectiveTokens(query, memory);
  const rawTokens = tokenize(query);
  const subject = extractSubject(query, rawTokens, memory);
  const seed = query.length + memory.turns + tokens.join("").length;

  if (intent === "greeting" || isShortSocial(query, intent)) {
    updateMemory(memory, query, intent, [], locale, subject, rawTokens);
    return { text: pick(ui.hello, seed), blocks: [makeChips(ui, "chat", rawTokens)], mode: "talk" };
  }

  if (intent === "thanks") {
    updateMemory(memory, query, intent, [], locale, subject, rawTokens);
    return { text: pick(ui.thanks, seed), blocks: [], mode: "talk" };
  }

  if (intent === "capabilities") {
    updateMemory(memory, query, intent, [], locale, subject, rawTokens);
    return { text: ui.capabilities, blocks: [makeChips(ui, "capabilities", rawTokens)], mode: "talk" };
  }

  if (intent === "identity") {
    updateMemory(memory, query, intent, [], locale, subject, rawTokens);
    return { text: ui.identity, blocks: [makeChips(ui, "identity", rawTokens)], mode: "talk" };
  }

  if (intent === "liveness") {
    updateMemory(memory, query, intent, [], locale, subject, rawTokens);
    return { text: ui.liveness, blocks: [makeChips(ui, "liveness", rawTokens)], mode: "talk" };
  }

  if (intent === "personalQuestion") {
    updateMemory(memory, query, intent, [], locale, subject, rawTokens);
    return { text: ui.askMe, blocks: [makeChips(ui, "personalQuestion", rawTokens)], mode: "talk" };
  }

  if (intent === "abilityCheck") {
    updateMemory(memory, query, intent, [], locale, subject, rawTokens);
    return { text: answerAbility(ui, query), blocks: [makeChips(ui, "abilityCheck", rawTokens)], mode: "talk" };
  }

  if (intent === "weather" && isBroadQuery(query, intent, strength)) {
    updateMemory(memory, query, intent, [], locale, subject, rawTokens);
    return { text: ui.weatherClarify, blocks: [makeChips(ui, intent, rawTokens)], mode: "clarify" };
  }

  if (isBroadQuery(query, intent, strength)) {
    updateMemory(memory, query, intent, [], locale, subject, rawTokens);
    const text = intent === "trend" ? ui.trendClarify : ui.clarify;
    return { text, blocks: [makeChips(ui, intent, rawTokens)], mode: "clarify" };
  }

  if (intent === "fact") {
    const previous = answerFromPreviousFact(ui, query, memory);
    if (previous) {
      updateMemory(memory, query, intent, [], locale, memory.lastSubject || subject, tokens);
      return { text: previous, blocks: [makeChips(ui, "fact", rawTokens)], mode: "answer" };
    }
  }

  const ranked = posts
    .map((post) => ({ post, score: rankPost(post, tokens, intent, memory), matches: countMatches(getPostSearchText(post), tokens) }))
    .filter(({ score, matches }) => score >= 11 && matches >= (tokens.length >= 4 && intent !== "images" && intent !== "video" ? 2 : 1))
    .sort((a, b) => b.score - a.score)
    .slice(0, intent === "images" || intent === "video" ? 7 : 2);

  const found = ranked.map((item) => item.post);

  if (!ranked.length) {
    updateMemory(memory, query, intent, [], locale, subject, tokens);
    return { text: intent === "fact" ? ui.factCareful : ui.noExact, blocks: [makeChips(ui, intent, rawTokens)], mode: "clarify" };
  }

  updateMemory(memory, query, intent, found, locale, subject, tokens);

  const blocks: SpaceBlock[] = [];
  const best = ranked[0];

  if (intent === "images" || intent === "video") {
    const gallery = buildGallery(found, intent === "video" ? ui.videoTitle : ui.galleryTitle);
    if (gallery) blocks.push(gallery);
    if (!gallery) blocks.push(postToBlock(best.post, best.score));
  } else {
    blocks.push(postToBlock(best.post, best.score));
  }

  blocks.push(makeChips(ui, intent, rawTokens));

  let text = ui.foundOne;
  if (intent === "recipe") text = ui.recipeFound;
  if (intent === "images") text = ui.foundGallery;
  if (intent === "video") text = ui.foundVideo;

  return { text, blocks, mode: blocks.length > 1 ? "show" : "answer" };
}
