import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFeedPosts, savePost } from "./lib/kv.js";
import { ingestTelegramPost } from "../src/lib/telegram.js";
import type { IngestedPost } from "../src/types/app";

type RefreshablePost = IngestedPost & {
  status?: string;
  role?: string;
  mediaRefreshedAt?: string | null;
};

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

function shouldRefresh(post: RefreshablePost) {
  const lastRefresh =
    Date.parse(post.mediaRefreshedAt || "") ||
    Date.parse(post.createdAt || "");

  if (!Number.isFinite(lastRefresh)) return false;

  const now = Date.now();
  const refreshEveryMs = 2 * 60 * 60 * 1000; // раз в 2 часа

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

      // 🔥 не трогаем жизнь контейнера
      id: post.id,
      postUrl: post.postUrl,
      createdAt: post.createdAt,
      expiresAt: post.expiresAt,
      ttlHours: post.ttlHours,
      tag: post.tag,
      addedBy: post.addedBy,
      billing: post.billing,
      status: post.status,
      role: post.role,

      mediaRefreshedAt: refreshedAt,
    };

    await savePost(updated);

    return updated;
  } catch (error) {
    console.error("refreshPostKeepingTtl error", error);
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

    const posts = (await getFeedPosts(limit)) as RefreshablePost[];

    const refreshedPosts = await Promise.all(
      posts.map(async (post) => {
        if (!shouldRefresh(post)) {
          return post;
        }

        return refreshPostKeepingTtl(post);
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