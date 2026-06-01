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
};

type TrendPost = {
  id: string | number;
  text: string;
  url?: string;
  publishedAt?: string;
  sourceTitle?: string;
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

function normalizeCategory(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;

  const aliases: Record<string, string> = {
    tech: "technology",
    it: "technology",
    auto: "auto",
    cars: "auto",
    economy: "economy",
    economics: "economy",
    finance: "finance",
    business: "business",
    news: "news",
    politics: "politics",
    science: "science",
    education: "education",
    culture: "culture",
    gaming: "gaming",
    games: "gaming",
    sports: "sports",
    health: "health",
    travel: "travel",
    food: "food",
    nature: "nature",
    marketing: "marketing",
    startups: "startups",
  };

  return aliases[normalized] || normalized;
}

function collectCategoryValues(value: unknown, out: Set<string>) {
  if (!value) return;

  if (typeof value === "string") {
    const category = normalizeCategory(value);
    if (category) out.add(category);
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

function getDominantCategory(
  categoryMap: Record<string, number>,
  fallback: string,
) {
  const winner = Object.entries(categoryMap)
    .filter(([category]) => category && category !== "all")
    .sort((a, b) => b[1] - a[1])[0];

  return winner?.[0] || fallback;
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
  if (/tesla|авто|машин|car|cars|ev|электромоб/.test(text)) return "auto";
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

  // Public attention is not a single post from one channel.
  // A topic must be picked up by at least two independent sources.
  if (sourceCount < 2) return false;

  if (parts.length === 2 && mentions < 2) return false;
  if (parts.length >= 3 && mentions < 2) return false;

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
      for (const category of postCategories) {
        const safeCategory = normalizeCategory(category) || "all";
        if (safeCategory === "all" || isUnsafeObjectKey(safeCategory))
          continue;
        item.categoryMap[safeCategory] =
          (item.categoryMap[safeCategory] || 0) + 1;
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
        .slice(0, 8);

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
        countries: [{ code: countryCode, mentions: item.mentions }],
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
