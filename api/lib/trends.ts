import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { IngestedPost } from "./contracts.js";
import { buildAttentionCandidates, tokenOverlapScore, type AttentionCandidate } from "./attention-brain.js";
import {
  buildBlockedSourceHandles,
  cleanTrendText,
  isGenericSingleTrendWord,
  isKnownTrendEntity,
  isTrendNoisePhrase,
  isTrendNoiseToken,
  isUnsafeObjectKey,
  normalizeTrendToken,
} from "./trend-noise.js";

const TRENDS_DIR = "data/trends";

type TrendSource = {
  id: string;
  title: string;
  username?: string;
  avatarUrl?: string;
  mentions: number;
};

type TrendCountry = {
  code: string;
  mentions: number;
  sourceCount?: number;
};

type TrendPost = {
  id: string | number;
  text: string;
  url?: string;
  publishedAt?: string;
  sourceTitle?: string;
  sourceUsername?: string;
  sourceAvatarUrl?: string;
};

type TrendItem = {
  topic: string;
  word: string;
  mentions: number;
  momentum: number;
  change: string;
  sourceCount: number;
  countries: TrendCountry[];
  topSources: TrendSource[];
  history: number[];
  firstSeenAt: string | null;
  lastSeenAt: string | null;
  examples: TrendPost[];
  signals?: string[];
  category?: string;
  categories?: string[];
  score?: number;
};

function cleanText(text: string, blockedHandles: Set<string>) {
  return cleanTrendText(text, blockedHandles);
}

function normalizeToken(value: string) {
  return normalizeTrendToken(value);
}

function isLikelyNoiseToken(token: string, blockedHandles: Set<string> = new Set()) {
  return isTrendNoiseToken(token, blockedHandles);
}

function isGoodSingleToken(token: string, blockedHandles: Set<string> = new Set()) {
  const normalized = normalizeToken(token);
  if (isLikelyNoiseToken(normalized, blockedHandles)) return false;
  if (isGenericSingleTrendWord(normalized)) return false;
  if (isKnownTrendEntity(normalized)) return true;
  if (/^[a-z0-9-]+$/.test(normalized) && normalized.length < 5) return false;
  return normalized.length >= 4;
}

function isGoodPhrase(parts: string[], blockedHandles: Set<string> = new Set()) {
  if (parts.length < 2) return false;
  if (isTrendNoisePhrase(parts, blockedHandles)) return false;
  if (parts.some((part) => isLikelyNoiseToken(part, blockedHandles))) return false;

  const meaningful = parts.filter(
    (part) => isGoodSingleToken(part, blockedHandles) || isKnownTrendEntity(normalizeToken(part)),
  );

  return meaningful.length > 0;
}

function extractTokens(text: string, blockedHandles: Set<string>): string[] {
  return cleanText(text, blockedHandles)
    .split(" ")
    .map(normalizeToken)
    .filter((token) => !isLikelyNoiseToken(token, blockedHandles));
}

function extractTopics(text: string, blockedHandles: Set<string>): string[] {
  const tokens = extractTokens(text, blockedHandles);
  const topics: string[] = [];

  // Phrases are more useful for margeleT attention than random single words.
  // Example: "куриное филе", "ид аль адха", "доля в бизнесе".
  for (let i = 0; i < tokens.length - 2; i++) {
    const phrase = [tokens[i], tokens[i + 1], tokens[i + 2]];
    if (isGoodPhrase(phrase, blockedHandles)) topics.push(phrase.join(" "));
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    const phrase = [tokens[i], tokens[i + 1]];
    if (isGoodPhrase(phrase, blockedHandles)) topics.push(phrase.join(" "));
  }

  for (const token of tokens) {
    if (isGoodSingleToken(token, blockedHandles)) topics.push(token);
  }

  return topics;
}

function getPostAnalysisText(post: IngestedPost): string {
  const record = post as any;

  // Only content fields are allowed here. Do not add source/channel fields.
  // Source data is used below only for attribution, never for topic extraction.
  return [record.text, record.caption, record.title]
    .filter((value) => typeof value === "string" && value.trim())
    .join("\n");
}

