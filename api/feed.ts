import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getFeedPosts } from "./lib/kv.js";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
    const posts = await getFeedPosts(100);

    return res.status(200).json({
      posts,
    });
  } catch (error) {
    console.error("feed api error", error);

    return res.status(500).json({
      error: "Failed to load feed",
    });
  }
}