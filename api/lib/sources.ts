import { getPostByUrl, savePost, redis } from "./kv.js";
import type { ContentTag } from "../../src/types/app.js";
import type { CountryCode } from "../../src/screens/admin/admin.countries.js";
import type { TrustedSource } from "../../src/screens/admin/admin.types.js";
import { ingestTelegramPost, parseTelegramPostUrl } from "../../src/lib/telegram.js";
import type { IngestedPost } from "../../src/types/app.js";

const SOURCES_IDS_KEY = "margelet:sources:ids";
const SOURCE_KEY_PREFIX = "margelet:source:";

const POLLER_LOCK_KEY = "margelet:sources:poller:lock";
const POLLER_RUN_EVERY_MS = 30 * 1000;
const POLLER_LOCK_TTL_SECONDS = 25;
const SOURCES_PER_RUN = 40;
const POSTS_PER_SOURCE_SCAN = 12;
const MAX_NEW_POSTS_PER_SOURCE = 3;
const SOURCE_CONCURRENCY = 6;

function sourceKey(id: string) {
  return `${SOURCE_KEY_PREFIX}${id}`;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function isStatus(value: unknown): value is TrustedSource["status"] {
  return value === "active" || value === "paused";
}

function normalizeHandle(handle: string) {
  return handle.replace(/^@/, "").trim().toLowerCase();
}

function buildSourceId(countryCode: CountryCode, handle: string) {
  return `${countryCode}:${normalizeHandle(handle)}`;
}

function normalizeSource(raw: unknown): TrustedSource | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;

  const id = asString(record.id);
  const countryCode = asString(record.countryCode) as CountryCode | null;
  const handle = asString(record.handle);
  const title = asString(record.title);
  const defaultTag = asString(record.defaultTag) as ContentTag | null;
  const status = isStatus(record.status) ? record.status : null;

  if (!id || !countryCode || !handle || !title || !defaultTag || !status) {
    return null;
  }

  return {
    id,
    countryCode,
    handle: normalizeHandle(handle),
    title,
    defaultTag,
    status,
    note: asString(record.note),
    createdAt: asString(record.createdAt) || new Date().toISOString(),
    updatedAt: asString(record.updatedAt) || new Date().toISOString(),
    lastCheckedAt: asString(record.lastCheckedAt),
    lastImportedAt: asString(record.lastImportedAt),
    lastSeenPostId: asNumber(record.lastSeenPostId),
    importedPostsCount: asNumber(record.importedPostsCount) || 0,
  };
}

async function getAllSourceIds(): Promise<string[]> {
  const ids = await redis.lrange<string>(SOURCES_IDS_KEY, 0, -1);

  if (!ids || ids.length === 0) {
    return [];
  }

  return Array.from(
    new Set(
      ids
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter(Boolean)
    )
  );
}

export async function listSources(limit = 1000): Promise<TrustedSource[]> {
  const ids = await getAllSourceIds();

  if (ids.length === 0) {
    return [];
  }

  const limitedIds = ids.slice(0, Math.max(0, limit));

  const items = await Promise.all(
    limitedIds.map(async (id) => {
      const raw = await redis.get(sourceKey(id));
      return normalizeSource(raw);
    })
  );

  return items
    .filter((item): item is TrustedSource => !!item)
    .sort((a, b) => {
      if (a.countryCode !== b.countryCode) {
        return a.countryCode.localeCompare(b.countryCode);
      }
      return a.handle.localeCompare(b.handle);
    });
}

export async function listSourcesToPoll(limit = 5): Promise<TrustedSource[]> {
  const ids = await getAllSourceIds();

  if (ids.length === 0) {
    return [];
  }

  const scored: Array<{ id: string; ts: number }> = [];

  for (const id of ids) {
    const raw = await redis.get(sourceKey(id));
    const source = normalizeSource(raw);

    if (!source || source.status !== "active") {
      continue;
    }

    const ts = Date.parse(source.lastCheckedAt || source.createdAt || "") || 0;
    scored.push({ id, ts });
  }

  const pickedIds = scored
    .sort((a, b) => a.ts - b.ts)
    .slice(0, Math.max(0, limit))
    .map((item) => item.id);

  if (pickedIds.length === 0) {
    return [];
  }

  const items = await Promise.all(
    pickedIds.map(async (id) => {
      const raw = await redis.get(sourceKey(id));
      return normalizeSource(raw);
    })
  );

  return items.filter((item): item is TrustedSource => !!item);
}

