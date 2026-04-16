import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  readFeedFile,
  readSourcesFile,
  writeFeedFile,
  writeSourcesFile,
} from "./lib/blob-store.ts";
import type { IngestedPost, ContentTag } from "../src/types/app.ts";

const ADMIN_TELEGRAM_ID = String(process.env.ADMIN_TELEGRAM_ID || "").trim();
const ADMIN_TELEGRAM_USERNAME = String(
  process.env.ADMIN_TELEGRAM_USERNAME || ""
)
  .trim()
  .toLowerCase();

type StoredSource = {
  id: string;
  countryCode: string;
  handle: string;
  title: string;
  avatarUrl: string | null;
  defaultTag: ContentTag;
  tags: ContentTag[];
  status: "active" | "paused";
  note: string | null;
  createdAt: string;
  updatedAt: string;
  lastCheckedAt: string | null;
  lastImportedAt: string | null;
  lastSeenPostId: string | null;
  importedPostsCount: number;
};

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function isOwner(body: Record<string, unknown>) {
  const telegramId =
    asString(body.telegramId) || asString(body.telegramUserId);

  const username = (
    asString(body.username) ||
    asString(body.telegramUsername)
  ).toLowerCase();

  const byId = ADMIN_TELEGRAM_ID && telegramId === ADMIN_TELEGRAM_ID;
  const byUsername =
    ADMIN_TELEGRAM_USERNAME && username === ADMIN_TELEGRAM_USERNAME;

  return Boolean(byId || byUsername);
}

function normalizeCountryCode(value: unknown): string {
  return asString(value, "ru").toLowerCase() || "ru";
}

function normalizeTags(value: unknown, fallback: ContentTag): ContentTag[] {
  const tags = Array.isArray(value)
    ? (value
        .map((item) => asString(item))
        .filter(Boolean) as ContentTag[])
    : [];

  const unique = Array.from(new Set(tags));
  return unique.length ? unique : [fallback];
}

function buildSource(body: Record<string, unknown>): StoredSource | null {
  const handle = asString(body.handle).replace(/^@/, "").toLowerCase();
  if (!handle) return null;

  const countryCode = normalizeCountryCode(body.countryCode);
  const defaultTag = (asString(body.defaultTag, "other") as ContentTag) || "other";
  const now = new Date().toISOString();

  return {
    id: asString(body.id) || `${countryCode}:${handle}`,
    countryCode,
    handle,
    title: asString(body.title) || handle,
    avatarUrl: null,
    defaultTag,
    tags: normalizeTags(body.tags, defaultTag),
    status: asString(body.status) === "paused" ? "paused" : "active",
    note: asString(body.note) || null,
    createdAt: asString(body.createdAt) || now,
    updatedAt: now,
    lastCheckedAt: null,
    lastImportedAt: null,
    lastSeenPostId: null,
    importedPostsCount: 0,
  };
}

function parseDateMs(value: string | null | undefined) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? ms : 0;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    if (!isOwner(body)) {
      return res.status(403).json({
        ok: false,
        error: "Access denied",
      });
    }

    if (req.method === "POST") {
      const entity = asString(body.entity);
      const countryCode = normalizeCountryCode(body.countryCode);

      if (entity === "posts") {
        const feedFile = await readFeedFile<IngestedPost>();

        const posts = (Array.isArray(feedFile.posts) ? feedFile.posts : [])
          .filter((post) => !post.sourceCountryCode || post.sourceCountryCode === countryCode)
          .sort((a, b) => parseDateMs(b.createdAt) - parseDateMs(a.createdAt));

        return res.status(200).json({
          ok: true,
          posts,
        });
      }

      if (entity === "sources") {
        const sourcesFile = await readSourcesFile<StoredSource>();

        const sources = (Array.isArray(sourcesFile.sources) ? sourcesFile.sources : [])
          .filter((source) => source.countryCode === countryCode)
          .sort((a, b) => a.handle.localeCompare(b.handle));

        return res.status(200).json({
          ok: true,
          sources,
        });
      }

      return res.status(400).json({
        ok: false,
        error: "Unknown entity",
      });
    }

    if (req.method === "PATCH") {
      const entity = asString(body.entity);

      if (entity !== "sources") {
        return res.status(400).json({
          ok: false,
          error: "Unsupported entity",
        });
      }

      const source = buildSource(body);

      if (!source) {
        return res.status(400).json({
          ok: false,
          error: "Invalid source payload",
        });
      }

      const sourcesFile = await readSourcesFile<StoredSource>();
      const current = Array.isArray(sourcesFile.sources) ? sourcesFile.sources : [];

      const existingIndex = current.findIndex(
        (item) => item.id === source.id || item.handle === source.handle
      );

      const next = [...current];

      if (existingIndex >= 0) {
        next[existingIndex] = {
          ...next[existingIndex],
          ...source,
          createdAt: next[existingIndex].createdAt || source.createdAt,
        };
      } else {
        next.unshift(source);
      }

      await writeSourcesFile(next);

      return res.status(200).json({
        ok: true,
        source,
        sources: next,
      });
    }

    if (req.method === "DELETE") {
      const entity = asString(body.entity);

      if (entity === "sources") {
        const id = asString(body.id);

        const sourcesFile = await readSourcesFile<StoredSource>();
        const current = Array.isArray(sourcesFile.sources) ? sourcesFile.sources : [];
        const next = current.filter((item) => item.id !== id);

        await writeSourcesFile(next);

        return res.status(200).json({
          ok: true,
          sources: next,
        });
      }

      if (entity === "posts") {
        const id = Number(body.id);

        const feedFile = await readFeedFile<IngestedPost>();
        const current = Array.isArray(feedFile.posts) ? feedFile.posts : [];
        const next = current.filter((item) => item.id !== id);

        await writeFeedFile(next);

        return res.status(200).json({
          ok: true,
          posts: next,
        });
      }

      return res.status(400).json({
        ok: false,
        error: "Unknown entity",
      });
    }

    res.setHeader("Allow", "POST, PATCH, DELETE");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("admin-posts api error", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}