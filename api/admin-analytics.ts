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

    const views = await redis.hget(STATS_KEY, "views");
    const rawCountries = await redis.hgetall(`${STATS_KEY}:countries`);
    const rawDevices = await redis.hgetall(`${STATS_KEY}:devices`);
    const rawDays = await redis.hgetall(`${STATS_KEY}:days`);

    const countries = normalizeStringMap(rawCountries);
    const devices = normalizeStringMap(rawDevices);
    const days = normalizeStringMap(rawDays);

    return res.status(200).json({
      views: Number(views || 0),
      countries,
      devices,
      today: sumRange(days, 1),
      last7: sumRange(days, 7),
      last30: sumRange(days, 30),
      days,
    });
  } catch (error) {
    console.error("analytics error", error);
    return res.status(500).json({ error: "Failed" });
  }
}