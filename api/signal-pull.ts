// api/signal-pull.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

type PullReq = {
  sessionId: string;
  peerId: string; // кто я (получатель)
  limit?: number; // на всякий
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const body = (typeof req.body === "string" ? JSON.parse(req.body) : req.body) as PullReq;

  const sessionId = body?.sessionId;
  const peerId = body?.peerId;
  const limit = Math.max(1, Math.min(body?.limit ?? 64, 256));

  if (!sessionId || !peerId) {
    return res.status(400).json({ ok: false, error: "Missing fields: sessionId/peerId" });
  }

  const key = `sig:${sessionId}:${peerId}`;

  // Берём всё (или limit) и очищаем
  // LRANGE 0..limit-1, потом LTRIM (удаляем то, что отдали)
  const end = limit - 1;
  const items = (await kv.lrange<string>(key, 0, end)) ?? [];

  if (items.length > 0) {
    // удаляем те, что вернули
    await kv.ltrim(key, items.length, -1);
  }

  const messages = items
    .map((s) => {
      try {
        return JSON.parse(s);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return res.status(200).json({ ok: true, messages });
}