import { getFeedPosts, savePost, redis } from "./kv.js";
import { listSources, runTrustedSourcesPolling } from "./sources.js";
import { ingestTelegramPost } from "../../src/lib/telegram.js";
import type { IngestedPost } from "../../src/types/app.js";

type RefreshablePost = IngestedPost & {
  status?: string;
  role?: string;
  mediaRefreshedAt?: string | null;
};

type PostMetrics = {
  views: number;
  opens: number;
  tgClicks: number;
  likes: number;
};

type SourceMetrics = {
  subscriptions: number;
  views: number;
  opens: number;
  tgClicks: number;
};

export type CachedFeedPayload = {
  builtAt: string;
  countryCode: string | null;
  posts: IngestedPost[];
};

export type RebuildResult = {
  builtAt: string;
  refreshedCount: number;
  countryCode: string | null;
  postCount: number;
  cacheHit: boolean;
};

const FEED_CACHE_VERSION = "v2";
const FEED_CACHE_PREFIX = `margelet:feed:cache:${FEED_CACHE_VERSION}:`;
const FEED_CACHE_TTL_SECONDS = 60 * 10;
const FEED_STALE_AFTER_MS = FEED_CACHE_TTL_SECONDS * 1000;

const FEED_REBUILD_LOCK_KEY = `margelet:feed:rebuild:lock:${FEED_CACHE_VERSION}`;
const FEED_REBUILD_LOCK_TTL_SECONDS = 45;

const FEED_BUILD_LIMIT = 120;
const FEED_REFRESH_SCAN_LIMIT = 160;
const FEED_REFRESH_MAX_PER_RUN = 24;
const FEED_POLL_COOLDOWN_MS = 30 * 1000;
const FEED_POLL_MARKER_KEY = `margelet:feed:poller:last:${FEED_CACHE_VERSION}`;

function cacheKey(countryCode: string | null) {
  return `${FEED_CACHE_PREFIX}${countryCode || "__global__"}`;
}

function rebuildLockKey(countryCode: string | null) {
  return `${FEED_REBUILD_LOCK_KEY}:${countryCode || "__global__"}`;
}

export function normalizeCountryCode(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
}

function isVisiblePost(post: IngestedPost) {
  const status = (post as RefreshablePost).status;
  if (!status) return true;
  return status === "published";
}