export async function getSourceById(id: string): Promise<TrustedSource | null> {
  const raw = await redis.get(sourceKey(id));
  return normalizeSource(raw);
}

export async function saveSource(
  input: Omit<TrustedSource, "id" | "createdAt" | "updatedAt"> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  }
): Promise<TrustedSource> {
  const id = input.id || buildSourceId(input.countryCode, input.handle);
  const nowIso = new Date().toISOString();

  const existing = await getSourceById(id);

  const source: TrustedSource = {
    id,
    countryCode: input.countryCode,
    handle: normalizeHandle(input.handle),
    title: input.title.trim(),
    defaultTag: input.defaultTag,
    status: input.status,
    note: input.note || null,
    createdAt: existing?.createdAt || input.createdAt || nowIso,
    updatedAt: input.updatedAt || nowIso,
    lastCheckedAt:
      input.lastCheckedAt !== undefined
        ? input.lastCheckedAt
        : existing?.lastCheckedAt || null,
    lastImportedAt:
      input.lastImportedAt !== undefined
        ? input.lastImportedAt
        : existing?.lastImportedAt || null,
    lastSeenPostId:
      typeof input.lastSeenPostId === "number"
        ? input.lastSeenPostId
        : existing?.lastSeenPostId ?? null,
    importedPostsCount:
      typeof input.importedPostsCount === "number"
        ? input.importedPostsCount
        : existing?.importedPostsCount ?? 0,
  };

  await redis.set(sourceKey(id), source);
  await redis.lrem(SOURCES_IDS_KEY, 0, id);
  await redis.lpush(SOURCES_IDS_KEY, id);

  return source;
}

export async function touchSourceAfterPoll(
  source: TrustedSource,
  payload: {
    lastCheckedAt: string;
    lastImportedAt?: string | null;
    lastSeenPostId?: number | null;
    importedPostsCountDelta?: number;
  }
): Promise<TrustedSource> {
  return saveSource({
    id: source.id,
    countryCode: source.countryCode,
    handle: source.handle,
    title: source.title,
    defaultTag: source.defaultTag,
    status: source.status,
    note: source.note,
    createdAt: source.createdAt,
    updatedAt: new Date().toISOString(),
    lastCheckedAt: payload.lastCheckedAt,
    lastImportedAt:
      payload.lastImportedAt !== undefined
        ? payload.lastImportedAt
        : source.lastImportedAt,
    lastSeenPostId:
      payload.lastSeenPostId !== undefined
        ? payload.lastSeenPostId
        : source.lastSeenPostId,
    importedPostsCount:
      (source.importedPostsCount || 0) + (payload.importedPostsCountDelta || 0),
  });
}

export async function deleteSourceById(id: string): Promise<boolean> {
  const existing = await getSourceById(id);
  if (!existing) return false;

  await redis.del(sourceKey(id));
  await redis.lrem(SOURCES_IDS_KEY, 0, id);

  return true;
}

export function makeSourceId(countryCode: CountryCode, handle: string) {
  return buildSourceId(countryCode, handle);
}

function buildCanonicalPostUrl(handle: string, postId: number) {
  return `https://t.me/${handle}/${postId}?single`;
}

function asArrayUniqueDesc(values: number[]) {
  return Array.from(new Set(values)).sort((a, b) => b - a);
}

async function fetchChannelHtml(handle: string) {
  const url = `https://t.me/s/${handle}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,ru;q=0.8",
      Referer: "https://t.me/",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch channel ${handle}: ${res.status}`);
  }

  return res.text();
}

function extractLatestPostIds(handle: string, html: string): number[] {
  const escapedHandle = handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`data-post="${escapedHandle}\\/([0-9]+)"`, "gi");

  const ids: number[] = [];
  let match: RegExpExecArray | null = null;

  while ((match = regex.exec(html))) {
    const id = Number(match[1]);
    if (Number.isFinite(id)) {
      ids.push(id);
    }
  }

  return asArrayUniqueDesc(ids).slice(0, POSTS_PER_SOURCE_SCAN);
}

