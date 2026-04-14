import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getOrRebuildFeed,
  normalizeCountryCode,
} from "./lib/feed-cache.js";

function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function setCacheHeaders(res: VercelResponse) {
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300"
  );
}

function resolveCountryCode(req: VercelRequest) {
  const rawCountry =
    typeof req.query.countryCode === "string"
      ? req.query.countryCode
      : typeof req.query.locale === "string"
        ? req.query.locale
        : null;

  return normalizeCountryCode(rawCountry);
}

function resolveLimit(req: VercelRequest) {
  if (typeof req.query.limit !== "string") {
    return 100;
  }

  const parsed = parseInt(req.query.limit, 10);
  if (!Number.isFinite(parsed)) {
    return 100;
  }

  return Math.min(Math.max(parsed, 1), 200);
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
    setCacheHeaders(res);

    const countryCode = resolveCountryCode(req);
    const limit = resolveLimit(req);

    const feed = await getOrRebuildFeed({
      countryCode,
      limit,
    });

    return res.status(200).json({
      posts: feed.posts,
    });
  } catch (error) {
    console.error("feed api error", error);

    return res.status(500).json({
      error: "Failed to load feed",
    });
  }
}
