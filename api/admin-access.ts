import type { VercelRequest, VercelResponse } from "@vercel/node";

const ADMIN_TELEGRAM_ID = String(process.env.ADMIN_TELEGRAM_ID || "").trim();
const ADMIN_TELEGRAM_USERNAME = String(
  process.env.ADMIN_TELEGRAM_USERNAME || ""
)
  .trim()
  .toLowerCase();

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isOwner(body: Record<string, unknown>) {
  const telegramId =
    asString(body.telegramId) || asString(body.telegramUserId);

  const username = (
    asString(body.username) ||
    asString(body.telegramUsername)
  ).toLowerCase();

  const byId = ADMIN_TELEGRAM_ID && telegramId === ADMIN_TELEGRAM_ID;
  const byUsername =
    ADMIN_TELEGRAM_USERNAME && username === ADMIN_TELEGRAM_USERNAME;

  return Boolean(byId || byUsername);
}

function ownerGrant() {
  return {
    telegramUserId: ADMIN_TELEGRAM_ID || null,
    username: ADMIN_TELEGRAM_USERNAME || null,
    role: "admin",
    plan: "free",
    note: "owner",
    grantedBy: "system",
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: null,
    isActive: true,
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    if (!isOwner(body)) {
      return res.status(403).json({
        ok: false,
        error: "Access denied",
      });
    }

    if (req.method === "POST") {
      return res.status(200).json({
        ok: true,
        isAdmin: true,
        grants: [ownerGrant()],
      });
    }

    if (req.method === "PATCH" || req.method === "DELETE") {
      return res.status(200).json({
        ok: true,
        isAdmin: true,
        grants: [ownerGrant()],
      });
    }

    res.setHeader("Allow", "POST, PATCH, DELETE");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  } catch (error) {
    console.error("admin-access api error", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}