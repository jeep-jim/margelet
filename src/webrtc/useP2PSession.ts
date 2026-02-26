// src/webrtc/useP2PSession.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signalPull, signalSend, type SignalEnvelope } from "./signal";

type UseP2PSessionArgs = {
  sessionId: string;
  meId: string;
  peerId: string;
  pollingMs?: number;
};

type P2PState = "idle" | "connecting" | "connected" | "closed" | "error";

const DEFAULT_ICE: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] },
  ],
};

function isInitiator(meId: string, peerId: string) {
  return meId.localeCompare(peerId) < 0;
}

export function useP2PSession({ sessionId, meId, peerId, pollingMs = 700 }: UseP2PSessionArgs) {
  const initiator = useMemo(() => isInitiator(meId, peerId), [meId, peerId]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  const pollTimerRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);
  const makingOfferRef = useRef(false);

  const [state, setState] = useState<P2PState>("idle");
  const [lastError, setLastError] = useState<string | null>(null);
  const [chatLog, setChatLog] = useState<Array<{ from: string; text: string; ts: number }>>([]);

  const teardown = useCallback(() => {
    stoppedRef.current = true;

    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    try {
      dcRef.current?.close();
    } catch {}
    dcRef.current = null;

    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;

    setState("closed");
  }, []);

  const attachDataChannel = useCallback(
    (dc: RTCDataChannel) => {
      dcRef.current = dc;

      dc.onopen = () => setState("connected");
      dc.onclose = () => setState("closed");
      dc.onerror = () => {
        setState("error");
        setLastError("DataChannel error");
      };

      dc.onmessage = (ev) => {
        const raw = typeof ev.data === "string" ? ev.data : "";
        let parsed: any = null;
        try {
          parsed = JSON.parse(raw);
        } catch {}

        if (parsed?.type === "chat" && typeof parsed?.text === "string") {
          setChatLog((prev) => [...prev, { from: peerId, text: parsed.text, ts: Date.now() }]);
          return;
        }

        if (raw) setChatLog((prev) => [...prev, { from: peerId, text: raw, ts: Date.now() }]);
      };
    },
    [peerId]
  );

  const ensurePC = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(DEFAULT_ICE);
    pcRef.current = pc;

    pc.onconnectionstatechange = () => {
      const s = pc.connectionState;
      if (s === "connected") setState("connected");
      else if (s === "connecting") setState("connecting");
      else if (s === "failed") {
        setState("error");
        setLastError("WebRTC connection failed (possible NAT/TURN issue)");
      }
    };

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      void signalSend({
        sessionId,
        from: meId,
        to: peerId,
        type: "ice",
        payload: e.candidate.toJSON(),
      }).catch(() => {});
    };

    pc.ondatachannel = (e) => attachDataChannel(e.channel);

    return pc;
  }, [attachDataChannel, sessionId, meId, peerId]);

  const start = useCallback(async () => {
    stoppedRef.current = false;
    setState("connecting");
    setLastError(null);

    const pc = ensurePC();

    // initiator создаёт DC
    if (initiator && !dcRef.current) {
      const dc = pc.createDataChannel("margelet", { ordered: true });
      attachDataChannel(dc);
    }

    // polling
    if (!pollTimerRef.current) {
      pollTimerRef.current = window.setInterval(async () => {
        if (stoppedRef.current) return;

        let msgs: SignalEnvelope[] = [];
        try {
          msgs = await signalPull(sessionId, meId);
        } catch {
          return;
        }

        for (const msg of msgs) {
          if (!pcRef.current) continue;
          if (msg.from !== peerId) continue;

          const pcNow = pcRef.current;

          if (msg.type === "offer") {
            if (initiator) continue; // simple glare avoidance
            await pcNow.setRemoteDescription(msg.payload);
            const answer = await pcNow.createAnswer();
            await pcNow.setLocalDescription(answer);
            await signalSend({
              sessionId,
              from: meId,
              to: peerId,
              type: "answer",
              payload: pcNow.localDescription,
            });
          }

          if (msg.type === "answer") {
            if (!initiator) continue;
            await pcNow.setRemoteDescription(msg.payload);
          }

          if (msg.type === "ice") {
            try {
              await pcNow.addIceCandidate(msg.payload);
            } catch {}
          }

          if (msg.type === "event") {
            // Phase 2: call:ring/accept/reject/end
          }
        }
      }, pollingMs);
    }

    // initiator: offer
    if (initiator) {
      if (makingOfferRef.current) return;
      makingOfferRef.current = true;
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await signalSend({
          sessionId,
          from: meId,
          to: peerId,
          type: "offer",
          payload: pc.localDescription,
        });
      } finally {
        makingOfferRef.current = false;
      }
    }
  }, [ensurePC, initiator, attachDataChannel, sessionId, meId, peerId, pollingMs]);

  const sendChat = useCallback(
    (text: string) => {
      const dc = dcRef.current;
      if (!dc || dc.readyState !== "open") return false;

      dc.send(JSON.stringify({ type: "chat", text }));
      setChatLog((prev) => [...prev, { from: meId, text, ts: Date.now() }]);
      return true;
    },
    [meId]
  );

  const sendEvent = useCallback(
    async (event: any) => {
      await signalSend({
        sessionId,
        from: meId,
        to: peerId,
        type: "event",
        payload: event,
      });
    },
    [sessionId, meId, peerId]
  );

  useEffect(() => {
    if (!sessionId || !meId || !peerId) return;
    void start().catch((e: any) => {
      setState("error");
      setLastError(e?.message ?? "start error");
    });
    return () => teardown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, meId, peerId]);

  return { state, lastError, initiator, chatLog, sendChat, sendEvent, teardown };
}