function getPostTime(post: IngestedPost): number {
  const raw =
    (post as any).publishedAt ||
    (post as any).createdAt ||
    (post as any).date ||
    (post as any).timestamp ||
    Date.now();

  const time = new Date(raw).getTime();
  return Number.isFinite(time) ? time : Date.now();
}

function getPostUrl(post: IngestedPost): string | undefined {
  return (
    (post as any).url ||
    (post as any).telegramUrl ||
    (post as any).postUrl ||
    (post as any).link
  );
}

function getSourceId(post: IngestedPost): string {
  const handle = String(
    (post as any).source?.handle ||
      (post as any).sourceUsername ||
      (post as any).channelUsername ||
      "",
  )
    .replace(/^@+/, "")
    .trim()
    .toLowerCase();

  const country = String((post as any).sourceCountryCode || "").trim().toLowerCase();

  if (handle) return country ? `${country}:${handle}` : handle;

  return String(
    (post as any).sourceId ||
      (post as any).channelId ||
      (post as any).postUrl ||
      "telegram",
  );
}

function getSourceTitle(post: IngestedPost): string {
  return String(
    (post as any).source?.title ||
      (post as any).sourceTitle ||
      (post as any).channelTitle ||
      (post as any).sourceName ||
      (post as any).channelName ||
      (post as any).source?.handle ||
      "Telegram",
  );
}

function getSourceUsername(post: IngestedPost): string | undefined {
  const username =
    (post as any).source?.handle ||
    (post as any).sourceUsername ||
    (post as any).channelUsername ||
    (post as any).username;

  return username ? String(username).replace(/^@+/, "").trim() : undefined;
}

function getSourceAvatar(post: IngestedPost): string | undefined {
  return (
    (post as any).source?.avatar ||
    (post as any).sourceAvatarUrl ||
    (post as any).channelAvatarUrl ||
    (post as any).avatarUrl ||
    (post as any).photoUrl ||
    undefined
  );
}


