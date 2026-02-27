// src/webrtc/signal.ts
export type SignalType = "offer" | "answer" | "ice" | "event" | "chat";

export type SignalEnvelope = {
  sessionId: string;
  from: string;
  to: string;
  type: SignalType;
  payload: any;
  ts: number;
  id: string;
};

function nowId() {
  // стабильно уникально и достаточно для KV очереди
  return Math.random().toString(16).slice(2) + "-" + Date.now().toString(16);
}

export function makeEnvelope(
  partial: Omit<SignalEnvelope, "ts" | "id">
): SignalEnvelope {
  return { ...partial, ts: Date.now(), id: nowId() };
}

async function postJSON<T>(url: string, body: any): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  // если сервер вернул не-JSON (редко, но бывает) — не ломаем всё приложение
  const text = await r.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // @ts-expect-error — аварийный формат
    return { ok: false, error: "Bad JSON response", raw: text };
  }
}

export async function signalSend(env: SignalEnvelope) {
  return postJSON<{ ok: boolean; error?: string }>(
    "/api/signal-send",
    env
  );
}

export async function signalPull(args: {
  sessionId: string;
  peerId: string;
  limit?: number;
}) {
  return postJSON<{ ok: boolean; messages: SignalEnvelope[]; error?: string }>(
    "/api/signal-pull",
    args
  );
}