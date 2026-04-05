import { getPostByUrl, savePost } from "./kv.js";
import { listSourcesToPoll, touchSourceAfterPoll } from "./sources.js";
import { ingestTelegramPost, parseTelegramPostUrl } from "../../src/lib/telegram.js";
import type { IngestedPost } from "../../src/types/app.js";
import type { TrustedSource } from "../../src/screens/admin/admin.types.js";

const POLLER_LOCK_KEY = "margelet:sources:poller:lock";
const POLLER_RUN_EVERY_MS = 5 * 60 * 1000; // не чаще чем раз в 5 минут
const SOURCES_PER_RUN = 3;
const POSTS_PER_SOURCE = 5;

function getBaseOrigin() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "https://www.margelet.space";
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

  return asArrayUniqueDesc(ids).slice(0, POSTS_PER_SOURCE);
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
    id: Date.now() + Math.floor(Math.random() * 1000),
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

    const newIds = ids.filter((id) => id > lastSeen).sort((a, b) => a - b);

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

async function shouldRunPoller() {
  const raw = await fetch(`${getBaseOrigin()}/api/access`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ping: true }),
  }).catch(() => null);

  void raw;

  return true;
}

export async function runTrustedSourcesPolling() {
  try {
    const lastRunRaw = await (await import("./kv.js")).redis.get(POLLER_LOCK_KEY);
    const lastRunMs =
      typeof lastRunRaw === "number"
        ? lastRunRaw
        : typeof lastRunRaw === "string" && lastRunRaw.trim()
          ? Number(lastRunRaw)
          : 0;

    const now = Date.now();

    if (Number.isFinite(lastRunMs) && lastRunMs > 0) {
      if (now - lastRunMs < POLLER_RUN_EVERY_MS) {
        return;
      }
    }

    await (await import("./kv.js")).redis.set(POLLER_LOCK_KEY, String(now), {
      ex: Math.ceil(POLLER_RUN_EVERY_MS / 1000),
    });

    const canRun = await shouldRunPoller();
    if (!canRun) return;

    const sources = await listSourcesToPoll(SOURCES_PER_RUN);

    for (const source of sources) {
      await pollOneSource(source);
    }
  } catch (error) {
    console.error("runTrustedSourcesPolling error", error);
  }
}