const TREND_PARENT_BY_CHILD: Record<string, string> = {
  news_all: "news",
  news_world: "news",
  news_breaking: "news",
  news_regions: "news",
  news_incidents: "news",
  news_investigations: "news",
  news_good: "news",
  news_no_negative: "news",
  politics_all: "politics",
  politics_world: "politics",
  politics_government: "politics",
  politics_elections: "politics",
  politics_conflicts: "politics",
  war: "politics",
  politics_opinion: "politics",
  politics_other: "politics",
  economy_all: "economy",
  economy_macro: "economy",
  economy_markets: "economy",
  economy_industry: "economy",
  economy_energy: "economy",
  economy_logistics: "economy",
  economy_other: "economy",
  business_all: "business",
  business_companies: "business",
  business_entrepreneurship: "business",
  business_ecommerce: "business",
  business_management: "business",
  business_cases: "business",
  business_other: "business",
  finance_all: "finance",
  finance_banks: "finance",
  finance_payment_systems: "finance",
  finance_investing: "finance",
  finance_trading: "finance",
  finance_personal: "finance",
  crypto: "finance",
  finance_other: "finance",
  technology_all: "technology",
  technology_software: "technology",
  technology_dev: "technology",
  technology_web: "technology",
  internet: "technology",
  gadgets: "technology",
  ai: "technology",
  technology_other: "technology",
  electronics_home_appliances: "electronics",
  electronics_pc: "electronics",
  electronics_construction: "electronics",
  electronics_trends: "electronics",
  electronics_brands: "electronics",
  electronics_delivery: "electronics",
  electronics_reviews: "electronics",
  science_all: "science",
  science_research: "science",
  science_discoveries: "science",
  science_medicine: "science",
  space: "science",
  science_other: "science",
  education_all: "education",
  education_courses: "education",
  education_languages: "education",
  education_self: "education",
  history: "education",
  books: "education",
  education_other: "education",
  culture_all: "culture",
  art: "culture",
  design: "culture",
  photography: "culture",
  cinema: "culture",
  series: "culture",
  music: "culture",
  culture_other: "culture",
  gaming_all: "gaming",
  gaming_mobile: "gaming",
  gaming_pc: "gaming",
  gaming_console: "gaming",
  gaming_esports: "gaming",
  gaming_other: "gaming",
  humor_all: "humor",
  memes: "humor",
  humor_ironical: "humor",
  humor_satire: "humor",
  humor_other: "humor",
  sports_all: "sports",
  sports_championships: "sports",
  sports_matches: "sports",
  sports_news: "sports",
  sports_people: "sports",
  sports_transfers: "sports",
  sports_analytics: "sports",
  sports_other: "sports",
  fitness_all: "fitness",
  fitness_training: "fitness",
  fitness_nutrition: "fitness",
  fitness_body: "fitness",
  fitness_other: "fitness",
  health_all: "health",
  health_medicine: "health",
  health_research: "health",
  health_food: "health",
  health_advice: "health",
  health_other: "health",
  travel_all: "travel",
  travel_rest: "travel",
  travel_countries: "travel",
  travel_routes: "travel",
  travel_hotels: "travel",
  travel_other: "travel",
  food_all: "food",
  food_products: "food",
  recipes: "food",
  food_other: "food",
  food_service_places: "food_service",
  food_service_delivery: "food_service",
  food_service_new: "food_service",
  food_service_jobs: "food_service",
  food_service_software: "food_service",
  food_service_reviews: "food_service",
  psychology_all: "psychology",
  psychology_self: "psychology",
  psychology_other: "psychology",
  fashion_all: "fashion",
  fashion_style: "fashion",
  fashion_brands: "fashion",
  fashion_other: "fashion",
  nature_all: "nature",
  nature_ecology: "nature",
  nature_plants: "nature",
  animals: "nature",
  nature_other: "nature",
  people_all: "people",
  people_blogs: "people",
  people_interviews: "people",
  people_other: "people",
  marketing_all: "marketing",
  marketing_smm: "marketing",
  marketing_ads: "marketing",
  marketing_brand: "marketing",
  marketing_other: "marketing",
  startups_all: "startups",
  startups_cases: "startups",
  startups_founders: "startups",
  startups_invest: "startups",
  startups_other: "startups",
  jobs_all: "jobs",
  jobs_vacancies: "jobs",
  jobs_remote: "jobs",
  jobs_parttime: "jobs",
  jobs_career: "jobs",
  jobs_freelance: "jobs",
  jobs_resume: "jobs",
  jobs_interviews: "jobs",
  jobs_learning: "jobs",
  jobs_other: "jobs",
  real_estate_all: "real_estate",
  real_estate_housing: "real_estate",
  real_estate_invest: "real_estate",
  real_estate_build: "real_estate",
  real_estate_other: "real_estate",
  transport_auto: "auto",
  transport_moto: "auto",
  transport_other: "auto",
  transport_reviews: "auto",
  transport_other2: "auto",
  telegram_all: "telegram",
  telegram_channels: "telegram",
  telegram_bots: "telegram",
  telegram_ton: "telegram",
  telegram_updates: "telegram",
  telegram_other: "telegram",
  other_misc: "other",
};

function normalizeCategoryText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, " ")
    .replace(/[^a-zа-я0-9_]+/gi, "_")
    .replace(/^_+|_+$/g, "");
}

function getParentCategory(value: string) {
  return TREND_PARENT_BY_CHILD[value] || "";
}

