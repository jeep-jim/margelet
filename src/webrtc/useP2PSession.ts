// src/webrtc/useP2PSession.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { makeEnvelope, signalPull, signalSend, type SignalEnvelope } from "./signal";

export type P2PStatus =
  | "idle"
  | "need-peer"
  | "connecting"
  | "connected"
  | "fallback-kv"
  | "error";

export type P2PChatMsg = {
  id: string;
  ts: number;
  from: "me" | "other" | "system";
  text: string;
};

function getOrCreateDeviceId() {
  const k = "margelet.peerId";
  const cur = localStorage.getItem(k);
  if (cur) return cur;
  const id = crypto?.randomUUID?.() ?? `${Math.random().toString(16).slice(2)}-${Date.now()}`;
  localStorage.setItem(k, id);
  return id;
}

/**
 * MVP account id (stable, human): @nickname (without @).
 * Used as "address" in KV signaling so Search(@nick) works.
 */
function getOrCreateHandle() {
  const k = "margelet_handle_v1";
  const cur = localStorage.getItem(k);
  if (cur && cur.trim()) return cur.trim();

  // fallback: derived from device id
  const dev = getOrCreateDeviceId();
  const short = dev.split("-")[0].slice(0, 6);
  const next = `user_${short}`;
  try {
    localStorage.setItem(k, next);
  } catch {}
  return next;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] },
];

export type UseP2PArgs = {
  sessionId: string;

  /**
   * Who you want to talk to (their @handle without @).
   * If missing -> we still poll, but we can't send.
   */
  otherPeerId?: string;

  /**
   * Optional override for "my id" (account id). If not provided -> local handle.
   * This is the key that will be used in signal-pull as peerId.
   */
  myPeerId?: string;

  enabled?: boolean;

  // how long to wait before switching to KV chat fallback (no TURN)
  fallbackAfterMs?: number;

  /**
   * When we receive first inbound msg and otherPeerId is empty,
   * we can discover it from msg.from and report to UI.
   */
  onPeerDiscovered?: (peerId: string) => void;
};

