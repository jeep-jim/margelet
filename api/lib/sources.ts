import type { ContentTag, IngestedPost } from "../../src/types/app.js";
import type { CountryCode } from "../../src/screens/admin/admin.countries.js";
import type { TrustedSource } from "../../src/screens/admin/admin.types.js";
import { ingestTelegramPost } from "../../src/lib/telegram.js";
import {
  readFeedFile,
  readSourcesFile,
  writeFeedFile,
  writeSourcesFile,
} from "./blob-store.js";

const POSTS_PER_SOURCE_SCAN = 12;
const MAX_NEW_POSTS_PER_SOURCE = 3;
const MAX_TOTAL_POSTS = 500;
const POST_TTL_HOURS = 24;
const MAX_SOURCES_PER_REBUILD = 200;

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeHandle(handle: string) {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

function normalizeCountryCode(value: string | null | undefined) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || null;
}

function normalizeTags(
  tags: unknown,
  fallbackTag?: ContentTag | null
): ContentTag[] {
  const normalized = Array.isArray(tags)
    ? tags
        .map((item: unknown) => asString(item))
        .filter((item): item is ContentTag => Boolean(item))
    : [];

  const unique = Array.from(new Set(normalized));
  if (unique.length > 0) return unique;
  return fallbackTag ? [fallbackTag] : ["other"];
}

export function makeSourceId(countryCode: CountryCode, handle: string) {
  return `${countryCode}:${normalizeHandle(handle)}`;
}

function isStatus(value: unknown): value is TrustedSource["status"] {
  return value === "active" || value === "paused";
}

function buildSource(
  input: Partial<TrustedSource> & {
    countryCode: CountryCode;
    handle: string;
    defaultTag: ContentTag;
  }
): TrustedSource {
  const now = new Date().toISOString();
  const normalizedHandle = normalizeHandle(input.handle);
  const title = asString(input.title) || normalizedHandle;
  const defaultTag = input.defaultTag;
  const tags = normalizeTags(input.tags, defaultTag);

  return {
    id: input.id || makeSourceId(input.countryCode, normalizedHandle),
    countryCode: input.countryCode,
    handle: normalizedHandle,
    title,
    avatarUrl: input.avatarUrl || null,
    defaultTag,
    tags,
    status: isStatus(input.status) ? input.status : "active",
    note: asString(input.note) || null,
    createdAt: input.createdAt || now,
    updatedAt: now,
    lastCheckedAt: input.lastCheckedAt || null,
    lastImportedAt: input.lastImportedAt || null,
    lastSeenPostId:
      typeof input.lastSeenPostId === "number" ? input.lastSeenPostId : null,
    importedPostsCount:
      typeof input.importedPostsCount === "number"
        ? input.importedPostsCount
        : 0,
  };
}

function normalizeSource(value: unknown): TrustedSource | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Partial<TrustedSource> & {
    countryCode?: CountryCode;
    handle?: string;
    defaultTag?: ContentTag;
  };

  const countryCode = normalizeCountryCode(raw.countryCode) as
    | CountryCode
    | null;
  const handle = asString(raw.handle);
  const defaultTag = asString(raw.defaultTag) as ContentTag | null;

  if (!countryCode || !handle || !defaultTag) return null;
  return buildSource({ ...raw, countryCode, handle, defaultTag });
}

export async function listSources(limit = 5000) {
  const file = await readSourcesFile<unknown>();

  return file.sources
    .map((item: unknown) => normalizeSource(item))
    .filter((item): item is TrustedSource => Boolean(item))
    .slice(0, limit);
}

export async function getSourceById(id: string) {
  const sources = await listSources(5000);
  return sources.find((source: TrustedSource) => source.id === id) || null;
}

export async function upsertSourceWithMeta(
  input: Pick<
    TrustedSource,
    "id" | "countryCode" | "handle" | "defaultTag" | "status"
  > &
    Partial<
      Pick<
        TrustedSource,
        | "title"
        | "note"
        | "avatarUrl"
        | "tags"
        | "createdAt"
        | "lastCheckedAt"
        | "lastImportedAt"
        | "lastSeenPostId"
        | "importedPostsCount"
      >
    >
) {
  const sources = await listSources(5000);
  const existing =
    sources.find((source: TrustedSource) => source.id === input.id) || null;

  const next = buildSource({
    ...(existing || {}),
    ...input,
    title: input.title ?? existing?.title ?? input.handle,
    note: input.note ?? existing?.note ?? null,
    avatarUrl: input.avatarUrl ?? existing?.avatarUrl ?? null,
    tags: input.tags ?? existing?.tags ?? [input.defaultTag],
    createdAt: existing?.createdAt || input.createdAt,
    importedPostsCount:
      typeof input.importedPostsCount === "number"
        ? input.importedPostsCount
        : existing?.importedPostsCount,
    lastSeenPostId:
      typeof input.lastSeenPostId === "number"
        ? input.lastSeenPostId
        : existing?.lastSeenPostId,
    lastCheckedAt: input.lastCheckedAt ?? existing?.lastCheckedAt,
    lastImportedAt: input.lastImportedAt ?? existing?.lastImportedAt,
  });

  const without = sources.filter((source: TrustedSource) => source.id !== next.id);
  const updated = [...without, next].sort((a: TrustedSource, b: TrustedSource) =>
    a.handle.localeCompare(b.handle)
  );

  await writeSourcesFile(updated);
  return next;
}

export async function deleteSourceById(id: string) {
  const sources = await listSources(5000);
  const updated = sources.filter((source: TrustedSource) => source.id !== id);
  await writeSourcesFile(updated);
}