function normalizeCategory(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = normalizeCategoryText(value);
  if (!normalized) return null;

  const aliases: Record<string, string> = {
    tech: "technology",
    it: "technology",
    tehnologii: "technology",
    технологии: "technology",
    internet: "internet",
    интернет: "internet",
    software: "technology_software",
    софт: "technology_software",
    electronics: "electronics",
    электроника: "electronics",
    gadgets: "gadgets",
    гаджеты: "gadgets",
    auto: "auto",
    avto: "auto",
    cars: "transport_auto",
    car: "transport_auto",
    авто: "transport_auto",
    автомобили: "transport_auto",
    машины: "transport_auto",
    transport: "auto",
    транспорт: "auto",
    economy: "economy",
    economics: "economy",
    экономика: "economy",
    finance: "finance",
    финансы: "finance",
    business: "business",
    бизнес: "business",
    news: "news",
    новости: "news",
    politics: "politics",
    политика: "politics",
    science: "science",
    наука: "science",
    education: "education",
    образование: "education",
    культура: "culture",
    culture: "culture",
    gaming: "gaming",
    games: "gaming",
    игры: "gaming",
    sports: "sports",
    спорт: "sports",
    health: "health",
    здоровье: "health",
    travel: "travel",
    путешествия: "travel",
    food: "food",
    еда: "food",
    recipes: "recipes",
    recipe: "recipes",
    кулинария: "recipes",
    рецепты: "recipes",
    nature: "nature",
    природа: "nature",
    animals: "animals",
    animal: "animals",
    животные: "animals",
    marketing: "marketing",
    маркетинг: "marketing",
    startups: "startups",
    стартапы: "startups",
    telegram_channels: "telegram",
    other_misc: "other",
    misc: "other",
    разное: "other",
    другое: "other",
    other: "other",
  };

  return aliases[normalized] || normalized;
}
function collectCategoryValues(value: unknown, out: Set<string>) {
  if (!value) return;

  if (typeof value === "string") {
    const category = normalizeCategory(value);
    if (category) {
      out.add(category);
      const parent = getParentCategory(category);
      if (parent) out.add(parent);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) collectCategoryValues(item, out);
    return;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    collectCategoryValues(record.value, out);
    collectCategoryValues(record.id, out);
    collectCategoryValues(record.slug, out);
    collectCategoryValues(record.tag, out);
    collectCategoryValues(record.category, out);
  }
}

function getPostCategories(post: IngestedPost): string[] {
  const categories = new Set<string>();
  const record = post as any;

  collectCategoryValues(record.category, categories);
  collectCategoryValues(record.tag, categories);
  collectCategoryValues(record.tags, categories);
  collectCategoryValues(record.contentTags, categories);
  collectCategoryValues(record.sourceTags, categories);
  collectCategoryValues(record.channelTags, categories);
  collectCategoryValues(record.source?.tags, categories);
  collectCategoryValues(record.channel?.tags, categories);
  collectCategoryValues(record.source?.category, categories);
  collectCategoryValues(record.channel?.category, categories);

  return [...categories].filter((item) => item !== "all");
}


function addCategoryScore(
  categoryMap: Record<string, number>,
  category: string,
  weight = 1,
) {
  const safeCategory = normalizeCategory(category) || "all";
  if (!safeCategory || safeCategory === "all" || isUnsafeObjectKey(safeCategory)) return;

  categoryMap[safeCategory] = (categoryMap[safeCategory] || 0) + weight;

  const parent = getParentCategory(safeCategory);
  if (parent && parent !== safeCategory && !isUnsafeObjectKey(parent)) {
    categoryMap[parent] = (categoryMap[parent] || 0) + weight;
  }
}

