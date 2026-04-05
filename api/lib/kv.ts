import { Redis } from "@upstash/redis";
import type { IngestedPost } from "../../src/types/app";
import { parseTelegramPostUrl } from "../../src/lib/telegram.js";

type EnvMap = Record<string, string | undefined>;

const env: EnvMap =
  (
    globalThis as typeof globalThis & {
      process?: { env?: EnvMap };
    }
  ).process?.env ?? {};

const url =
  String(env.KV_REST_API_URL || "").trim() ||
  String(env.BRAIN_KV_REST_API_URL || "").trim() ||
  String(env.UPSTASH_REDIS_REST_URL || "").trim();

const token =
  String(env.KV_REST_API_TOKEN || "").trim() ||
  String(env.BRAIN_KV_REST_API_TOKEN || "").trim() ||
  String(env.UPSTASH_REDIS_REST_TOKEN || "").trim();

if (!url || !token) {
  throw new Error("Missing KV_REST_API_URL or KV_REST_API_TOKEN");
}

export const redis = new Redis({ url, token });

const FEED_IDS_KEY = "margelet:feed:ids";
const POST_KEY_PREFIX = "margelet:post:";
const POST_URL_KEY_PREFIX = "margelet:post:url:";

function postKey(id: number | string) {
  return `${POST_KEY_PREFIX}${id}`;
}

function postUrlKey(postUrl: string) {
  return `${POST_URL_KEY_PREFIX}${postUrl}`;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function stripAt(value: string | null) {
  return String(value || "").replace(/^@/, "").trim();
}

function pickLocalizedText(value: unknown): string {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const ru = asString(record.ru);
    const en = asString(record.en);
    return ru || en || "";
  }

  return "";
}

function normalizeLegacyMedia(raw: Record<string, unknown>): IngestedPost["media"] {
  const media = Array.isArray(raw.media) ? raw.media : [];

  const normalizedFromArray = media
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;

      const record = item as Record<string, unknown>;
      const type = asString(record.type);
      const url = asString(record.url);
      const poster = asString(record.poster);

      if (!type || !url) return null;
      if (type !== "image" && type !== "video" && type !== "audio" && type !== "file") {
        return null;
      }

      return {
        id: asString(record.id) || `${type}-${index + 1}`,
        kind: type,
        url,
        poster: poster || null,
        mimeType: asString(record.mimeType),
        fileName: asString(record.fileName),
        width: asNumber(record.width),
        height: asNumber(record.height),
        duration: asNumber(record.duration),
      } as IngestedPost["media"][number];
    })
    .filter(Boolean) as IngestedPost["media"];

  if (normalizedFromArray.length > 0) {
    return normalizedFromArray;
  }

  const videoUrl = asString(raw.videoUrl);
  const previewUrl = asString(raw.previewUrl);
  const audioUrl = asString(raw.audio);
  const fileUrl = asString(raw.file);
  const poster = asString(raw.poster);

  if (videoUrl) {
    return [
      {
        id: "video-1",
        kind: "video",
        url: videoUrl,
        poster: poster || previewUrl || null,
      },
    ];
  }

  if (previewUrl) {
    return [
      {
        id: "image-1",
        kind: "image",
        url: previewUrl,
      },
    ];
  }

  if (audioUrl) {
    return [
      {
        id: "audio-1",
        kind: "audio",
        url: audioUrl,
      },
    ];
  }

  if (fileUrl) {
    return [
      {
        id: "file-1",
        kind: "file",
        url: fileUrl,
      },
    ];
  }

  return [];
}

function deriveLegacyContentType(
  raw: Record<string, unknown>,
  media: IngestedPost["media"]
): IngestedPost["contentType"] {
  const explicitMediaKind = asString(raw.mediaKind);
  const explicitMediaType = asString(raw.mediaType);

  if (explicitMediaKind === "gif") return "gif";
  if (explicitMediaKind === "audio") return "audio";
  if (explicitMediaKind === "file") return "file";
  if (explicitMediaKind === "external_media") return "external_media";

  if (explicitMediaType === "video") return "video";
  if (explicitMediaType === "image") {
    return media.length > 1 ? "gallery" : "image";
  }
  if (explicitMediaType === "text") return "text";

  if (media.some((item) => item.kind === "video")) return "video";
  if (media.filter((item) => item.kind === "image").length > 1) return "gallery";
  if (media.some((item) => item.kind === "image")) return "image";
  if (media.some((item) => item.kind === "audio")) return "audio";
  if (media.some((item) => item.kind === "file")) return "file";

  return "text";
}

function looksLikeNewPost(raw: Record<string, unknown>) {
  return (
    !!raw.source &&
    typeof raw.source === "object" &&
    typeof raw.contentType === "string" &&
    !!raw.addedBy &&
    typeof raw.addedBy === "object"
  );
}

