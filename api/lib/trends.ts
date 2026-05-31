import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { IngestedPost } from "./contracts.js";

const TRENDS_DIR = "data/trends";

const STOP_WORDS = new Set([
  // ru — служебные слова и частый мусор Telegram-постов
  "это","что","как","для","если","или","его","её","ее","она","они","оно","там","тут","уже","ещё","еще",
  "вот","все","всё","сам","сама","сами","над","под","без","при","про","чем","тем","где","кто",
  "когда","почему","потому","так","также","только","можно","нужно","будет","будут","были","было","быть",
  "есть","нет","да","не","но","же","бы","ли","на","по","из","от","до","за","во","со","ко","об",
  "а","и","в","с","к","у","о","мы","вы","он","их","им","нас","вам","тебя","меня","наш","ваш",
  "который","которая","которое","которые","которых","которым","которыми","того","той","том","томy",
  "этот","эта","эти","этих","этом","этого","этой","этим","здесь","туда","сюда","пока","после","перед",
  "сейчас","сегодня","вчера","завтра","день","дня","дней","года","год","лет","раз","раза","разом",
  "всего","почти","очень","снова","сразу","прямо","просто","больше","меньше","через","теперь","даже",
  "могут","может","мочь","должен","должна","должны","стоит","стал","стала","стали","нельзя",
  "подписаться","подписывайтесь","подпишись","читать","читать далее","видео","фото","смотреть","ссылка","канал",
  "новости","новость","пост","поста","посты","сообщает","сообщили","пишут","заявил","рассказал",
  "рублей","рубля","руб","тыс","млн","млрд","тысяч","около","более","менее","около",

  // en — service words + Telegram CTA/noise
  "the","and","for","with","this","that","from","are","was","were","you","your","they","have",
  "has","had","not","but","his","her","its","our","their","about","into","after","before","what",
  "when","where","why","how","who","all","can","will","would","could","should","just","more","than","then","there","here",
  "now","new","don","one","two","most","join","over","every","only","today","yesterday","tomorrow","year","years","day","days",
  "video","photo","watch","read","subscribe","follow","channel","post","posts","news","update","updates","breaking",
  "said","says","say","reported","reports","report","live","official","latest","first","last","next","again",
  "many","much","some","any","also","even","still","very","really","click","link","source","sources",
  "usd","eur","rub","million","billion","thousand","max","min",

  // extra common particles in supported regions/languages — conservative baseline
  "de","la","el","los","las","un","una","unos","unas","por","para","con","sin","del","que","como","más","mas","muy",
  "le","les","des","une","aux","avec","sur","dans","est","sont","plus","moins","pour","par",
  "der","die","das","und","oder","ist","sind","mit","von","auf","ein","eine","einer","nicht","mehr",
  "ve","bir","bu","şu","icin","için","olan","olarak","daha","sonra","önce","gibi",
]);

const GENERIC_SINGLE_WORDS = new Set([
  "рынок","рынки","компания","компании","люди","человек","время","страна","страны","город","города",
  "работа","работы","деньги","цена","цены","сезон","место","места","часть","случай","уровень",
  "market","markets","company","people","person","time","country","city","work","money","price","season","place","case","level",
]);

const KNOWN_ENTITY_WORDS = new Set([
  "ai","gpt","openai","chatgpt","apple","google","microsoft","tesla","nvidia","spacex","telegram","durov","дуров",
  "bitcoin","btc","ethereum","eth","ton","crypto","binance","sber","сбер","сбербанк","газпром","tesla","iphone",
  "москва","москве","moscow","киев","kyiv","украина","россия","iran","иран","trump","трамп","putin","путин",
  "спартак","зенит","messi","месси","ozon","wildberries","youtube","tiktok","instagram",
]);

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
  category?: string;
  score?: number;
};