function inferPostCategories(post: IngestedPost, text: string): string[] {
  const record = post as any;
  const sourceTitle = getSourceTitle(post);
  const sourceHandle = getSourceUsername(post) || "";
  const haystack = `${text}\n${sourceTitle}\n${sourceHandle}`.toLowerCase();
  const categories = new Set<string>();

  const rules: Array<[RegExp, string]> = [
    [/\b(авто|автомоб|машин|tesla|toyota|honda|bmw|mercedes|geely|byd|автобус|пикап|грузовик|дтп|дорог|car|cars|truck|pickup|motor|ev)\b/i, "auto"],
    [/\b(банк|сбер|тинькофф|курс|доллар|рубл|юан|биткоин|bitcoin|btc|crypto|крипт|binance|ton|бирж|акци|инвест|трейдинг)\b/i, "finance"],
    [/\b(openai|chatgpt|gpt|ai|ии|нейросет|nvidia|iphone|apple|google|microsoft|android|software|dev|код|программист|технолог)\b/i, "technology"],
    [/\b(полит|выбор|президент|правительств|трамп|путин|войн|армия|ракет|обстрел|санкци|конфликт|war|government|election)\b/i, "politics"],
    [/\b(новост|срочн|breaking|происшеств|инцидент|пожар|авария|погод|шторм|дожд|гроза)\b/i, "news"],
    [/\b(бизнес|стартап|предприним|маркетплейс|ozon|wildberries|компани|продаж|рынок|startup|business|ecommerce)\b/i, "business"],
    [/\b(реклам|маркетинг|smm|бренд|таргет|креатив|продвижен|marketing|ads)\b/i, "marketing"],
    [/\b(кино|фильм|сериал|музык|концерт|театр|культур|movie|film|series|music)\b/i, "culture"],
    [/\b(игр|game|gaming|steam|gta|minecraft|roblox|playstation|xbox)\b/i, "gaming"],
    [/\b(спорт|футбол|хоккей|матч|лига|спартак|зенит|месси|football|sport)\b/i, "sports"],
    [/\b(еда|рецепт|кухн|готов|продукт|ресторан|кафе|доставк|food|recipe)\b/i, "food"],
    [/\b(путешеств|тур|отел|виза|рейс|авиа|билет|travel|hotel|flight|visa)\b/i, "travel"],
    [/\b(здоров|медицин|болезн|врач|клиник|питание|health|medicine)\b/i, "health"],
    [/\b(учеб|курс|образован|школ|университет|книг|истори|education|study|course)\b/i, "education"],
    [/\b(наук|исследован|космос|space|science|research)\b/i, "science"],
    [/\b(дом|квартир|ипотек|жк|новострой|недвиж|аренд|real estate|housing)\b/i, "real_estate"],
    [/\b(животн|птиц|кот|собак|растен|эколог|природ|лес|nature|animal|ecology)\b/i, "nature"],
    [/\b(работ|ваканс|карьер|резюме|фриланс|job|career|vacancy)\b/i, "jobs"],
    [/\b(telegram|телеграм|тон |ton |бот|канал)\b/i, "telegram"],
  ];

  for (const [regex, category] of rules) {
    if (regex.test(haystack)) categories.add(category);
  }

  const explicit = getPostCategories(post).filter((category) => category !== "other");
  for (const category of explicit) categories.add(category);

  return [...categories];
}

function getDominantCategory(
  categoryMap: Record<string, number>,
  fallback: string,
) {
  const winner = Object.entries(categoryMap)
    .filter(([category]) => category && category !== "all")
    .sort((a, b) => b[1] - a[1])[0];

  return winner?.[0] || fallback;
}

function getTrendCategories(
  categoryMap: Record<string, number>,
  fallback: string,
) {
  const categories = Object.entries(categoryMap)
    .filter(([category]) => category && category !== "all" && !isUnsafeObjectKey(category))
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  if (fallback && fallback !== "all" && !categories.includes(fallback)) {
    categories.push(fallback);
  }

  for (const category of [...categories]) {
    const parent = getParentCategory(category);
    if (parent && !categories.includes(parent)) categories.push(parent);
  }

  return categories;
}

function calcMomentum(history: number[]) {
  const mid = Math.floor(history.length / 2);
  const previous = history.slice(0, mid).reduce((sum, value) => sum + value, 0);
  const current = history.slice(mid).reduce((sum, value) => sum + value, 0);

  if (previous <= 0 && current <= 0) return 0;
  if (previous <= 0) return current * 100;

  return Math.round(((current - previous) / previous) * 100);
}

function titleCaseWord(word: string) {
  const normalized = normalizeToken(word);

  const upper = new Set([
    "ai",
    "gpt",
    "btc",
    "eth",
    "ton",
    "nft",
    "etf",
    "usa",
    "us",
    "uk",
    "uae",
  ]);
  const brands: Record<string, string> = {
    openai: "OpenAI",
    chatgpt: "ChatGPT",
    iphone: "iPhone",
    youtube: "YouTube",
    tiktok: "TikTok",
    spacex: "SpaceX",
    telegram: "Telegram",
    bitcoin: "Bitcoin",
    ethereum: "Ethereum",
    tesla: "Tesla",
    nvidia: "NVIDIA",
    apple: "Apple",
    google: "Google",
    microsoft: "Microsoft",
    ozon: "Ozon",
    wildberries: "Wildberries",
  };

  if (brands[normalized]) return brands[normalized];
  if (upper.has(normalized)) return normalized.toUpperCase();

  return word.charAt(0).toUpperCase() + word.slice(1);
}

