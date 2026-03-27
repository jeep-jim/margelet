import { Redis } from "@upstash/redis";
import type { Video } from "../../src/types/app";

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

function asCleanString(value: unknown) {
  return String(value ?? "").trim();
}

function asNullableString(value: unknown): string | null {
  const s = asCleanString(value);
  return s || null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const n = Number(asCleanString(value));
  return Number.isFinite(n) ? n : null;
}

function isLocalizedText(value: any): value is { ru: string; en: string } {
  return (
    value &&
    typeof value === "object" &&
    typeof value.ru === "string" &&
    typeof value.en === "string"
  );
}

function normalizeLocalizedText(value: any, fallback = "") {
  if (isLocalizedText(value)) {
    return {
      ru: asCleanString(value.ru) || fallback,
      en: asCleanString(value.en) || fallback,
    };
  }

  const text = asCleanString(value) || fallback;

  return {
    ru: text,
    en: text,
  };
}

function normalizeMediaType(value: unknown): "video" | "image" | "text" | null {
  if (value === "video") return "video";
  if (value === "image") return "image";
  if (value === "text") return "text";
  return null;
}

function normalizeVideo(raw: any): Video | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const id = asNumber(raw.id);
  const postUrl = asNullableString(raw.postUrl);
  const channel = asCleanString(raw.channel);
  const handle = asCleanString(raw.handle);
  const mediaType = normalizeMediaType(raw.mediaType);

  if (!id || !postUrl || !channel || !handle || !mediaType) {
    return null;
  }

  const title = normalizeLocalizedText(raw.title, channel);
  const caption = normalizeLocalizedText(raw.caption, title.ru);

  return {
    id,
    mediaType,
    title,
    caption,
    channel,
    avatar: asCleanString(raw.avatar) || "TG",
    handle,
    channelVerified: !!raw.channelVerified,
    views: asCleanString(raw.views) || "0",
    likes: asNumber(raw.likes) ?? 0,
    comments: asNumber(raw.comments) ?? 0,
    duration: asCleanString(raw.duration),
    lang: asCleanString(raw.lang) || "RU",
    postUrl,
    bg: asCleanString(raw.bg) || "from-neutral-300 to-neutral-200",
    tag: raw.tag || "other",
    previewUrl: asNullableString(raw.previewUrl),
    videoUrl: asNullableString(raw.videoUrl),
    addedByTelegramId: asNullableString(raw.addedByTelegramId),
    addedByUsername: asNullableString(raw.addedByUsername),
  };
}

export async function getFeedPosts(limit = 100): Promise<Video[]> {
  const ids = await redis.lrange<number | string>(FEED_IDS_KEY, 0, limit - 1);

  if (!ids || ids.length === 0) {
    return [];
  }

  const posts = await Promise.all(
    ids.map(async (id) => {
      const normalizedId = asNumber(id);

      if (!normalizedId) {
        return null;
      }

      const raw = await redis.get(postKey(normalizedId));
      return normalizeVideo(raw);
    })
  );

  return posts.filter((post): post is Video => !!post);
}

export async function getPostById(id: number): Promise<Video | null> {
  const raw = await redis.get(postKey(id));
  return normalizeVideo(raw);
}

export async function getPostByUrl(url: string): Promise<Video | null> {
  const cleanUrl = asCleanString(url);

  if (!cleanUrl) {
    return null;
  }

  const existingIdRaw = await redis.get(postUrlKey(cleanUrl));
  const existingId = asNumber(existingIdRaw);

  if (!existingId) {
    return null;
  }

  const raw = await redis.get(postKey(existingId));
  return normalizeVideo(raw);
}

export async function savePost(post: Video): Promise<Video> {
  const normalized = normalizeVideo(post);

  if (!normalized) {
    throw new Error("INVALID_POST_PAYLOAD");
  }

  await redis.set(postKey(normalized.id), normalized);
  await redis.set(postUrlKey(normalized.postUrl), normalized.id);
  await redis.lrem(FEED_IDS_KEY, 0, normalized.id);
  await redis.lpush(FEED_IDS_KEY, normalized.id);

  return normalized;
}

export async function deletePostById(id: number): Promise<boolean> {
  const existing = await getPostById(id);

  if (!existing) {
    return false;
  }

  await redis.del(postKey(id));
  await redis.del(postUrlKey(existing.postUrl));
  await redis.lrem(FEED_IDS_KEY, 0, id);

  return true;
}