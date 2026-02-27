// api/handle-resolve.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function normalizeHandle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  const withAt = s.startsWith("@") ? s : `@${s}`;
  const h = withAt.toLowerCase();
  if (!/^@[a-z0-9_]{3,32}$/.test(h)) return null;
  return h;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });

  const handle = normalizeHandle(req.query?.handle);
  if (!handle) return res.status(400).json({ ok: false, error: "BAD_HANDLE" });

  const key = `handle:${handle}`;

  try {
    const peerId = await kv.get<string>(key);
    if (!peerId) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
    return res.status(200).json({ ok: true, peerId });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "KV_ERROR" });
  }
}
