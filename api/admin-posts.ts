import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  readAllCountryFeedPosts,
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
    status: asString(body.status, existing?.status || "active") === "paused" ? "paused" : "active",
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
  let total = 0;
  let active = 0;

  for (const source of items) {
    const country = normalizeCountryCode(source.countryCode);
    if (!country) continue;

    total += 1;
    countsByCountry[country] = (countsByCountry[country] || 0) + 1;

    if (source.status === "active") {
      active += 1;
      activeCountsByCountry[country] = (activeCountsByCountry[country] || 0) + 1;
    }
  }

  return {
    total,
    active,
    countsByCountry,
    activeCountsByCountry,
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

async function deletePostById(body: Record<string, unknown>) {
  const id = asNumber(body.id);
  if (id === null) {
    throw new Error("Invalid post id");
  }

  const countryPosts = await readAllCountryFeedPosts<IngestedPost>();
  const feedFile = await readFeedFile<IngestedPost>();
  const legacyPosts = Array.isArray(feedFile.posts) ? feedFile.posts : [];
  const current = countryPosts;

  if (!current.length) {
    throw new Error(
      "Delete blocked: feed index has no country posts. Run rebuild first; refusing to overwrite feed with an empty snapshot."
    );
  }

  const next = current.filter((item) => Number(item.id) !== id);

  if (next.length === current.length) {
    throw new Error("Post not found in feed snapshot");
  }

  await writeFeedFile(sortPosts(next), { reason: `deletePostById:${id}` });
  return next;
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
        const posts = await deletePostById(payload);
        return res.status(200).json({ ok: true, posts });
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
