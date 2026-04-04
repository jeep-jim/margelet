import { redis } from "./lib/kv.js";
import {
  deleteSourceById,
  listSources,
  makeSourceId,
  saveSource,
} from "./lib/sources.js";
import type { IngestedPost, ContentTag } from "../src/types/app.js";
import type { CountryCode } from "../src/screens/admin/admin.countries.js";
import type { TrustedSource } from "../src/screens/admin/admin.types.js";

const ADMIN_TELEGRAM_IDS = new Set(["1372669404"]);

const FEED_IDS_KEY = "margelet:feed:ids";
const POST_KEY_PREFIX = "margelet:post:";

function postKey(id: number | string) {
  return `${POST_KEY_PREFIX}${id}`;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableString(value: unknown): string | null {
  const v = asString(value);
  return v || null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const n = Number(String(value || "").trim());
  return Number.isFinite(n) ? n : null;
}

function isAdmin(telegramUserId: string) {
  return ADMIN_TELEGRAM_IDS.has(telegramUserId);
}

function isEntity(value: unknown): value is "posts" | "sources" {
  return value === "posts" || value === "sources";
}

function isCountryCode(value: unknown): value is CountryCode {
  return typeof value === "string" && value.trim().length > 0;
}

function isContentTag(value: unknown): value is ContentTag {
  return typeof value === "string" && value.trim().length > 0;
}

function isSourceStatus(value: unknown): value is TrustedSource["status"] {
  return value === "active" || value === "paused";
}

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const telegramUserId = asString(body.telegramUserId);

    if (!telegramUserId) {
      return res.status(400).json({ error: "Missing telegramUserId" });
    }

    if (!isAdmin(telegramUserId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const entity = isEntity(body.entity) ? body.entity : "posts";

    if (req.method === "POST") {
      if (entity === "sources") {
        const sources = await listSources(2000);

        return res.status(200).json({
          ok: true,
          entity: "sources",
          sources,
        });
      }

      const ids = await redis.lrange<number | string>(FEED_IDS_KEY, 0, 500);

      if (!ids || ids.length === 0) {
        return res.status(200).json({ ok: true, entity: "posts", posts: [] });
      }

      const uniqueIds = Array.from(
        new Set(
          ids
            .map((rawId) => {
              const id = asNumber(rawId);
              return id ? String(id) : null;
            })
            .filter((id): id is string => Boolean(id))
        )
      );

      const posts: IngestedPost[] = [];

      for (const rawId of uniqueIds) {
        const raw = await redis.get(postKey(rawId));
        if (!raw || typeof raw !== "object") continue;

        posts.push(raw as IngestedPost);
      }

      return res.status(200).json({
        ok: true,
        entity: "posts",
        posts,
      });
    }

    if (req.method === "PATCH") {
      if (entity === "sources") {
        const countryCode = body.countryCode;
        const handle = asString(body.handle);
        const title = asString(body.title);
        const defaultTag = body.defaultTag;
        const status = body.status;
        const note = asNullableString(body.note);

        if (!isCountryCode(countryCode)) {
          return res.status(400).json({ error: "Missing countryCode" });
        }

        if (!handle) {
          return res.status(400).json({ error: "Missing handle" });
        }

        if (!title) {
          return res.status(400).json({ error: "Missing title" });
        }

        if (!isContentTag(defaultTag)) {
          return res.status(400).json({ error: "Missing defaultTag" });
        }

        if (!isSourceStatus(status)) {
          return res.status(400).json({ error: "Invalid source status" });
        }

        const source = await saveSource({
          id: makeSourceId(countryCode, handle),
          countryCode,
          handle,
          title,
          defaultTag,
          status,
          note,
          lastCheckedAt: null,
          lastImportedAt: null,
          lastSeenPostId: null,
          importedPostsCount: 0,
        });

        return res.status(200).json({
          ok: true,
          entity: "sources",
          source,
        });
      }

      const id = asNumber(body.id);
      const status = body.status;

      if (!id) {
        return res.status(400).json({ error: "Missing id" });
      }

      if (!["published", "blocked"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const key = postKey(id);
      const raw = await redis.get(key);

      if (!raw || typeof raw !== "object") {
        return res.status(404).json({ error: "Post not found" });
      }

      const post = raw as IngestedPost;

      const updated: IngestedPost = {
        ...post,
        status,
        moderation: {
          status,
          reason: null,
          reviewedAt: new Date().toISOString(),
        },
      };

      await redis.set(key, updated);

      return res.status(200).json({
        ok: true,
        entity: "posts",
        post: updated,
      });
    }

    if (req.method === "DELETE") {
      if (entity === "sources") {
        const countryCode = body.countryCode;
        const handle = asString(body.handle);
        const sourceId = asString(body.id);

        const id =
          sourceId ||
          (isCountryCode(countryCode) && handle
            ? makeSourceId(countryCode, handle)
            : "");

        if (!id) {
          return res.status(400).json({ error: "Missing source id" });
        }

        await deleteSourceById(id);

        return res.status(200).json({
          ok: true,
          entity: "sources",
          deletedId: id,
        });
      }

      return res.status(405).json({ error: "Method not allowed" });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("admin-posts api error", error);
    return res.status(500).json({ error: "Failed" });
  }
}