function normalizeNewPost(raw: Record<string, unknown>): IngestedPost | null {
  const id = asNumber(raw.id);
  const postUrl = asString(raw.postUrl);
  const source = raw.source as Record<string, unknown> | undefined;
  const addedBy = raw.addedBy as Record<string, unknown> | undefined;
  const billing = raw.billing as Record<string, unknown> | undefined;
  const media = Array.isArray(raw.media) ? (raw.media as IngestedPost["media"]) : [];

  if (!id || !postUrl || !source || !addedBy || !billing) {
    return null;
  }

  const post: IngestedPost = {
    id,
    postUrl,
    source: {
      handle: stripAt(asString(source.handle)),
      title: asString(source.title) || stripAt(asString(source.handle)) || "Telegram",
      avatar: asString(source.avatar),
      verified: !!source.verified,
    },
    text: asString(raw.text) || "",
    links: Array.isArray(raw.links)
      ? (raw.links as Array<{ label: string | null; url: string }>)
      : [],
    contentType: (asString(raw.contentType) as IngestedPost["contentType"]) || "text",
    media,
    hasMediaInOriginal: !!raw.hasMediaInOriginal,
    fallbackReason:
      (raw.fallbackReason as IngestedPost["fallbackReason"]) ?? null,
    createdAt: asString(raw.createdAt) || new Date(id).toISOString(),
    expiresAt:
      asString(raw.expiresAt) ||
      new Date(id + 24 * 3600 * 1000).toISOString(),
    ttlHours: asNumber(raw.ttlHours) || 24,
    tag: (asString(raw.tag) as IngestedPost["tag"]) || "other",
    addedBy: {
      telegramId: asString(addedBy.telegramId),
      username: asString(addedBy.username),
    },
    billing: {
      plan:
        (asString(billing.plan) as IngestedPost["billing"]["plan"]) || "free",
      autopublishEnabled: !!billing.autopublishEnabled,
    },
  };

  if ("status" in raw) {
    (post as IngestedPost & { status?: "published" | "pending" | "blocked" }).status =
      raw.status === "published" || raw.status === "pending" || raw.status === "blocked"
        ? raw.status
        : undefined;
  }

  if ("role" in raw) {
    (post as IngestedPost & { role?: "user" | "channel_owner" | "admin" }).role =
      raw.role === "user" || raw.role === "channel_owner" || raw.role === "admin"
        ? raw.role
        : undefined;
  }

  if ("mediaRefreshedAt" in raw) {
    (post as IngestedPost & { mediaRefreshedAt?: string | null }).mediaRefreshedAt =
      asString(raw.mediaRefreshedAt);
  }

  return post;
}

function normalizeLegacyPost(raw: Record<string, unknown>): IngestedPost | null {
  const id = asNumber(raw.id);
  const postUrl = asString(raw.postUrl);
  const channel = pickLocalizedText(raw.title) || asString(raw.channel) || "Telegram";
  const handle = stripAt(asString(raw.handle)) || "telegram";
  const media = normalizeLegacyMedia(raw);

  if (!id || !postUrl) {
    return null;
  }

  const ttlHours = 24;
  const createdAt = new Date(id).toISOString();
  const expiresAt = new Date(id + ttlHours * 3600 * 1000).toISOString();

  const post: IngestedPost = {
    id,
    postUrl,
    source: {
      handle,
      title: channel,
      avatar: asString(raw.avatar),
      verified: !!raw.channelVerified,
    },
    text: pickLocalizedText(raw.caption),
    links: [],
    contentType: deriveLegacyContentType(raw, media),
    media,
    hasMediaInOriginal: !!raw.hasMediaInOriginal || media.length > 0,
    fallbackReason: null,
    createdAt,
    expiresAt,
    ttlHours,
    tag: (asString(raw.tag) as IngestedPost["tag"]) || "other",
    addedBy: {
      telegramId: asString(raw.addedByTelegramId),
      username: asString(raw.addedByUsername),
    },
    billing: {
      plan: "free",
      autopublishEnabled: false,
    },
  };

  if ("status" in raw) {
    (post as IngestedPost & { status?: "published" | "pending" | "blocked" }).status =
      raw.status === "published" || raw.status === "pending" || raw.status === "blocked"
        ? raw.status
        : undefined;
  }

  if ("role" in raw) {
    (post as IngestedPost & { role?: "user" | "channel_owner" | "admin" }).role =
      raw.role === "user" || raw.role === "channel_owner" || raw.role === "admin"
        ? raw.role
        : undefined;
  }

  if ("mediaRefreshedAt" in raw) {
    (post as IngestedPost & { mediaRefreshedAt?: string | null }).mediaRefreshedAt =
      asString(raw.mediaRefreshedAt);
  }

  return post;
}

