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

const MAX_IMPORT_CANDIDATES_PER_SOURCE = 20;
const MAX_REFRESH_POSTS_PER_SOURCE = 3;
const POST_TTL_HOURS = 24;
const SOURCE_PAGE_TIMEOUT_MS = 15000;
const REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000;
const MIN_REMAINING_TTL_MS = 60 * 60 * 1000;
const MIN_POST_AGE_BEFORE_REFRESH_MS = 10 * 60 * 1000;
const REBUILD_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36";

type SourceSyncResult = {
  source: TrustedSource;
  newPosts: IngestedPost[];
  refreshedPosts: IngestedPost[];
  refreshedCount: number;
};

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim();
  return v || null;
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
        .map((item) => asString(item))
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
  if (typeof value === "number" && Number.isFinite(value)) return value;
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

  return {
    id: input.id || makeSourceId(input.countryCode, normalizedHandle),
    countryCode: input.countryCode,
    handle: normalizedHandle,
    title: asString(input.title) || normalizedHandle,
    avatarUrl: input.avatarUrl || null,
    verified: Boolean(input.verified),
    defaultTag: input.defaultTag,
    tags: normalizeTags(input.tags, input.defaultTag),
    status: isStatus(input.status) ? input.status : "active",
    note: asString(input.note) || null,
    createdAt: input.createdAt || now,
    updatedAt: now,
    lastCheckedAt: input.lastCheckedAt || null,
    lastImportedAt: input.lastImportedAt || null,
    lastSeenPostId: parseNumericPostId(input.lastSeenPostId),
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

  const countryCode = normalizeCountryCode(raw.countryCode) as CountryCode | null;
  const handle = asString(raw.handle);
  const defaultTag = asString(raw.defaultTag) as ContentTag | null;

  if (!countryCode || !handle || !defaultTag) return null;
  return buildSource({ ...raw, countryCode, handle, defaultTag });
}

function sortSources(sources: TrustedSource[]) {
  return [...sources].sort((a, b) => {
    const byCountry = a.countryCode.localeCompare(b.countryCode);
    if (byCountry !== 0) return byCountry;
    return a.handle.localeCompare(b.handle);
  });
}

export async function listSources(limit = 5000) {
  const file = await readSourcesFile<unknown>();

  return file.sources
    .map((item) => normalizeSource(item))
    .filter((item): item is TrustedSource => Boolean(item))
    .slice(0, limit);
}

export async function getSourceById(id: string) {
  const sources = await listSources();
  return sources.find((source) => source.id === id) || null;
}

export async function upsertSourceWithMeta(
  input: Pick<
    TrustedSource,
    "id" | "countryCode" | "handle" | "defaultTag" | "status"
  > &
    Partial<TrustedSource>
) {
  const sources = await listSources();
  const existing = sources.find((source) => source.id === input.id) || null;

  const next = buildSource({
    ...(existing || {}),
    ...input,
  });

  const updated = sortSources(
    sources.filter((source) => source.id !== next.id).concat(next)
  );

  await writeSourcesFile(updated);
  return next;
}

export async function deleteSourceById(id: string) {
  const sources = await listSources();
  await writeSourcesFile(sources.filter((source) => source.id !== id));
}

function getExpiresAt(post: IngestedPost) {
  const explicit = Date.parse(post.expiresAt || "");
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  const created = Date.parse(post.createdAt || "");
  if (!Number.isFinite(created)) return 0;

  const ttl =
    typeof post.ttlHours === "number" && post.ttlHours > 0
      ? post.ttlHours
      : POST_TTL_HOURS;

  return created + ttl * 60 * 60 * 1000;
}

function parseIsoMs(value: string | null | undefined) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? ms : null;
}

function dedupePosts(posts: IngestedPost[]) {
  const map = new Map<string, IngestedPost>();

  for (const post of posts) {
    if (!map.has(post.postUrl)) {
      map.set(post.postUrl, post);
    }
  }

  return Array.from(map.values());
}

export function cleanupFeedPosts(posts: IngestedPost[]) {
  const now = Date.now();

  return dedupePosts(posts).filter((post) => getExpiresAt(post) > now);
}

