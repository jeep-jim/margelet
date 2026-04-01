import { getAccessGrant } from "./lib/access.js";

const ADMIN_TELEGRAM_IDS = new Set(["1372669404"]);

function fallbackAccess(telegramUserId: string) {
  return {
    telegramUserId,
    username: null,
    role: ADMIN_TELEGRAM_IDS.has(telegramUserId) ? "admin" : "user",
    plan: "free",
    note: null,
    grantedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: null,
    isActive: true,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const telegramUserId =
      typeof body.telegramUserId === "string" ? body.telegramUserId.trim() : "";

    if (!telegramUserId) {
      return res.status(400).json({ error: "Missing telegramUserId" });
    }

    const grant = await getAccessGrant(telegramUserId);

    if (!grant || !grant.isActive) {
      return res.status(200).json({
        ok: true,
        access: fallbackAccess(telegramUserId),
      });
    }

    return res.status(200).json({
      ok: true,
      access: grant,
    });
  } catch (error) {
    console.error("access api error", error);
    return res.status(500).json({ error: "Failed to load access" });
  }
}