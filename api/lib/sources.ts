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
import { inferPostCategories } from "./post-categories.js";

const MAX_IMPORT_CANDIDATES_PER_SOURCE = 6; 
const MAX_REFRESH_POSTS_PER_SOURCE = 3; 
const MAX_RESCUE_IMPORTS_PER_EMPTY_SOURCE = 3; 
const COUNTRY_RESCUE_FRESH_POSTS_THRESHOLD = 6; 
const POST_TTL_HOURS = 24; 
const SOURCE_PAGE_TIMEOUT_MS = 15000; 
const REFRESH_INTERVAL_MS = 3 * 60 * 60 * 1000; 
const MIN_REMAINING_TTL_MS = 60 * 60 * 1000; 
const MIN_REBUILD_GAP_MS = 20 * 60 * 1000; 
const MIN_POST_AGE_BEFORE_REFRESH_MS = 10 * 60 * 1000; 
const REBUILD_INTERVAL_HOURS = 3; 
const SOURCE_CHECK_CYCLE_HOURS = 24; 
const MIN_SOURCES_PER_COUNTRY_PER_RUN = 100; 
const MAX_SOURCES_PER_COUNTRY_PER_RUN = 3000;

const REBUILD_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36";

type SourceSyncResult = {
  source: TrustedSource;
  newPosts: IngestedPost[];
  refreshedPosts: IngestedPost[];
  refreshedCount: number;
  sourceMetaTouched: boolean;
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
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  return normalized || null;
}

