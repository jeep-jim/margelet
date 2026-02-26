// src/webrtc/signal.ts
export type SignalType = "offer" | "answer" | "ice" | "event";

export type SignalEnvelope<T = any> = {
  sessionId: string;
  from: string;
  to: string;
  type: SignalType;
  payload: T;
  ts?: number;
  id?: string;
};

export type PullResponse = {
  ok: boolean;
  messages: SignalEnvelope[];
};

export async function signalSend(msg: SignalEnvelope) {
  const r = await fetch("/api/signal-send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(msg),
  });
  if (!r.ok) throw new Error(`signal-send failed: ${r.status}`);
  const data = await r.json().catch(() => ({}));
  if (data?.ok === false) throw new Error(data?.error ?? "signal-send error");
  return true;
}

export async function signalPull(sessionId: string, peerId: string, limit = 64) {
  const r = await fetch("/api/signal-pull", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, peerId, limit }),
  });
  if (!r.ok) throw new Error(`signal-pull failed: ${r.status}`);
  const data = (await r.json()) as PullResponse;
  return (data?.messages ?? []) as SignalEnvelope[];
}