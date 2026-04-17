import {
  type ContentTag,
  type CountryCode,
  type IngestedPost,
  type TrustedSource,
} from "./contracts.js";
import { ingestTelegramPost } from "./telegram.js";
import {
  readFeedFile,
  readSourcesFile,
  writeFeedFile,
  writeSourcesFile,
} from "./github-store.js";

const MAX_NEW_POSTS_PER_SOURCE = 3;
const MAX_IMPORT_CANDIDATES_PER_SOURCE = 12;
const MAX_TOTAL_POSTS = 500;
const POST_TTL_HOURS = 24;
const MAX_SOURCES_PER_REBUILD = 500;
const SOURCE_PAGE_TIMEOUT_MS = 15_000;
const REBUILD_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36";

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

function normalizeTags(tags: unknown, fallbackTag?: ContentTag | null): ContentTag[] {
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

function parseNumericPostId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number(value);
  }

  return null;
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
    lastSeenPostId: parseNumericPostId(input.lastSeenPostId),
    importedPostsCount:
      typeof input.importedPostsCount === "number" ? input.importedPostsCount : 0,
  };
}

function normalizeSource(value: unknown): TrustedSource | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Partial<TrustedSource> & {
    countryCode?: CountryCode;
    handle?: string;
    defaultTag?: ContentTag;
  };

  const countryCode = normalizeCountryCode(raw.countryCode) as CountryCode | null;
  const handle = asString(raw.handle);
  const defaultTag = asString(raw.defaultTag) as ContentTag | null;

  if (!countryCode || !handle || !defaultTag) return null;
  return buildSource({ ...raw, countryCode, handle, defaultTag });
}

function getSourceSortValue(source: TrustedSource) {
  const checkedAt = Date.parse(source.lastCheckedAt || "");
  if (Number.isFinite(checkedAt) && checkedAt > 0) {
    return checkedAt;
  }

  const createdAt = Date.parse(source.createdAt || "");
  if (Number.isFinite(createdAt) && createdAt > 0) {
    return createdAt;
  }

  return 0;
}

function sortSourcesForRebuild(sources: TrustedSource[]) {
  return [...sources].sort((a, b) => {
    const byLastChecked = getSourceSortValue(a) - getSourceSortValue(b);
    if (byLastChecked !== 0) return byLastChecked;
    return a.handle.localeCompare(b.handle);
  });
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
  const existing = sources.find((source: TrustedSource) => source.id === input.id) || null;

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
  const updated = without
    .concat(next)
    .sort((a: TrustedSource, b: TrustedSource) => {
      const byCountry = a.countryCode.localeCompare(b.countryCode);
      if (byCountry !== 0) return byCountry;
      return a.handle.localeCompare(b.handle);
    });

  await writeSourcesFile(updated);
  return next;
}

export async function deleteSourceById(id: string) {
  const sources = await listSources(5000);
  const updated = sources.filter((source: TrustedSource) => source.id !== id);
  await writeSourcesFile(updated);
}

function getPostCreatedAt(post: IngestedPost) {
  const ts = Date.parse(post.createdAt);
  return Number.isFinite(ts) ? ts : 0;
}

function getPostExpiresAt(post: IngestedPost) {
  const explicit = Date.parse(post.expiresAt || "");
  if (Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }

  const createdAt = getPostCreatedAt(post);
  const ttlHours = typeof post.ttlHours === "number" && post.ttlHours > 0 ? post.ttlHours : 24;
  return createdAt + ttlHours * 60 * 60 * 1000;
}

function dedupePosts(posts: IngestedPost[]) {
  const byUrl = new Map<string, IngestedPost>();

  for (const post of posts) {
    const existing = byUrl.get(post.postUrl);
    if (!existing || getPostCreatedAt(post) > getPostCreatedAt(existing)) {
      byUrl.set(post.postUrl, post);
    }
  }

  return Array.from(byUrl.values());
}

export function cleanupFeedPosts(posts: IngestedPost[]) {
  const now = Date.now();
  const minCreatedAt = now - POST_TTL_HOURS * 60 * 60 * 1000;

  return dedupePosts(posts)
    .filter((post: IngestedPost) => {
      const createdAt = getPostCreatedAt(post);
      const expiresAt = getPostExpiresAt(post);
      return createdAt >= minCreatedAt && expiresAt > now;
    })
    .sort((a: IngestedPost, b: IngestedPost) => getPostCreatedAt(b) - getPostCreatedAt(a))
    .slice(0, MAX_TOTAL_POSTS);
}

function parsePostIdsFromChannelHtml(html: string): number[] {
  const ids = new Set<number>();
  const re = /data-post="[^/]+\/(\d+)"/g;
  let match: RegExpExecArray | null;

  while ((match = re.exec(html))) {
    const id = Number(match[1]);
    if (Number.isFinite(id)) {
      ids.add(id);
    }
  }

  return Array.from(ids).sort((a, b) => b - a);
}

