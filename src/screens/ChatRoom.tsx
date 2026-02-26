import React, { useEffect, useMemo, useState } from "react";
import ChatRoomDesktop from "./ChatRoomDesktop";
import ChatRoomMobile, { type ChatRoomProps } from "./ChatRoomMobile";
import { useP2PSession } from "../webrtc/useP2PSession";

function getOrCreatePeerId(storageKey = "margelet_peer_id_v1") {
  if (typeof window === "undefined") return "server";
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;

  const id =
    (globalThis.crypto as any)?.randomUUID?.() ??
    `p-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  try {
    localStorage.setItem(storageKey, id);
  } catch {}
  return id;
}

function useMedia(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const m = window.matchMedia(query);
    const update = () => setMatches(!!m.matches);
    update();
    if ((m as any).addEventListener) {
      m.addEventListener("change", update);
      return () => m.removeEventListener("change", update);
    } else {
      // old safari
      m.addListener(update);
      return () => m.removeListener(update);
    }
  }, [query]);
  return matches;
}

function getPeerFromUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    const u = new URL(window.location.href);
    return (
      u.searchParams.get("peer") ||
      u.searchParams.get("peerId") ||
      u.searchParams.get("device") ||
      ""
    );
  } catch {
    return "";
  }
}

function dmSessionId(meId: string, peerId: string) {
  const a = (meId || "").trim();
  const b = (peerId || "").trim();
  if (!a || !b) return "";
  const [x, y] = [a, b].sort();
  return `dm:${x}:${y}`;
}

const ACTIVE_ROOM_KEY = "margelet_active_room_v1";

export default function ChatRoom(
  props: ChatRoomProps & { onOpenRoom?: (roomId: string) => void }
) {
  const isDesktop = useMedia("(min-width: 1024px)");

  // device-first id
  const meId = useMemo(() => getOrCreatePeerId(), []);

  // active room local (so left list works even without router)
  const [activeRoomId, setActiveRoomId] = useState(() => {
    const fromLS =
      typeof window !== "undefined" ? localStorage.getItem(ACTIVE_ROOM_KEY) : null;
    return props.roomId || fromLS || "margelet-public";
  });

  useEffect(() => {
    if (props.roomId && props.roomId !== activeRoomId) {
      setActiveRoomId(props.roomId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.roomId]);

  const onOpenRoom = useMemo(() => {
    return (roomId: string) => {
      setActiveRoomId(roomId);
      try {
        localStorage.setItem(ACTIVE_ROOM_KEY, roomId);
      } catch {}
      props.onOpenRoom?.(roomId);
    };
  }, [props]);

  // peerId can come from props OR from invite URL (?peer=...)
  const peerFromProps =
    (props as any).peerId ||
    (props as any).peerDeviceId ||
    (props as any).otherPeerId ||
    (props as any).otherDeviceId ||
    "";

  const [peerId, setPeerId] = useState<string>(() => peerFromProps || getPeerFromUrl());

  // keep peer in sync if props changes
  useEffect(() => {
    const next = peerFromProps || getPeerFromUrl();
    if ((next || "") !== (peerId || "")) setPeerId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerFromProps]);

  // IMPORTANT: for 1:1 use deterministic DM sessionId
  const sessionId = useMemo(() => {
    const dm = peerId ? dmSessionId(meId, peerId) : "";
    return dm || activeRoomId;
  }, [activeRoomId, meId, peerId]);

  const p2p = useP2PSession({
    sessionId,
    myPeerId: meId,
    otherPeerId: peerId || undefined,
  });

  const nextProps = useMemo(() => {
    return {
      ...props,
      roomId: activeRoomId,
      onOpenRoom,

      // P2P wiring
      p2p,
      p2pState: p2p.status,
      p2pChatLog: p2p.chatLog,
      p2pSendChat: p2p.sendChat,
      p2pMeId: meId,
      p2pPeerId: peerId,
      p2pEnabled: !!peerId,
      p2pSessionId: sessionId,
    } as any;
  }, [props, activeRoomId, onOpenRoom, p2p, meId, peerId, sessionId]);

  if (isDesktop) return <ChatRoomDesktop {...nextProps} />;
  return <ChatRoomMobile {...nextProps} />;
}