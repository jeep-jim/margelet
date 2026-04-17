import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFeedFile } from "./lib/github-store.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  try {
    const feed = await readFeedFile<unknown>();

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=300"
    );

    return res.status(200).json({
      ok: true,
      updatedAt: feed.updatedAt,
      posts: feed.posts,
    });
  } catch (error) {
    console.error("feed api error", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to read feed",
    });
  }
}
