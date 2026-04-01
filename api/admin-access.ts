import {
  deleteAccessGrant,
  getAccessGrant,
  listAccessGrants,
  saveAccessGrant,
  type AccessPlan,
  type AccessRole,
} from "./lib/access.js";

const ADMIN_TELEGRAM_IDS = new Set(["1372669404"]);

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNullableString(value: unknown): string | null {
  const v = asString(value);
  return v || null;
}

function asPositiveNumber(value: unknown): number | null {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
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

function isAdmin(telegramUserId: string) {
  return ADMIN_TELEGRAM_IDS.has(telegramUserId);
}

function setNoIndex(res: any) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
}

export default async function handler(req: any, res: any) {
  setNoIndex(res);

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const telegramUserId = asString(body.telegramUserId);

    if (!telegramUserId) {
      return res.status(400).json({ error: "Missing telegramUserId" });
    }

    if (!isAdmin(telegramUserId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (req.method === "POST") {
      const grants = await listAccessGrants(300);

      return res.status(200).json({
        ok: true,
        grants,
      });
    }

    if (req.method === "PATCH") {
      const targetTelegramUserId = asString(body.targetTelegramUserId);
      const username = asNullableString(body.username);
      const role = isRole(body.role) ? body.role : "user";
      const plan = isPlan(body.plan) ? body.plan : "free";
      const durationDays = asPositiveNumber(body.durationDays);
      const note = asNullableString(body.note);

      if (!targetTelegramUserId) {
        return res.status(400).json({ error: "Missing targetTelegramUserId" });
      }

      const existing = await getAccessGrant(targetTelegramUserId);
      const nowIso = new Date().toISOString();

      const expiresAt = durationDays
        ? new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString()
        : null;

      const saved = await saveAccessGrant({
        telegramUserId: targetTelegramUserId,
        username: username ?? existing?.username ?? null,
        role,
        plan,
        note,
        grantedBy: telegramUserId,
        createdAt: existing?.createdAt || nowIso,
        updatedAt: nowIso,
        expiresAt,
      });

      return res.status(200).json({
        ok: true,
        access: saved,
      });
    }

    if (req.method === "DELETE") {
      const targetTelegramUserId = asString(body.targetTelegramUserId);

      if (!targetTelegramUserId) {
        return res.status(400).json({ error: "Missing targetTelegramUserId" });
      }

      await deleteAccessGrant(targetTelegramUserId);

      return res.status(200).json({
        ok: true,
        deletedTelegramUserId: targetTelegramUserId,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("admin-access api error", error);
    return res.status(500).json({ error: "Failed to manage access" });
  }
}