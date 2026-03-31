import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFeedPosts } from "./lib/kv.js";
import type { IngestedPost } from "../src/types/app";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function isVisiblePost(post: IngestedPost) {
  // старые посты (без status) показываем
  if (!post.status) return true;

  return post.status === "published";
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

    // 🔥 ГЛАВНОЕ: фильтрация
    const visiblePosts = posts.filter(isVisiblePost);

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