function cleanText(text: string) {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[@#][\wа-яё_-]+/gi, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeToken(value: string) {
  return value
    .toLowerCase()
    .replace(/^[-_]+|[-_]+$/g, "")
    .trim();
}

function isStopToken(token: string) {
  const normalized = normalizeToken(token);
  return !normalized || STOP_WORDS.has(normalized);
}

function isLikelyNoiseToken(token: string) {
  const normalized = normalizeToken(token);
  if (!normalized) return true;
  if (normalized.length < 3) return true;
  if (/^\d+$/.test(normalized)) return true;
  if (STOP_WORDS.has(normalized)) return true;
  if (/^[a-z]$/.test(normalized)) return true;
  if (/^[а-яё]$/i.test(normalized)) return true;
  return false;
}

function isGoodSingleToken(token: string) {
  const normalized = normalizeToken(token);
  if (isLikelyNoiseToken(normalized)) return false;
  if (GENERIC_SINGLE_WORDS.has(normalized)) return false;

  // allow known entities even if short, e.g. ton, btc, ai
  if (KNOWN_ENTITY_WORDS.has(normalized)) return true;

  // strict for short latin words because they often become noise: now/new/one/don/etc.
  if (/^[a-z0-9-]+$/.test(normalized) && normalized.length < 5) return false;

  return normalized.length >= 4;
}

function isGoodPhrase(parts: string[]) {
  if (parts.length < 2) return false;
  if (parts.some((part) => isLikelyNoiseToken(part))) return false;

  const meaningful = parts.filter((part) => isGoodSingleToken(part) || KNOWN_ENTITY_WORDS.has(normalizeToken(part)));
  if (meaningful.length === 0) return false;

  const joined = parts.join(" ");
  if (STOP_WORDS.has(joined)) return false;

  return true;
}

function extractTokens(text: string): string[] {
  return cleanText(text)
    .split(" ")
    .map(normalizeToken)
    .filter((token) => !isLikelyNoiseToken(token));
}

function extractTopics(text: string): string[] {
  const tokens = extractTokens(text);
  const topics: string[] = [];

  for (const token of tokens) {
    if (isGoodSingleToken(token)) topics.push(token);
  }

  for (let i = 0; i < tokens.length - 1; i++) {
    const phrase = [tokens[i], tokens[i + 1]];
    if (isGoodPhrase(phrase)) topics.push(phrase.join(" "));
  }

  for (let i = 0; i < tokens.length - 2; i++) {
    const phrase = [tokens[i], tokens[i + 1], tokens[i + 2]];
    if (isGoodPhrase(phrase)) topics.push(phrase.join(" "));
  }

  return topics;
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
  return String(
    (post as any).sourceId ||
      (post as any).channelId ||
      (post as any).sourceUsername ||
      (post as any).channelUsername ||
      (post as any).sourceTitle ||
      (post as any).channelTitle ||
      "telegram"
  );
}

function getSourceTitle(post: IngestedPost): string {
  return String(
    (post as any).sourceTitle ||
      (post as any).channelTitle ||
      (post as any).sourceName ||
      (post as any).channelName ||
      (post as any).sourceUsername ||
      (post as any).channelUsername ||
      "Telegram"
  );
}

function getSourceUsername(post: IngestedPost): string | undefined {
  return (
    (post as any).sourceUsername ||
    (post as any).channelUsername ||
    (post as any).username
  );
}

function getSourceAvatar(post: IngestedPost): string | undefined {
  return (
    (post as any).sourceAvatarUrl ||
    (post as any).channelAvatarUrl ||
    (post as any).avatarUrl ||
    (post as any).photoUrl
  );
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

  const upper = new Set(["ai", "gpt", "btc", "eth", "ton", "nft", "etf", "usa", "us", "uk", "uae"]);
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
      if (["etf", "ai", "gpt", "btc", "eth", "ton"].includes(normalized)) return normalized.toUpperCase();
      return part;
    })
    .join(" ");
}

function inferCategory(topic: string) {
  const text = topic.toLowerCase();

  if (/bitcoin|btc|ethereum|eth|crypto|ton|binance|банк|сбер|доллар|курс|нефть|oil/.test(text)) return "finance";
  if (/tesla|авто|машин|car|cars|ev|электромоб/.test(text)) return "auto";
  if (/openai|chatgpt|gpt|nvidia|iphone|apple|google|microsoft|ai|ии|нейросет/.test(text)) return "technology";
  if (/спартак|зенит|футбол|football|messi|месси|спорт|лига/.test(text)) return "sports";
  if (/погод|гроза|дожд|москва|moscow|срочн|новост|breaking/.test(text)) return "news";
  if (/трамп|trump|иран|iran|украин|полит|выбор|government|president/.test(text)) return "politics";
  if (/игр|game|gaming|steam|gta|dtf/.test(text)) return "gaming";
  if (/еда|рецепт|food|картош|доставка/.test(text)) return "food";
  if (/жук|мурав|птиц|живот|nature|animal|капибар/.test(text)) return "nature";
  if (/кино|сериал|film|movie|music|музык/.test(text)) return "culture";
  if (/курс|обуч|education|study|школ|университет/.test(text)) return "education";
  if (/бизнес|стартап|startup|marketplace|маркетплейс|ozon|wildberries/.test(text)) return "business";
  if (/travel|турц|виза|отел|hotel|flight/.test(text)) return "travel";
  if (/здоров|health|медицин|питание/.test(text)) return "health";
  if (/реклам|marketing|smm|telegram ads/.test(text)) return "marketing";

  return "all";
}

