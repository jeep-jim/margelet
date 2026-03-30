import { savePost, getPostByUrl } from "./lib/kv.js";
import { parseTelegramPostUrl, ingestTelegramPost } from "../src/lib/telegram.js";
import type { IngestedPost, ContentTag } from "../src/types/app";

function asCleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function resolvePlan(plan: unknown): IngestedPost["billing"]["plan"] {
  if (plan === "pro_1m") return "pro_1m";
  if (plan === "pro_3m") return "pro_3m";
  if (plan === "pro_12m") return "pro_12m";
  return "free";
}

function resolveTTL(plan: IngestedPost["billing"]["plan"]): number {
  if (plan === "pro_12m") return 48;
  return 24;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const url = asCleanString(body.url);
    const tag = body.tag as ContentTag;
    const plan = resolvePlan(body.plan);

    if (!url) {
      return res.status(400).json({ error: "Missing url" });
    }

    const parsed = parseTelegramPostUrl(url);

    if (!parsed) {
      return res.status(400).json({ error: "Invalid Telegram post URL" });
    }

    const normalizedUrl = parsed.normalizedUrl;

    const existing = await getPostByUrl(normalizedUrl);

    if (existing) {
      return res.status(200).json({ post: existing, duplicated: true });
    }

    // 🔥 ГЛАВНОЕ: ingest Telegram поста
    const ingest = await ingestTelegramPost(normalizedUrl);

    if (!ingest) {
      return res.status(500).json({ error: "Failed to ingest Telegram post" });
    }

    const ttlHours = resolveTTL(plan);
    const now = new Date();
    const expires = new Date(now.getTime() + ttlHours * 3600 * 1000);

    const post: IngestedPost = {
      id: Date.now(),

      postUrl: normalizedUrl,

      source: {
        handle: ingest.source.handle,
        title: ingest.source.title,
        avatar: ingest.source.avatar,
        verified: ingest.source.verified,
      },

      text: ingest.text,
      links: ingest.links,

      contentType: ingest.contentType,
      media: ingest.media,

      hasMediaInOriginal: ingest.hasMediaInOriginal,
      fallbackReason: ingest.fallbackReason,

      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      ttlHours,

      tag: tag || "other",

      addedBy: {
        telegramId: asCleanString(body.addedByTelegramId),
        username: asCleanString(body.addedByUsername),
      },

      billing: {
        plan,
        autopublishEnabled:
          plan === "pro_3m" || plan === "pro_12m",
      },
    };

    const saved = await savePost(post);

    return res.status(200).json({ post: saved });
  } catch (error) {
    console.error("submit-post api error", error);
    return res.status(500).json({ error: "Failed to submit post" });
  }
}