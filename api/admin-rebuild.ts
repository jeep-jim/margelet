import type { VercelRequest, VercelResponse } from "@vercel/node";
import { rebuildFeedFromSources } from "./lib/sources.js";
import type { CountryCode } from "./lib/contracts.js";

const ADMIN_TELEGRAM_ID = String(process.env.ADMIN_TELEGRAM_ID || "").trim();
const ADMIN_TELEGRAM_USERNAME = String(process.env.ADMIN_TELEGRAM_USERNAME || "")
  .trim()
  .toLowerCase();

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
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
    ADMIN_TELEGRAM_USERNAME && username === ADMIN_TELEGRAM_USERNAME.replace(/^@/, "");

  return Boolean(byId || byUsername);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    if (!isOwner(body)) {
      return res.status(403).json({ ok: false, error: "Access denied" });
    }

    const result = await rebuildFeedFromSources({
      countryCode: null,
      forceFullCountryScan: false,
    });    

    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("admin-rebuild api error", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}