function getTopicQuality(topic: string) {
  const parts = topic.split(" ");
  let quality = 0;

  if (parts.length === 1) quality -= 40;
  if (parts.length === 2) quality += 25;
  if (parts.length >= 3) quality += 15;

  for (const part of parts) {
    const normalized = normalizeToken(part);
    if (KNOWN_ENTITY_WORDS.has(normalized)) quality += 45;
    if (/\d/.test(normalized)) quality += 10;
    if (GENERIC_SINGLE_WORDS.has(normalized)) quality -= 20;
  }

  return quality;
}

function shouldKeepTopic(topic: string, mentions: number, sourceCount: number) {
  const parts = topic.split(" ");

  if (parts.some((part) => isLikelyNoiseToken(part))) return false;

  if (parts.length === 1) {
    const token = parts[0];
    if (!isGoodSingleToken(token)) return false;

    // Single-word trends must be stronger than phrase trends.
    if (!KNOWN_ENTITY_WORDS.has(normalizeToken(token)) && mentions < 8 && sourceCount < 3) {
      return false;
    }
  }

  if (parts.length === 2 && mentions < 3 && sourceCount < 2) return false;
  if (parts.length >= 3 && mentions < 2) return false;

  return true;
}

function calcScore(trend: Pick<TrendItem, "topic" | "mentions" | "momentum" | "sourceCount">) {
  return (
    trend.mentions +
    Math.abs(trend.momentum) * 100 +
    trend.sourceCount * 50 +
    getTopicQuality(trend.topic)
  );
}

export async function updateTrends(posts: IngestedPost[], countryCode: string) {
  const now = Date.now();
  const bucketHours = 4;
  const buckets = 12;
  const bucketMs = bucketHours * 60 * 60 * 1000;

  const stats: Record<
    string,
    {
      mentions: number;
      history: number[];
      sourceMap: Record<string, TrendSource>;
      examples: TrendPost[];
      firstSeenAt: number | null;
      lastSeenAt: number | null;
    }
  > = {};

  for (const post of posts) {
    if (!(post as any).text) continue;

    const text = String((post as any).text || "");
    const postTime = getPostTime(post);
    const age = now - postTime;

    if (age < 0) continue;

    const bucketIndex =
      age > buckets * bucketMs
        ? 0
        : Math.max(0, buckets - 1 - Math.floor(age / bucketMs));

    const sourceId = getSourceId(post);
    const sourceTitle = getSourceTitle(post);
    const sourceUsername = getSourceUsername(post);
    const sourceAvatar = getSourceAvatar(post);

    const topics = new Set(extractTopics(text));

    for (const topic of topics) {
      if (!stats[topic]) {
        stats[topic] = {
          mentions: 0,
          history: Array.from({ length: buckets }, () => 0),
          sourceMap: {},
          examples: [],
          firstSeenAt: null,
          lastSeenAt: null,
        };
      }

      const item = stats[topic];

      item.mentions += 1;
      item.history[bucketIndex] += 1;

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
        item.firstSeenAt === null ? postTime : Math.min(item.firstSeenAt, postTime);
      item.lastSeenAt =
        item.lastSeenAt === null ? postTime : Math.max(item.lastSeenAt, postTime);

      if (item.examples.length < 5) {
        item.examples.push({
          id: (post as any).id || `${sourceId}-${postTime}`,
          text: text.slice(0, 280),
          url: getPostUrl(post),
          publishedAt: new Date(postTime).toISOString(),
          sourceTitle,
        });
      }
    }
  }

  const trends: TrendItem[] = Object.entries(stats)
    .map(([topic, item]) => {
      const momentum = calcMomentum(item.history);
      const sourceCount = Object.keys(item.sourceMap).length;
      const displayTopic = formatTopic(topic);

      const topSources = Object.values(item.sourceMap)
        .sort((a, b) => b.mentions - a.mentions)
        .slice(0, 8);

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
        firstSeenAt: item.firstSeenAt ? new Date(item.firstSeenAt).toISOString() : null,
        lastSeenAt: item.lastSeenAt ? new Date(item.lastSeenAt).toISOString() : null,
        examples: item.examples,
        category: inferCategory(topic),
      };

      trend.score = calcScore(trend);
      return trend;
    })
    .filter((trend) => shouldKeepTopic(trend.topic.toLowerCase(), trend.mentions, trend.sourceCount))
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
    JSON.stringify(trends, null, 2)
  );

  console.log(
    `📊 Trends updated for ${countryCode}: ${trends.length} topics`
  );
}
