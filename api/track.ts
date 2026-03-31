import { redis } from "./lib/kv.js";

const STATS_KEY = "margelet:stats";

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
    const ua = req.headers["user-agent"] || "";
    const country = getCountry(req);
    const device = getDevice(ua);

    // глобальный счётчик
    await redis.hincrby(STATS_KEY, "views", 1);

    // страна
    await redis.hincrby(`${STATS_KEY}:countries`, country, 1);

    // устройство
    await redis.hincrby(`${STATS_KEY}:devices`, device, 1);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("track error", error);
    return res.status(500).json({ error: "Failed" });
  }
}