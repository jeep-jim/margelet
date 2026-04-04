import { redis } from "./lib/kv.js";
import type { IngestedPost } from "../src/types/app.js";

const ADMIN_TELEGRAM_IDS = new Set(["1372669404"]);

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

function isAdmin(telegramUserId: string) {
  return ADMIN_TELEGRAM_IDS.has(telegramUserId);
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");

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

    if (!isAdmin(telegramUserId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (req.method === "POST") {
      const ids = await redis.lrange<number | string>(FEED_IDS_KEY, 0, 500);

      if (!ids || ids.length === 0) {
        return res.status(200).json({ ok: true, posts: [] });
      }

      const uniqueIds = Array.from(
        new Set(
          ids
            .map((rawId) => {
              const id = asNumber(rawId);
              return id ? String(id) : null;
            })
            .filter((id): id is string => Boolean(id))
        )
      );

      const posts: IngestedPost[] = [];

      for (const rawId of uniqueIds) {
        const raw = await redis.get(postKey(rawId));
        if (!raw || typeof raw !== "object") continue;

        posts.push(raw as IngestedPost);
      }

      return res.status(200).json({
        ok: true,
        posts,
      });
    }

    if (req.method === "PATCH") {
      const id = asNumber(body.id);
      const status = body.status;

      if (!id) {
        return res.status(400).json({ error: "Missing id" });
      }

      if (!["published", "blocked"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const key = postKey(id);
      const raw = await redis.get(key);

      if (!raw || typeof raw !== "object") {
        return res.status(404).json({ error: "Post not found" });
      }

      const post = raw as IngestedPost;

      const updated: IngestedPost = {
        ...post,
        status,
        moderation: {
          status,
          reason: null,
          reviewedAt: new Date().toISOString(),
        },
      };

      await redis.set(key, updated);

      return res.status(200).json({
        ok: true,
        post: updated,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("admin-posts api error", error);
    return res.status(500).json({ error: "Failed" });
  }
}