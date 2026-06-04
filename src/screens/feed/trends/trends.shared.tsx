import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  SITE_TAG_GROUPS,
  getTagLabel,
  type SiteTagGroup,
} from "../../../lib/tags";
import { getAutotranslit, requestGTranslate } from "../../../lib/autotranslit";
import type { IngestedPost, Locale } from "../../../types/app";
import { getTrendsExtraCopy, type TrendsCopy } from "./trends.copy";
export { getTrendsCopy, getTrendsExtraCopy, type TrendsCopy } from "./trends.copy";

export type TrendSource = {
  id?: string;
  title: string;
  username?: string;
  avatarUrl?: string;
  mentions: number;
};

export type TrendCountry = {
  code: string;
  mentions: number;
  sourceCount?: number;
};

export type TrendPost = {
  id: string | number;
  text: string;
  url?: string;
  publishedAt?: string;
  sourceTitle?: string;
  sourceUsername?: string;
  sourceAvatarUrl?: string;
};

export type TrendItem = {
  word?: string;
  topic?: string;
  mentions: number;
  momentum?: number;
  change: string;
  sourceCount?: number;
  countries?: TrendCountry[];
  topSources?: TrendSource[];
  examples?: TrendPost[];
  signals?: string[];
  category?: string;
  categories?: string[];
};

export type TrendCategory = {
  value: string;
  emoji: string;
  label: string;
};

function stripCategoryEmoji(label: string) {
  return label.replace(/^[^\p{L}\p{N}]+/u, "").trim() || label;
}

const FOLLOWED_TOPICS_STORAGE_KEY = "margelet_followed_attention_topics_v1";

const FEATURED_CATEGORY_VALUES = [
  "all",
  "news",
  "politics",
  "economy",
  "business",
  "finance",
  "technology",
  "science",
  "education",
  "culture",
  "gaming",
  "sports",
  "health",
  "travel",
  "food",
  "auto",
  "nature",
  "marketing",
  "startups",
];

const SOURCE_PAGE_SIZE = 10;
const FREE_SOURCE_PREVIEW_LIMIT = 20;

const COUNTRY_LABELS: Record<string, string> = {
  ru: "Россия",
  ua: "Украина",
  us: "United States",
  in: "India",
  ir: "Iran",
  tr: "Türkiye",
  br: "Brasil",
  kz: "Kazakhstan",
  uz: "Uzbekistan",
  ae: "UAE",
  eg: "Egypt",
  pk: "Pakistan",
  id: "Indonesia",
  mx: "Mexico",
  sa: "Saudi Arabia",
  es: "España",
  it: "Italia",
  fr: "France",
  de: "Deutschland",
  ar: "Argentina",
  co: "Colombia",
  za: "South Africa",
  ng: "Nigeria",
  cn: "China",
  my: "Malaysia",
};


