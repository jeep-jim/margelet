import { savePost, getPostByUrl, getFeedPosts } from "./lib/kv.js";
import { parseTelegramPostUrl, ingestTelegramPost } from "../src/lib/telegram.js";
import type { IngestedPost, ContentTag } from "../src/types/app";

type UserRole = "user" | "channel_owner" | "admin";
type PostStatus = "published" | "pending" | "blocked";

const DAILY_USER_LIMIT = 1;

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

function resolveRole(value: unknown): UserRole {
  if (value === "admin") return "admin";
  if (value === "channel_owner") return "channel_owner";
  return "user";
}

function getStartOfUtcDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function getUserPostsToday(telegramId: string | null) {
  if (!telegramId) return 0;

  const posts = await getFeedPosts(200);
  const dayStart = getStartOfUtcDay().getTime();

  return posts.filter((post) => {
    if (post.addedBy?.telegramId !== telegramId) return false;

    const createdAt = Date.parse(post.createdAt || "");
    if (!Number.isFinite(createdAt)) return false;

    return createdAt >= dayStart;
  }).length;
}

function simpleModeration(text: string): PostStatus {
  const t = text.toLowerCase();

  if (
    t.includes("cp") ||
    t.includes("pedo") ||
    t.includes("pedophile") ||
    t.includes("child porn")
  ) {
    return "blocked";
  }

  if (
    t.includes("porn") ||
    t.includes("nsfw") ||
    t.includes("sex") ||
    t.includes("xxx") ||
    t.includes("gore") ||
    t.includes("suicide") ||
    t.includes("drug") ||
    t.includes("casino") ||
    t.includes("scam")
  ) {
    return "pending";
  }

  return "published";
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const url = asCleanString(body.url);
    const plan = resolvePlan(body.plan);
    const role = resolveRole(body.role);

    const addedByTelegramId = asCleanString(body.addedByTelegramId);
    const addedByUsername = asCleanString(body.addedByUsername);

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

    if (!addedByTelegramId && role !== "admin") {
      return res.status(401).json({ error: "Telegram auth required" });
    }

    if (role === "user") {
      const count = await getUserPostsToday(addedByTelegramId);

      if (count >= DAILY_USER_LIMIT) {
        return res.status(429).json({
          error: "Daily limit reached",
        });
      }

      if (!body.tag) {
        return res.status(400).json({
          error: "Tag required for user",
        });
      }
    }

    const ingest = await ingestTelegramPost(normalizedUrl);

    if (!ingest) {
      return res.status(500).json({ error: "Failed to ingest Telegram post" });
    }

    const moderationText = `
      ${normalizedUrl}
      ${ingest.source.title}
      ${ingest.source.handle}
      ${ingest.text}
    `;

    const status = simpleModeration(moderationText);

    const ttlHours = resolveTTL(plan);
    const now = new Date();
    const nowIso = now.toISOString();
    const expires = new Date(now.getTime() + ttlHours * 3600 * 1000);

    const post: IngestedPost & {
      status: PostStatus;
      role?: UserRole;
      mediaRefreshedAt?: string | null;
    } = {
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

      createdAt: nowIso,
      expiresAt: expires.toISOString(),
      ttlHours,
      mediaRefreshedAt: nowIso,

      tag: body.tag || "other",

      addedBy: {
        telegramId: addedByTelegramId,
        username: addedByUsername,
      },

      billing: {
        plan,
        autopublishEnabled:
          plan === "pro_3m" || plan === "pro_12m",
      },

      status,
      role,
    };

    const saved = await savePost(post);

    return res.status(200).json({
      post: saved,
      status: saved.status,
    });
  } catch (error) {
    console.error("submit-post api error", error);
    return res.status(500).json({ error: "Failed to submit post" });
  }
}