function normalizeTags(
  tags: unknown,
  fallbackTag?: ContentTag | null,
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

function parseIsoMs(value: string | null | undefined) {
  const ms = Date.parse(String(value || ""));
  return Number.isFinite(ms) ? ms : null;
}

function sortSources(sources: TrustedSource[]) {
  return [...sources].sort((a, b) => {
    const byCountry = a.countryCode.localeCompare(b.countryCode);
    if (byCountry !== 0) return byCountry;
    return a.handle.localeCompare(b.handle);
  });
}

function buildSource(
  input: Partial<TrustedSource> & {
    countryCode: CountryCode;
    handle: string;
    defaultTag: ContentTag;
  },
): TrustedSource {
  const now = new Date().toISOString();
  const normalizedHandle = normalizeHandle(input.handle);

  return {
    id: input.id || makeSourceId(input.countryCode, normalizedHandle),
    countryCode: input.countryCode,
    handle: normalizedHandle,
    title: asString(input.title) || normalizedHandle,
    avatarUrl: input.avatarUrl || null,
    avatarOverride: input.avatarOverride || null,
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
    lastRefreshCursorPostId: parseNumericPostId(input.lastRefreshCursorPostId),
  };
}

function normalizeSource(value: unknown): TrustedSource | null {
  if (!value || typeof value !== "object") return null;

  const raw = value as Partial<TrustedSource> & {
    countryCode?: CountryCode;
    handle?: string;
    defaultTag?: ContentTag;
  };

  const countryCode = normalizeCountryCode(
    raw.countryCode,
  ) as CountryCode | null;
  
  const handle = asString(raw.handle);
  const defaultTag = asString(raw.defaultTag) as ContentTag | null;

  if (!countryCode || !handle || !defaultTag) return null;
  return buildSource({ ...raw, countryCode, handle, defaultTag });
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
    Partial<TrustedSource>,
) {
  const sources = await listSources();
  const existing = sources.find((source) => source.id === input.id) || null;

  const next = buildSource({
    ...(existing || {}),
    ...input,
  });

  const updated = sortSources(
    sources.filter((source) => source.id !== next.id).concat(next),
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

function getPostCreatedAtMs(post: IngestedPost) {
  const ms = Date.parse(post.createdAt || "");
  return Number.isFinite(ms) ? ms : 0;
}

function getPostSourceKey(post: IngestedPost) {
  const country = normalizeCountryCode(post.sourceCountryCode) || "xx";
  const handle = normalizeHandle(post.source?.handle || "");
  return `${country}:${handle}`;
}

function interleavePostsBySource(posts: IngestedPost[]) {
  const grouped = new Map<string, IngestedPost[]>();

  for (const post of [...posts].sort(
    (a, b) => getPostCreatedAtMs(b) - getPostCreatedAtMs(a),
  )) {
    const key = getPostSourceKey(post);
    const list = grouped.get(key) || [];
    list.push(post);
    grouped.set(key, list);
  }

  const groups = Array.from(grouped.values()).sort((a, b) => {
    const aTop = a[0] ? getPostCreatedAtMs(a[0]) : 0;
    const bTop = b[0] ? getPostCreatedAtMs(b[0]) : 0;
    return bTop - aTop;
  });

  const result: IngestedPost[] = [];
  let added = true;

  while (added) {
    added = false;

    for (const group of groups) {
      const next = group.shift();
      if (!next) continue;
      result.push(next);
      added = true;
    }
  }

  return result;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePostIdsFromChannelHtml(handle: string, html: string): number[] {
  const ids = new Set<number>();
  const escapedHandle = escapeRegExp(normalizeHandle(handle));
  const re = new RegExp(`data-post="${escapedHandle}/(\\d+)"`, "gi");

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

function getPostIdFromUrl(postUrl: string) {
  const match = postUrl.match(/\/(\d+)\?single$/);
  if (!match) return null;

  const id = Number(match[1]);
  return Number.isFinite(id) ? id : null;
}

function getEffectiveSourceAvatar(
  source: TrustedSource,
  telegramAvatar?: string | null,
) {
  return source.avatarOverride || telegramAvatar || source.avatarUrl || null;
}


function getPostSemanticTags(params: {
  text: string;
  source: TrustedSource;
}) {
  // Post-first intelligence:
  // the post text is the source of truth. Channel tags are only a weak fallback
  // for posts with almost no useful text, so one channel can feed many categories.
  return inferPostCategories({
    text: params.text,
    sourceTags: params.source.tags,
    sourceDefaultTag: params.source.defaultTag,
    maxTags: 6,
  });
}

function buildPost(params: {
  postUrl: string;
  source: TrustedSource;
  ingest: NonNullable<Awaited<ReturnType<typeof ingestTelegramPost>>>;
  createdAt: string;
}): IngestedPost {
  const { postUrl, source, ingest, createdAt } = params;
  const semanticTags = getPostSemanticTags({
    text: ingest.text,
    source,
  });

  const expiresAt = new Date(
    Date.parse(createdAt) + POST_TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();

  return {
    id: makePostId(postUrl),
    postUrl,
    source: {
      title: ingest.source.title || source.title,
      handle: source.handle,
      verified: ingest.source.verified,
      avatar: getEffectiveSourceAvatar(source, ingest.source.avatar),
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
    tag: semanticTags[0] || source.defaultTag,
    tags: semanticTags,
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
  const semanticTags = getPostSemanticTags({
    text: ingest.text || post.text,
    source,
  });

  return {
    ...post,
    source: {
      title: ingest.source.title || source.title || post.source.title,
      handle: source.handle,
      verified: ingest.source.verified,
      avatar:
        getEffectiveSourceAvatar(source, ingest.source.avatar) ||
        post.source.avatar ||
        null,
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
    tag: semanticTags[0] || source.defaultTag,
    tags: semanticTags,
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
  return (
    Array.isArray(post.media) && post.media.some((item) => Boolean(item?.url))
  );
}

function shouldRefreshPost(post: IngestedPost, nowMs: number) {
  if (!post.postUrl) return false;
  if (!hasRefreshableMedia(post)) return false;

  const expiresAt = getExpiresAt(post);
  if (!expiresAt || expiresAt <= nowMs + MIN_REMAINING_TTL_MS) {
    return false;
  }

  const createdAtMs = parseIsoMs(post.createdAt);
  if (
    createdAtMs !== null &&
    createdAtMs >= nowMs - MIN_POST_AGE_BEFORE_REFRESH_MS
  ) {
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

function pickPostsToRefresh(
  posts: IngestedPost[],
  nowMs: number,
  lastRefreshCursorPostId: number | null | undefined,
) {
  const eligible = posts
    .filter((post) => shouldRefreshPost(post, nowMs))
    .map((post) => ({
      post,
      postId: getPostIdFromUrl(post.postUrl),
      refreshedAtMs:
        parseIsoMs(post.mediaRefreshedAt) ?? parseIsoMs(post.createdAt) ?? 0,
    }))
    .sort((a, b) => {
      if (a.refreshedAtMs !== b.refreshedAtMs) {
        return a.refreshedAtMs - b.refreshedAtMs;
      }

      return (b.postId ?? 0) - (a.postId ?? 0);
    });

  if (!eligible.length) {
    return {
      posts: [] as IngestedPost[],
      nextCursorPostId: lastRefreshCursorPostId ?? null,
    };
  }

  let startIndex = 0;

  if (lastRefreshCursorPostId) {
    const cursorIndex = eligible.findIndex(
      (entry) => entry.postId === lastRefreshCursorPostId,
    );

    if (cursorIndex >= 0) {
      startIndex = (cursorIndex + 1) % eligible.length;
    }
  }

  const selected: IngestedPost[] = [];

  for (
    let offset = 0;
    offset < Math.min(MAX_REFRESH_POSTS_PER_SOURCE, eligible.length);
    offset += 1
  ) {
    const entry = eligible[(startIndex + offset) % eligible.length];
    selected.push(entry.post);
  }

  const lastSelected = selected[selected.length - 1];
  const nextCursorPostId = lastSelected
    ? getPostIdFromUrl(lastSelected.postUrl)
    : (lastRefreshCursorPostId ?? null);

  return {
    posts: selected,
    nextCursorPostId,
  };
}

function getCountryBatchSize(totalSources: number) {
  if (totalSources <= 0) return 0;

  const runsPerCycle = Math.max(
    1,
    Math.ceil(SOURCE_CHECK_CYCLE_HOURS / REBUILD_INTERVAL_HOURS),
  );
  const dynamicSize = Math.ceil(totalSources / runsPerCycle);

  return Math.max(
    MIN_SOURCES_PER_COUNTRY_PER_RUN,
    Math.min(MAX_SOURCES_PER_COUNTRY_PER_RUN, dynamicSize),
  );
}

function pickSourcesForRun(sources: TrustedSource[]) {
  const batchSize = getCountryBatchSize(sources.length);

  return [...sources]
    .sort((a, b) => {
      const aChecked = parseIsoMs(a.lastCheckedAt) ?? 0;
      const bChecked = parseIsoMs(b.lastCheckedAt) ?? 0;
      if (aChecked !== bChecked) {
        return aChecked - bChecked;
      }

      const aImported = a.importedPostsCount || 0;
      const bImported = b.importedPostsCount || 0;
      if (aImported !== bImported) {
        return aImported - bImported;
      }

      return a.handle.localeCompare(b.handle);
    })
    .slice(0, batchSize);
}

async function syncSourceMetaFromLatestPost(params: {
  source: TrustedSource;
  ids: number[];
  title: string;
  avatarUrl: string | null;
  verified: boolean;
}) {
  const { source, ids, title, avatarUrl, verified } = params;

  for (const postId of ids.slice(0, 3)) {
    const postUrl = `https://t.me/${source.handle}/${postId}?single`;
    const ingest = await ingestTelegramPost(postUrl);
    if (!ingest) continue;

    return {
      title: ingest.source.title || title,
      avatarUrl: ingest.source.avatar || avatarUrl,
      verified: ingest.source.verified || verified,
      touched: Boolean(
        ingest.source.title || ingest.source.avatar || ingest.source.verified,
      ),
    };
  }

  return {
    title,
    avatarUrl,
    verified,
    touched: false,
  };
}

async function syncSourcePosts(
  source: TrustedSource,
  existingPosts: IngestedPost[],
  options: { allowRescueBackfill?: boolean } = {},
): Promise<SourceSyncResult> {
  const html = await fetchChannelHtml(source.handle);
  const ids = parsePostIdsFromChannelHtml(source.handle, html);
  const nowIso = new Date().toISOString();
  const nowMs = Date.parse(nowIso);

  const sourceExistingPosts = existingPosts.filter((post) =>
    isPostFromSource(post, source),
  );
  const allowRescueBackfill = Boolean(
    options.allowRescueBackfill && sourceExistingPosts.length === 0,
  );
  const knownUrls = new Set(existingPosts.map((post) => post.postUrl));
  const newPosts: IngestedPost[] = [];
  const refreshedPosts: IngestedPost[] = [];

  let sourceTitle = source.title;
  let sourceAvatarUrl = source.avatarUrl;
  let sourceVerified = Boolean(source.verified);
  let sourceMetaTouched = false;

  const visibleLatestPostId = ids.length > 0 ? ids[0] : null;
  const existingTopPostId =
    sourceExistingPosts
      .map((post) => getPostIdFromUrl(post.postUrl))
      .filter((postId): postId is number => Number.isFinite(postId))
      .sort((a, b) => b - a)[0] ?? null;

  const hasCorruptedLastSeen = Boolean(
    source.lastSeenPostId &&
    visibleLatestPostId &&
    source.lastSeenPostId > visibleLatestPostId,
  );

  const effectiveLastSeenPostId = hasCorruptedLastSeen
    ? existingTopPostId
    : source.lastSeenPostId;

  for (const postId of ids.slice(0, MAX_IMPORT_CANDIDATES_PER_SOURCE)) {
    const isOlderOrKnownCursor = Boolean(
      effectiveLastSeenPostId && postId <= effectiveLastSeenPostId,
    );

    if (isOlderOrKnownCursor && !allowRescueBackfill) continue;
    if (
      isOlderOrKnownCursor &&
      newPosts.length >= MAX_RESCUE_IMPORTS_PER_EMPTY_SOURCE
    ) {
      break;
    }

    const postUrl = `https://t.me/${source.handle}/${postId}?single`;
    if (knownUrls.has(postUrl)) continue;

    const ingest = await ingestTelegramPost(postUrl);
    if (!ingest) continue;

    sourceTitle = ingest.source.title || sourceTitle;
    sourceAvatarUrl = ingest.source.avatar || sourceAvatarUrl;
    sourceVerified = ingest.source.verified || sourceVerified;
    sourceMetaTouched = true;

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
      }),
    );
    knownUrls.add(postUrl);
  }

  const refreshSelection = pickPostsToRefresh(
    sourceExistingPosts,
    nowMs,
    source.lastRefreshCursorPostId,
  );

  for (const post of refreshSelection.posts) {
    const ingest = await ingestTelegramPost(post.postUrl);
    if (!ingest) continue;

    sourceTitle = ingest.source.title || sourceTitle;
    sourceAvatarUrl = ingest.source.avatar || sourceAvatarUrl;
    sourceVerified = ingest.source.verified || sourceVerified;
    sourceMetaTouched = true;

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
      }),
    );
  }

  if (!sourceMetaTouched && ids.length > 0) {
    const meta = await syncSourceMetaFromLatestPost({
      source,
      ids,
      title: sourceTitle,
      avatarUrl: sourceAvatarUrl,
      verified: sourceVerified,
    });

    sourceTitle = meta.title;
    sourceAvatarUrl = meta.avatarUrl;
    sourceVerified = meta.verified;
    sourceMetaTouched = meta.touched;
  }

  const importedTopPostId =
    newPosts
      .map((post) => getPostIdFromUrl(post.postUrl))
      .filter((postId): postId is number => Number.isFinite(postId))
      .sort((a, b) => b - a)[0] ?? null;

  const highestSeen =
    importedTopPostId || existingTopPostId || source.lastSeenPostId || null;
  const nextSource = buildSource({
    ...source,
    title: sourceTitle,
    avatarUrl: sourceAvatarUrl,
    verified: sourceVerified,
    lastSeenPostId: highestSeen,
    lastCheckedAt: nowIso,
    lastImportedAt:
      newPosts.length > 0 ? nowIso : source.lastImportedAt || null,
    importedPostsCount: (source.importedPostsCount || 0) + newPosts.length,
    lastRefreshCursorPostId: refreshSelection.nextCursorPostId,
  });

  return {
    source: nextSource,
    newPosts,
    refreshedPosts,
    refreshedCount: refreshedPosts.length,
    sourceMetaTouched,
  };
}

function mergeSourcePosts(params: {
  allPosts: IngestedPost[];
  source: TrustedSource;
  nextSource: TrustedSource;
  newPosts: IngestedPost[];
  refreshedPosts: IngestedPost[];
}) {
  const { allPosts, source, nextSource, newPosts, refreshedPosts } = params;
  const refreshedByUrl = new Map(
    refreshedPosts.map((post) => [post.postUrl, post]),
  );

  return cleanupFeedPosts([
    ...newPosts,
    ...allPosts.map((post) => {
      if (!isPostFromSource(post, source)) {
        return post;
      }

      const refreshed = refreshedByUrl.get(post.postUrl);
      if (refreshed) {
        return refreshed;
      }

      const semanticTags = getPostSemanticTags({
        text: post.text,
        source: nextSource,
      });

      return {
        ...post,
        source: {
          ...post.source,
          handle: nextSource.handle || post.source.handle,
          title: nextSource.title || post.source.title,
          avatar:
            getEffectiveSourceAvatar(nextSource) || post.source.avatar || null,
          verified: Boolean(nextSource.verified),
        },
        sourceId: nextSource.id,
        sourceCountryCode: nextSource.countryCode,
        tag: semanticTags[0] || nextSource.defaultTag,
        tags: semanticTags,
      };
    }),
  ]);
}

export async function rebuildFeedFromSources(options?: {
  countryCode?: CountryCode | null;
  forceFullCountryScan?: boolean;
}) {
  const normalizedCountry = normalizeCountryCode(
    options?.countryCode,
  ) as CountryCode | null;
  const forceFullCountryScan = Boolean(
    normalizedCountry && options?.forceFullCountryScan,
  );

  const feedFile = await readFeedFile<IngestedPost>();
  const previousAllPosts = dedupePosts(
    Array.isArray(feedFile.posts) ? feedFile.posts : [],
  );
  const previousFreshPosts = cleanupFeedPosts(previousAllPosts);
  const lastUpdatedMs = parseIsoMs(feedFile.updatedAt) ?? 0;

  if (!forceFullCountryScan && lastUpdatedMs > 0) {
    const nowMs = Date.now();
    if (nowMs - lastUpdatedMs < MIN_REBUILD_GAP_MS) {
      const posts = previousFreshPosts;
      return {
        updatedAt: feedFile.updatedAt,
        posts,
        countriesChecked: 0,
        activeCountries: 0,
        selectedSources: 0,
        sourcesChecked: 0,
        importedPosts: 0,
        refreshedPosts: 0,
        removedPosts: 0,
        existingFreshPostsCount: posts.length,
        sourcesWithNewPosts: 0,
        sourcesWithRefreshedPosts: 0,
        skipped: true,
        skipReason: "recently_rebuilt",
      };
    }
  }

  const allSources = await listSources();
  const activeSources = allSources.filter(
    (source) =>
      source.status === "active" &&
      (normalizedCountry ? source.countryCode === normalizedCountry : true),
  );

  const activeSourceKeys = new Set(
    activeSources.map(
      (source) => `${source.countryCode}:${normalizeHandle(source.handle)}`,
    ),
  );
  const visiblePreviousFreshPosts = normalizedCountry
    ? previousFreshPosts.filter((post) => {
        const country = normalizeCountryCode(post.sourceCountryCode);
        return (
          country !== normalizedCountry ||
          activeSourceKeys.has(getPostSourceKey(post))
        );
      })
    : previousFreshPosts.filter((post) =>
        activeSourceKeys.has(getPostSourceKey(post)),
      );

  const sourcesById = new Map(allSources.map((source) => [source.id, source]));
  const activeByCountry = new Map<CountryCode, TrustedSource[]>();

  for (const source of activeSources) {
    const list = activeByCountry.get(source.countryCode) || [];
    list.push(source);
    activeByCountry.set(source.countryCode, list);
  }

  const countryFreshPostCounts = new Map<CountryCode, number>();

  for (const post of visiblePreviousFreshPosts) {
    const country = normalizeCountryCode(
      post.sourceCountryCode,
    ) as CountryCode | null;
    if (!country) continue;
    countryFreshPostCounts.set(
      country,
      (countryFreshPostCounts.get(country) || 0) + 1,
    );
  }

  const rescueCountries = new Set<CountryCode>();

  for (const [countryCode, countrySources] of activeByCountry.entries()) {
    const freshCount = countryFreshPostCounts.get(countryCode) || 0;
    if (
      countrySources.length > 0 &&
      freshCount < COUNTRY_RESCUE_FRESH_POSTS_THRESHOLD
    ) {
      rescueCountries.add(countryCode);
    }
  }

  const selectedSources = Array.from(activeByCountry.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .flatMap(([, countrySources]) => {
      if (forceFullCountryScan) {
        return [...countrySources].sort((a, b) =>
          a.handle.localeCompare(b.handle),
        );
      }

      return pickSourcesForRun(countrySources);
    });

  let currentPosts = visiblePreviousFreshPosts;

  let countriesChecked = 0;
  let sourcesChecked = 0;
  let importedPosts = 0;
  let refreshedPosts = 0;
  let sourcesWithNewPosts = 0;
  let sourcesWithRefreshedPosts = 0;
  let sourceFailures = 0;
  let healedCorruptedSources = 0;
  let rescueBackfillSources = 0;

  const countryStats = new Map<
    CountryCode,
    {
      selected: number;
      checked: number;
      imported: number;
      refreshed: number;
      failures: number;
      rescue: number;
    }
  >();

  const getCountryStats = (countryCode: CountryCode) => {
    const existing = countryStats.get(countryCode);
    if (existing) return existing;

    const next = {
      selected: 0,
      checked: 0,
      imported: 0,
      refreshed: 0,
      failures: 0,
      rescue: rescueCountries.has(countryCode) ? 1 : 0,
    };

    countryStats.set(countryCode, next);
    return next;
  };

  for (const source of selectedSources) {
    getCountryStats(source.countryCode).selected += 1;
  }

  for (const [, countrySources] of activeByCountry) {
    const hasSelected = forceFullCountryScan
      ? countrySources.length > 0
      : pickSourcesForRun(countrySources).length > 0;

    if (hasSelected) {
      countriesChecked += 1;
    }
  }

  for (const source of selectedSources) {
    sourcesChecked += 1;
    getCountryStats(source.countryCode).checked += 1;

    try {
      const allowRescueBackfill = rescueCountries.has(source.countryCode);
      if (allowRescueBackfill) {
        rescueBackfillSources += 1;
      }

      const result = await syncSourcePosts(source, currentPosts, {
        allowRescueBackfill,
      });
      if (
        result.source.lastSeenPostId !== source.lastSeenPostId &&
        (source.lastSeenPostId || 0) > (result.source.lastSeenPostId || 0)
      ) {
        healedCorruptedSources += 1;
      }
      sourcesById.set(result.source.id, result.source);

      currentPosts = mergeSourcePosts({
        allPosts: currentPosts,
        source,
        nextSource: result.source,
        newPosts: result.newPosts,
        refreshedPosts: result.refreshedPosts,
      });

      if (result.newPosts.length > 0) {
        importedPosts += result.newPosts.length;
        sourcesWithNewPosts += 1;
        getCountryStats(source.countryCode).imported += result.newPosts.length;
      }

      if (result.refreshedCount > 0) {
        refreshedPosts += result.refreshedCount;
        sourcesWithRefreshedPosts += 1;
        getCountryStats(source.countryCode).refreshed += result.refreshedCount;
      }
    } catch (error) {
      sourceFailures += 1;
      getCountryStats(source.countryCode).failures += 1;
      console.error("rebuild source failed", source.handle, error);
    }
  }

  const posts = interleavePostsBySource(cleanupFeedPosts(currentPosts));

  const shouldKeepPreviousFeed =
    posts.length === 0 &&
    previousAllPosts.length > 0 &&
    activeSources.length > 0;

  // 🔥 НОВАЯ ЛОГИКА: если нет постов, но есть активные источники — НЕ УБИВАЕМ ФИД
  if (posts.length === 0 && activeSources.length > 0 && previousAllPosts.length === 0) {
    console.warn(
      `⚠️ SKIPPING empty feed write for ${normalizedCountry || 'all'}: activeSources=${activeSources.length}, no posts yet. Keeping previous feed.`
    );
    
    // Сохраняем старый фид, если он был
    if (previousAllPosts.length > 0) {
      await writeFeedFile(previousAllPosts, { reason: normalizedCountry ? `country:${normalizedCountry}-skipped` : undefined });
      return {
        updatedAt: new Date().toISOString(),
        posts: previousAllPosts,
        countriesChecked,
        activeCountries: activeByCountry.size,
        selectedSources: selectedSources.length,
        sourcesChecked,
        importedPosts,
        refreshedPosts,
        removedPosts: 0,
        existingFreshPostsCount: previousAllPosts.length,
        sourcesWithNewPosts,
        sourcesWithRefreshedPosts,
        sourceFailures,
        healedCorruptedSources,
        rescueBackfillSources,
        rescueCountries: Array.from(rescueCountries).sort(),
        countrySummary: Object.fromEntries(
          Array.from(countryStats.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([countryCode, stats]) => [countryCode, stats]),
        ),
        keptPreviousFeed: true,
        skipped: true,
        skipReason: "no_posts_yet_keeping_previous",
      };
    }
    
    // Если фид был пустой и остался пустой
    await writeFeedFile([], { allowEmpty: true, reason: normalizedCountry ? `country:${normalizedCountry}-empty` : undefined });
    return {
      updatedAt: new Date().toISOString(),
      posts: [],
      countriesChecked,
      activeCountries: activeByCountry.size,
      selectedSources: selectedSources.length,
      sourcesChecked,
      importedPosts,
      refreshedPosts,
      removedPosts: 0,
      existingFreshPostsCount: 0,
      sourcesWithNewPosts,
      sourcesWithRefreshedPosts,
      sourceFailures,
      healedCorruptedSources,
      rescueBackfillSources,
      rescueCountries: Array.from(rescueCountries).sort(),
      countrySummary: Object.fromEntries(
        Array.from(countryStats.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([countryCode, stats]) => [countryCode, stats]),
      ),
      keptPreviousFeed: false,
      skipped: true,
      skipReason: "no_posts_and_no_previous_feed",
    };
  }

  const publishedPosts = shouldKeepPreviousFeed ? previousAllPosts : posts;

  if (
    posts.length === 0 &&
    activeSources.length > 0 &&
    previousAllPosts.length === 0
  ) {
    console.error(
      `Refusing to publish empty feed: activeSources=${activeSources.length}, selectedSources=${selectedSources.length}, sourcesChecked=${sourcesChecked}, sourceFailures=${sourceFailures}`,
    );
    throw new Error(
      `Refusing to publish empty feed: activeSources=${activeSources.length}, selectedSources=${selectedSources.length}, sourcesChecked=${sourcesChecked}, sourceFailures=${sourceFailures}`,
    );
  }

  await writeFeedFile(publishedPosts, { reason: normalizedCountry ? `country:${normalizedCountry}` : undefined });

  // 🔥 ГЛАВНОЕ ИСПРАВЛЕНИЕ: сохраняем ВСЕ источники, а не только те, что обработали
  const finalSources = allSources.map(source => 
    sourcesById.get(source.id) || source
  );
  await writeSourcesFile(sortSources(finalSources));

  return {
    updatedAt: new Date().toISOString(),
    posts: publishedPosts,
    countriesChecked,
    activeCountries: activeByCountry.size,
    selectedSources: selectedSources.length,
    sourcesChecked,
    importedPosts,
    refreshedPosts,
    removedPosts: Math.max(
      0,
      previousFreshPosts.length - publishedPosts.length,
    ),
    existingFreshPostsCount: publishedPosts.length,
    sourcesWithNewPosts,
    sourcesWithRefreshedPosts,
    sourceFailures,
    healedCorruptedSources,
    rescueBackfillSources,
    rescueCountries: Array.from(rescueCountries).sort(),
    countrySummary: Object.fromEntries(
      Array.from(countryStats.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([countryCode, stats]) => [countryCode, stats]),
    ),
    keptPreviousFeed: shouldKeepPreviousFeed,
  };
}