function formatCopy(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function makeDemoHandle(title: string) {
  const explicit: Record<string, string> = {
    "Москва Live": "moskva_live",
    "Новости Москвы": "moscowmap",
    Bloomberg: "bloomberg",
    "Market Watch": "marketwatch",
    CoinDesk: "coindesk",
    CryptoRank: "cryptorank_io",
    "Whale Alert": "whale_alert",
    TechCrunch: "techcrunch",
    "The Verge": "verge",
    "AI News": "artificial_intelligence_news",
    "Матч ТВ": "match_tv",
    Чемпионат: "championat",
    DTF: "dtfbest",
    Игры: "games",
  };

  if (explicit[title]) return explicit[title];

  return (
    title
      .toLowerCase()
      .replace(/[^a-zа-яё0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 32) || "margelet"
  );
}

export function readFollowedTopics() {
  try {
    const raw = localStorage.getItem(FOLLOWED_TOPICS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeFollowedTopics(value: string[]) {
  try {
    localStorage.setItem(FOLLOWED_TOPICS_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore localStorage errors
  }
}

export function refreshAutotranslit(locale?: Locale, delay = 80) {
  if (typeof window === "undefined" || !getAutotranslit()) return;

  window.setTimeout(() => requestGTranslate(locale), delay);
  window.setTimeout(() => requestGTranslate(locale), delay + 450);
}

export function getTopic(trend: TrendItem) {
  return trend.topic || trend.word || "Unknown topic";
}

function getTrendSnippet(trend: TrendItem) {
  const examples = Array.isArray(trend.examples) ? trend.examples : [];
  const text = String(examples[0]?.text || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return "";

  return text.length > 180 ? `${text.slice(0, 177).trim()}…` : text;
}

function getSourceSnippet(trend: TrendItem, source: TrendSource) {
  const examples = Array.isArray(trend.examples) ? trend.examples : [];
  const sourceTitle = String(source.title || "").toLowerCase();

  const direct = examples.find((example) =>
    String(example.sourceTitle || "").toLowerCase() === sourceTitle,
  );

  const text = String((direct || examples[0])?.text || "")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 170 ? `${text.slice(0, 167).trim()}…` : text;
}

function getExampleSource(trend: TrendItem, example: TrendPost): TrendSource {
  const title = String(example.sourceTitle || "Telegram").trim() || "Telegram";
  const matched = (trend.topSources || []).find(
    (source) => String(source.title || "").toLowerCase() === title.toLowerCase(),
  );

  return (
    matched || {
      id: example.sourceUsername || title,
      title,
      username: example.sourceUsername,
      avatarUrl: example.sourceAvatarUrl,
      mentions: 1,
    }
  );
}

export function normalizeTopic(value: string) {
  return value.trim().toLowerCase();
}

function normalizeTrendCountry(value: unknown, fallback = "ru") {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || fallback;
}

const COUNTRY_REGION_CODES: Record<string, string> = {
  ru: "RU",
  ua: "UA",
  us: "US",
  in: "IN",
  ir: "IR",
  tr: "TR",
  br: "BR",
  kz: "KZ",
  uz: "UZ",
  ae: "AE",
  eg: "EG",
  pk: "PK",
  id: "ID",
  mx: "MX",
  sa: "SA",
  es: "ES",
  it: "IT",
  fr: "FR",
  de: "DE",
  ar: "AR",
  co: "CO",
  za: "ZA",
  ng: "NG",
  cn: "CN",
  my: "MY",
};

const INTL_LOCALE_BY_SITE_LOCALE: Partial<Record<Locale, string>> = {
  ru: "ru",
  ua: "uk",
  us: "en",
  in: "hi",
  ir: "fa",
  tr: "tr",
  br: "pt-BR",
  kz: "kk",
  uz: "uz",
  ae: "ar-AE",
  eg: "ar-EG",
  pk: "ur",
  id: "id",
  mx: "es-MX",
  sa: "ar-SA",
  es: "es",
  it: "it",
  fr: "fr",
  de: "de",
  ar: "es-AR",
  co: "es-CO",
  za: "en-ZA",
  ng: "en-NG",
  cn: "zh-CN",
  my: "ms",
};

export function getCountryLabel(code: string, locale: Locale = "us") {
  const normalized = normalizeTrendCountry(code);
  const regionCode = COUNTRY_REGION_CODES[normalized];

  if (regionCode && typeof Intl !== "undefined" && "DisplayNames" in Intl) {
    try {
      const displayNames = new Intl.DisplayNames(
        [INTL_LOCALE_BY_SITE_LOCALE[locale] || "en"],
        { type: "region" },
      );
      return displayNames.of(regionCode) || COUNTRY_LABELS[normalized] || normalized.toUpperCase();
    } catch {
      // fallback below
    }
  }

  return COUNTRY_LABELS[normalized] || normalized.toUpperCase();
}

function getPostCountry(post: IngestedPost, fallbackCountry: string) {
  return normalizeTrendCountry((post as any).sourceCountryCode, fallbackCountry);
}


function normalizeTrendSearchText(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getTrendSearchWords(value: string) {
  return normalizeTrendSearchText(value)
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function trendOverlapScore(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;

  const left = new Set(a);
  const right = new Set(b);
  let hits = 0;

  for (const word of left) {
    if (right.has(word)) hits += 1;
  }

  return hits / Math.max(1, Math.min(left.size, right.size));
}

function getTrendFullSearchText(trend: TrendItem) {
  const examples = Array.isArray(trend.examples) ? trend.examples : [];
  const signals = Array.isArray(trend.signals) ? trend.signals : [];

  return [
    getTopic(trend),
    ...signals,
    ...examples.slice(0, 5).map((example) => example.text || ""),
  ].join(" ");
}

export function findTrendByTopic(trends: TrendItem[], topic: string) {
  const normalizedTopic = normalizeTopic(topic);
  if (!normalizedTopic) return null;

  const exact = trends.find((trend) => normalizeTopic(getTopic(trend)) === normalizedTopic);
  if (exact) return exact;

  const topicWords = getTrendSearchWords(topic);
  let best: TrendItem | null = null;
  let bestScore = 0;

  for (const trend of trends) {
    const score = trendOverlapScore(topicWords, getTrendSearchWords(getTrendFullSearchText(trend)));
    if (score > bestScore) {
      best = trend;
      bestScore = score;
    }
  }

  return best && bestScore >= 0.34 ? best : null;
}

function getMomentumNumber(trend: TrendItem) {
  if (typeof trend.momentum === "number") return trend.momentum;
  const parsed = Number(String(trend.change || "0").replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatNumber(value: number) {
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (value >= 1_000) return `${Math.round(value / 100) / 10}K`;
  return String(value);
}

function formatMomentumDelta(value: number) {
  const rounded = Math.round(value);
  if (!rounded) return "";
  const prefix = rounded > 0 ? "+" : "-";
  return `${prefix}${formatNumber(Math.abs(rounded))}`;
}

function getTrendSignals(trend: TrendItem) {
  const fromApi = Array.isArray(trend.signals)
    ? trend.signals
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    : [];

  if (fromApi.length) return fromApi.slice(0, 5);

  return getTopic(trend).split(/\s+/).filter(Boolean).slice(0, 5);
}

function getTrendEmoji(topic: string, category?: string) {
  const text = `${topic} ${category || ""}`.toLowerCase();

  if (text.includes("bitcoin") || text.includes("btc") || text.includes("крип"))
    return "₿";
  if (text.includes("tesla") || text.includes("авто") || text.includes("машин"))
    return "🚗";
  if (
    text.includes("openai") ||
    text.includes("ai") ||
    text.includes("gpt") ||
    text.includes("ии")
  )
    return "🤖";
  if (text.includes("погод")) return "🌦️";
  if (text.includes("игр") || text.includes("steam") || text.includes("gta"))
    return "🎮";
  if (
    text.includes("спорт") ||
    text.includes("спартак") ||
    text.includes("футбол")
  )
    return "⚽";
  if (
    text.includes("еда") ||
    text.includes("рецепт") ||
    text.includes("картош")
  )
    return "🍕";
  if (
    text.includes("жук") ||
    text.includes("мурав") ||
    text.includes("живот") ||
    text.includes("птиц")
  )
    return "🐾";
  if (
    text.includes("кино") ||
    text.includes("сериал") ||
    text.includes("игрушек")
  )
    return "🎬";
  if (text.includes("полит") || text.includes("трамп") || text.includes("иран"))
    return "🏛️";
  if (
    text.includes("финанс") ||
    text.includes("банк") ||
    text.includes("доллар")
  )
    return "💰";
  if (text.includes("наук") || text.includes("космос")) return "🔬";
  if (text.includes("travel") || text.includes("турц") || text.includes("виза"))
    return "🧳";

  const group = SITE_TAG_GROUPS.find((item) => item.value === category);
  return group?.emoji || "🔥";
}

export function getTrendCategory(topic: string, fallback = "all") {
  const text = topic.toLowerCase();
  if (
    text.includes("bitcoin") ||
    text.includes("btc") ||
    text.includes("ton") ||
    text.includes("сбер") ||
    text.includes("банк")
  )
    return "finance";
  if (text.includes("tesla") || text.includes("авто")) return "auto";
  if (
    text.includes("openai") ||
    text.includes("nvidia") ||
    text.includes("iphone") ||
    text.includes("ai")
  )
    return "technology";
  if (
    text.includes("спартак") ||
    text.includes("лига") ||
    text.includes("месси")
  )
    return "sports";
  if (text.includes("погод") || text.includes("новост")) return "news";
  if (text.includes("игр") || text.includes("steam") || text.includes("gta"))
    return "gaming";
  if (
    text.includes("еда") ||
    text.includes("рецепт") ||
    text.includes("картош")
  )
    return "food";
  return fallback;
}

function getSourceHandle(source: TrendSource) {
  const username = String(source.username || "")
    .replace(/^@+/, "")
    .trim();
  if (username) return username;

  const id = String(source.id || "")
    .replace(/^@+/, "")
    .trim();
  if (id && !/\s/.test(id) && !/^.+-\d+$/.test(id)) return id;

  return makeDemoHandle(source.title);
}


function getSourceHandleForOpen(source: TrendSource) {
  return getSourceHandle(source).trim().replace(/^@+/, "");
}


function getTagGroupByValue(value: string) {
  return SITE_TAG_GROUPS.find((group) => group.value === value);
}

function getParentTagValue(value: string) {
  for (const group of SITE_TAG_GROUPS) {
    if (group.children.some((child) => child.value === value)) return group.value;
  }

  return "";
}

function getTrendCategoriesList(trend: TrendItem) {
  const values = new Set<string>();
  const push = (value?: string | null) => {
    const normalized = String(value || "").trim();
    if (!normalized || normalized === "all") return;
    values.add(normalized);
    const parent = getParentTagValue(normalized);
    if (parent) values.add(parent);
  };

  push(trend.category || getTrendCategory(getTopic(trend)));

  if (Array.isArray(trend.categories)) {
    for (const category of trend.categories) push(category);
  }

  return values;
}

export function trendMatchesCategory(trend: TrendItem, selectedCategory: string) {
  if (selectedCategory === "all") return true;

  const categories = getTrendCategoriesList(trend);
  if (categories.has(selectedCategory)) return true;

  const group = getTagGroupByValue(selectedCategory);
  if (!group) return false;

  return group.children.some((child) => categories.has(child.value));
}

function collectPostTagValues(post: IngestedPost) {
  const values = new Set<string>();
  const add = (value: unknown) => {
    if (!value) return;
    if (Array.isArray(value)) {
      for (const item of value) add(item);
      return;
    }
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      add(record.value);
      add(record.id);
      add(record.slug);
      add(record.tag);
      add(record.category);
      return;
    }
    const text = String(value).trim();
    if (text && text !== "all") values.add(text);
  };

  add((post as any).tag);
  add((post as any).tags);
  add((post as any).contentTags);
  add((post as any).sourceTags);
  add((post as any).channelTags);
  add((post as any).source?.tags);
  add((post as any).channel?.tags);

  return [...values];
}

function postMatchesAttentionQuery(post: IngestedPost, normalizedQuery: string) {
  if (!normalizedQuery) return false;

  const haystack = [post.text, post.tag, ...collectPostTagValues(post)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}


function buildPostTrendTitle(post: IngestedPost) {
  const lines = String(post.text || "")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) =>
      line
        .replace(/https?:\/\/\S+/gi, " ")
        .replace(/\b(?:t\.me|max\.ru)\/\S+/gi, " ")
        .replace(/[@#][\wа-яё_.-]+/gi, " ")
        .replace(/[|•]+/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .filter(
      (line) =>
        line.length >= 8 &&
        !/(подписывай|подписаться|наш канал|ссылка в шапке|реклама|дорогие подписчики|привет,? друзья|уважаемые подписчики)/i.test(
          line,
        ),
    );

  const first = lines[0] || String(post.text || "").replace(/\s+/g, " ").trim();
  const words = first.split(/\s+/).filter(Boolean).slice(0, 14);
  const title = words.join(" ").trim();

  return title.length > 110 ? `${title.slice(0, 107).trim()}…` : title;
}

export function buildLivePostTrends(posts: IngestedPost[]): TrendItem[] {
  const sourceKey = (post: IngestedPost) =>
    String(post.source?.handle || post.source?.title || "telegram")
      .replace(/^@+/, "")
      .trim()
      .toLowerCase();

  const trends = posts
    .map((post) => {
      const topic = buildPostTrendTitle(post);
      if (!topic || topic.length < 6) return null;

      const source: TrendSource = {
        id: sourceKey(post),
        title: post.source?.title || "Telegram",
        username: post.source?.handle || undefined,
        avatarUrl: post.source?.avatar || undefined,
        mentions: 1,
      };

      const postTags = collectPostTagValues(post);
      const category = postTags[0] || getTrendCategory(`${topic} ${postTags.join(" ")}`, "all");

      return {
        topic,
        word: topic,
        mentions: 1,
        momentum: 100,
        change: "+100%",
        sourceCount: 1,
        topSources: [source],
        examples: [
          {
            id: post.id,
            text: String(post.text || "").slice(0, 280),
            url: post.postUrl,
            publishedAt: post.createdAt,
            sourceTitle: source.title,
            sourceUsername: source.username,
            sourceAvatarUrl: source.avatarUrl,
          },
        ],
        signals: topic.split(/\s+/).filter(Boolean).slice(0, 5),
        category,
        categories: postTags,
      } as TrendItem;
    })
    .filter(Boolean) as TrendItem[];

  const seen = new Set<string>();

  return trends
    .filter((trend) => {
      const key = normalizeTopic(getTopic(trend));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 30);
}

export function buildLiveSearchTrend(
  posts: IngestedPost[],
  rawQuery: string,
  countryCode = "ru",
): TrendItem | null {
  const topic = rawQuery.trim();
  const normalizedQuery = topic.toLowerCase();
  const selectedCountry = normalizeTrendCountry(countryCode);

  if (normalizedQuery.length < 2) return null;

  const allMatchingPosts = posts.filter((post) =>
    postMatchesAttentionQuery(post, normalizedQuery),
  );

  if (!allMatchingPosts.length) return null;

  const countryStats = new Map<string, { mentions: number; sources: Set<string> }>();

  for (const post of allMatchingPosts) {
    const postCountry = getPostCountry(post, selectedCountry);
    const sourceKey =
      getSourceHandleForOpen({
        id: post.source?.handle,
        title: post.source?.title || "Telegram",
        username: post.source?.handle,
        avatarUrl: post.source?.avatar || undefined,
        mentions: 0,
      }) || String(post.source?.title || "telegram").trim().toLowerCase();

    const current = countryStats.get(postCountry) || {
      mentions: 0,
      sources: new Set<string>(),
    };

    current.mentions += 1;
    current.sources.add(sourceKey || "telegram");
    countryStats.set(postCountry, current);
  }

  const matchingPosts = allMatchingPosts.filter(
    (post) => getPostCountry(post, selectedCountry) === selectedCountry,
  );

  if (!matchingPosts.length) return null;

  const sourceMap = new Map<string, TrendSource>();

  for (const post of matchingPosts) {
    const handle = getSourceHandleForOpen({
      id: post.source?.handle,
      title: post.source?.title || "Telegram",
      username: post.source?.handle,
      avatarUrl: post.source?.avatar || undefined,
      mentions: 0,
    });

    const key =
      handle ||
      String(post.source?.title || "telegram").trim().toLowerCase() ||
      "telegram";

    const current = sourceMap.get(key);

    if (current) {
      current.mentions += 1;
      continue;
    }

    sourceMap.set(key, {
      id: handle || key,
      title: post.source?.title || "Telegram",
      username: handle || post.source?.handle,
      avatarUrl: post.source?.avatar || undefined,
      mentions: 1,
    });
  }

  const topSources = Array.from(sourceMap.values()).sort(
    (a, b) => b.mentions - a.mentions,
  );

  const countries = Array.from(countryStats.entries())
    .map(([code, item]) => ({
      code,
      mentions: item.mentions,
      sourceCount: item.sources.size,
    }))
    .sort((a, b) => b.mentions - a.mentions || (b.sourceCount || 0) - (a.sourceCount || 0));

  return {
    topic,
    word: topic,
    mentions: matchingPosts.length,
    momentum: matchingPosts.length * 100,
    change: `+${matchingPosts.length * 100}%`,
    sourceCount: sourceMap.size,
    countries,
    topSources: topSources.slice(0, 120),
    examples: matchingPosts.slice(0, 20).map((post) => ({
      id: post.id,
      text: String(post.text || "").slice(0, 280),
      url: post.postUrl,
      publishedAt: post.createdAt,
      sourceTitle: post.source?.title || "Telegram",
      sourceUsername: post.source?.handle || undefined,
      sourceAvatarUrl: post.source?.avatar || undefined,
    })),
    signals: topic.split(/\s+/).filter(Boolean).slice(0, 5),
    category:
      collectPostTagValues(matchingPosts[0] || ({} as IngestedPost))[0] ||
      getTrendCategory(topic, "all"),
    categories: Array.from(
      new Set(matchingPosts.flatMap((post) => collectPostTagValues(post))),
    ).slice(0, 12),
  };
}

function getTelegramAvatarUrl(source: TrendSource) {
  const handle = getSourceHandle(source);
  return handle ? `https://t.me/i/userpic/320/${handle}.jpg` : "";
}

function SourceAvatar({
  source,
  size = "sm",
}: {
  source: TrendSource;
  size?: "sm" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const sizeClass = size === "lg" ? "h-11 w-11 text-sm" : "h-7 w-7 text-[10px]";
  const fallback = source.title.slice(0, 1).toUpperCase();
  const avatarUrl = failed ? "" : source.avatarUrl || getTelegramAvatarUrl(source);

  return (
    <div
      className={`${sizeClass} grid shrink-0 place-items-center overflow-hidden rounded-full border border-[color:var(--bg-app)] bg-surface-soft font-black text-primary`}
      title={source.title}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full rounded-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        fallback
      )}
    </div>
  );
}


function SourceDots({ sources = [] }: { sources?: TrendSource[] }) {
  const visible = sources.slice(0, 5);

  if (!visible.length) return null;

  return (
    <div className="flex -space-x-2">
      {visible.map((source, index) => (
        <SourceAvatar key={`${source.title}-${index}`} source={source} />
      ))}
    </div>
  );
}

function MiniAttentionChart({
  isUp,
  mentions,
  copy,
}: {
  isUp: boolean;
  mentions: number;
  copy: TrendsCopy;
}) {
  const values = isUp
    ? [0.14, 0.2, 0.3, 0.43, 0.6, 0.78, 1]
    : [1, 0.9, 0.76, 0.55, 0.4, 0.26, 0.12];

  const plotLeft = 42;
  const plotTop = 14;
  const plotWidth = 286;
  const plotHeight = 52;
  const step = plotWidth / (values.length - 1);

  const points = values
    .map((value, index) => {
      const x = plotLeft + index * step;
      const y = plotTop + plotHeight - value * plotHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const activeValue = formatNumber(mentions);
  const midValue = formatNumber(Math.max(1, Math.round(mentions * 0.5)));
  const lowValue = formatNumber(Math.max(1, Math.round(mentions * 0.18)));
  const activeX = plotLeft + (values.length - 1) * step;
  const activeY = plotTop + plotHeight - values[values.length - 1] * plotHeight;
  const lineClass = isUp ? "stroke-emerald-500" : "stroke-red-500";
  const labelClass = isUp ? "text-emerald-500" : "text-red-500";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-soft bg-app px-3 pb-2 pt-2">
      <div className="mb-2 flex items-center justify-between text-[11px] text-secondary">
        <span>48h</span>
        <span className={`font-black ${labelClass}`}>
          {copy.now} · {activeValue}
        </span>
      </div>

      <svg
        viewBox="0 0 344 104"
        className="h-20 min-h-[80px] w-full overflow-visible"
      >
        {[plotTop, plotTop + plotHeight / 2, plotTop + plotHeight].map(
          (y, index) => (
            <g key={y}>
              <text
                x="0"
                y={y + 4}
                fill="currentColor"
                className="text-[10px] font-bold text-secondary"
              >
                {index === 0 ? activeValue : index === 1 ? midValue : lowValue}
              </text>
              <line
                x1={plotLeft}
                x2={plotLeft + plotWidth}
                y1={y}
                y2={y}
                className="stroke-[color:var(--border-soft)]"
                strokeWidth="1"
              />
            </g>
          ),
        )}

        {["48h", "36h", "24h", "12h", copy.now].map((label, index) => {
          const x =
            index === 4
              ? plotLeft + plotWidth
              : plotLeft + (plotWidth / 4) * index;

          return (
            <text
              key={label}
              x={x}
              y="100"
              textAnchor={
                index === 0 ? "start" : index === 4 ? "end" : "middle"
              }
              fill="currentColor"
              className="text-[10px] font-bold text-secondary"
            >
              {label}
            </text>
          );
        })}

        <polyline
          points={points}
          fill="none"
          className={lineClass}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle
          cx={activeX}
          cy={activeY}
          r="6"
          className={lineClass.replace("stroke", "fill")}
          opacity="0.18"
        />

        <circle
          cx={activeX}
          cy={activeY}
          r="7"
          className={lineClass.replace("stroke", "fill")}
          opacity="0.28"
        >
          <animate
            attributeName="r"
            values="7;18"
            dur="2.8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.28;0"
            dur="2.8s"
            repeatCount="indefinite"
          />
        </circle>

        <circle
          cx={activeX}
          cy={activeY}
          r="7"
          className={lineClass.replace("stroke", "fill")}
          opacity="0.18"
        >
          <animate
            attributeName="r"
            values="7;24"
            begin="1.4s"
            dur="2.8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.2;0"
            begin="1.4s"
            dur="2.8s"
            repeatCount="indefinite"
          />
        </circle>

        <circle cx={activeX} cy={activeY} r="5.2" className="fill-white" />

        <circle
          cx={activeX}
          cy={activeY}
          r="2"
          className={lineClass.replace("stroke", "fill")}
        />

        <text
          x={activeX - 8}
          y={activeY - 13}
          textAnchor="end"
          fill="currentColor"
          className={`text-[10px] font-black ${labelClass}`}
        >
          {activeValue}
        </text>
      </svg>
    </div>
  );
}


export function CountryDistributionBlock({
  trend,
  countryCode,
  copy,
  locale,
  defaultOpen = false,
  className = "",
  isPro = false,
}: {
  trend: TrendItem;
  countryCode: string;
  copy: TrendsCopy;
  locale: Locale;
  defaultOpen?: boolean;
  className?: string;
  isPro?: boolean;
}) {
  const countries = Array.isArray(trend.countries) ? trend.countries : [];
  const selectedCountry = normalizeTrendCountry(countryCode);
  const extraCopy = getTrendsExtraCopy(locale);
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (open) refreshAutotranslit(locale);
  }, [open, locale]);

  const normalizedCountries = countries.length
    ? countries.map((country) =>
        normalizeTrendCountry(country.code) === selectedCountry
          ? {
              ...country,
              mentions: trend.mentions,
              sourceCount: trend.sourceCount || country.sourceCount || country.mentions,
            }
          : country,
      )
    : [
        {
          code: selectedCountry,
          mentions: trend.mentions,
          sourceCount: trend.sourceCount || trend.mentions,
        },
      ];

  const sorted = [...normalizedCountries].sort(
    (a, b) => b.mentions - a.mentions || (b.sourceCount || 0) - (a.sourceCount || 0),
  );

  if (!sorted.length) return null;

  const hasOtherCountries = sorted.some(
    (country) => normalizeTrendCountry(country.code) !== selectedCountry,
  );

  return (
    <div
      className={["rounded-[24px] border border-soft bg-app p-3", className].filter(Boolean).join(" ")}
      translate="yes"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl bg-emerald-500/10 px-3 py-2 text-left text-sm font-black text-emerald-500 transition hover:bg-emerald-500/15"
        aria-expanded={open}
      >
        <span>{formatNumber(trend.mentions)} {copy.mentions}</span>
        <span className="inline-flex items-center gap-1" aria-label={getCountryLabel(selectedCountry, locale)}>
          <ChevronDown className={["h-3.5 w-3.5 transition", open ? "rotate-180" : ""].join(" ")} />
        </span>
      </button>

      {open ? (
        <div className="mt-3">
          <div className="space-y-1.5">
            {sorted.slice(0, 5).map((country, index) => {
              const locked = !isPro && normalizeTrendCountry(country.code) !== selectedCountry;
              return (
                <div
                  key={`${country.code}-${index}`}
                  className="flex items-center justify-between gap-3 border-b border-dashed border-soft pb-1.5 text-sm last:border-b-0 last:pb-0"
                >
                  <span className={locked ? "text-secondary" : "font-bold text-primary"}>
                    {locked ? "🔒 " : ""}
                    {getCountryLabel(country.code, locale)}
                  </span>
                  <span className={locked ? "font-black text-secondary" : "font-black text-emerald-500"}>
                    {formatNumber(country.sourceCount || country.mentions)}
                  </span>
                </div>
              );
            })}
          </div>

          {hasOtherCountries ? (
            <button
              type="button"
              className="mt-3 w-full rounded-2xl border border-soft bg-surface px-4 py-3 text-sm font-black text-primary transition hover:bg-surface-soft"
            >
              {extraCopy.fullReport24h}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function TrendDetail({
  trend,
  followed,
  onBack,
  onToggleFollow,
  onOpenSource,
  copy,
  countryCode,
  locale,
  isPro = false,
}: {
  trend: TrendItem;
  followed: boolean;
  onBack: () => void;
  onToggleFollow: () => void;
  onOpenSource?: (handle: string) => void;
  copy: TrendsCopy;
  countryCode: string;
  locale: Locale;
  isPro?: boolean;
}) {
  const topic = getTopic(trend);
  const momentum = getMomentumNumber(trend);
  const isUp = momentum >= 0;
  const sourceCount = trend.sourceCount || trend.topSources?.length || 0;
  const chips = getTrendSignals(trend);
  const emoji = getTrendEmoji(topic, trend.category);
  const sourcesRef = useRef<HTMLElement | null>(null);
  const extraCopy = getTrendsExtraCopy(locale);
  const topSources = trend.topSources || [];
  const sourcePreviewLimit = isPro ? topSources.length : FREE_SOURCE_PREVIEW_LIMIT;
  const [visibleSourceCount, setVisibleSourceCount] = useState(SOURCE_PAGE_SIZE);
  const visibleSources = topSources.slice(0, Math.min(visibleSourceCount, sourcePreviewLimit || SOURCE_PAGE_SIZE));
  const hasMoreSources = visibleSources.length < topSources.length;

  useEffect(() => {
    setVisibleSourceCount(SOURCE_PAGE_SIZE);
  }, [topic]);

  useEffect(() => {
    refreshAutotranslit(locale);
  }, [topic, visibleSourceCount, locale]);

  const scrollToSources = () => {
    sourcesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto max-w-[570px] px-4 pb-28 pt-3" translate="yes">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-2 rounded-full border border-soft bg-surface px-3 py-2 text-sm font-bold text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {copy.back}
      </button>

      <section className="rounded-[30px] border border-soft bg-surface p-4 shadow-sm">
        <div className="min-w-0">
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-400">
            {copy.telegramAttention}
          </div>
          <h2 className="margelet-telegram-content mt-1 text-base font-bold leading-tight text-[color:var(--trend-title)] sm:text-lg" translate="yes">
            <span className="mr-1.5 align-[-1px] text-xl">{emoji}</span>
            {topic}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={
                isUp ? "font-bold text-emerald-500" : "font-bold text-red-500"
              }
            >
              {isUp ? "↗" : "↘"} {String(trend.change).replace("+", "")}
            </span>
            <span className="text-secondary">·</span>
            <span className="text-secondary">
              {sourceCount} {copy.sources}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-3xl border border-soft bg-app px-3 py-3">
          <div>
            <div className="text-[11px] text-secondary">{copy.mentions}</div>
            <div className="mt-1 text-xl font-black text-primary">
              {formatNumber(trend.mentions)}
            </div>
          </div>

          <button
            type="button"
            onClick={scrollToSources}
            className="flex items-center gap-2 rounded-2xl bg-surface-soft px-2 py-2 text-left transition hover:bg-surface"
          >
            <div className="flex -space-x-2">
              {topSources.slice(0, 3).map((source, index) => (
                <SourceAvatar
                  key={`${source.title}-${index}`}
                  source={source}
                />
              ))}
            </div>
            <div className="text-right">
              <div className="text-[11px] text-secondary">{copy.sources}</div>
              <div className="text-sm font-black text-primary">
                {sourceCount}
              </div>
            </div>
          </button>
        </div>

        <div className="mt-4">
          <MiniAttentionChart
            isUp={isUp}
            mentions={trend.mentions}
            copy={copy}
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" translate="yes">
          {chips.map((chip) => (
            <span
              key={chip}
              className="margelet-telegram-content shrink-0 rounded-full border border-soft bg-app px-3 py-1.5 text-xs text-secondary"
              translate="yes"
            >
              {chip}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={onToggleFollow}
          className={[
            "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition hover:opacity-90",
            followed
              ? "border-red-500/20 bg-red-500/10 text-red-500"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
          ].join(" ")}
        >
          {followed ? (
            <Check className="h-4 w-4" />
          ) : (
            <Bell className="h-4 w-4" />
          )}
          {followed ? copy.unfollowTopic : copy.followTopic}
        </button>

        <CountryDistributionBlock
          trend={trend}
          countryCode={countryCode}
          copy={copy}
          locale={locale}
          defaultOpen
          className="mt-3"
          isPro={isPro}
        />
      </section>

      <section className="mt-5 border-t border-soft pt-4">
        <h3 className="text-lg font-black text-primary">
          {isUp ? copy.whyGrows : copy.whyFalls}
        </h3>
        <div className="mt-3 space-y-2 text-sm leading-6 text-secondary" translate="yes">
          <p className="margelet-telegram-content" translate="yes">• {formatCopy(copy.whyLineSources, { count: sourceCount })}</p>
          <p className="margelet-telegram-content" translate="yes">• {isUp ? copy.whyLineActivityUp : copy.whyLineActivityDown}</p>
          <p className="margelet-telegram-content" translate="yes">
            • {formatCopy(copy.whyLineRelated, { chips: chips.join(", ") })}
          </p>
        </div>
      </section>

      <section
        ref={sourcesRef}
        id="trend-sources"
        className="mt-5 border-t border-soft pt-4 scroll-mt-20"
      >
        <h3 className="text-lg font-black text-primary">
          {copy.whoFormsAttention}
        </h3>
        <div className="mt-3 space-y-2">
          {visibleSources.map((source, index) => {
            const snippet = getSourceSnippet(trend, source);

            const content = (
              <>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <SourceAvatar source={source} />
                    <div className="min-w-0 flex-1">
                      <div className="margelet-telegram-content truncate text-sm font-black text-primary" translate="yes">
                        {source.title}
                      </div>
                      {getSourceHandle(source) ? (
                        <div className="truncate text-xs text-secondary">
                          @{getSourceHandle(source)}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {snippet ? (
                    <div className="margelet-telegram-content mt-2 line-clamp-3 text-[12px] font-medium leading-relaxed text-secondary" translate="yes">
                      {snippet}
                    </div>
                  ) : null}
                </div>

                <div className="shrink-0 rounded-full bg-app px-2.5 py-1 text-xs font-black text-secondary">
                  {source.mentions}
                </div>
              </>
            );

            const handle = getSourceHandleForOpen(source);

            if (handle) {
              return (
                <button
                  key={`${source.title}-${index}`}
                  type="button"
                  onClick={() => {
                    if (onOpenSource) {
                      onOpenSource(handle);
                      return;
                    }

                    window.location.href = `/${handle}`;
                  }}
                  className="margelet-telegram-content flex w-full items-start justify-between gap-3 rounded-2xl border border-soft bg-surface-soft px-3 py-3 text-left no-underline transition hover:bg-app"
                  translate="yes"
                >
                  {content}
                </button>
              );
            }

            return (
              <div
                key={`${source.title}-${index}`}
                className="margelet-telegram-content flex items-start justify-between gap-3 rounded-2xl border border-soft bg-surface-soft px-3 py-3"
                translate="yes"
              >
                {content}
              </div>
            );
          })}
        </div>

        {topSources.length > SOURCE_PAGE_SIZE ? (
          <div className="mt-3 space-y-2">
            <div className="text-center text-xs font-bold text-secondary">
              {formatCopy(extraCopy.shownSources, {
                shown: Math.min(visibleSourceCount, topSources.length),
                total: topSources.length,
                sources: copy.sources,
              })}
            </div>
            {hasMoreSources && (isPro || visibleSourceCount < FREE_SOURCE_PREVIEW_LIMIT) ? (
              <button
                type="button"
                onClick={() =>
                  setVisibleSourceCount((current) =>
                    Math.min(current + SOURCE_PAGE_SIZE, sourcePreviewLimit || topSources.length, topSources.length),
                  )
                }
                className="w-full rounded-2xl border border-soft bg-surface px-4 py-3 text-sm font-black text-primary transition hover:bg-surface-soft"
              >
                {extraCopy.showMoreSources}
              </button>
            ) : null}
            {!isPro && visibleSourceCount >= FREE_SOURCE_PREVIEW_LIMIT && topSources.length > visibleSourceCount ? (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("margelet:open-pro-plans"))}
                className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white transition hover:opacity-90"
              >
                {extraCopy.unlockAllSignals}
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function TrendRow({
  trend,
  opened,
  followed,
  onToggle,
  onOpenDetail,
  onToggleFollow,
  copy,
}: {
  trend: TrendItem;
  opened: boolean;
  followed: boolean;
  onToggle: () => void;
  onOpenDetail: () => void;
  onToggleFollow: () => void;
  copy: TrendsCopy;
}) {
  const topic = getTopic(trend);
  const momentum = getMomentumNumber(trend);
  const isUp = momentum >= 0;
  const chips = getTrendSignals(trend);
  const sourceCount = trend.sourceCount || trend.topSources?.length || 0;
  const emoji = getTrendEmoji(topic, trend.category);
  const snippet = getTrendSnippet(trend);

  return (
    <article className="overflow-hidden rounded-[26px] border border-soft bg-surface shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 px-3 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="margelet-telegram-content text-base font-bold leading-tight text-[color:var(--trend-title)] line-clamp-2" translate="yes">
            <span className="mr-1.5 align-[-1px] text-base">{emoji}</span>
            {topic}
          </div>

          {snippet ? (
            <div className="margelet-telegram-content mt-1 line-clamp-2 text-[12px] leading-relaxed text-secondary" translate="yes">
              {snippet}
            </div>
          ) : null}

          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs whitespace-nowrap">
            <span
              className={
                isUp ? "font-black text-emerald-500" : "font-black text-red-500"
              }
            >
              {formatNumber(trend.mentions)}
            </span>
            <Search className="h-3.5 w-3.5 text-secondary" />
            <span className="text-secondary">·</span>
            <span className="text-secondary">
              {sourceCount} {copy.sources}
            </span>
            {trend.topSources?.length ? (
              <span className="ml-1 inline-flex align-middle">
                <SourceDots sources={trend.topSources} />
              </span>
            ) : null}
          </div>
        </div>

        <div
          className={[
            "mt-0.5 flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl",
            isUp
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-red-500/10 text-red-500",
          ].join(" ")}
        >
          {opened ? (
            <ChevronDown className="h-6 w-6" />
          ) : Math.abs(momentum) >= 100 ? (
            isUp ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )
          ) : isUp ? (
            <ArrowUpRight className="h-5 w-5" />
          ) : (
            <ArrowDownRight className="h-5 w-5" />
          )}
          {!opened && formatMomentumDelta(momentum) ? (
            <span className="mt-0.5 text-[10px] font-black leading-none">
              {formatMomentumDelta(momentum)}
            </span>
          ) : null}
        </div>
      </button>

      {opened ? (
        <div className="border-t border-soft px-3 pb-3 pt-3">
          {chips.length ? (
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="shrink-0 rounded-full border border-soft bg-app px-3 py-1 text-xs text-secondary"
                >
                  {chip}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleFollow();
              }}
              className={[
                "rounded-2xl border px-4 py-3 text-sm font-black transition hover:opacity-90",
                followed
                  ? "border-red-500/20 bg-red-500/10 text-red-500"
                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
              ].join(" ")}
            >
              {followed ? copy.unsubscribe : copy.follow}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenDetail();
              }}
              className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white transition hover:opacity-90"
            >
              {copy.explore}
            </button>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpenDetail();
            }}
            className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-soft bg-app px-3 py-2.5 text-left text-[15px] font-black text-emerald-500 transition hover:bg-surface-soft"
          >
            <span>{copy.whoFormsAttention}</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>

          {trend.examples?.length ? (
            <div className="mt-3 space-y-2">
              {trend.examples.slice(0, 3).map((example, index) => {
                const exampleSource = getExampleSource(trend, example);

                return (
                  <div
                    key={`${example.id}-${index}`}
                    className="rounded-2xl border border-soft bg-app px-3 py-2 text-[12px] leading-relaxed text-secondary"
                  >
                    <div className="mb-1.5 flex items-center gap-2 font-bold text-[color:var(--trend-title)]">
                      <SourceAvatar source={exampleSource} />
                      <span className="min-w-0 truncate">
                        {example.sourceTitle || exampleSource.title}
                      </span>
                    </div>
                    <div className="line-clamp-3">{example.text}</div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function buildCategories(locale: Locale, copy: TrendsCopy): TrendCategory[] {
  const groupsByValue = new Map<string, SiteTagGroup>();

  for (const group of SITE_TAG_GROUPS) {
    groupsByValue.set(group.value, group);
  }

  const categories: TrendCategory[] = [
    { value: "followed", emoji: "👀", label: copy.interests },
    { value: "all", emoji: "🔥", label: copy.all },
  ];

  for (const value of FEATURED_CATEGORY_VALUES) {
    if (value === "all") continue;
    const group = groupsByValue.get(value);
    if (!group) continue;
    categories.push({
      value: group.value,
      emoji: group.emoji,
      label: stripCategoryEmoji(getTagLabel(group, locale)),
    });
  }

  return categories;
}