function formatTopic(topic: string) {
  return topic
    .split(" ")
    .map((part, index) => {
      if (index === 0) return titleCaseWord(part);
      const normalized = normalizeToken(part);
      if (["etf", "ai", "gpt", "btc", "eth", "ton"].includes(normalized))
        return normalized.toUpperCase();
      return part;
    })
    .join(" ");
}

function inferCategory(topic: string) {
  const text = topic.toLowerCase();

  if (
    /bitcoin|btc|ethereum|eth|crypto|ton|binance|банк|сбер|доллар|курс|нефть|oil/.test(
      text,
    )
  )
    return "finance";
  if (/tesla|toyota|honda|bmw|geely|rezvani|авто|машин|автомоб|пикап|грузовик|дорог|дтп|car|cars|pickup|truck|ev|электромоб/.test(text)) return "auto";
  if (
    /openai|chatgpt|gpt|nvidia|iphone|apple|google|microsoft|ai|ии|нейросет/.test(
      text,
    )
  )
    return "technology";
  if (/спартак|зенит|футбол|football|messi|месси|спорт|лига/.test(text))
    return "sports";
  if (/погод|гроза|дожд|москва|moscow|срочн|новост|breaking/.test(text))
    return "news";
  if (
    /трамп|trump|иран|iran|украин|полит|выбор|government|president/.test(text)
  )
    return "politics";
  if (/игр|game|gaming|steam|gta|dtf/.test(text)) return "gaming";
  if (/еда|рецепт|food|картош|доставка/.test(text)) return "food";
  if (/жук|мурав|птиц|живот|nature|animal|капибар/.test(text)) return "nature";
  if (/кино|сериал|film|movie|music|музык/.test(text)) return "culture";
  if (/курс|обуч|education|study|школ|университет/.test(text))
    return "education";
  if (
    /бизнес|стартап|startup|marketplace|маркетплейс|ozon|wildberries/.test(text)
  )
    return "business";
  if (/travel|турц|виза|отел|hotel|flight/.test(text)) return "travel";
  if (/здоров|health|медицин|питание/.test(text)) return "health";
  if (/реклам|marketing|smm|telegram ads/.test(text)) return "marketing";

  return "all";
}

function getTopicQuality(topic: string) {
  const parts = topic.split(" ");
  let quality = 0;

  if (parts.length === 1) quality -= 70;
  if (parts.length === 2) quality += 35;
  if (parts.length >= 3) quality += 45;

  for (const part of parts) {
    const normalized = normalizeToken(part);
    if (isKnownTrendEntity(normalized)) quality += 45;
    if (/\d/.test(normalized)) quality += 10;
    if (isGenericSingleTrendWord(normalized)) quality -= 20;
  }

  return quality;
}

function shouldKeepTopic(topic: string, mentions: number, sourceCount: number, blockedHandles: Set<string>) {
  const parts = topic.split(" ");

  if (parts.some((part) => isLikelyNoiseToken(part, blockedHandles))) return false;

  if (parts.length === 1) {
    const token = parts[0];
    const normalized = normalizeToken(token);
    if (!isGoodSingleToken(token, blockedHandles)) return false;

    // Single-word trends are allowed only for known entities/brands/places.
    // Everything else becomes noise too easily: "чтобы", "июня", "один", "active", etc.
    if (!isKnownTrendEntity(normalized)) return false;
  }

  // Trends must be real crossings of attention.
  // A single-source mention belongs to the normal feed/search, not to Trends.
  if (sourceCount < 2 || mentions < 2) return false;

  if (parts.length === 1) return false;

  return true;
}