async function fetchChannelHtml(handle: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SOURCE_PAGE_TIMEOUT_MS);

  try {
    const response = await fetch(`https://t.me/s/${handle}`, {
      headers: {
        "user-agent": REBUILD_USER_AGENT,
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch channel page: ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function pickBestSourceTitle(source: TrustedSource, ingestTitle: string | null | undefined) {
  return asString(ingestTitle) || source.title || source.handle;
}

function pickBestSourceAvatar(source: TrustedSource, ingestAvatar: string | null | undefined) {
  return asString(ingestAvatar) || source.avatarUrl || null;
}

function buildPost(params: {
  postUrl: string;
  source: TrustedSource;
  ingest: NonNullable<Awaited<ReturnType<typeof ingestTelegramPost>>>;
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
      title: pickBestSourceTitle(source, ingest.source.title),
      handle: source.handle,
      verified: ingest.source.verified,
      avatar: pickBestSourceAvatar(source, ingest.source.avatar),
    },
    sourceId: source.id,
    sourceCountryCode: source.countryCode,
    contentType: ingest.contentType,
    media: ingest.media,
    hasMediaInOriginal: ingest.hasMediaInOriginal,
    fallbackReason: ingest.fallbackReason,
    text: ingest.text,
    links: ingest.links,
    createdAt,
    expiresAt,
    ttlHours: POST_TTL_HOURS,
    mediaRefreshedAt: createdAt,
    tag: primaryTag,
    tags,
    addedBy: {
      telegramId: "system",
      username: "system",
    },
    billing: {
      plan: "free",
      autopublishEnabled: true,
    },
    status: "published",
    role: "channel_owner",
    moderation: {
      status: "published",
      reason: null,
      reviewedAt: createdAt,
    },
  };
}

function makePostId(postUrl: string) {
  let hash = 2166136261;
  for (let i = 0; i < postUrl.length; i += 1) {
    hash ^= postUrl.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

async function importFromSource(source: TrustedSource, existingPosts: IngestedPost[]) {
  const html = await fetchChannelHtml(source.handle);
  const postIds = parsePostIdsFromChannelHtml(html);
  const knownUrls = new Set(existingPosts.map((post: IngestedPost) => post.postUrl));
  const nowIso = new Date().toISOString();

  const freshIds = postIds.filter((postId: number) => {
    if (source.lastSeenPostId && postId <= source.lastSeenPostId) {
      return false;
    }

    const url = `https://t.me/${source.handle}/${postId}?single`;
    return !knownUrls.has(url);
  });

  const candidateIds = freshIds.slice(0, MAX_IMPORT_CANDIDATES_PER_SOURCE);
  const importedPosts: IngestedPost[] = [];
  let sourceTitle = source.title;
  let sourceAvatarUrl = source.avatarUrl;

  for (const postId of candidateIds) {
    if (importedPosts.length >= MAX_NEW_POSTS_PER_SOURCE) {
      break;
    }

    const postUrl = `https://t.me/${source.handle}/${postId}?single`;
    const ingest = await ingestTelegramPost(postUrl);
    if (!ingest) {
      continue;
    }

    sourceTitle = pickBestSourceTitle(source, ingest.source.title);
    sourceAvatarUrl = pickBestSourceAvatar(source, ingest.source.avatar);

    importedPosts.push(
      buildPost({
        postUrl,
        source: {
          ...source,
          title: sourceTitle,
          avatarUrl: sourceAvatarUrl,
        },
        ingest,
        createdAt: nowIso,
      })
    );
  }

  const highestSeenPostId =
    postIds.length > 0 ? Math.max(...postIds) : source.lastSeenPostId || null;

  const nextSource = await upsertSourceWithMeta({
    ...source,
    title: sourceTitle,
    avatarUrl: sourceAvatarUrl,
    lastSeenPostId: highestSeenPostId || source.lastSeenPostId || null,
    lastCheckedAt: nowIso,
    lastImportedAt: importedPosts.length > 0 ? nowIso : source.lastImportedAt || null,
    importedPostsCount: (source.importedPostsCount || 0) + importedPosts.length,
  });

  return {
    source: nextSource,
    importedPosts,
  };
}

export async function rebuildFeedFromSources(options?: { countryCode?: CountryCode | null }) {
  const normalizedCountry = normalizeCountryCode(options?.countryCode) as CountryCode | null;

  const allSources = await listSources(5000);
  const activeSources = sortSourcesForRebuild(
    allSources
      .filter((source: TrustedSource) => source.status === "active")
      .filter((source: TrustedSource) =>
        normalizedCountry ? source.countryCode === normalizedCountry : true
      )
      .slice(0, MAX_SOURCES_PER_REBUILD)
  );

  const feedFile = await readFeedFile<IngestedPost>();
  let posts = cleanupFeedPosts(feedFile.posts || []);
  const existingFreshPostsCount = posts.length;

  let sourcesChecked = 0;
  let importedPosts = 0;

  for (const source of activeSources) {
    sourcesChecked += 1;

    try {
      const result = await importFromSource(source, posts);
      if (result.importedPosts.length > 0) {
        posts = cleanupFeedPosts([...result.importedPosts, ...posts]);
        importedPosts += result.importedPosts.length;
      }
    } catch (error) {
      console.error("rebuild source failed", source.handle, error);
    }
  }

  posts = cleanupFeedPosts(posts);
  await writeFeedFile(posts);

  return {
    updatedAt: new Date().toISOString(),
    posts,
    sourcesChecked,
    importedPosts,
    removedPosts: Math.max(0, (feedFile.posts || []).length - posts.length),
    existingFreshPostsCount,
  };
}
