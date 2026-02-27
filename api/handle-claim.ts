import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

function normalizeHandle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let h = raw.trim();
  if (!h) return null;
  if (!h.startsWith("@")) h = "@" + h;
  h = h.toLowerCase();

  // @ + [a-z0-9_], 3..32
  if (!/^@[a-z0-9_]{3,32}$/.test(h)) return null;
  return h;
}

function normalizePeerId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const p = raw.trim();
  // peerId = handle без @ (или любой стабильный id)
  if (!/^[a-z0-9_]{3,64}$/i.test(p)) return null;
  return p;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const handle = normalizeHandle(req.body?.handle);
    const peerId = normalizePeerId(req.body?.peerId);

    if (!handle) return res.status(400).json({ ok: false, error: "BAD_HANDLE" });
    if (!peerId) return res.status(400).json({ ok: false, error: "BAD_PEER_ID" });

    const key = `handle:${handle}`; // handle:@jim -> peerId

    const existing = (await kv.get<string>(key)) || null;

    // idempotent: если уже твой — ок
    if (existing && existing !== peerId) {
      return res.status(409).json({ ok: false, error: "TAKEN" });
    }

    await kv.set(key, peerId);
    return res.status(200).json({ ok: true, handle, peerId });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message ?? "SERVER_ERROR" });
  }
}