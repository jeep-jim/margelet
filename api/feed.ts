import { getFeedPosts } from "./lib/kv.js";

export default async function handler(_: any, res: any) {
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