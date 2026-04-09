import { redis } from "./lib/kv.js";

const ADMIN_IDS = new Set(["1372669404"]);
const STATS_KEY = "margelet:stats";

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
    ]);

    const countries = normalizeStringMap(rawCountries);
    const countriesUnique = normalizeStringMap(rawCountriesUnique);
    const devices = normalizeStringMap(rawDevices);
    const devicesUnique = normalizeStringMap(rawDevicesUnique);
    const days = normalizeStringMap(rawDaysViews);
    const uniqueDays = normalizeStringMap(rawDaysUnique);
    const openDays = normalizeStringMap(rawDaysOpens);
    const tgClickDays = normalizeStringMap(rawDaysTgClicks);

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
    });
  } catch (error) {
    console.error("analytics error", error);
    return res.status(500).json({ error: "Failed" });
  }
}