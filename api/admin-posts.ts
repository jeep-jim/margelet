import type { VercelRequest, VercelResponse } from "@vercel/node";
import { readFeedFile, readSourcesFile, writeSourcesFile } from "./lib/blob-store.js";

type LiteSource = {
  id: string;
  handle: string;
  title: string;
  countryCode: string;
  defaultTag: string;
  status: "active" | "paused";
  note?: string;
  createdAt: string;
};

function toStringSafe(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeSource(input: unknown): LiteSource | null {
  if (!input || typeof input !== "object") return null;

  const raw = input as Record<string, unknown>;
  const handle = toStringSafe(raw.handle).replace(/^@/, "");
  if (!handle) return null;

  const id =
    toStringSafe(raw.id) ||
    `src_${handle.toLowerCase()}_${Date.now().toString(36)}`;

  const title = toStringSafe(raw.title) || handle;
  const countryCode = toStringSafe(raw.countryCode, "RU").toUpperCase();
  const defaultTag = toStringSafe(raw.defaultTag, "other");
  const status = toStringSafe(raw.status, "active") === "paused" ? "paused" : "active";
  const note = toStringSafe(raw.note);
  const createdAt = toStringSafe(raw.createdAt) || new Date().toISOString();

  return {
    id,
    handle,
    title,
    countryCode,
    defaultTag,
    status,
    note: note || undefined,
    createdAt,
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (req.method === "GET") {
      const [sourcesFile, feedFile] = await Promise.all([
        readSourcesFile<LiteSource>(),
        readFeedFile<unknown>(),
      ]);

      return res.status(200).json({
        ok: true,
        sources: sourcesFile.sources,
        posts: feedFile.posts,
        updatedAt: feedFile.updatedAt,
      });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({
        ok: false,
        error: "Method not allowed",
      });
    }

    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    const action = toStringSafe(body?.action);

    if (action === "delete-source") {
      const sourceId = toStringSafe(body?.sourceId);
      const sourcesFile = await readSourcesFile<LiteSource>();
      const nextSources = sourcesFile.sources.filter(
        (item: LiteSource) => item.id !== sourceId
      );

      await writeSourcesFile(nextSources);

      return res.status(200).json({
        ok: true,
        sources: nextSources,
      });
    }

    if (action === "save-source") {
      const normalized = normalizeSource(body?.source);
      if (!normalized) {
        return res.status(400).json({
          ok: false,
          error: "Invalid source payload",
        });
      }

      const sourcesFile = await readSourcesFile<LiteSource>();
      const existingIndex = sourcesFile.sources.findIndex(
        (item: LiteSource) =>
          item.id === normalized.id || item.handle === normalized.handle
      );

      const nextSources = [...sourcesFile.sources];

      if (existingIndex >= 0) {
        nextSources[existingIndex] = {
          ...nextSources[existingIndex],
          ...normalized,
        };
      } else {
        nextSources.unshift(normalized);
      }

      await writeSourcesFile(nextSources);

      return res.status(200).json({
        ok: true,
        sources: nextSources,
      });
    }

    return res.status(400).json({
      ok: false,
      error: "Unknown action",
    });
  } catch (error) {
    console.error("admin-posts api error", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}