function shouldRefresh(post: RefreshablePost) {
  const lastRefresh =
    Date.parse(post.mediaRefreshedAt || "") || Date.parse(post.createdAt || "");

  if (!Number.isFinite(lastRefresh)) return false;

  return Date.now() - lastRefresh >= 60 * 60 * 1000;
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

async function getPostMetrics(postId: number): Promise<PostMetrics> {
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

async function getSourceMetrics(handle: string): Promise<SourceMetrics> {
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
  postMetrics: PostMetrics;
  sourceMetrics: SourceMetrics;
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

async function rankPosts(posts: IngestedPost[]) {
  const ranked = await Promise.all(
    posts.map(async (post) => {
      const [postMetrics, sourceMetrics] = await Promise.all([
        getPostMetrics(post.id),
        getSourceMetrics(post.source.handle),
      ]);

      return {
        post,
        score: calculateScore({
          post,
          postMetrics,
          sourceMetrics,
        }),
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

  return ranked.map((item) => item.post);
}

export async function readCachedFeed(countryCode: string | null) {
  try {
    const raw = await redis.get(cacheKey(countryCode));

    if (!raw || typeof raw !== "object") {
      return null;
    }

    const payload = raw as Partial<CachedFeedPayload>;

    return {
      builtAt:
        typeof payload.builtAt === "string"
          ? payload.builtAt
          : new Date().toISOString(),
      countryCode: normalizeCountryCode(payload.countryCode),
      posts: Array.isArray(payload.posts) ? payload.posts : [],
    } satisfies CachedFeedPayload;
  } catch {
    return null;
  }
}

async function writeCachedFeed(countryCode: string | null, posts: IngestedPost[]) {
  const payload: CachedFeedPayload = {
    builtAt: new Date().toISOString(),
    countryCode,
    posts,
  };

  await redis.set(cacheKey(countryCode), payload, {
    ex: FEED_CACHE_TTL_SECONDS,
  });

  return payload;
}

function isCacheFresh(payload: CachedFeedPayload | null) {
  if (!payload) return false;
  const builtAtMs = Date.parse(payload.builtAt || "");
  if (!Number.isFinite(builtAtMs)) return false;
  return Date.now() - builtAtMs < FEED_STALE_AFTER_MS;
}

async function tryAcquireRebuildLock(countryCode: string | null) {
  try {
    const result = await redis.set(
      rebuildLockKey(countryCode),
      String(Date.now()),
      {
        nx: true,
        ex: FEED_REBUILD_LOCK_TTL_SECONDS,
      }
    );

return result === "OK";    
  } catch {
    return false;
  }
}

async function runPollingIfNeeded() {
  try {
    const lastRunRaw = await redis.get(FEED_POLL_MARKER_KEY);
    const lastRunMs =
      typeof lastRunRaw === "number"
        ? lastRunRaw
        : typeof lastRunRaw === "string" && lastRunRaw.trim()
          ? Number(lastRunRaw)
          : 0;

    if (Number.isFinite(lastRunMs) && lastRunMs > 0) {
      if (Date.now() - lastRunMs < FEED_POLL_COOLDOWN_MS) {
        return;
      }
    }

    await redis.set(FEED_POLL_MARKER_KEY, String(Date.now()), {
      ex: Math.ceil(FEED_POLL_COOLDOWN_MS / 1000),
    });

    await runTrustedSourcesPolling();
  } catch (error) {
    console.error("runPollingIfNeeded error", error);
  }
}

async function collectCandidatePosts(countryCode: string | null) {
  const posts = (await getFeedPosts(FEED_REFRESH_SCAN_LIMIT, {
    countryCode,
  })) as RefreshablePost[];

  if (posts.length === 0) {
    return {
      posts: [] as RefreshablePost[],
      refreshedCount: 0,
    };
  }

  let refreshedCount = 0;

  const refreshedPosts = await Promise.all(
    posts.map(async (post) => {
      if (!shouldRefresh(post)) {
        return post;
      }

      if (refreshedCount >= FEED_REFRESH_MAX_PER_RUN) {
        return post;
      }

      refreshedCount += 1;
      return refreshPostKeepingTtl(post);
    })
  );

  return {
    posts: refreshedPosts.filter(isVisiblePost),
    refreshedCount,
  };
}

async function buildFeedPosts(countryCode: string | null) {
  const { posts, refreshedCount } = await collectCandidatePosts(countryCode);
  const ranked = await rankPosts(posts);

  return {
    posts: ranked.slice(0, FEED_BUILD_LIMIT),
    refreshedCount,
  };
}

function limitPosts(posts: IngestedPost[], limit: number) {
  return posts.slice(0, Math.max(1, limit));
}

export async function rebuildFeedCache(countryCode: string | null): Promise<RebuildResult> {
  const normalizedCountryCode = normalizeCountryCode(countryCode);
  const { posts, refreshedCount } = await buildFeedPosts(normalizedCountryCode);
  const payload = await writeCachedFeed(normalizedCountryCode, posts);

  return {
    builtAt: payload.builtAt,
    refreshedCount,
    countryCode: normalizedCountryCode,
    postCount: payload.posts.length,
    cacheHit: false,
  };
}

export async function getOrRebuildFeed(params?: {
  countryCode?: string | null;
  limit?: number;
}) {
  const countryCode = normalizeCountryCode(params?.countryCode);
  const limit = Math.min(Math.max(Number(params?.limit) || 100, 1), 200);

  const cached = await readCachedFeed(countryCode);
  if (cached && isCacheFresh(cached)) {
    return {
      builtAt: cached.builtAt,
      posts: limitPosts(cached.posts, limit),
      countryCode,
      cacheHit: true,
      refreshedCount: 0,
    };
  }

  const acquiredLock = await tryAcquireRebuildLock(countryCode);

  if (acquiredLock) {
    await runPollingIfNeeded();

    const rebuilt = await rebuildFeedCache(countryCode);
    const freshCache = await readCachedFeed(countryCode);

    return {
      builtAt: freshCache?.builtAt || rebuilt.builtAt,
      posts: limitPosts(freshCache?.posts || [], limit),
      countryCode,
      cacheHit: false,
      refreshedCount: rebuilt.refreshedCount,
    };
  }

  const warmed = await readCachedFeed(countryCode);
  if (warmed) {
    return {
      builtAt: warmed.builtAt,
      posts: limitPosts(warmed.posts, limit),
      countryCode,
      cacheHit: true,
      refreshedCount: 0,
    };
  }

  const fallback = await buildFeedPosts(countryCode);

  return {
    builtAt: new Date().toISOString(),
    posts: limitPosts(fallback.posts, limit),
    countryCode,
    cacheHit: false,
    refreshedCount: fallback.refreshedCount,
  };
}

export async function rebuildAllFeedCaches() {
  const sources = await listSources(5000);
  const countryCodes = Array.from(
    new Set(
      sources
        .map((source) => normalizeCountryCode(source.countryCode))
        .filter((value): value is string => Boolean(value))
    )
  );

  const targets: Array<string | null> = [null, ...countryCodes];
  const results: RebuildResult[] = [];

  for (const countryCode of targets) {
    results.push(await rebuildFeedCache(countryCode));
  }

  return results;
}