function parsePostIdsFromChannelHtml(html: string): number[] {
  const ids = new Set<number>();
  const re = /data-post="[^/]+\/(\d+)"/g;

  let match: RegExpExecArray | null;

  while ((match = re.exec(html))) {
    const id = Number(match[1]);
    if (Number.isFinite(id)) ids.add(id);
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
  ingest: NonNullable<Awaited<ReturnType<typeof ingestTelegramPost>>>;
  createdAt: string;
}): IngestedPost {
  const { postUrl, source, ingest, createdAt } = params;

  const expiresAt = new Date(
    Date.parse(createdAt) + POST_TTL_HOURS * 60 * 60 * 1000
  ).toISOString();

  return {
    id: makePostId(postUrl),
    postUrl,
    source: {
      title: ingest.source.title || source.title,
      handle: source.handle,
      verified: ingest.source.verified,
      avatar: ingest.source.avatar || source.avatarUrl || null,
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
    tag: source.defaultTag,
    tags: normalizeTags(source.tags, source.defaultTag),
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

function buildRefreshedPost(params: {
  post: IngestedPost;
  source: TrustedSource;
  ingest: NonNullable<Awaited<ReturnType<typeof ingestTelegramPost>>>;
  refreshedAt: string;
}): IngestedPost {
  const { post, source, ingest, refreshedAt } = params;

  return {
    ...post,
    source: {
      title: ingest.source.title || source.title || post.source.title,
      handle: source.handle,
      verified: ingest.source.verified,
      avatar: ingest.source.avatar || source.avatarUrl || post.source.avatar || null,
    },
    sourceId: source.id,
    sourceCountryCode: source.countryCode,
    contentType: ingest.contentType,
    media: ingest.media,
    hasMediaInOriginal: ingest.hasMediaInOriginal,
    fallbackReason: ingest.fallbackReason,
    text: ingest.text,
    links: ingest.links,
    mediaRefreshedAt: refreshedAt,
    tag: source.defaultTag,
    tags: normalizeTags(source.tags, source.defaultTag),
  };
}

function isPostFromSource(post: IngestedPost, source: TrustedSource) {
  const byId = post.sourceId === source.id;
  const byCountryAndHandle =
    normalizeCountryCode(post.sourceCountryCode) === source.countryCode &&
    normalizeHandle(post.source.handle) === source.handle;

  return byId || byCountryAndHandle;
}

function hasRefreshableMedia(post: IngestedPost) {
  return Array.isArray(post.media) && post.media.some((item) => Boolean(item?.url));
}

function shouldRefreshPost(post: IngestedPost, nowMs: number) {
  if (!post.postUrl) return false;
  if (!hasRefreshableMedia(post)) return false;

  const expiresAt = getExpiresAt(post);
  if (!expiresAt || expiresAt <= nowMs + MIN_REMAINING_TTL_MS) {
    return false;
  }

  const createdAtMs = parseIsoMs(post.createdAt);
  if (createdAtMs !== null && createdAtMs >= nowMs - MIN_POST_AGE_BEFORE_REFRESH_MS) {
    return false;
  }

  if (post.fallbackReason === "expired") {
    return true;
  }

  const lastRefreshMs = parseIsoMs(post.mediaRefreshedAt) ?? createdAtMs;
  if (lastRefreshMs === null) {
    return true;
  }

  return lastRefreshMs <= nowMs - REFRESH_INTERVAL_MS;
}

function pickPostsToRefresh(posts: IngestedPost[], nowMs: number) {
  return posts
    .filter((post) => shouldRefreshPost(post, nowMs))
    .sort((a, b) => {
      const aMs = parseIsoMs(a.mediaRefreshedAt) ?? parseIsoMs(a.createdAt) ?? 0;
      const bMs = parseIsoMs(b.mediaRefreshedAt) ?? parseIsoMs(b.createdAt) ?? 0;
      return aMs - bMs;
    })
    .slice(0, MAX_REFRESH_POSTS_PER_SOURCE);
}

async function syncSourcePosts(
  source: TrustedSource,
  existingPosts: IngestedPost[]
): Promise<SourceSyncResult> {
  const html = await fetchChannelHtml(source.handle);
  const ids = parsePostIdsFromChannelHtml(html);
  const nowIso = new Date().toISOString();
  const nowMs = Date.parse(nowIso);

  const sourceExistingPosts = existingPosts.filter((post) => isPostFromSource(post, source));
  const knownUrls = new Set(existingPosts.map((post) => post.postUrl));
  const newPosts: IngestedPost[] = [];
  const refreshedPosts: IngestedPost[] = [];

  let sourceTitle = source.title;
  let sourceAvatarUrl = source.avatarUrl;
  let sourceVerified = Boolean(source.verified);

  for (const postId of ids.slice(0, MAX_IMPORT_CANDIDATES_PER_SOURCE)) {
    if (source.lastSeenPostId && postId <= source.lastSeenPostId) continue;

    const postUrl = `https://t.me/${source.handle}/${postId}?single`;
    if (knownUrls.has(postUrl)) continue;

    const ingest = await ingestTelegramPost(postUrl);
    if (!ingest) continue;

    sourceTitle = ingest.source.title || sourceTitle;
    sourceAvatarUrl = ingest.source.avatar || sourceAvatarUrl;
    sourceVerified = ingest.source.verified || sourceVerified;

    newPosts.push(
      buildPost({
        postUrl,
        source: {
          ...source,
          title: sourceTitle,
          avatarUrl: sourceAvatarUrl,
          verified: sourceVerified,
        },
        ingest,
        createdAt: nowIso,
      })
    );
    knownUrls.add(postUrl);
  }

  const refreshCandidates = pickPostsToRefresh(sourceExistingPosts, nowMs);

  for (const post of refreshCandidates) {
    const ingest = await ingestTelegramPost(post.postUrl);
    if (!ingest) continue;

    sourceTitle = ingest.source.title || sourceTitle;
    sourceAvatarUrl = ingest.source.avatar || sourceAvatarUrl;
    sourceVerified = ingest.source.verified || sourceVerified;

    refreshedPosts.push(
      buildRefreshedPost({
        post,
        source: {
          ...source,
          title: sourceTitle,
          avatarUrl: sourceAvatarUrl,
          verified: sourceVerified,
        },
        ingest,
        refreshedAt: nowIso,
      })
    );
  }

  const highestSeen =
    ids.length > 0 ? Math.max(...ids) : source.lastSeenPostId || null;

  const nextSource = buildSource({
    ...source,
    title: sourceTitle,
    avatarUrl: sourceAvatarUrl,
    verified: sourceVerified,
    lastSeenPostId: highestSeen,
    lastCheckedAt: nowIso,
    lastImportedAt: newPosts.length > 0 ? nowIso : source.lastImportedAt || null,
    importedPostsCount: (source.importedPostsCount || 0) + newPosts.length,
  });

  return {
    source: nextSource,
    newPosts,
    refreshedPosts,
    refreshedCount: refreshedPosts.length,
  };
}

function mergeSourcePosts(params: {
  allPosts: IngestedPost[];
  source: TrustedSource;
  newPosts: IngestedPost[];
  refreshedPosts: IngestedPost[];
}) {
  const { allPosts, source, newPosts, refreshedPosts } = params;
  const refreshedByUrl = new Map(refreshedPosts.map((post) => [post.postUrl, post]));

  return cleanupFeedPosts([
    ...newPosts,
    ...allPosts.map((post) => {
      if (!isPostFromSource(post, source)) {
        return post;
      }

      return refreshedByUrl.get(post.postUrl) || post;
    }),
  ]);
}

export async function rebuildFeedFromSources(options?: {
  countryCode?: CountryCode | null;
}) {
  const normalizedCountry = normalizeCountryCode(
    options?.countryCode
  ) as CountryCode | null;

  const allSources = await listSources();
  const activeSources = allSources.filter(
    (source) =>
      source.status === "active" &&
      (normalizedCountry ? source.countryCode === normalizedCountry : true)
  );

  const sourcesById = new Map(allSources.map((source) => [source.id, source]));
  const feedFile = await readFeedFile<IngestedPost>();
  let currentPosts = cleanupFeedPosts(feedFile.posts || []);

  let sourcesChecked = 0;
  let importedPosts = 0;
  let refreshedPosts = 0;
  let sourcesWithNewPosts = 0;
  let sourcesWithRefreshedPosts = 0;

  for (const source of activeSources) {
    sourcesChecked += 1;

    try {
      const result = await syncSourcePosts(source, currentPosts);
      sourcesById.set(result.source.id, result.source);

      currentPosts = mergeSourcePosts({
        allPosts: currentPosts,
        source,
        newPosts: result.newPosts,
        refreshedPosts: result.refreshedPosts,
      });

      if (result.newPosts.length > 0) {
        importedPosts += result.newPosts.length;
        sourcesWithNewPosts += 1;
      }

      if (result.refreshedCount > 0) {
        refreshedPosts += result.refreshedCount;
        sourcesWithRefreshedPosts += 1;
      }
    } catch (error) {
      console.error("rebuild source failed", source.handle, error);
    }
  }

  const posts = cleanupFeedPosts(currentPosts);
  await writeFeedFile(posts);
  await writeSourcesFile(sortSources(Array.from(sourcesById.values())));

  return {
    updatedAt: new Date().toISOString(),
    posts,
    sourcesChecked,
    importedPosts,
    refreshedPosts,
    removedPosts: Math.max(0, (feedFile.posts || []).length - posts.length),
    existingFreshPostsCount: posts.length,
    sourcesWithNewPosts,
    sourcesWithRefreshedPosts,
  };
}