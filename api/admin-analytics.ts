import { redis, getFeedPosts } from "./lib/kv.js";

const ADMIN_IDS = new Set(["1372669404"]);
const STATS_KEY = "margelet:stats";

type TopPostItem = {
  id: number;
  postUrl: string;
  sourceHandle: string;
  sourceTitle: string;
  textPreview: string;
  createdAt: string;
  tag: string;
  views: number;
  opens: number;
  tgClicks: number;
  likes: number;
  subscriptions: number;
  score: number;
};

type TopSourceItem = {
  handle: string;
  title: string;
  countryCode: string | null;
  views: number;
  opens: number;
  tgClicks: number;
  subscriptions: number;
  score: number;
};

function normalizeStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") {
    return {};
  }

  const out: Record<string, string> = {};

  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    out[key] = String(raw ?? "0");
  }

  return out;
}

function sumRange(days: Record<string, string>, range: number) {
  const keys = Object.keys(days).sort().reverse();

  let total = 0;

  for (let i = 0; i < range; i++) {
    const key = keys[i];
    if (!key) continue;

    total += Number(days[key] || 0);
  }

  return total;
}

function textPreview(text: string) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, 140);
}

function calcScore(params: {
  views: number;
  opens: number;
  tgClicks: number;
  likes: number;
  subscriptions: number;
}) {
  return (
    params.views * 0.15 +
    params.opens * 1.5 +
    params.tgClicks * 3 +
    params.likes * 4 +
    params.subscriptions * 5
  );
}

