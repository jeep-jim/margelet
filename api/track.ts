import { redis } from "./lib/kv.js";

const STATS_KEY = "margelet:stats";
const ADMIN_IDS = ["1372669404"];

function getTodayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function getCountry(req: any) {
  return req.headers["x-vercel-ip-country"] || "unknown";
}

function getDevice(userAgent: string) {
  const ua = userAgent.toLowerCase();

  if (ua.includes("mobile")) return "mobile";
  if (ua.includes("tablet")) return "tablet";
  return "desktop";
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const telegramUserId =
      req.headers["x-telegram-id"] || body.telegramUserId;

    // ❌ НЕ считаем админа
    if (telegramUserId && ADMIN_IDS.includes(String(telegramUserId))) {
      return res.status(200).json({ ok: true, skipped: "admin" });
    }

    const ua = req.headers["user-agent"] || "";
    const country = getCountry(req);
    const device = getDevice(ua);

    const today = getTodayKey();

    // 🔥 ОБЩИЕ
    await redis.hincrby(STATS_KEY, "views", 1);

    // 🔥 ПО ДНЯМ
    await redis.hincrby(`${STATS_KEY}:days`, today, 1);

    // 🔥 СТРАНЫ
    await redis.hincrby(`${STATS_KEY}:countries`, country, 1);

    // 🔥 УСТРОЙСТВА
    await redis.hincrby(`${STATS_KEY}:devices`, device, 1);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("track error", error);
    return res.status(500).json({ error: "Failed" });
  }
}