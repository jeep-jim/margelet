import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFeedPosts, savePost } from "./lib/kv.js";
import type { IngestedPost } from "../src/types/app";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function isVisiblePost(post: IngestedPost) {
  if (!post.status) return true;
  return post.status === "published";
}

// 🔥 проверка: нужно ли обновлять медиа
function shouldRefresh(post: IngestedPost) {
  const created = Date.parse(post.createdAt || "");
  if (!Number.isFinite(created)) return false;

  const now = Date.now();

  // каждые 30 минут
  return now - created > 30 * 60 * 1000;
}

// 🔥 проверка: есть ли битое медиа
function hasBrokenMedia(post: IngestedPost) {
  if (!post.media || post.media.length === 0) return false;

  return post.media.some((m) =>
    m.url?.includes("telesco.pe")
  );
}

// 🔥 обновление поста
async function refreshPost(post: IngestedPost): Promise<IngestedPost> {
  try {
    const res = await fetch(
      `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ""}/api/telegram-preview?url=${encodeURIComponent(post.postUrl)}`
    );

    if (!res.ok) return post;

    const data = await res.json();

    const updated: IngestedPost = {
      ...post,

      source: {
        ...post.source,
        avatar: data.avatar || post.source.avatar,
      },

      media:
        data.video
          ? [
              {
                id: "video-1",
                kind: "video",
                url: data.video,
                poster: data.poster || null,
              },
            ]
          : data.image
          ? [
              {
                id: "image-1",
                kind: "image",
                url: data.image,
              },
            ]
          : post.media,
    };

    await savePost(updated);

    return updated;
  } catch {
    return post;
  }
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
    const limit =
      typeof req.query.limit === "string"
        ? Math.min(parseInt(req.query.limit, 10) || 100, 200)
        : 100;

    const posts = await getFeedPosts(limit);

    // 🔥 ГЛАВНОЕ: авто-refresh
    const refreshedPosts = await Promise.all(
      posts.map(async (post) => {
        if (hasBrokenMedia(post) || shouldRefresh(post)) {
          return await refreshPost(post);
        }
        return post;
      })
    );

    const visiblePosts = refreshedPosts.filter(isVisiblePost);

    return res.status(200).json({
      posts: visiblePosts,
    });
  } catch (error) {
    console.error("feed api error", error);

    return res.status(500).json({
      error: "Failed to load feed",
    });
  }
}