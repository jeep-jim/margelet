import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  readFeedCountryPosts,
  readFeedFile,
  readFeedIndexFile,
} from "./lib/github-store.js";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  try {
    const countryCode = asString(req.query.countryCode).toLowerCase();
    const index = await readFeedIndexFile();

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=300"
    );

    if (countryCode) {
      const posts = await readFeedCountryPosts(countryCode);
      const country = index.countries[countryCode] || null;

      return res.status(200).json({
        ok: true,
        updatedAt: index.updatedAt,
        index,
        country,
        posts,
      });
    }

    const feed = await readFeedFile();

    return res.status(200).json({
      ok: true,
      updatedAt: feed.updatedAt,
      index,
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