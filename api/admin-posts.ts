import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  readAllCountryFeedPosts,
  readFeedFile,
  readSourcesFile,
  writeFeedFile,
  writeSourcesFile,
  readReportsFile,
  writeReportsFile,
  type ModerationReport,
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

function readNullableStringPatch(
  body: Record<string, unknown>,
  key: string,
  fallback: string | null | undefined
) {
  if (Object.prototype.hasOwnProperty.call(body, key)) {
    return asString(body[key]) || null;
  }

  return fallback || null;
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


const SOURCE_TAG_PARENT_BY_CHILD: Record<string, string> = {
  news_all: "news",
  news_world: "news",
  news_breaking: "news",
  news_regions: "news",
  news_incidents: "news",
  politics_opinion: "politics",
  politics_government: "politics",
  politics_elections: "politics",
  war: "politics",
  business_all: "business",
  finance_all: "finance",
  finance_banks: "finance",
  finance_payment_systems: "finance",
  finance_investing: "finance",
  finance_trading: "finance",
  crypto: "finance",
  technology_all: "technology",
  technology_software: "technology",
  technology_dev: "technology",
  technology_web: "technology",
  internet: "technology",
  gadgets: "technology",
  ai: "technology",
  education_courses: "education",
  education_self: "education",
  cinema: "culture",
  series: "culture",
  music: "culture",
  memes: "humor",
  recipes: "food",
  food_products: "food",
  people_blogs: "people",
  people_interviews: "people",
  marketing_smm: "marketing",
  transport_auto: "auto",
  transport_moto: "auto",
  transport_other: "auto",
  transport_reviews: "auto",
  telegram_channels: "telegram",
  telegram_ton: "telegram",
  telegram_bots: "telegram",
  other_misc: "other",
};

function normalizeSourceTagText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, " ")
    .replace(/[^a-zа-я0-9_]+/gi, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeSourceTag(value: unknown): string {
  const raw = asString(value);
  if (!raw) return "";
  const normalized = normalizeSourceTagText(raw);
  const aliases: Record<string, string> = {
    технологии: "technology",
    technology: "technology",
    tech: "technology",
    it: "technology",
    софт: "technology_software",
    software: "technology_software",
    электроника: "technology",
    гаджеты: "gadgets",
    авто: "transport_auto",
    автомобили: "transport_auto",
    машины: "transport_auto",
    транспорт: "auto",
    auto: "transport_auto",
    cars: "transport_auto",
    маркетинг: "marketing",
    business: "business",
    бизнес: "business",
    финансы: "finance",
    finance: "finance",
    крипта: "crypto",
    crypto: "crypto",
    новости: "news",
    news: "news",
    политика: "politics",
    politics: "politics",
    образование: "education",
    мотивация: "education_self",
    культура: "culture",
    кино: "cinema",
    фильмы: "cinema",
    сериалы: "series",
    природа: "nature",
    животные: "animals",
    еда: "food",
    рецепты: "recipes",
    разное: "other",
    другое: "other",
    other_misc: "other",
  };
  return aliases[normalized] || normalized;
}

function normalizeTags(value: unknown, fallback: ContentTag): ContentTag[] {
  const rawTags = Array.isArray(value)
    ? value.map(normalizeSourceTag).filter(Boolean)
    : [];

  const normalizedFallback = normalizeSourceTag(fallback) || "other";
  const tags = rawTags.length ? rawTags : [normalizedFallback];
  const result: string[] = [];
  const used = new Set<string>();

  const add = (tag: string) => {
    const normalized = normalizeSourceTag(tag);
    if (!normalized || used.has(normalized)) return;
    used.add(normalized);
    result.push(normalized);
  };

  for (const tag of tags) {
    add(tag);
    const parent = SOURCE_TAG_PARENT_BY_CHILD[normalizeSourceTag(tag)];
    if (parent) add(parent);
  }

  return (result.length ? result : ["other"]) as ContentTag[];
}
function buildSource(body: Record<string, unknown>, existing?: StoredSource | null): StoredSource | null {
  const handle = normalizeHandle(body.handle ?? existing?.handle);
  if (!handle) return null;

  const countryCode = normalizeCountryCode(
    body.countryCode ?? existing?.countryCode
  ) as StoredSource["countryCode"];
  const defaultTag =
    (asString(body.defaultTag, existing?.defaultTag || "other") as ContentTag) || "other";
  const now = new Date().toISOString();

  const idFromBody = asString(body.id);
  const shouldRekey =
    existing &&
    (existing.countryCode !== countryCode || existing.handle.toLowerCase() !== handle);
  const id = shouldRekey
    ? `${countryCode}:${handle}`
    : idFromBody || existing?.id || `${countryCode}:${handle}`;

  return {
    id,
    countryCode,
    handle,
    title: asString(body.title) || existing?.title || handle,
    avatarUrl: readNullableStringPatch(body, "avatarUrl", existing?.avatarUrl),
    avatarOverride: readNullableStringPatch(body, "avatarOverride", existing?.avatarOverride),
    verified:
      typeof body.verified === "boolean" ? Boolean(body.verified) : Boolean(existing?.verified),
    defaultTag,
    tags: normalizeTags(body.tags ?? existing?.tags, defaultTag),
    status: (() => {
      const nextStatus = asString(body.status, existing?.status || "active");
      return nextStatus === "paused" || nextStatus === "blocked" ? nextStatus : "active";
    })(),
    note: asString(body.note) || existing?.note || null,
    createdAt: asString(body.createdAt) || existing?.createdAt || now,
    updatedAt: now,
    lastCheckedAt: asString(body.lastCheckedAt) || existing?.lastCheckedAt || null,
    lastImportedAt: asString(body.lastImportedAt) || existing?.lastImportedAt || null,
    lastSeenPostId: asNumber(body.lastSeenPostId) ?? existing?.lastSeenPostId ?? null,
    importedPostsCount:
      typeof body.importedPostsCount === "number"
        ? body.importedPostsCount
        : existing?.importedPostsCount || 0,
    lastRefreshCursorPostId:
      asNumber(body.lastRefreshCursorPostId) ?? existing?.lastRefreshCursorPostId ?? null,
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

async function readSourcesState() {
  const sourcesFile = await readSourcesFile<StoredSource>();
  const current = Array.isArray(sourcesFile.sources) ? sourcesFile.sources : [];

  return current;
}

function buildSourcesSummary(items: StoredSource[]) {
  const countsByCountry: Record<string, number> = {};
  const activeCountsByCountry: Record<string, number> = {};
  const pausedCountsByCountry: Record<string, number> = {};
  const blockedCountsByCountry: Record<string, number> = {};
  let total = 0;
  let active = 0;
  let paused = 0;
  let blocked = 0;

  for (const source of items) {
    const country = normalizeCountryCode(source.countryCode);
    if (!country) continue;

    total += 1;
    countsByCountry[country] = (countsByCountry[country] || 0) + 1;

    if (source.status === "active") {
      active += 1;
      activeCountsByCountry[country] = (activeCountsByCountry[country] || 0) + 1;
    } else if (source.status === "blocked") {
      blocked += 1;
      blockedCountsByCountry[country] = (blockedCountsByCountry[country] || 0) + 1;
    } else {
      paused += 1;
      pausedCountsByCountry[country] = (pausedCountsByCountry[country] || 0) + 1;
    }
  }

  return {
    total,
    active,
    paused,
    blocked,
    countsByCountry,
    activeCountsByCountry,
    pausedCountsByCountry,
    blockedCountsByCountry,
  };
}

async function listSources(requestedCountryCode: string) {
  const current = await readSourcesState();

  return {
    sources: sortSources(
      current.filter(
        (source) => !requestedCountryCode || source.countryCode === requestedCountryCode
      )
    ),
    summary: buildSourcesSummary(current),
  };
}

function getSourceAvatarForPosts(source: StoredSource) {
  return source.avatarOverride || source.avatarUrl || null;
}

function isPostFromSource(post: IngestedPost, source: StoredSource) {
  if (post.sourceId && post.sourceId === source.id) return true;

  return (
    post.source?.handle?.toLowerCase?.() === source.handle.toLowerCase() &&
    (!post.sourceCountryCode || post.sourceCountryCode === source.countryCode)
  );
}

async function applySourceAvatarToFeed(source: StoredSource) {
  const feedFile = await readFeedFile<IngestedPost>();
  const current = Array.isArray(feedFile.posts) ? feedFile.posts : [];
  const avatar = getSourceAvatarForPosts(source);
  let changed = false;

  const next = current.map((post) => {
    if (!isPostFromSource(post, source)) return post;
    if ((post.source.avatar || null) === avatar) return post;

    changed = true;
    return {
      ...post,
      source: {
        ...post.source,
        avatar,
      },
    };
  });

  if (changed) {
    await writeFeedFile(sortPosts(next));
  }
}

async function upsertSingleSource(sourcePatch: Record<string, unknown>) {
  const sourcesFile = await readSourcesFile<StoredSource>();
  const current = Array.isArray(sourcesFile.sources) ? sourcesFile.sources : [];

  const sourceId = asString(sourcePatch.id);
  const sourceHandle = normalizeHandle(sourcePatch.handle);
  const sourceCountryCode = normalizeCountryCode(sourcePatch.countryCode);

  const existingIndex = current.findIndex(
    (item) =>
      (sourceId && item.id === sourceId) ||
      (sourceHandle && item.handle === sourceHandle && item.countryCode === sourceCountryCode)
  );

  const existing = existingIndex >= 0 ? current[existingIndex] : null;
  const source = buildSource(sourcePatch, existing);
  if (!source) {
    throw new Error("Invalid source payload");
  }

  const next = [...current];

  if (existingIndex >= 0) {
    next[existingIndex] = source;
  } else {
    next.unshift(source);
  }

  await writeSourcesFile(sortSources(next));

  if (Object.prototype.hasOwnProperty.call(sourcePatch, "avatarOverride")) {
    await applySourceAvatarToFeed(source);
  }

  return { source, next };
}

async function bulkCreateSources(items: Record<string, unknown>[]) {
  const sourcesFile = await readSourcesFile<StoredSource>();
  const current = Array.isArray(sourcesFile.sources) ? sourcesFile.sources : [];
  const next = [...current];
  let created = 0;
  let updated = 0;

  for (const patch of items) {
    const sourceId = asString(patch.id);
    const sourceHandle = normalizeHandle(patch.handle);
    const sourceCountryCode = normalizeCountryCode(patch.countryCode);

    const existingIndex = next.findIndex(
      (item) =>
        (sourceId && item.id === sourceId) ||
        (sourceHandle && item.handle === sourceHandle && item.countryCode === sourceCountryCode)
    );

    const existing = existingIndex >= 0 ? next[existingIndex] : null;
    const source = buildSource(patch, existing);
    if (!source) continue;

    if (existingIndex >= 0) {
      next[existingIndex] = source;
      updated += 1;
    } else {
      next.unshift(source);
      created += 1;
    }
  }

  const sorted = sortSources(next);
  await writeSourcesFile(sorted);

  return {
    next: sorted,
    created,
    updated,
    summary: buildSourcesSummary(sorted),
  };
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

async function bulkDeleteSources(body: Record<string, unknown>) {
  const rawIds = Array.isArray(body.sourceIds) ? body.sourceIds : [];
  const ids = new Set(rawIds.map((item) => asString(item)).filter(Boolean));
  const countryCode = normalizeCountryCode(body.countryCode);

  if (ids.size === 0) {
    throw new Error("No sources selected");
  }

  const sourcesFile = await readSourcesFile<StoredSource>();
  const current = Array.isArray(sourcesFile.sources) ? sourcesFile.sources : [];

  const next = current.filter((item) => {
    if (!ids.has(item.id)) return true;
    if (countryCode && item.countryCode !== countryCode) return true;
    return false;
  });

  if (next.length === current.length) {
    throw new Error("Selected sources were not found");
  }

  await writeSourcesFile(sortSources(next));
  return next;
}

async function bulkUpdateSourcesStatus(body: Record<string, unknown>) {
  const rawIds = Array.isArray(body.sourceIds) ? body.sourceIds : [];
  const ids = new Set(rawIds.map((item) => asString(item)).filter(Boolean));
  const countryCode = normalizeCountryCode(body.countryCode);
  const rawStatus = asString(body.status, "active");
  const status = rawStatus === "paused" || rawStatus === "blocked" ? rawStatus : "active";

  if (ids.size === 0) {
    throw new Error("No sources selected");
  }

  const sourcesFile = await readSourcesFile<StoredSource>();
  const current = Array.isArray(sourcesFile.sources) ? sourcesFile.sources : [];
  const now = new Date().toISOString();
  let changed = 0;

  const next = current.map((item) => {
    if (!ids.has(item.id)) return item;
    if (countryCode && item.countryCode !== countryCode) return item;
    if (item.status === status) return item;
    changed += 1;
    return { ...item, status: status as StoredSource["status"], updatedAt: now };
  });

  if (changed === 0) {
    throw new Error("Selected sources were not changed");
  }

  await writeSourcesFile(sortSources(next));
  return next;
}

async function readCurrentFeedPosts() {
  const countryPosts = await readAllCountryFeedPosts<IngestedPost>();
  if (countryPosts.length > 0) return countryPosts;

  const feedFile = await readFeedFile<IngestedPost>();
  const legacyPosts = Array.isArray(feedFile.posts) ? feedFile.posts : [];
  if (legacyPosts.length > 0) return legacyPosts;

  throw new Error(
    "Delete blocked: feed snapshot is empty. Run rebuild first; refusing to overwrite feed with an empty snapshot."
  );
}

function readPostIds(body: Record<string, unknown>) {
  const ids = new Set<number>();
  const single = asNumber(body.id ?? body.postId);
  if (single !== null) ids.add(single);

  const rawIds = Array.isArray(body.ids)
    ? body.ids
    : Array.isArray(body.postIds)
      ? body.postIds
      : [];

  for (const value of rawIds) {
    const id = asNumber(value);
    if (id !== null) ids.add(id);
  }

  return ids;
}

function getPostSourceKey(post: IngestedPost) {
  const handle = normalizeHandle(post.source?.handle);
  const country = normalizeCountryCode(post.sourceCountryCode);
  return handle ? `${country || ""}:${handle}` : "";
}

function readSourceKeys(body: Record<string, unknown>) {
  const keys = new Set<string>();

  const push = (countryValue: unknown, handleValue: unknown) => {
    const handle = normalizeHandle(handleValue);
    if (!handle) return;
    const country = normalizeCountryCode(countryValue);
    keys.add(`${country || ""}:${handle}`);
  };

  push(body.sourceCountryCode ?? body.countryCode, body.sourceHandle ?? body.handle);

  const rawSources = Array.isArray(body.sources)
    ? body.sources
    : Array.isArray(body.sourceRefs)
      ? body.sourceRefs
      : Array.isArray(body.sourceHandles)
        ? body.sourceHandles
        : [];

  for (const item of rawSources) {
    if (typeof item === "string") {
      push(body.countryCode, item);
      continue;
    }

    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      push(record.countryCode ?? record.sourceCountryCode ?? body.countryCode, record.handle ?? record.sourceHandle);
    }
  }

  return keys;
}

async function deletePostsByIds(body: Record<string, unknown>) {
  const ids = readPostIds(body);
  if (ids.size === 0) {
    throw new Error("No posts selected");
  }

  const current = await readCurrentFeedPosts();
  const next = current.filter((item) => !ids.has(Number(item.id)));

  const deleted = current.length - next.length;
  if (deleted === 0) {
    // Старый кэш на клиенте мог показать пост, которого уже нет в актуальном снапшоте.
    // Для админа это не должно ломать UX: фронт всё равно скроет пост локально.
    return { posts: current, deleted: 0, notFound: ids.size };
  }

  await writeFeedFile(sortPosts(next), {
    reason: ids.size === 1 ? `deletePostById:${[...ids][0]}` : `bulkDeletePosts:${ids.size}`,
  });

  return { posts: next, deleted, notFound: 0 };
}

async function deletePostById(body: Record<string, unknown>) {
  const result = await deletePostsByIds(body);
  return result.posts;
}

async function bulkDeletePostsAndSources(body: Record<string, unknown>) {
  const ids = readPostIds(body);
  const requestedSourceKeys = readSourceKeys(body);

  if (ids.size === 0 && requestedSourceKeys.size === 0) {
    throw new Error("No posts or sources selected");
  }

  const currentPosts = await readCurrentFeedPosts();
  const selectedPosts = currentPosts.filter((post) => ids.has(Number(post.id)));

  const sourceKeys = new Set<string>(requestedSourceKeys);
  const sourceIds = new Set<string>();

  for (const post of selectedPosts) {
    const key = getPostSourceKey(post);
    if (key) sourceKeys.add(key);
    if (post.sourceId) sourceIds.add(String(post.sourceId));
  }

  const nextPosts = currentPosts.filter((post) => {
    if (ids.has(Number(post.id))) return false;
    const key = getPostSourceKey(post);
    return key ? !sourceKeys.has(key) : true;
  });

  const sourcesFile = await readSourcesFile<StoredSource>();
  const currentSources = Array.isArray(sourcesFile.sources) ? sourcesFile.sources : [];
  let blockedSources = 0;
  const now = new Date().toISOString();

  const nextSources = currentSources.map((source) => {
    const key = `${normalizeCountryCode(source.countryCode) || ""}:${normalizeHandle(source.handle)}`;
    const shouldBlock = sourceIds.has(source.id) || sourceKeys.has(key);
    if (!shouldBlock || source.status === "blocked") return source;
    blockedSources += 1;
    return {
      ...source,
      status: "blocked" as StoredSource["status"],
      note: source.note || "blocked by moderation",
      updatedAt: now,
    };
  });

  const deletedPosts = currentPosts.length - nextPosts.length;
  const missingPosts = Math.max(0, ids.size - selectedPosts.length);

  if (deletedPosts > 0) {
    await writeFeedFile(sortPosts(nextPosts), { reason: `bulkDeletePostsAndSources:${ids.size}` });
  }

  if (blockedSources > 0) {
    await writeSourcesFile(sortSources(nextSources));
  }

  return {
    posts: deletedPosts > 0 ? nextPosts : currentPosts,
    sources: nextSources,
    deletedPosts,
    blockedSources,
    deletedSources: 0,
    missingPosts,
  };
}

function normalizeReportReason(value: unknown) {
  const normalized = asString(value, "other").toLowerCase();
  return normalized || "other";
}

async function createReport(payload: Record<string, unknown>) {
  const postId = asNumber(payload.postId ?? payload.id);
  const sourceHandle = normalizeHandle(payload.sourceHandle ?? payload.handle) || null;
  const sourceTitle = asString(payload.sourceTitle) || null;
  const sourceCountryCode = normalizeCountryCode(payload.sourceCountryCode ?? payload.countryCode) || null;
  const reason = normalizeReportReason(payload.reason);
  const message = asString(payload.message) || null;
  const now = new Date().toISOString();

  if (postId === null && !sourceHandle) {
    throw new Error("Report needs postId or sourceHandle");
  }

  const file = await readReportsFile<ModerationReport>();
  const current = Array.isArray(file.reports) ? file.reports : [];
  const existingIndex = current.findIndex(
    (report) =>
      report.status === "open" &&
      report.postId === postId &&
      (report.sourceHandle || "") === (sourceHandle || "") &&
      report.reason === reason
  );

  const next = [...current];
  let report: ModerationReport;

  if (existingIndex >= 0) {
    report = {
      ...next[existingIndex],
      count: Math.max(1, Number(next[existingIndex].count || 1)) + 1,
      message: message || next[existingIndex].message || null,
      updatedAt: now,
    };
    next[existingIndex] = report;
  } else {
    report = {
      id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      postId,
      sourceHandle,
      sourceTitle,
      sourceCountryCode,
      reason,
      message,
      count: 1,
      status: "open",
      createdAt: now,
      updatedAt: now,
    };
    next.unshift(report);
  }

  await writeReportsFile(next.slice(0, 500));
  return { report, reports: next };
}

async function listReports() {
  const file = await readReportsFile<ModerationReport>();
  const reports = Array.isArray(file.reports) ? file.reports : [];
  return reports
    .filter((report) => report.status !== "resolved")
    .sort((a, b) => parseDateMs(b.updatedAt) - parseDateMs(a.updatedAt));
}

async function resolveReport(payload: Record<string, unknown>) {
  const reportId = asString(payload.reportId ?? payload.id);
  if (!reportId) throw new Error("No report selected");

  const file = await readReportsFile<ModerationReport>();
  const current = Array.isArray(file.reports) ? file.reports : [];
  const next = current.map((report) =>
    report.id === reportId
      ? { ...report, status: "resolved" as const, updatedAt: new Date().toISOString() }
      : report
  );

  await writeReportsFile(next);
  return next.filter((report) => report.status !== "resolved");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log("ENV CHECK:", {
    storageMode: process.env.MARGELET_STORAGE_MODE,
    hasGitHubToken: !!process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    method: req.method,
    bodyKeys: req.body ? Object.keys(req.body) : null,
  });  

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    const payload = body as Record<string, unknown>;
    const entity = asString(payload.entity);
    const action = asString(payload.action);
    const requestedCountryCode = asString(payload.countryCode).toLowerCase();

    if (entity === "reports" && req.method === "POST" && (!action || action === "create")) {
      const result = await createReport(payload);
      return res.status(200).json({ ok: true, report: result.report });
    }

    if (!isOwner(payload)) {
      return res.status(403).json({
        ok: false,
        error: "Access denied",
      });
    }

    if (req.method !== "POST" && req.method !== "DELETE") {
      res.setHeader("Allow", "POST, DELETE");
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    if (entity === "reports") {
      if (!action || action === "list") {
        const reports = await listReports();
        return res.status(200).json({ ok: true, reports });
      }

      if (action === "resolve") {
        const reports = await resolveReport(payload);
        return res.status(200).json({ ok: true, reports });
      }

      return res.status(400).json({ ok: false, error: "Unknown reports action" });
    }

    if (req.method === "DELETE") {
      if (entity === "sources") {
        const sources = await deleteSourceByIdentity(payload);
        return res.status(200).json({
          ok: true,
          sources: requestedCountryCode
            ? sources.filter((source) => source.countryCode === requestedCountryCode)
            : sources,
          sourceSummary: buildSourcesSummary(sources),
        });
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
        const result = await deletePostsByIds(payload);
        return res.status(200).json({ ok: true, posts: result.posts, deleted: result.deleted });
      }

      if (action === "bulk-delete") {
        const result = await deletePostsByIds(payload);
        return res.status(200).json({ ok: true, posts: result.posts, deleted: result.deleted });
      }

      if (action === "bulk-delete-posts-and-sources") {
        const result = await bulkDeletePostsAndSources(payload);
        return res.status(200).json({
          ok: true,
          posts: result.posts,
          sources: result.sources,
          deletedPosts: result.deletedPosts,
          deletedSources: result.deletedSources,
        });
      }

      return res.status(400).json({ ok: false, error: "Unknown posts action" });
    }

    if (entity === "sources") {
      if (!action || action === "list") {
        const result = await listSources(requestedCountryCode);
        return res.status(200).json({
          ok: true,
          sources: result.sources,
          sourceSummary: result.summary,
        });
      }

      if (action === "create" || action === "update") {
        const sourcePayload =
          payload.source && typeof payload.source === "object"
            ? (payload.source as Record<string, unknown>)
            : payload;

        const result = await upsertSingleSource(sourcePayload);
        const sourceCountry = normalizeCountryCode(result.source.countryCode);
        return res.status(200).json({
          ok: true,
          source: result.source,
          sources: sortSources(result.next.filter((source) => source.countryCode === sourceCountry)),
          sourceSummary: buildSourcesSummary(result.next),
        });
      }

      if (action === "bulk-create") {
        const rawSources = Array.isArray(payload.sources) ? payload.sources : [];
        const prepared = rawSources.filter(
          (item): item is Record<string, unknown> => Boolean(item) && typeof item === "object"
        );

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
          totalSources: result.next.length,
          sourceSummary: result.summary,
        });
      }

      if (action === "delete") {
        const sources = await deleteSourceByIdentity(payload);
        return res.status(200).json({
          ok: true,
          sources: requestedCountryCode
            ? sources.filter((source) => source.countryCode === requestedCountryCode)
            : sources,
          sourceSummary: buildSourcesSummary(sources),
        });
      }

      if (action === "bulk-status") {
        const sources = await bulkUpdateSourcesStatus(payload);
        return res.status(200).json({
          ok: true,
          sources: requestedCountryCode
            ? sources.filter((source) => source.countryCode === requestedCountryCode)
            : sources,
          sourceSummary: buildSourcesSummary(sources),
        });
      }

      if (action === "bulk-delete") {
        const sources = await bulkDeleteSources(payload);
        return res.status(200).json({
          ok: true,
          sources: requestedCountryCode
            ? sources.filter((source) => source.countryCode === requestedCountryCode)
            : sources,
          sourceSummary: buildSourcesSummary(sources),
        });
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