function buildAutoImportedPost(
  source: TrustedSource,
  ingest: NonNullable<Awaited<ReturnType<typeof ingestTelegramPost>>>,
  normalizedUrl: string
): IngestedPost {
  const ttlHours = 24;
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + ttlHours * 3600 * 1000).toISOString();

  return {
    id: Date.now() + Math.floor(Math.random() * 100000),
    postUrl: normalizedUrl,
    source: {
      handle: ingest.source.handle,
      title: ingest.source.title,
      avatar: ingest.source.avatar,
      verified: ingest.source.verified,
    },
    text: ingest.text,
    links: ingest.links,
    contentType: ingest.contentType,
    media: ingest.media,
    hasMediaInOriginal: ingest.hasMediaInOriginal,
    fallbackReason: ingest.fallbackReason,
    createdAt: nowIso,
    expiresAt,
    ttlHours,
    mediaRefreshedAt: nowIso,
    tag: source.defaultTag,
    addedBy: {
      telegramId: "1372669404",
      username: "admin",
    },
    billing: {
      plan: "free",
      autopublishEnabled: false,
    },
    status: "published",
    role: "admin",
  };
}

async function importPostFromSource(source: TrustedSource, postId: number) {
  const url = buildCanonicalPostUrl(source.handle, postId);
  const parsed = parseTelegramPostUrl(url);

  if (!parsed) {
    return false;
  }

  const normalizedUrl = parsed.normalizedUrl;
  const existing = await getPostByUrl(normalizedUrl);

  if (existing) {
    return false;
  }

  const ingest = await ingestTelegramPost(normalizedUrl);
  if (!ingest) {
    return false;
  }

  const post = buildAutoImportedPost(source, ingest, normalizedUrl);
  await savePost(post);

  return true;
}

async function pollOneSource(source: TrustedSource) {
  const checkedAt = new Date().toISOString();

  try {
    const html = await fetchChannelHtml(source.handle);
    const ids = extractLatestPostIds(source.handle, html);

    if (ids.length === 0) {
      await touchSourceAfterPoll(source, {
        lastCheckedAt: checkedAt,
      });
      return;
    }

    const newestSeen = Math.max(...ids);
    const lastSeen = source.lastSeenPostId || 0;

    // 🔥 Первый запуск: просто запоминаем верхний postId и не тащим историю
    if (lastSeen <= 0) {
      await touchSourceAfterPoll(source, {
        lastCheckedAt: checkedAt,
        lastSeenPostId: newestSeen,
      });
      return;
    }

    const newIds = ids
      .filter((id) => id > lastSeen)
      .sort((a, b) => a - b)
      .slice(-MAX_NEW_POSTS_PER_SOURCE);

    let imported = 0;
    let lastImportedAt: string | null = null;

    for (const postId of newIds) {
      const ok = await importPostFromSource(source, postId);
      if (ok) {
        imported += 1;
        lastImportedAt = new Date().toISOString();
      }
    }

    await touchSourceAfterPoll(source, {
      lastCheckedAt: checkedAt,
      lastImportedAt: lastImportedAt ?? source.lastImportedAt,
      lastSeenPostId: Math.max(newestSeen, lastSeen),
      importedPostsCountDelta: imported,
    });
  } catch (error) {
    console.error("pollOneSource error", source.handle, error);

    await touchSourceAfterPoll(source, {
      lastCheckedAt: checkedAt,
    });
  }
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
) {
  if (items.length === 0) return;

  let currentIndex = 0;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = currentIndex;
      currentIndex += 1;

      if (index >= items.length) {
        return;
      }

      await worker(items[index]);
    }
  });

  await Promise.all(runners);
}

async function tryAcquirePollerLock() {
  const now = Date.now();
  const lastRunRaw = await redis.get(POLLER_LOCK_KEY);

  const lastRunMs =
    typeof lastRunRaw === "number"
      ? lastRunRaw
      : typeof lastRunRaw === "string" && lastRunRaw.trim()
        ? Number(lastRunRaw)
        : 0;

  if (Number.isFinite(lastRunMs) && lastRunMs > 0) {
    if (now - lastRunMs < POLLER_RUN_EVERY_MS) {
      return false;
    }
  }

  await redis.set(POLLER_LOCK_KEY, String(now), {
    ex: POLLER_LOCK_TTL_SECONDS,
  });

  return true;
}

export async function runTrustedSourcesPolling() {
  try {
    const acquired = await tryAcquirePollerLock();
    if (!acquired) {
      return;
    }

    const sources = await listSourcesToPoll(SOURCES_PER_RUN);

    if (!Array.isArray(sources) || sources.length === 0) {
      return;
    }

    await runWithConcurrency(sources, SOURCE_CONCURRENCY, async (source) => {
      await pollOneSource(source);
    });
  } catch (error) {
    console.error("runTrustedSourcesPolling error", error);
  }
}