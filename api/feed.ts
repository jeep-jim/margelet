import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  readFeedCountryPosts,
  readFeedFile,
  readFeedIndexFile,
  readFeedSnapshotByPath,
} from "./lib/github-store";

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
    const rawFeedPath = asString(req.query.rawFeedPath);

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    if (rawFeedPath) {
      const snapshot = await readFeedSnapshotByPath(rawFeedPath);

      if (!snapshot) {
        return res.status(404).json({
          ok: false,
          error: "Feed snapshot not found",
        });
      }

      return res.status(200).json(snapshot);
    }

    const countryCode = asString(req.query.countryCode).toLowerCase();
    const index = await readFeedIndexFile();

    if (countryCode) {
      const posts = await readFeedCountryPosts(countryCode);
      const country = index.countries[countryCode] || null;

      return res.status(200).json({
        ok: true,
        updatedAt: country?.updatedAt || index.updatedAt,
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