function normalizeCountryCode(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

function matchesCountry(value: string | null | undefined, filter: string | null) {
  if (!filter) return true;
  return normalizeCountryCode(value) === filter;
}

async function getPostMetrics(postId: number) {
  const raw = await redis.hgetall<Record<string, string | number>>(
    `${STATS_KEY}:post:${postId}`
  );

  const views = Number(raw?.views || 0);
  const opens = Number(raw?.opens || 0);
  const tgClicks = Number(raw?.tgClicks || 0);
  const likes = Number(raw?.likes || 0);

  return {
    views: Number.isFinite(views) ? views : 0,
    opens: Number.isFinite(opens) ? opens : 0,
    tgClicks: Number.isFinite(tgClicks) ? tgClicks : 0,
    likes: Number.isFinite(likes) ? likes : 0,
  };
}

async function getSourceMetrics(handle: string) {
  const raw = await redis.hgetall<Record<string, string | number>>(
    `${STATS_KEY}:source:${handle}`
  );

  const views = Number(raw?.views || 0);
  const opens = Number(raw?.opens || 0);
  const tgClicks = Number(raw?.tgClicks || 0);
  const subscriptions = Number(raw?.subscriptions || 0);

  return {
    views: Number.isFinite(views) ? views : 0,
    opens: Number.isFinite(opens) ? opens : 0,
    tgClicks: Number.isFinite(tgClicks) ? tgClicks : 0,
    subscriptions: Number.isFinite(subscriptions) ? subscriptions : 0,
  };
}

function filterMapByCountry(
  map: Record<string, string>,
  countryCode: string | null
) {
  if (!countryCode) return map;

  const value = map[countryCode];
  if (typeof value === "undefined") return {};

  return { [countryCode]: value };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const telegramUserId =
      typeof body.telegramUserId === "string" ? body.telegramUserId.trim() : "";

    if (!ADMIN_IDS.has(telegramUserId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const countryCode = normalizeCountryCode(body.countryCode);

    const [
      views,
      opens,
      tgClicks,
      likes,
      subscriptions,
      uniqueUsers,
      rawCountries,
      rawCountriesUnique,
      rawDevices,
      rawDevicesUnique,
      rawDaysViews,
      rawDaysUnique,
      rawDaysOpens,
      rawDaysTgClicks,
      feedPosts,
    ] = await Promise.all([
      redis.hget(STATS_KEY, "views"),
      redis.hget(STATS_KEY, "opens"),
      redis.hget(STATS_KEY, "tgClicks"),
      redis.hget(STATS_KEY, "likes"),
      redis.hget(STATS_KEY, "subscriptions"),
      redis.hget(STATS_KEY, "uniqueUsers"),
      redis.hgetall(`${STATS_KEY}:countries`),
      redis.hgetall(`${STATS_KEY}:countries:unique`),
      redis.hgetall(`${STATS_KEY}:devices`),
      redis.hgetall(`${STATS_KEY}:devices:unique`),
      redis.hgetall(`${STATS_KEY}:days`),
      redis.hgetall(`${STATS_KEY}:unique:days`),
      redis.hgetall(`${STATS_KEY}:days:opens`),
      redis.hgetall(`${STATS_KEY}:days:tgClicks`),
      getFeedPosts(400, { countryCode }),
    ]);

    const countries = filterMapByCountry(normalizeStringMap(rawCountries), countryCode);
    const countriesUnique = filterMapByCountry(
      normalizeStringMap(rawCountriesUnique),
      countryCode
    );
    const devices = normalizeStringMap(rawDevices);
    const devicesUnique = normalizeStringMap(rawDevicesUnique);
    const days = normalizeStringMap(rawDaysViews);
    const uniqueDays = normalizeStringMap(rawDaysUnique);
    const openDays = normalizeStringMap(rawDaysOpens);
    const tgClickDays = normalizeStringMap(rawDaysTgClicks);

    const filteredFeedPosts = (feedPosts || []).filter((post) =>
      matchesCountry(post.sourceCountryCode, countryCode)
    );

    const topPostsRaw = await Promise.all(
      filteredFeedPosts.map(async (post) => {
        const [postMetrics, sourceMetrics] = await Promise.all([
          getPostMetrics(post.id),
          getSourceMetrics(post.source.handle),
        ]);

        const score = calcScore({
          views: postMetrics.views,
          opens: postMetrics.opens,
          tgClicks: postMetrics.tgClicks,
          likes: postMetrics.likes,
          subscriptions: sourceMetrics.subscriptions,
        });

        const item: TopPostItem = {
          id: post.id,
          postUrl: post.postUrl,
          sourceHandle: post.source.handle,
          sourceTitle: post.source.title,
          textPreview: textPreview(post.text),
          createdAt: post.createdAt,
          tag: post.tag || "other",
          views: postMetrics.views,
          opens: postMetrics.opens,
          tgClicks: postMetrics.tgClicks,
          likes: postMetrics.likes,
          subscriptions: sourceMetrics.subscriptions,
          score,
        };

        return item;
      })
    );

    const topPosts = topPostsRaw
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.id - a.id;
      })
      .slice(0, 12);

    const sourceMap = new Map<string, TopSourceItem>();

    for (const post of filteredFeedPosts) {
      if (sourceMap.has(post.source.handle)) continue;

      const sourceMetrics = await getSourceMetrics(post.source.handle);

      sourceMap.set(post.source.handle, {
        handle: post.source.handle,
        title: post.source.title,
        countryCode: post.sourceCountryCode || null,
        views: sourceMetrics.views,
        opens: sourceMetrics.opens,
        tgClicks: sourceMetrics.tgClicks,
        subscriptions: sourceMetrics.subscriptions,
        score: calcScore({
          views: sourceMetrics.views,
          opens: sourceMetrics.opens,
          tgClicks: sourceMetrics.tgClicks,
          likes: 0,
          subscriptions: sourceMetrics.subscriptions,
        }),
      });
    }

    const topSources = Array.from(sourceMap.values())
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.handle.localeCompare(b.handle);
      })
      .slice(0, 12);

    return res.status(200).json({
      views: Number(views || 0),
      opens: Number(opens || 0),
      tgClicks: Number(tgClicks || 0),
      likes: Number(likes || 0),
      subscriptions: Number(subscriptions || 0),
      uniqueUsers: Number(uniqueUsers || 0),

      countries,
      countriesUnique,
      devices,
      devicesUnique,

      todayViews: sumRange(days, 1),
      last7Views: sumRange(days, 7),
      last30Views: sumRange(days, 30),

      todayUniqueUsers: sumRange(uniqueDays, 1),
      last7UniqueUsers: sumRange(uniqueDays, 7),
      last30UniqueUsers: sumRange(uniqueDays, 30),

      todayOpens: sumRange(openDays, 1),
      last7Opens: sumRange(openDays, 7),
      last30Opens: sumRange(openDays, 30),

      todayTgClicks: sumRange(tgClickDays, 1),
      last7TgClicks: sumRange(tgClickDays, 7),
      last30TgClicks: sumRange(tgClickDays, 30),

      days,
      uniqueDays,
      openDays,
      tgClickDays,

      topPosts,
      topSources,
    });
  } catch (error) {
    console.error("analytics error", error);
    return res.status(500).json({ error: "Failed" });
  }
}