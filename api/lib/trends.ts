import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import type { IngestedPost } from "./contracts.js";

const TRENDS_DIR = "data/trends";

const STOP_WORDS = new Set([
  "это","что","как","для","если","или","его","её","ее","она","они","оно","там","тут","уже","ещё","еще",
  "вот","все","всё","сам","сама","сами","над","под","без","при","про","чем","тем","где","кто",
  "когда","почему","потому","так","также","только","можно","нужно","будет","были","было","быть",
  "есть","нет","да","не","но","же","бы","ли","на","по","из","от","до","за","во","со","ко","об",
  "а","и","в","с","к","у","о","мы","вы","он","их","им","нас","вам","вам","тебя","меня",
  "the","and","for","with","this","that","from","are","was","were","you","your","they","have",
  "has","had","not","but","his","her","its","our","their","about","into","after","before","what",
  "when","where","why","how","who","all","can","will","just","more","than","then","there","here",
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

function extractTokens(text: string): string[] {
  return cleanText(text)
    .split(" ")
    .map((w) => w.trim())
    .filter((w) => {
      if (w.length < 3) return false;
      if (STOP_WORDS.has(w)) return false;
      if (/^\d+$/.test(w)) return false;
      return true;
    });
}

function extractTopics(text: string): string[] {
  const tokens = extractTokens(text);
  const topics: string[] = [];

  for (const token of tokens) topics.push(token);

  for (let i = 0; i < tokens.length - 1; i++) {
    topics.push(`${tokens[i]} ${tokens[i + 1]}`);
  }

  for (let i = 0; i < tokens.length - 2; i++) {
    topics.push(`${tokens[i]} ${tokens[i + 1]} ${tokens[i + 2]}`);
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
    .filter(([topic, item]) => {
      const parts = topic.split(" ");

      if (item.mentions < 3) return false;
      if (parts.length === 1 && item.mentions < 6) return false;
      if (parts.length >= 2 && item.mentions < 3) return false;

      return true;
    })
    .map(([topic, item]) => {
      const momentum = calcMomentum(item.history);

      const topSources = Object.values(item.sourceMap)
        .sort((a, b) => b.mentions - a.mentions)
        .slice(0, 8);

      return {
        topic,
        word: topic,
        mentions: item.mentions,
        momentum,
        change: `${momentum >= 0 ? "+" : ""}${momentum}%`,
        sourceCount: Object.keys(item.sourceMap).length,
        countries: [{ code: countryCode, mentions: item.mentions }],
        topSources,
        history: item.history,
        firstSeenAt: item.firstSeenAt ? new Date(item.firstSeenAt).toISOString() : null,
        lastSeenAt: item.lastSeenAt ? new Date(item.lastSeenAt).toISOString() : null,
        examples: item.examples,
      };
    })
    .sort((a, b) => {
      const scoreA =
        a.mentions +
        Math.abs(a.momentum) * 100 +
        a.sourceCount * 50;

      const scoreB =
        b.mentions +
        Math.abs(b.momentum) * 100 +
        b.sourceCount * 50;

      return scoreB - scoreA;
    })
    .slice(0, 100);

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