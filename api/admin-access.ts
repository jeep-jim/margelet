import type { VercelRequest, VercelResponse } from "@vercel/node";

const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || "";
const ADMIN_TELEGRAM_USERNAME = (process.env.ADMIN_TELEGRAM_USERNAME || "")
  .trim()
  .toLowerCase();

function toStringSafe(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    const telegramId = toStringSafe(body?.telegramId);
    const username = toStringSafe(body?.username).toLowerCase();

    const byId = ADMIN_TELEGRAM_ID && telegramId === ADMIN_TELEGRAM_ID;
    const byUsername =
      ADMIN_TELEGRAM_USERNAME && username === ADMIN_TELEGRAM_USERNAME;

    if (!byId && !byUsername) {
      return res.status(403).json({
        ok: false,
        error: "Access denied",
      });
    }

    return res.status(200).json({
      ok: true,
      isAdmin: true,
    });
  } catch (error) {
    console.error("admin-access api error", error);
    return res.status(500).json({
      ok: false,
      error: "Internal server error",
    });
  }
}