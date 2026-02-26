// api/signal-send.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

const TTL_SECONDS = 120;

function cors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function safeJsonParse<T>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

type SignalEnvelope = {
  sessionId: string; // общий "чат/сессия" для двух девайсов
  from: string;      // peerId отправителя
  to: string;        // peerId получателя
  type: string;      // "offer" | "answer" | "ice" | "event" | ...
  payload: any;      // RTCSessionDescriptionInit / RTCIceCandidateInit / etc
  ts?: number;
  id?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const body =
    typeof req.body === "string"
      ? safeJsonParse<SignalEnvelope>(req.body)
      : (req.body as SignalEnvelope | undefined);

  if (!body) return res.status(400).json({ ok: false, error: "Invalid JSON body" });

  const { sessionId, from, to, type, payload } = body;

  if (!sessionId || !from || !to || !type) {
    return res.status(400).json({ ok: false, error: "Missing fields: sessionId/from/to/type" });
  }

  const key = `sig:${sessionId}:${to}`;

  const msg: SignalEnvelope = {
    sessionId,
    from,
    to,
    type,
    payload,
    ts: Date.now(),
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  };

  // Очередь сообщений в list + TTL
  // (ttl на ключ — если ключ уже был, expire обновляем)
  await kv.rpush(key, JSON.stringify(msg));
  await kv.expire(key, TTL_SECONDS);

  return res.status(200).json({ ok: true });
}