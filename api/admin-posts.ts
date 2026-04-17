import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  readFeedFile,
  readSourcesFile,
  writeFeedFile,
  writeSourcesFile,
} from "./lib/github-store.js";
import type { ContentTag, IngestedPost, TrustedSource } from "./lib/contracts.js";

const ADMIN_TELEGRAM_ID = String(process.env.ADMIN_TELEGRAM_ID || "").trim();
const ADMIN_TELEGRAM_USERNAME = String(
  process.env.ADMIN_TELEGRAM_USERNAME || ""
)
  .trim()
  .toLowerCase();

type StoredSource = TrustedSource;

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  return null;
}

function normalizeHandle(value: unknown) {
  return asString(value).replace(/^@+/, "").toLowerCase();
}

function normalizeCountryCode(value: unknown) {
  return asString(value, "ru").toLowerCase() || "ru";
}

function parseDateMs(value: string | null | undefined) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? ms : 0;
}

function isOwner(body: Record<string, unknown>) {
  const telegramId = asString(body.telegramId) || asString(body.telegramUserId);
  const username = (asString(body.username) || asString(body.telegramUsername))
    .replace(/^@/, "")
    .toLowerCase();

  const hasEnv = Boolean(ADMIN_TELEGRAM_ID || ADMIN_TELEGRAM_USERNAME);
  if (!hasEnv) {
    return Boolean(telegramId);
  }

  const byId = ADMIN_TELEGRAM_ID && telegramId === ADMIN_TELEGRAM_ID;
  const byUsername =
    ADMIN_TELEGRAM_USERNAME &&
    username === ADMIN_TELEGRAM_USERNAME.replace(/^@/, "");

  return Boolean(byId || byUsername);
}

function normalizeTags(value: unknown, fallback: ContentTag): ContentTag[] {
  const tags = Array.isArray(value)
    ? (value
        .map((item: unknown) => asString(item))
        .filter(Boolean) as ContentTag[])
    : [];

  const unique = Array.from(new Set(tags));
  return unique.length ? unique : [fallback];
}

function buildSource(body: Record<string, unknown>): StoredSource | null {
  const handle = normalizeHandle(body.handle);
  if (!handle) return null;

  const countryCode = normalizeCountryCode(body.countryCode) as StoredSource["countryCode"];
  const defaultTag = (asString(body.defaultTag, "other") as ContentTag) || "other";
  const now = new Date().toISOString();

  return {
    id: asString(body.id) || `${countryCode}:${handle}`,
    countryCode,
    handle,
    title: asString(body.title) || handle,
    avatarUrl: asString(body.avatarUrl) || null,
    verified: Boolean(body.verified),
    defaultTag,
    tags: normalizeTags(body.tags, defaultTag),
    status: asString(body.status) === "paused" ? "paused" : "active",
    note: asString(body.note) || null,
    createdAt: asString(body.createdAt) || now,
    updatedAt: now,
    lastCheckedAt: asString(body.lastCheckedAt) || null,
    lastImportedAt: asString(body.lastImportedAt) || null,
    lastSeenPostId: asNumber(body.lastSeenPostId),
    importedPostsCount:
      typeof body.importedPostsCount === "number" ? body.importedPostsCount : 0,
  };
}

function sortSources(items: StoredSource[]) {
  return [...items].sort((a, b) => a.handle.localeCompare(b.handle));
}

function sortPosts(items: IngestedPost[]) {
  return [...items].sort((a, b) => parseDateMs(b.createdAt) - parseDateMs(a.createdAt));
}

async function listPosts(requestedCountryCode: string) {
  const feedFile = await readFeedFile<IngestedPost>();
  const current = Array.isArray(feedFile.posts) ? feedFile.posts : [];

  return sortPosts(
    current.filter(
      (post) =>
        !requestedCountryCode ||
        !post.sourceCountryCode ||
        post.sourceCountryCode === requestedCountryCode
    )
  );
}

async function listSources(requestedCountryCode: string) {
  const sourcesFile = await readSourcesFile<StoredSource>();
  const current = Array.isArray(sourcesFile.sources) ? sourcesFile.sources : [];

  return sortSources(
    current.filter(
      (source) => !requestedCountryCode || source.countryCode === requestedCountryCode
    )
  );
}

async function upsertSingleSource(source: StoredSource) {
  const sourcesFile = await readSourcesFile<StoredSource>();
  const current = Array.isArray(sourcesFile.sources) ? sourcesFile.sources : [];

  const existingIndex = current.findIndex(
    (item) =>
      item.id === source.id ||
      (item.handle === source.handle && item.countryCode === source.countryCode)
  );

  const next = [...current];

  if (existingIndex >= 0) {
    next[existingIndex] = {
      ...next[existingIndex],
      ...source,
      createdAt: next[existingIndex].createdAt || source.createdAt,
      updatedAt: new Date().toISOString(),
    };
  } else {
    next.unshift(source);
  }

  await writeSourcesFile(sortSources(next));
  return next;
}

