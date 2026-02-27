import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

function normalizeHandle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let h = raw.trim();
  if (!h) return null;
  if (!h.startsWith("@")) h = "@" + h;
  h = h.toLowerCase();
  if (!/^@[a-z0-9_]{3,32}$/.test(h)) return null;
  return h;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const handle = normalizeHandle(req.query?.handle);
    if (!handle) return res.status(400).json({ ok: false, error: "BAD_HANDLE" });

    const key = `handle:${handle}`;
    const peerId = (await kv.get<string>(key)) || null;

    if (!peerId) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    return res.status(200).json({ ok: true, handle, peerId });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message ?? "SERVER_ERROR" });
  }
}