function getFeedWindowStart() {
  return Date.now() - POST_TTL_HOURS * 60 * 60 * 1000;
}

function makePostId(postUrl: string) {
  let hash = 2166136261;
  for (let i = 0; i < postUrl.length; i += 1) {
    hash ^= postUrl.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function buildPost(params: {
  postUrl: string;
  source: TrustedSource;
  ingest: Awaited<ReturnType<typeof ingestTelegramPost>>;
  createdAt: string;
}): IngestedPost {
  const { postUrl, source, ingest, createdAt } = params;
  const expiresAt = new Date(
    Date.parse(createdAt) + POST_TTL_HOURS * 60 * 60 * 1000
  ).toISOString();
  const primaryTag = source.defaultTag;
  const tags = normalizeTags(source.tags, primaryTag);

  return {
    id: makePostId(postUrl),
    postUrl,
    source: {
      handle: ingest?.source.handle || source.handle,
      title: ingest?.source.title || source.title,
      avatar: ingest?.source.avatar || source.avatarUrl || null,
      verified: ingest?.source.verified || false,
    },
    text: ingest?.text || "",
    links: ingest?.links || [],
    contentType: ingest?.contentType || "text",
    media: ingest?.media || [],
    hasMediaInOriginal: ingest?.hasMediaInOriginal || false,
    fallbackReason: ingest?.fallbackReason || null,
    createdAt,
    expiresAt,
    ttlHours: POST_TTL_HOURS,
    mediaRefreshedAt: createdAt,
    tag: primaryTag,
    tags,
    addedBy: {
      telegramId: null,
      username: null,
    },
    billing: {
      plan: "free",
      autopublishEnabled: false,
    },
    sourceId: source.id,
    sourceCountryCode: source.countryCode,
    status: "published",
    role: "admin",
    moderation: {
      status: "published",
      reason: null,
      reviewedAt: createdAt,
    },
  };
}

async function ingestSourcePosts(source: TrustedSource) {
  const found: IngestedPost[] = [];
  let highestPostId: number | null = source.lastSeenPostId ?? null;
  const start = Math.max(1, (source.lastSeenPostId || 0) + 1);
  const end = start + POSTS_PER_SOURCE_SCAN - 1;

  for (let postId = end; postId >= start; postId -= 1) {
    const postUrl = `https://t.me/${source.handle}/${postId}?single`;
    const ingest = await ingestTelegramPost(postUrl);
    if (!ingest) continue;

    const createdAt = new Date().toISOString();
    found.push(buildPost({ postUrl, source, ingest, createdAt }));
    highestPostId = Math.max(highestPostId || 0, postId);

    if (found.length >= MAX_NEW_POSTS_PER_SOURCE) break;
  }

  return { posts: found, highestPostId };
}

export async function rebuildFeedFromSources(options?: {
  countryCode?: CountryCode | null;
}) {
  const allSources = await listSources(5000);
  const countryCode = options?.countryCode || null;

  const activeSources = allSources
    .filter((source: TrustedSource) => source.status === "active")
    .filter((source: TrustedSource) =>
      countryCode ? source.countryCode === countryCode : true
    )
    .slice(0, MAX_SOURCES_PER_REBUILD);

  const existingFeed = await readFeedFile<IngestedPost>();
  const now = Date.now();
  const freshWindowStart = getFeedWindowStart();

  const basePosts = existingFeed.posts.filter((post: IngestedPost) => {
    const createdAt = Date.parse(post.createdAt || "");
    if (!Number.isFinite(createdAt)) return false;
    if (createdAt < freshWindowStart || createdAt > now + 60_000) return false;
    if (countryCode && post.sourceCountryCode !== countryCode) return false;
    return true;
  });

  const seenUrls = new Set(basePosts.map((post: IngestedPost) => post.postUrl));
  const importedPosts: IngestedPost[] = [];
  const updatedSources = [...allSources];

  for (const source of activeSources) {
    const result = await ingestSourcePosts(source);
    const importedNow = result.posts.filter(
      (post: IngestedPost) => !seenUrls.has(post.postUrl)
    );

    for (const post of importedNow) {
      seenUrls.add(post.postUrl);
      importedPosts.push(post);
    }

    const sourceIndex = updatedSources.findIndex(
      (item: TrustedSource) => item.id === source.id
    );

    if (sourceIndex >= 0) {
      updatedSources[sourceIndex] = buildSource({
        ...updatedSources[sourceIndex],
        title: importedNow[0]?.source.title || source.title,
        avatarUrl: importedNow[0]?.source.avatar || source.avatarUrl,
        countryCode: source.countryCode,
        handle: source.handle,
        defaultTag: source.defaultTag,
        status: source.status,
        note: source.note,
        createdAt: source.createdAt,
        importedPostsCount:
          (source.importedPostsCount || 0) + importedNow.length,
        lastImportedAt: importedNow.length
          ? new Date().toISOString()
          : source.lastImportedAt,
        lastCheckedAt: new Date().toISOString(),
        lastSeenPostId: result.highestPostId ?? source.lastSeenPostId,
        tags: source.tags,
      });
    }
  }

  const mergedPosts = [...importedPosts, ...basePosts]
    .sort((a: IngestedPost, b: IngestedPost) => {
      const aTime = Date.parse(a.createdAt || "");
      const bTime = Date.parse(b.createdAt || "");
      return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
    })
    .slice(0, MAX_TOTAL_POSTS);

  await Promise.all([
    writeFeedFile(mergedPosts),
    writeSourcesFile(updatedSources),
  ]);

  return {
    updatedAt: new Date().toISOString(),
    sourcesChecked: activeSources.length,
    importedPosts: importedPosts.length,
    posts: mergedPosts,
  };
}