async function bulkCreateSources(items: StoredSource[]) {
  const sourcesFile = await readSourcesFile<StoredSource>();
  const current = Array.isArray(sourcesFile.sources) ? sourcesFile.sources : [];
  const next = [...current];
  let created = 0;
  let updated = 0;

  for (const source of items) {
    const existingIndex = next.findIndex(
      (item) =>
        item.id === source.id ||
        (item.handle === source.handle && item.countryCode === source.countryCode)
    );

    if (existingIndex >= 0) {
      next[existingIndex] = {
        ...next[existingIndex],
        ...source,
        createdAt: next[existingIndex].createdAt || source.createdAt,
        updatedAt: new Date().toISOString(),
      };
      updated += 1;
    } else {
      next.unshift(source);
      created += 1;
    }
  }

  await writeSourcesFile(sortSources(next));
  return { next, created, updated };
}

async function deleteSourceByIdentity(body: Record<string, unknown>) {
  const id = asString(body.sourceId) || asString(body.id);
  const handle = normalizeHandle(body.handle);
  const countryCode = normalizeCountryCode(body.countryCode);

  const sourcesFile = await readSourcesFile<StoredSource>();
  const current = Array.isArray(sourcesFile.sources) ? sourcesFile.sources : [];

  const next = current.filter((item) => {
    if (id && item.id === id) return false;
    if (handle && item.handle.toLowerCase() === handle) {
      if (!countryCode || item.countryCode === countryCode) {
        return false;
      }
    }
    return true;
  });

  await writeSourcesFile(sortSources(next));
  return next;
}

async function deletePostById(body: Record<string, unknown>) {
  const id = asNumber(body.id);
  if (id === null) {
    throw new Error("Invalid post id");
  }

  const feedFile = await readFeedFile<IngestedPost>();
  const current = Array.isArray(feedFile.posts) ? feedFile.posts : [];
  const next = current.filter((item) => item.id !== id);

  await writeFeedFile(sortPosts(next));
  return next;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    if (!isOwner(body as Record<string, unknown>)) {
      return res.status(403).json({
        ok: false,
        error: "Access denied",
      });
    }

    if (req.method !== "POST" && req.method !== "DELETE") {
      res.setHeader("Allow", "POST, DELETE");
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    const payload = body as Record<string, unknown>;
    const entity = asString(payload.entity);
    const action = asString(payload.action);
    const requestedCountryCode = asString(payload.countryCode).toLowerCase();

    if (req.method === "DELETE") {
      if (entity === "sources") {
        const sources = await deleteSourceByIdentity(payload);
        return res.status(200).json({ ok: true, sources });
      }

      if (entity === "posts") {
        const posts = await deletePostById(payload);
        return res.status(200).json({ ok: true, posts });
      }

      return res.status(400).json({ ok: false, error: "Unknown entity" });
    }

    if (entity === "posts") {
      if (!action || action === "list") {
        const posts = await listPosts(requestedCountryCode);
        return res.status(200).json({ ok: true, posts });
      }

      if (action === "delete") {
        const posts = await deletePostById(payload);
        return res.status(200).json({ ok: true, posts });
      }

      return res.status(400).json({ ok: false, error: "Unknown posts action" });
    }

    if (entity === "sources") {
      if (!action || action === "list") {
        const sources = await listSources(requestedCountryCode);
        return res.status(200).json({ ok: true, sources });
      }

      if (action === "create" || action === "update") {
        const sourcePayload =
          payload.source && typeof payload.source === "object"
            ? (payload.source as Record<string, unknown>)
            : payload;

        const source = buildSource(sourcePayload);
        if (!source) {
          return res.status(400).json({ ok: false, error: "Invalid source payload" });
        }

        const sources = await upsertSingleSource(source);
        return res.status(200).json({ ok: true, source, sources });
      }

      if (action === "bulk-create") {
        const rawSources = Array.isArray(payload.sources) ? payload.sources : [];
        const prepared = rawSources
          .map((item: unknown) =>
            buildSource((item || {}) as Record<string, unknown>)
          )
          .filter((item): item is StoredSource => Boolean(item));

        if (!prepared.length) {
          return res
            .status(400)
            .json({ ok: false, error: "No valid sources to import" });
        }

        const result = await bulkCreateSources(prepared);
        return res.status(200).json({
          ok: true,
          created: result.created,
          updated: result.updated,
          sources: result.next,
        });
      }

      if (action === "delete") {
        const sources = await deleteSourceByIdentity(payload);
        return res.status(200).json({ ok: true, sources });
      }

      return res.status(400).json({ ok: false, error: "Unknown sources action" });
    }

    return res.status(400).json({ ok: false, error: "Unknown entity" });
  } catch (error) {
    console.error("admin-posts api error", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}