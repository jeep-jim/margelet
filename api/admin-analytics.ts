import { redis } from "./lib/kv.js";

const ADMIN_IDS = new Set(["1372669404"]);
const STATS_KEY = "margelet:stats";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const telegramUserId = body.telegramUserId;

    if (!ADMIN_IDS.has(telegramUserId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const views = await redis.hget(STATS_KEY, "views");

    const countries = await redis.hgetall(`${STATS_KEY}:countries`);
    const devices = await redis.hgetall(`${STATS_KEY}:devices`);

    return res.status(200).json({
      views: Number(views || 0),
      countries: countries || {},
      devices: devices || {},
    });
  } catch (error) {
    console.error("analytics error", error);
    return res.status(500).json({ error: "Failed" });
  }
}