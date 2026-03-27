import { redis } from "./lib/kv.js";
import type { Video } from "../src/types/app.js";

const ADMIN_TELEGRAM_IDS = new Set([
  "1372669404",
]);

const FEED_IDS_KEY = "margelet:feed:ids";
const POST_KEY_PREFIX = "margelet:post:";

function postKey(id: number | string) {
  return `${POST_KEY_PREFIX}${id}`;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const n = Number(String(value || "").trim());
  return Number.isFinite(n) ? n : null;
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const telegramUserId =
      typeof body.telegramUserId === "string"
        ? body.telegramUserId.trim()
        : "";

    if (!telegramUserId) {
      return res.status(400).json({ error: "Missing telegramUserId" });
    }

    if (!ADMIN_TELEGRAM_IDS.has(telegramUserId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const ids = await redis.lrange<number | string>(FEED_IDS_KEY, 0, 500);

    if (!ids || ids.length === 0) {
      return res.status(200).json({ ok: true, posts: [] });
    }

    const posts: Video[] = [];

    for (const rawId of ids) {
      const id = asNumber(rawId);
      if (!id) continue;

      const raw = await redis.get(postKey(id));
      if (!raw || typeof raw !== "object") continue;

      posts.push(raw as Video);
    }

    return res.status(200).json({
      ok: true,
      posts,
    });
  } catch (error) {
    console.error("admin-posts api error", error);
    return res.status(500).json({ error: "Failed to load admin posts" });
  }
}