function calcScore(
  trend: Pick<TrendItem, "topic" | "mentions" | "momentum" | "sourceCount">,
) {
  return (
    trend.mentions +
    Math.abs(trend.momentum) * 100 +
    trend.sourceCount * 50 +
    getTopicQuality(trend.topic)
  );
}


function findAttentionClusterKey(
  stats: Record<
    string,
    {
      mentions: number;
      history: number[];
      sourceMap: Record<string, TrendSource>;
      categoryMap: Record<string, number>;
      examples: TrendPost[];
      firstSeenAt: number | null;
      lastSeenAt: number | null;
      displayTitle: string;
      tokens: string[];
      signalMap: Record<string, number>;
    }
  >,
  candidate: AttentionCandidate,
) {
  let bestKey = "";
  let bestScore = 0;

  for (const [key, item] of Object.entries(stats)) {
    const overlap = tokenOverlapScore(item.tokens || [], candidate.tokens || []);
    if (overlap > bestScore) {
      bestScore = overlap;
      bestKey = key;
    }
  }

  // 0.5 means two snippets share enough strong words to be one attention topic,
  // but we still avoid gluing broad one-word trends together.
  return bestScore >= 0.5 ? bestKey : "";
}

function chooseDisplayTitle(current: string, next: string) {
  if (!current) return next;
  if (!next) return current;

  const currentLength = current.length;
  const nextLength = next.length;

  if (nextLength >= 18 && nextLength <= 86 && nextLength < currentLength) {
    return next;
  }

  return current;
}

