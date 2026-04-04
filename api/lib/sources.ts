import { redis } from "./kv.js";
import type { ContentTag } from "../../src/types/app.js";
import type { CountryCode } from "../../src/screens/admin/admin.countries.js";
import type { TrustedSource } from "../../src/screens/admin/admin.types.js";

const SOURCES_IDS_KEY = "margelet:sources:ids";
const SOURCE_KEY_PREFIX = "margelet:source:";

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

export async function listSources(limit = 1000): Promise<TrustedSource[]> {
  const ids = await redis.lrange<string>(SOURCES_IDS_KEY, 0, limit - 1);

  if (!ids || ids.length === 0) {
    return [];
  }

  const uniqueIds = Array.from(
    new Set(
      ids
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter(Boolean)
    )
  );

  const items = await Promise.all(
    uniqueIds.map(async (id) => {
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
    lastCheckedAt: input.lastCheckedAt || existing?.lastCheckedAt || null,
    lastImportedAt: input.lastImportedAt || existing?.lastImportedAt || null,
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