import { deletePostById, getFeedPosts, getPostById, redis } from "./lib/kv.js";
import {
  deleteSourceById,
  getSourceById,
  listSources,
  makeSourceId,
  upsertSourceWithMeta,
} from "./lib/sources.js";
import type { IngestedPost, ContentTag } from "../src/types/app.js";
import type { CountryCode } from "../src/screens/admin/admin.countries.js";
import type { TrustedSource } from "../src/screens/admin/admin.types.js";

const ADMIN_TELEGRAM_IDS = new Set(["1372669404"]);

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
        const sources = await listSources(5000);

        return res.status(200).json({
          ok: true,
          entity: "sources",
          sources,
        });
      }

      const posts = await getFeedPosts(500);

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
        const title = asNullableString(body.title);
        const defaultTag = body.defaultTag;
        const status = body.status;
        const note = asNullableString(body.note);

        if (!isCountryCode(countryCode)) {
          return res.status(400).json({ error: "Missing countryCode" });
        }

        if (!handle) {
          return res.status(400).json({ error: "Missing handle" });
        }

        if (!isContentTag(defaultTag)) {
          return res.status(400).json({ error: "Missing defaultTag" });
        }

        if (!isSourceStatus(status)) {
          return res.status(400).json({ error: "Invalid source status" });
        }

        const sourceId = makeSourceId(countryCode, handle);
        const existing = await getSourceById(sourceId);

        const source = await upsertSourceWithMeta({
          id: sourceId,
          countryCode,
          handle,
          title,
          defaultTag,
          status,
          note,
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

      const post = await getPostById(id);

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      const updated: IngestedPost = {
        ...post,
        status,
        moderation: {
          status,
          reason: null,
          reviewedAt: new Date().toISOString(),
        },
      };

      await redis.set(`margelet:post:${id}`, updated);

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

      const id = asNumber(body.id);

      if (!id) {
        return res.status(400).json({ error: "Missing id" });
      }

      const post = await getPostById(id);

      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }

      await deletePostById(id);

      return res.status(200).json({
        ok: true,
        entity: "posts",
        deletedId: id,
        deletedBy: "admin",
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("admin-posts api error", error);
    return res.status(500).json({ error: "Failed" });
  }
}