export async function updateTrends(posts: IngestedPost[], countryCode: string) {
  const now = Date.now();
  const bucketHours = 4;
  const buckets = 12;
  const bucketMs = bucketHours * 60 * 60 * 1000;
  const blockedHandles = buildBlockedSourceHandles(posts);

  const stats: Record<
    string,
    {
      mentions: number;
      history: number[];
      sourceMap: Record<string, TrendSource>;
      categoryMap: Record<string, number>;
      examples: TrendPost[];
      firstSeenAt: number | null;
      lastSeenAt: number | null;
      displayTitle: string;
      tokens: string[];
      signalMap: Record<string, number>;
    }
  > = Object.create(null);

  for (const post of posts) {
    const text = getPostAnalysisText(post);
    if (!text) continue;
    const postTime = getPostTime(post);
    const age = now - postTime;

    if (age < 0) continue;

    const rawBucketIndex =
      age > buckets * bucketMs ? 0 : buckets - 1 - Math.floor(age / bucketMs);

    const bucketIndex = Math.min(
      buckets - 1,
      Math.max(0, Number.isFinite(rawBucketIndex) ? rawBucketIndex : 0),
    );

    const sourceId = getSourceId(post);
    const sourceTitle = getSourceTitle(post);
    const sourceUsername = getSourceUsername(post);
    const sourceAvatar = getSourceAvatar(post);
    const postCategories = getPostCategories(post);

    const candidates = buildAttentionCandidates(text, blockedHandles);

    for (const candidate of candidates) {
      const clusterKey = findAttentionClusterKey(stats, candidate);
      const topic = clusterKey || candidate.fingerprint || candidate.title.toLowerCase();

      if (!Object.prototype.hasOwnProperty.call(stats, topic)) {
        stats[topic] = {
          mentions: 0,
          history: Array.from({ length: buckets }, () => 0),
          sourceMap: Object.create(null),
          categoryMap: Object.create(null),
          examples: [],
          firstSeenAt: null,
          lastSeenAt: null,
          displayTitle: candidate.title,
          tokens: candidate.tokens,
          signalMap: Object.create(null),
        };
      }

      const item = stats[topic];
      item.displayTitle = chooseDisplayTitle(item.displayTitle, candidate.title);
      item.tokens = Array.from(new Set([...(item.tokens || []), ...candidate.tokens])).slice(0, 40);
      if (!item.signalMap || typeof item.signalMap !== "object") {
        item.signalMap = Object.create(null);
      }
      for (const signal of candidate.signals || []) {
        item.signalMap[signal] = (item.signalMap[signal] || 0) + 1;
      }

      if (!item || typeof item !== "object") {
        continue;
      }

      if (!item.sourceMap || typeof item.sourceMap !== "object") {
        item.sourceMap = Object.create(null);
      }

      if (!item.categoryMap || typeof item.categoryMap !== "object") {
        item.categoryMap = Object.create(null);
      }

      item.mentions += 1;
      if (!Array.isArray(item.history)) {
        item.history = Array.from({ length: buckets }, () => 0);
      }

      item.history[bucketIndex] = (item.history[bucketIndex] || 0) + 1;
      const inferredCategories = inferPostCategories(post, text);
      const effectiveCategories = inferredCategories.length
        ? inferredCategories
        : postCategories.filter((category) => category !== "other");

      for (const category of effectiveCategories) {
        addCategoryScore(item.categoryMap, category, 1);
      }

      if (!item.sourceMap[sourceId]) {
        item.sourceMap[sourceId] = {
          id: sourceId,
          title: sourceTitle,
          username: sourceUsername,
          avatarUrl: sourceAvatar,
          mentions: 0,
        };
      }

      item.sourceMap[sourceId].mentions += 1;

      item.firstSeenAt =
        item.firstSeenAt === null
          ? postTime
          : Math.min(item.firstSeenAt, postTime);
      item.lastSeenAt =
        item.lastSeenAt === null
          ? postTime
          : Math.max(item.lastSeenAt, postTime);

      if (item.examples.length < 5) {
        item.examples.push({
          id: (post as any).id || `${sourceId}-${postTime}`,
          text: candidate.snippet || text.slice(0, 280),
          url: getPostUrl(post),
          publishedAt: new Date(postTime).toISOString(),
          sourceTitle,
          sourceUsername,
          sourceAvatarUrl: sourceAvatar,
        });
      }
    }
  }

  const trends: TrendItem[] = Object.entries(stats)
    .filter(
      ([topic, item]) =>
        !isUnsafeObjectKey(topic) &&
        !!item &&
        typeof item === "object" &&
        Array.isArray(item.history) &&
        !!item.sourceMap &&
        typeof item.sourceMap === "object" &&
        !!item.categoryMap &&
        typeof item.categoryMap === "object",
    )
    .map(([topic, item]) => {
      const momentum = calcMomentum(item.history);
      const sourceCount = Object.keys(item.sourceMap).length;
      const displayTopic = item.displayTitle || formatTopic(topic);

      const topSources = Object.values(item.sourceMap)
        .sort((a, b) => b.mentions - a.mentions)
        .slice(0, 80);

      const signals = Object.entries(item.signalMap || {})
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([signal]) => signal)
        .slice(0, 5);

      const trend: TrendItem = {
        topic: displayTopic,
        word: displayTopic,
        mentions: item.mentions,
        momentum,
        change: `${momentum >= 0 ? "+" : ""}${momentum}%`,
        sourceCount,
        countries: [{ code: countryCode, mentions: item.mentions, sourceCount }],
        topSources,
        history: item.history,
        firstSeenAt: item.firstSeenAt
          ? new Date(item.firstSeenAt).toISOString()
          : null,
        lastSeenAt: item.lastSeenAt
          ? new Date(item.lastSeenAt).toISOString()
          : null,
        examples: item.examples,
        signals,
        category: getDominantCategory(item.categoryMap, inferCategory(topic)) || "all",
        categories: getTrendCategories(item.categoryMap, inferCategory(topic)),
      };

      trend.score = calcScore(trend);
      return trend;
    })
    .filter((trend) =>
      shouldKeepTopic(
        trend.topic.toLowerCase(),
        trend.mentions,
        trend.sourceCount,
        blockedHandles,
      ),
    )
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 150)
    .map((trend) => {
      const { score, ...publicTrend } = trend;
      return publicTrend;
    });

  const countryDir = path.join(process.cwd(), TRENDS_DIR, countryCode);
  await mkdir(countryDir, { recursive: true });
  await writeFile(
    path.join(countryDir, "trends.json"),
    JSON.stringify(trends, null, 2),
  );

  console.log(`📊 Trends updated for ${countryCode}: ${trends.length} topics`);
}