export function useP2PSession({
  sessionId,
  otherPeerId: otherPeerIdProp,
  myPeerId: myPeerIdProp,
  enabled = true,
  fallbackAfterMs = 9000,
  onPeerDiscovered,
}: UseP2PArgs) {
  const myPeerId = useMemo(() => {
    const v = (myPeerIdProp || "").trim();
    return v ? v : getOrCreateHandle();
  }, [myPeerIdProp]);

  // local mutable "other" (so we can discover it on inbound)
  const otherPeerIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    otherPeerIdRef.current = (otherPeerIdProp || "").trim() || undefined;
  }, [otherPeerIdProp]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const pollTimer = useRef<number | null>(null);
  const startedAt = useRef<number>(0);

  const [status, setStatus] = useState<P2PStatus>(() => {
    if (!enabled) return "idle";
    if (!otherPeerIdProp) return "need-peer";
    return "connecting";
  });

  const [lastError, setLastError] = useState<string | null>(null);
  const [chatLog, setChatLog] = useState<P2PChatMsg[]>([]);

  const pushSystem = useCallback((text: string) => {
    setChatLog((s) => [
      ...s,
      {
        id: crypto.randomUUID?.() ?? String(Date.now()),
        ts: Date.now(),
        from: "system",
        text,
      },
    ]);
  }, []);

  const safeSendSignal = useCallback(
    async (env: Omit<SignalEnvelope, "ts" | "id">) => {
      const full = makeEnvelope(env);
      const r = await signalSend(full);
      if (!r.ok) throw new Error(r.error || "signal-send failed");
    },
    []
  );

  const ensurePC = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      const other = otherPeerIdRef.current;
      if (e.candidate && other) {
        safeSendSignal({
          sessionId,
          from: myPeerId,
          to: other,
          type: "ice",
          payload: e.candidate.toJSON(),
        }).catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === "connected") setStatus("connected");
    };

    pc.ondatachannel = (e) => {
      dcRef.current = e.channel;
      e.channel.onopen = () => setStatus("connected");
      e.channel.onmessage = (m) => {
        try {
          const data = JSON.parse(m.data);
          if (data?.t === "chat") {
            setChatLog((s) => [
              ...s,
              { id: data.id, ts: data.ts, from: "other", text: String(data.text ?? "") },
            ]);
          }
        } catch {}
      };
    };

    return pc;
  }, [myPeerId, safeSendSignal, sessionId]);

  const startOffer = useCallback(async () => {
    const other = otherPeerIdRef.current;
    if (!other) return;

    const pc = ensurePC();

    // initiator creates DataChannel
    if (!dcRef.current) {
      const dc = pc.createDataChannel("margelet", { ordered: true });
      dcRef.current = dc;
      dc.onopen = () => setStatus("connected");
      dc.onmessage = (m) => {
        try {
          const data = JSON.parse(m.data);
          if (data?.t === "chat") {
            setChatLog((s) => [
              ...s,
              { id: data.id, ts: data.ts, from: "other", text: String(data.text ?? "") },
            ]);
          }
        } catch {}
      };
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await safeSendSignal({
      sessionId,
      from: myPeerId,
      to: other,
      type: "offer",
      payload: offer,
    });

    pushSystem("🛰️ Отправили offer…");
  }, [ensurePC, myPeerId, pushSystem, safeSendSignal, sessionId]);

  const handleSignal = useCallback(
    async (msg: SignalEnvelope) => {
      const other = otherPeerIdRef.current;
      if (msg.sessionId !== sessionId) return;
      if (msg.to !== myPeerId) return;

      // discover other peer id if not set
      if (!other && msg.from && msg.from !== myPeerId) {
        otherPeerIdRef.current = msg.from;
        setStatus("connecting");
        onPeerDiscovered?.(msg.from);
        pushSystem(`👤 Найден собеседник: @${msg.from}`);
      }

      const realOther = otherPeerIdRef.current;
      const pc = ensurePC();

      if (msg.type === "offer") {
        await pc.setRemoteDescription(msg.payload);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (realOther) {
          await safeSendSignal({
            sessionId,
            from: myPeerId,
            to: realOther,
            type: "answer",
            payload: answer,
          });
          pushSystem("🛰️ Получили offer → отправили answer");
        }
      }

      if (msg.type === "answer") {
        await pc.setRemoteDescription(msg.payload);
        pushSystem("🛰️ Получили answer");
      }

      if (msg.type === "ice") {
        try {
          await pc.addIceCandidate(msg.payload);
        } catch {}
      }

      // KV fallback chat
      if (msg.type === "chat") {
        setChatLog((s) => [
          ...s,
          {
            id: msg.id,
            ts: msg.ts,
            from: "other",
            text: String(msg.payload?.text ?? ""),
          },
        ]);
      }
    },
    [ensurePC, myPeerId, onPeerDiscovered, pushSystem, safeSendSignal, sessionId]
  );

  const poll = useCallback(async () => {
    try {
      const res = await signalPull({ sessionId, peerId: myPeerId, limit: 64 });
      if (!res.ok) return;

      for (const m of res.messages) {
        await handleSignal(m);
      }

      // fallback decision
      if (status === "connecting" && Date.now() - startedAt.current > fallbackAfterMs) {
        if (pcRef.current?.connectionState !== "connected") {
          setStatus("fallback-kv");
          pushSystem("⚠️ P2P не поднялся. Переключились на KV-чат (TURN добавим позже).");
        }
      }
    } catch (e: any) {
      setLastError(e?.message ?? "poll error");
    }
  }, [fallbackAfterMs, handleSignal, myPeerId, pushSystem, sessionId, status]);

  useEffect(() => {
    if (!enabled) return;
    if (!sessionId) return;

    setLastError(null);
    startedAt.current = Date.now();

    // status init
    setStatus(otherPeerIdRef.current ? "connecting" : "need-peer");

    // start polling ALWAYS (even if otherPeerId unknown) — so inbound can discover it
    if (pollTimer.current) window.clearInterval(pollTimer.current);
    pollTimer.current = window.setInterval(() => poll(), 650);

    // start offer only if we already have otherPeerId
    const other = otherPeerIdRef.current;
    if (other) {
      const initiator = myPeerId < other;
      const t = window.setTimeout(() => {
        if (initiator) startOffer().catch((e) => setLastError(String(e?.message ?? e)));
        else pushSystem("🛰️ Ждём offer от собеседника…");
      }, 350);

      return () => {
        window.clearTimeout(t);
        if (pollTimer.current) window.clearInterval(pollTimer.current);
        pollTimer.current = null;

        dcRef.current?.close();
        dcRef.current = null;

        pcRef.current?.close();
        pcRef.current = null;
      };
    }

    return () => {
      if (pollTimer.current) window.clearInterval(pollTimer.current);
      pollTimer.current = null;

      dcRef.current?.close();
      dcRef.current = null;

      pcRef.current?.close();
      pcRef.current = null;
    };
  }, [enabled, myPeerId, poll, pushSystem, sessionId, startOffer]);

  const sendChat = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      const ts = Date.now();

      // optimistic local
      setChatLog((s) => [...s, { id, ts, from: "me", text }]);

      const dc = dcRef.current;
      if (dc && dc.readyState === "open") {
        dc.send(JSON.stringify({ t: "chat", id, ts, text }));
        return;
      }

      const other = otherPeerIdRef.current;
      if (!other) {
        pushSystem("⚠️ Нет адреса собеседника (otherPeerId). Откройте DM через поиск по @nickname.");
        return;
      }

      await safeSendSignal({
        sessionId,
        from: myPeerId,
        to: other,
        type: "chat",
        payload: { text },
      });
    },
    [myPeerId, pushSystem, safeSendSignal, sessionId]
  );

  const inviteLink = useMemo(() => {
    const u = new URL(window.location.href);
    u.searchParams.set("sid", sessionId);
    u.searchParams.set("to", myPeerId);
    return u.toString();
  }, [myPeerId, sessionId]);

  return {
    myPeerId,
    otherPeerId: otherPeerIdRef.current ?? null,
    status,
    lastError,
    chatLog,
    sendChat,
    inviteLink,
  };
}