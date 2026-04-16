import type { VercelRequest, VercelResponse } from "@vercel/node";
import { parseTelegramPostUrl, ingestTelegramPost } from "../src/lib/telegram.ts";
import type { IngestedPost, ContentTag, Locale } from "../src/types/app.ts";
import { readFeedFile, writeFeedFile } from "./lib/blob-store.ts";

type UserRole = "user" | "channel_owner" | "admin";
type PostStatus = "published" | "pending" | "blocked";

const DAILY_USER_LIMIT = 1;

function asCleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function resolveRole(value: unknown): UserRole {
  if (value === "admin") return "admin";
  if (value === "channel_owner") return "channel_owner";
  return "user";
}

function resolveLocale(value: unknown): Locale | null {
  if (
    value === "ru" ||
    value === "en" ||
    value === "de" ||
    value === "es" ||
    value === "tr" ||
    value === "fr" ||
    value === "it" ||
    value === "pt-br" ||
    value === "id" ||
    value === "pl"
  ) {
    return value;
  }

  return null;
}

function resolveTag(value: unknown): ContentTag {
  return (asCleanString(value) as ContentTag) || "other";
}

function normalizeTags(raw: unknown, fallback: ContentTag): ContentTag[] {
  const tags = Array.isArray(raw)
    ? raw
        .map((item) => asCleanString(item))
        .filter((item): item is ContentTag => Boolean(item))
    : [];

  const unique = Array.from(new Set(tags));

  if (unique.length > 0) {
    return unique;
  }

  return [fallback];
}

function getStartOfUtcDay() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function parseDateMs(value: string | null | undefined) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? ms : null;
}

function makePostId(postUrl: string) {
  let hash = 2166136261;

  for (let i = 0; i < postUrl.length; i += 1) {
    hash ^= postUrl.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}

async function getFeedPosts(): Promise<IngestedPost[]> {
  const file = await readFeedFile<IngestedPost>();
  const now = Date.now();

  return (Array.isArray(file.posts) ? file.posts : []).filter((post) => {
    const expiresAt = parseDateMs(post?.expiresAt);
    return expiresAt === null || expiresAt > now;
  });
}

async function saveFeedPosts(posts: IngestedPost[]) {
  const now = Date.now();

  const cleaned = posts
    .filter(Boolean)
    .filter((post) => {
      const expiresAt = parseDateMs(post?.expiresAt);
      return expiresAt === null || expiresAt > now;
    })
    .sort((a, b) => {
      const aMs = parseDateMs(a?.createdAt) || 0;
      const bMs = parseDateMs(b?.createdAt) || 0;
      return bMs - aMs;
    });

  await writeFeedFile(cleaned);
}

async function getPostByUrl(postUrl: string): Promise<IngestedPost | null> {
  const posts = await getFeedPosts();
  return posts.find((post) => post.postUrl === postUrl) || null;
}

async function getUserPostsToday(telegramId: string | null, locale: Locale | null) {
  if (!telegramId) return 0;

  const posts = await getFeedPosts();
  const dayStart = getStartOfUtcDay().getTime();

  return posts.filter((post) => {
    if (post.sourceCountryCode !== locale) return false;
    if (post.addedBy?.telegramId !== telegramId) return false;

    const createdAt = parseDateMs(post.createdAt);
    if (createdAt === null) return false;

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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const url = asCleanString(body.url);
    const role = resolveRole(body.role);
    const locale = resolveLocale(body.locale);

    const addedByTelegramId = asCleanString(body.addedByTelegramId);
    const addedByUsername = asCleanString(body.addedByUsername);

    if (!url) {
      return res.status(400).json({ error: "Missing url" });
    }

    if (!locale) {
      return res.status(400).json({ error: "Missing locale" });
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

    const primaryTag = resolveTag(body.tag);
    const tags = normalizeTags(body.tags, primaryTag);

    if (role === "user") {
      const count = await getUserPostsToday(addedByTelegramId, locale);

      if (count >= DAILY_USER_LIMIT) {
        return res.status(429).json({
          error: "Daily limit reached",
        });
      }

      if (!body.tag && !Array.isArray(body.tags)) {
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

    const ttlHours = 24;
    const now = new Date();
    const nowIso = now.toISOString();
    const expires = new Date(now.getTime() + ttlHours * 3600 * 1000);

    const post: IngestedPost = {
      id: makePostId(normalizedUrl),

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

      tag: primaryTag,
      tags,

      addedBy: {
        telegramId: addedByTelegramId,
        username: addedByUsername,
      },

      billing: {
        plan: "free",
        autopublishEnabled: false,
      },

      sourceId: null,
      sourceCountryCode: locale,

      status,
      role,

      moderation: {
        status,
        reason: null,
        reviewedAt: nowIso,
      },
    };

    const currentPosts = await getFeedPosts();
    const nextPosts = [post, ...currentPosts.filter((item) => item.postUrl !== post.postUrl)];

    await saveFeedPosts(nextPosts);

    return res.status(200).json({
      post,
      status: post.status,
      duplicated: false,
    });
  } catch (error) {
    console.error("submit-post api error", error);
    return res.status(500).json({ error: "Failed to submit post" });
  }
}