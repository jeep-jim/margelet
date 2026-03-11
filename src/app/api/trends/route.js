// src/app/api/trends/route.js

import { NextResponse } from "next/server";
import { findTrendIdeas } from "@/lib/margelet/trendEngine";
import { fetchGoogleTrends } from "@/lib/margelet/providers/googleTrendsProvider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const startedAt = Date.now();

  try {
    const { searchParams } = new URL(req.url);

    const format = searchParams.get("format") || "default";
    const topic = searchParams.get("topic") || "";
    const locale = searchParams.get("locale") || "US";
    const language = searchParams.get("language") || "ru";

    const links = parseListParam(searchParams.get("links"));
    const notes = searchParams.get("notes") || "";

    const manualUpstreamTrends = parseJsonParam(
      searchParams.get("upstreamTrends"),
      []
    );

    const googleCategory = searchParams.get("googleCategory") || "";
    const googleLimit = normalizeLimit(searchParams.get("limit"));
    const disableGoogle =
      String(searchParams.get("disableGoogle") || "").toLowerCase() === "true";

    let googleTrendsResult = null;
    let upstreamTrends = manualUpstreamTrends;

    if (!disableGoogle) {
      googleTrendsResult = await fetchGoogleTrends({
        geo: locale,
        category: googleCategory,
        limit: googleLimit,
      });

      if (googleTrendsResult?.ok && Array.isArray(googleTrendsResult.trends)) {
        upstreamTrends = mergeUpstreamTrends(
          manualUpstreamTrends,
          googleTrendsResult.trends
        );
      }
    }

    const result = await findTrendIdeas({
      format,
      topic,
      locale,
      language,
      upstreamTrends,
      links,
      notes,
    });

    if (!result?.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result?.error || {
            code: "TREND_ENGINE_FAILED",
            message: "Trend engine failed.",
          },
          meta: {
            startedAt,
            finishedAt: Date.now(),
            durationMs: Date.now() - startedAt,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      source: {
        ...result.source,
        googleTrends: googleTrendsResult
          ? {
              ok: Boolean(googleTrendsResult.ok),
              provider: googleTrendsResult.provider || "google-trends-rss",
              geo: googleTrendsResult.geo || locale,
              category: googleTrendsResult.category || googleCategory || "",
              updatedAt: googleTrendsResult.updatedAt || null,
              count: googleTrendsResult?.trends?.length || 0,
              error: googleTrendsResult.ok ? null : googleTrendsResult.error || null,
            }
          : null,
      },
      summary: {
        ...result.summary,
        upstreamCount: upstreamTrends.length,
      },
      best: result.best,
      suggestions: result.suggestions,
      meta: {
        startedAt,
        finishedAt: Date.now(),
        durationMs: Date.now() - startedAt,
      },
    });
  } catch (error) {
    console.error("Trends route error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "TRENDS_ROUTE_ERROR",
          message: error?.message || "Unexpected trends route error.",
        },
        meta: {
          startedAt,
          finishedAt: Date.now(),
          durationMs: Date.now() - startedAt,
        },
      },
      { status: 500 }
    );
  }
}

function parseListParam(value) {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseJsonParam(value, fallback) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeLimit(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 12;
  return Math.max(1, Math.min(25, Math.round(num)));
}

function mergeUpstreamTrends(manualList, googleList) {
  const merged = [];
  const seen = new Set();

  for (const item of [...(manualList || []), ...(googleList || [])]) {
    const key =
      typeof item === "string"
        ? item.trim().toLowerCase()
        : String(item?.title || item?.query || item?.name || "")
            .trim()
            .toLowerCase();

    if (!key || seen.has(key)) continue;

    seen.add(key);
    merged.push(item);
  }

  return merged;
}