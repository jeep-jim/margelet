import { Redis } from "@upstash/redis";
import type { Video } from "../src/types/app";

type EnvMap = Record<string, string | undefined>;

const env: EnvMap =
  (
    globalThis as typeof globalThis & {
      process?: { env?: EnvMap };
    }
  ).process?.env ?? {};

const url = env.KV_REST_API_URL;
const token = env.KV_REST_API_TOKEN;

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

function postUrlKey(url: string) {
  return `${POST_URL_KEY_PREFIX}${url}`;
}

export async function getFeedPosts(limit = 100): Promise<Video[]> {
  const ids = await redis.lrange<number>(FEED_IDS_KEY, 0, limit - 1);

  if (!ids || ids.length === 0) return [];

  const posts = await Promise.all(
    ids.map(async (id: number) => {
      const data = await redis.get<Video>(postKey(id));
      return data ?? null;
    })
  );

  return posts.filter(Boolean) as Video[];
}

export async function getPostByUrl(url: string): Promise<Video | null> {
  const existingId = await redis.get<number | null>(postUrlKey(url));
  if (existingId == null) return null;

  const existingPost = await redis.get<Video>(postKey(existingId));
  return existingPost ?? null;
}

export async function savePost(post: Video): Promise<Video> {
  await redis.set(postKey(post.id), post);
  await redis.set(postUrlKey(post.postUrl), post.id);
  await redis.lrem(FEED_IDS_KEY, 0, post.id);
  await redis.lpush(FEED_IDS_KEY, post.id);
  return post;
}