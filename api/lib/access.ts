import { redis } from "./kv.js";

export type AccessRole = "user" | "channel_owner" | "admin";
export type AccessPlan = "free" | "pro_1m" | "pro_3m" | "pro_12m";

export type AccessGrant = {
  telegramUserId: string;
  username: string | null;
  role: AccessRole;
  plan: AccessPlan;
  note: string | null;
  grantedBy: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  isActive: boolean;
};

const ACCESS_LIST_KEY = "margelet:access:list";
const ACCESS_KEY_PREFIX = "margelet:access:";

function accessKey(telegramUserId: string) {
  return `${ACCESS_KEY_PREFIX}${telegramUserId}`;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function isRole(value: unknown): value is AccessRole {
  return value === "user" || value === "channel_owner" || value === "admin";
}

function isPlan(value: unknown): value is AccessPlan {
  return (
    value === "free" ||
    value === "pro_1m" ||
    value === "pro_3m" ||
    value === "pro_12m"
  );
}

function normalizeAccessGrant(raw: unknown): AccessGrant | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;
  const telegramUserId = asString(record.telegramUserId);
  const role = isRole(record.role) ? record.role : "user";
  const plan = isPlan(record.plan) ? record.plan : "free";
  const expiresAt = asString(record.expiresAt);
  const now = Date.now();
  const expiresAtMs = expiresAt ? Date.parse(expiresAt) : NaN;
  const expired = Number.isFinite(expiresAtMs) ? expiresAtMs < now : false;

  if (!telegramUserId) return null;

  return {
    telegramUserId,
    username: asString(record.username),
    role,
    plan,
    note: asString(record.note),
    grantedBy: asString(record.grantedBy),
    createdAt: asString(record.createdAt) || new Date().toISOString(),
    updatedAt: asString(record.updatedAt) || new Date().toISOString(),
    expiresAt,
    isActive: !expired,
  };
}

export async function getAccessGrant(
  telegramUserId: string
): Promise<AccessGrant | null> {
  const raw = await redis.get(accessKey(telegramUserId));
  return normalizeAccessGrant(raw);
}

export async function saveAccessGrant(
  grant: Omit<AccessGrant, "isActive">
): Promise<AccessGrant> {
  const normalized: AccessGrant = {
    ...grant,
    isActive: !grant.expiresAt || Date.parse(grant.expiresAt) > Date.now(),
  };

  await redis.set(accessKey(grant.telegramUserId), {
    telegramUserId: normalized.telegramUserId,
    username: normalized.username,
    role: normalized.role,
    plan: normalized.plan,
    note: normalized.note,
    grantedBy: normalized.grantedBy,
    createdAt: normalized.createdAt,
    updatedAt: normalized.updatedAt,
    expiresAt: normalized.expiresAt,
  });

  await redis.lrem(ACCESS_LIST_KEY, 0, grant.telegramUserId);
  await redis.lpush(ACCESS_LIST_KEY, grant.telegramUserId);

  return normalized;
}

export async function listAccessGrants(limit = 300): Promise<AccessGrant[]> {
  const ids = await redis.lrange<string | number>(ACCESS_LIST_KEY, 0, limit - 1);

  if (!ids || ids.length === 0) {
    return [];
  }

  const items = await Promise.all(
    ids.map(async (rawId) => {
      const telegramUserId =
        typeof rawId === "string" || typeof rawId === "number"
          ? String(rawId)
          : "";

      if (!telegramUserId) return null;
      return getAccessGrant(telegramUserId);
    })
  );

  return items.filter((item): item is AccessGrant => !!item);
}

export async function deleteAccessGrant(telegramUserId: string) {
  await redis.del(accessKey(telegramUserId));
  await redis.lrem(ACCESS_LIST_KEY, 0, telegramUserId);
}