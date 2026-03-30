import { Redis } from "@upstash/redis";
import type { IngestedPost } from "../../src/types/app";

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

export async function savePost(post: IngestedPost): Promise<IngestedPost> {
  const ttlSeconds = post.ttlHours * 3600;

  await redis.set(postKey(post.id), post, {
    ex: ttlSeconds,
  });

  await redis.set(postUrlKey(post.postUrl), post.id, {
    ex: ttlSeconds,
  });

  await redis.lrem(FEED_IDS_KEY, 0, post.id);
  await redis.lpush(FEED_IDS_KEY, post.id);

  return post;
}

export async function getFeedPosts(limit = 100): Promise<IngestedPost[]> {
  const ids = await redis.lrange<number | string>(FEED_IDS_KEY, 0, limit - 1);

  if (!ids || ids.length === 0) {
    return [];
  }

  const posts = await Promise.all(
    ids.map(async (id) => {
      if (typeof id !== "string" && typeof id !== "number") {
        return null;
      }

      const post = await redis.get(postKey(id));
      return (post as IngestedPost | null) ?? null;
    })
  );

  return posts.filter((post): post is IngestedPost => !!post);
}

export async function getPostById(id: number): Promise<IngestedPost | null> {
  const post = await redis.get(postKey(id));
  return (post as IngestedPost | null) ?? null;
}

export async function getPostByUrl(url: string): Promise<IngestedPost | null> {
  const existingIdRaw = await redis.get(postUrlKey(url));

  const existingId =
    typeof existingIdRaw === "number"
      ? existingIdRaw
      : typeof existingIdRaw === "string" && existingIdRaw.trim()
        ? Number(existingIdRaw)
        : null;

  if (!existingId || !Number.isFinite(existingId)) {
    return null;
  }

  const post = await redis.get(postKey(existingId));
  return (post as IngestedPost | null) ?? null;
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