function normalizeAnyPost(raw: unknown): IngestedPost | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const record = raw as Record<string, unknown>;

  if (looksLikeNewPost(record)) {
    return normalizeNewPost(record);
  }

  return normalizeLegacyPost(record);
}

function getRemainingTtlSeconds(post: IngestedPost) {
  const expiresAtMs = Date.parse(post.expiresAt || "");
  if (!Number.isFinite(expiresAtMs)) {
    return Math.max(1, post.ttlHours * 3600);
  }

  const remaining = Math.floor((expiresAtMs - Date.now()) / 1000);
  return Math.max(1, remaining);
}

function getCanonicalPostUrl(url: string) {
  const parsed = parseTelegramPostUrl(url);
  return parsed?.normalizedUrl || url.trim();
}

export async function savePost(post: IngestedPost): Promise<IngestedPost> {
  const canonicalPostUrl = getCanonicalPostUrl(post.postUrl);
  const ttlSeconds = getRemainingTtlSeconds(post);
  const idValue = String(post.id);

  const existingIdRaw = await redis.get(postUrlKey(canonicalPostUrl));
  const existingId =
    typeof existingIdRaw === "number"
      ? existingIdRaw
      : typeof existingIdRaw === "string" && existingIdRaw.trim()
        ? Number(existingIdRaw)
        : null;

  if (existingId && Number.isFinite(existingId) && existingId !== post.id) {
    const existingRaw = await redis.get(postKey(existingId));
    const existingPost = normalizeAnyPost(existingRaw);

    if (existingPost) {
      return existingPost;
    }
  }

  const normalizedPost: IngestedPost = {
    ...post,
    postUrl: canonicalPostUrl,
  };

  await redis.set(postKey(normalizedPost.id), normalizedPost, {
    ex: ttlSeconds,
  });

  await redis.set(postUrlKey(canonicalPostUrl), idValue, {
    ex: ttlSeconds,
  });

  await redis.lrem(FEED_IDS_KEY, 0, idValue);
  await redis.lpush(FEED_IDS_KEY, idValue);

  return normalizedPost;
}

export async function getFeedPosts(limit = 100): Promise<IngestedPost[]> {
  const ids = await redis.lrange<number | string>(FEED_IDS_KEY, 0, limit - 1);

  if (!ids || ids.length === 0) {
    return [];
  }

  const uniqueIds = Array.from(
    new Set(
      ids
        .map((id) =>
          typeof id === "string" || typeof id === "number"
            ? String(id)
            : null
        )
        .filter((id): id is string => Boolean(id))
    )
  );

  const posts = await Promise.all(
    uniqueIds.map(async (id) => {
      const raw = await redis.get(postKey(id));
      return normalizeAnyPost(raw);
    })
  );

  const validPosts = posts.filter((post): post is IngestedPost => !!post);
  const seenUrls = new Set<string>();
  const deduped: IngestedPost[] = [];

  for (const post of validPosts) {
    const canonicalUrl = getCanonicalPostUrl(post.postUrl);

    if (seenUrls.has(canonicalUrl)) {
      continue;
    }

    seenUrls.add(canonicalUrl);
    deduped.push({
      ...post,
      postUrl: canonicalUrl,
    });
  }

  return deduped;
}

export async function getPostById(id: number): Promise<IngestedPost | null> {
  const raw = await redis.get(postKey(id));
  const post = normalizeAnyPost(raw);

  if (!post) {
    return null;
  }

  return {
    ...post,
    postUrl: getCanonicalPostUrl(post.postUrl),
  };
}

export async function getPostByUrl(url: string): Promise<IngestedPost | null> {
  const canonicalUrl = getCanonicalPostUrl(url);
  const existingIdRaw = await redis.get(postUrlKey(canonicalUrl));

  const existingId =
    typeof existingIdRaw === "number"
      ? existingIdRaw
      : typeof existingIdRaw === "string" && existingIdRaw.trim()
        ? Number(existingIdRaw)
        : null;

  if (!existingId || !Number.isFinite(existingId)) {
    return null;
  }

  const raw = await redis.get(postKey(existingId));
  const post = normalizeAnyPost(raw);

  if (!post) {
    return null;
  }

  return {
    ...post,
    postUrl: canonicalUrl,
  };
}

export async function deletePostById(id: number): Promise<boolean> {
  const existing = await getPostById(id);

  if (!existing) {
    return false;
  }

  const canonicalUrl = getCanonicalPostUrl(existing.postUrl);

  await redis.del(postKey(id));
  await redis.del(postUrlKey(canonicalUrl));
  await redis.lrem(FEED_IDS_KEY, 0, id);
  await redis.lrem(FEED_IDS_KEY, 0, String(id));

  return true;
}