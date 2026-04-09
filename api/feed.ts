import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFeedPosts, savePost, redis } from "./lib/kv.js";
import { ingestTelegramPost } from "../src/lib/telegram.js";
import { runTrustedSourcesPolling } from "./lib/sources.js";
import type { IngestedPost } from "../src/types/app";

type RefreshablePost = IngestedPost & {
  status?: string;
  role?: string;
  mediaRefreshedAt?: string | null;
};

let lastPollAt = 0;

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function isVisiblePost(post: IngestedPost) {
  const status = (post as RefreshablePost).status;
  if (!status) return true;
  return status === "published";
}

function normalizeCountryCode(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

function resolveCountryCode(req: VercelRequest) {
  const rawCountry =
    typeof req.query.countryCode === "string"
      ? req.query.countryCode
      : typeof req.query.locale === "string"
        ? req.query.locale
        : null;

  return normalizeCountryCode(rawCountry);
}

function shouldRefresh(post: RefreshablePost) {
  const lastRefresh =
    Date.parse(post.mediaRefreshedAt || "") ||
    Date.parse(post.createdAt || "");

  if (!Number.isFinite(lastRefresh)) return false;

  const now = Date.now();
  const refreshEveryMs = 60 * 60 * 1000;

  return now - lastRefresh >= refreshEveryMs;
}

async function refreshPostKeepingTtl(post: RefreshablePost): Promise<RefreshablePost> {
  try {
    const ingest = await ingestTelegramPost(post.postUrl);
    if (!ingest) return post;

    const refreshedAt = new Date().toISOString();

    const updated: RefreshablePost = {
      ...post,

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

      id: post.id,
      postUrl: post.postUrl,
      createdAt: post.createdAt,
      expiresAt: post.expiresAt,
      ttlHours: post.ttlHours,
      tag: post.tag,
      tags:
        Array.isArray(post.tags) && post.tags.length > 0
          ? post.tags
          : [post.tag || "other"],
      addedBy: post.addedBy,
      billing: post.billing,
      status: post.status,
      role: post.role,
      moderation: post.moderation,

      sourceId: post.sourceId ?? null,
      sourceCountryCode: post.sourceCountryCode ?? null,

      mediaRefreshedAt: refreshedAt,
    };

    await savePost(updated);

    return updated;
  } catch (error) {
    console.error("refreshPostKeepingTtl error", error);
    return post;
  }
}

function tryRunPoller() {
  const now = Date.now();
  const cooldown = 30 * 1000;

  if (now - lastPollAt < cooldown) return;

  lastPollAt = now;

  runTrustedSourcesPolling().catch((err) => {
    console.error("poller error", err);
  });
}

function getAgeHours(post: IngestedPost) {
  const createdAtMs = Date.parse(post.createdAt || "");
  if (!Number.isFinite(createdAtMs)) return 999;
  return Math.max(0, (Date.now() - createdAtMs) / (1000 * 60 * 60));
}

function getFreshnessBoost(post: IngestedPost) {
  const ageHours = getAgeHours(post);

  if (ageHours <= 1) return 14;
  if (ageHours <= 3) return 10;
  if (ageHours <= 6) return 7;
  if (ageHours <= 12) return 4;
  if (ageHours <= 24) return 1;

  return 0;
}

function getRecencyTieBreaker(post: IngestedPost) {
  const createdAtMs = Date.parse(post.createdAt || "");
  return Number.isFinite(createdAtMs) ? createdAtMs : 0;
}

async function getPostMetrics(postId: number) {
  try {
    const raw = await redis.hgetall<Record<string, string | number>>(
      `margelet:stats:post:${postId}`
    );

    const views = Number(raw?.views || 0);
    const opens = Number(raw?.opens || 0);
    const tgClicks = Number(raw?.tgClicks || 0);
    const likes = Number(raw?.likes || 0);

    return {
      views: Number.isFinite(views) ? views : 0,
      opens: Number.isFinite(opens) ? opens : 0,
      tgClicks: Number.isFinite(tgClicks) ? tgClicks : 0,
      likes: Number.isFinite(likes) ? likes : 0,
    };
  } catch {
    return {
      views: 0,
      opens: 0,
      tgClicks: 0,
      likes: 0,
    };
  }
}

async function getSourceMetrics(handle: string) {
  try {
    const raw = await redis.hgetall<Record<string, string | number>>(
      `margelet:stats:source:${handle}`
    );

    const subscriptions = Number(raw?.subscriptions || 0);
    const views = Number(raw?.views || 0);
    const opens = Number(raw?.opens || 0);
    const tgClicks = Number(raw?.tgClicks || 0);

    return {
      subscriptions: Number.isFinite(subscriptions) ? subscriptions : 0,
      views: Number.isFinite(views) ? views : 0,
      opens: Number.isFinite(opens) ? opens : 0,
      tgClicks: Number.isFinite(tgClicks) ? tgClicks : 0,
    };
  } catch {
    return {
      subscriptions: 0,
      views: 0,
      opens: 0,
      tgClicks: 0,
    };
  }
}

function calculateScore(params: {
  post: IngestedPost;
  postMetrics: {
    views: number;
    opens: number;
    tgClicks: number;
    likes: number;
  };
  sourceMetrics: {
    subscriptions: number;
    views: number;
    opens: number;
    tgClicks: number;
  };
}) {
  const { post, postMetrics, sourceMetrics } = params;

  const freshness = getFreshnessBoost(post);

  const engagement =
    postMetrics.views * 0.15 +
    postMetrics.opens * 1.5 +
    postMetrics.tgClicks * 3 +
    postMetrics.likes * 4 +
    sourceMetrics.subscriptions * 5;

  return freshness + engagement;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    tryRunPoller();

    const limit =
      typeof req.query.limit === "string"
        ? Math.min(parseInt(req.query.limit, 10) || 100, 200)
        : 100;

    const countryCode = resolveCountryCode(req);

    const posts = (await getFeedPosts(limit, {
      countryCode,
    })) as RefreshablePost[];

    const refreshedPosts = await Promise.all(
      posts.map(async (post) => {
        if (!shouldRefresh(post)) {
          return post;
        }

        return refreshPostKeepingTtl(post);
      })
    );

    const visiblePosts = refreshedPosts.filter(isVisiblePost);

    const ranked = await Promise.all(
      visiblePosts.map(async (post) => {
        const [postMetrics, sourceMetrics] = await Promise.all([
          getPostMetrics(post.id),
          getSourceMetrics(post.source.handle),
        ]);

        const score = calculateScore({
          post,
          postMetrics,
          sourceMetrics,
        });

        return {
          post,
          score,
          recency: getRecencyTieBreaker(post),
        };
      })
    );

    ranked.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.recency - a.recency;
    });

    return res.status(200).json({
      posts: ranked.map((item) => item.post),
    });
  } catch (error) {
    console.error("feed api error", error);

    return res.status(500).json({
      error: "Failed to load feed",
    });
  }
}