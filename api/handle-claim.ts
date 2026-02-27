// api/handle-claim.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function normalizeHandle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  const withAt = s.startsWith("@") ? s : `@${s}`;
  const h = withAt.toLowerCase();

  // allow: @ + [a-z0-9_], 3..32
  if (!/^@[a-z0-9_]{3,32}$/.test(h)) return null;
  return h;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });

  const handle = normalizeHandle((req.body as any)?.handle);
  const peerId = typeof (req.body as any)?.peerId === "string" ? (req.body as any).peerId.trim() : "";

  if (!handle) return res.status(400).json({ ok: false, error: "BAD_HANDLE" });
  if (!peerId) return res.status(400).json({ ok: false, error: "BAD_PEER_ID" });

  const key = `handle:${handle}`;

  try {
    const cur = await kv.get<string>(key);

    // idempotent claim
    if (cur && cur !== peerId) {
      return res.status(409).json({ ok: false, error: "HANDLE_TAKEN" });
    }

    await kv.set(key, peerId);
    // optional reverse index (useful later)
    await kv.set(`peer:${peerId}`, handle);

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "KV_ERROR" });
  }
}
