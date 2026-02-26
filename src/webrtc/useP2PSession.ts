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

function getOrCreatePeerId() {
  const k = "margelet.peerId";
  const cur = localStorage.getItem(k);
  if (cur) return cur;
  const id = crypto?.randomUUID?.() ?? `${Math.random().toString(16).slice(2)}-${Date.now()}`;
  localStorage.setItem(k, id);
  return id;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] },
];

type UseP2PArgs = {
  sessionId: string;
  otherPeerId?: string; // peerId собеседника
  enabled?: boolean;
  // сколько ждать P2P, прежде чем перейти на KV fallback
  fallbackAfterMs?: number;
};

export function useP2PSession({
  sessionId,
  otherPeerId,
  enabled = true,
  fallbackAfterMs = 9000,
}: UseP2PArgs) {
  const myPeerId = useMemo(getOrCreatePeerId, []);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const pollTimer = useRef<number | null>(null);
  const startedAt = useRef<number>(0);

  const [status, setStatus] = useState<P2PStatus>(() => {
    if (!enabled) return "idle";
    if (!otherPeerId) return "need-peer";
    return "connecting";
  });

  const [lastError, setLastError] = useState<string | null>(null);
  const [chatLog, setChatLog] = useState<P2PChatMsg[]>([]);

  const pushSystem = useCallback((text: string) => {
    setChatLog((s) => [...s, { id: crypto.randomUUID?.() ?? String(Date.now()), ts: Date.now(), from: "system", text }]);
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
      if (e.candidate && otherPeerId) {
        safeSendSignal({
          sessionId,
          from: myPeerId,
          to: otherPeerId,
          type: "ice",
          payload: e.candidate.toJSON(),
        }).catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (st === "connected") {
        setStatus("connected");
      } else if (st === "failed" || st === "disconnected") {
        // Не рвём сразу — дадим шанс fallback
      }
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
        } catch {
          // ignore
        }
      };
    };

    return pc;
  }, [myPeerId, otherPeerId, safeSendSignal, sessionId]);

  const startOffer = useCallback(async () => {
    if (!otherPeerId) return;
    const pc = ensurePC();

    // создаём DataChannel на инициаторе
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
      to: otherPeerId,
      type: "offer",
      payload: offer,
    });

    pushSystem("🛰️ Отправили offer…");
  }, [ensurePC, myPeerId, otherPeerId, pushSystem, safeSendSignal, sessionId]);

  const handleSignal = useCallback(
    async (msg: SignalEnvelope) => {
      if (!otherPeerId) return;
      if (msg.sessionId !== sessionId) return;
      if (msg.to !== myPeerId) return;

      const pc = ensurePC();

      if (msg.type === "offer") {
        await pc.setRemoteDescription(msg.payload);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await safeSendSignal({
          sessionId,
          from: myPeerId,
          to: otherPeerId,
          type: "answer",
          payload: answer,
        });

        pushSystem("🛰️ Получили offer → отправили answer");
      }

      if (msg.type === "answer") {
        await pc.setRemoteDescription(msg.payload);
        pushSystem("🛰️ Получили answer");
      }

      if (msg.type === "ice") {
        try {
          await pc.addIceCandidate(msg.payload);
        } catch {
          // ignore
        }
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
    [ensurePC, myPeerId, otherPeerId, pushSystem, safeSendSignal, sessionId]
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
        // если не connected — уходим в kv fallback
        if (pcRef.current?.connectionState !== "connected") {
          setStatus("fallback-kv");
          pushSystem("⚠️ P2P не поднялся. Переключились на KV-чат (работает у всех, TURN добавим позже).");
        }
      }
    } catch (e: any) {
      setLastError(e?.message ?? "poll error");
    }
  }, [fallbackAfterMs, handleSignal, myPeerId, pushSystem, sessionId, status]);

  useEffect(() => {
    if (!enabled) return;
    if (!sessionId) return;

    if (!otherPeerId) {
      setStatus("need-peer");
      return;
    }

    setStatus("connecting");
    setLastError(null);
    startedAt.current = Date.now();

    // стартуем offer только если "мы инициатор"
    // правило: инициатор — тот, у кого peerId лексикографически меньше (чтобы не было гонки)
    const initiator = myPeerId < otherPeerId;

    // запускаем polling
    if (pollTimer.current) window.clearInterval(pollTimer.current);
    pollTimer.current = window.setInterval(() => poll(), 650);

    // лёгкая задержка, чтобы оба успели стартануть polling
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
  }, [enabled, myPeerId, otherPeerId, poll, pushSystem, sessionId, startOffer]);

  const sendChat = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      const id = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
      const ts = Date.now();

      // optimistic local
      setChatLog((s) => [...s, { id, ts, from: "me", text }]);

      // 1) если DataChannel открыт — шлём туда
      const dc = dcRef.current;
      if (dc && dc.readyState === "open") {
        dc.send(JSON.stringify({ t: "chat", id, ts, text }));
        return;
      }

      // 2) иначе fallback через KV (тип chat)
      if (!otherPeerId) return;

      await safeSendSignal({
        sessionId,
        from: myPeerId,
        to: otherPeerId,
        type: "chat",
        payload: { text },
      });
    },
    [myPeerId, otherPeerId, safeSendSignal, sessionId]
  );

  const inviteLink = useMemo(() => {
    // друг откроет эту ссылку и у него будет sid + to
    const u = new URL(window.location.href);
    u.searchParams.set("sid", sessionId);
    u.searchParams.set("to", myPeerId);
    return u.toString();
  }, [myPeerId, sessionId]);

  return {
    myPeerId,
    otherPeerId: otherPeerId ?? null,
    status,
    lastError,
    chatLog,
    sendChat,
    inviteLink,
  };
}