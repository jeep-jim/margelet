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

    m.addEventListener?.("change", update);
    return () => m.removeEventListener?.("change", update);
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
      u.searchParams.get("to") ||
      ""
    );
  } catch {
    return "";
  }
}

function dmSessionId(a: string, b: string) {
  if (!a || !b) return "";
  const [x, y] = [a, b].sort();
  return `dm:${x}:${y}`;
}

const ACTIVE_ROOM_KEY = "margelet_active_room_v1";

export default function ChatRoom(
  props: ChatRoomProps & { onOpenRoom?: (roomId: string) => void }
) {
  const isDesktop = useMedia("(min-width: 1024px)");

  const myPeerId = useMemo(() => getOrCreatePeerId(), []);

  const [activeRoomId, setActiveRoomId] = useState(() => {
    const fromLS =
      typeof window !== "undefined"
        ? localStorage.getItem(ACTIVE_ROOM_KEY)
        : null;

    return props.roomId || fromLS || "margelet-public";
  });

  useEffect(() => {
    if (props.roomId && props.roomId !== activeRoomId) {
      setActiveRoomId(props.roomId);
    }
  }, [props.roomId]);

  const onOpenRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    try {
      localStorage.setItem(ACTIVE_ROOM_KEY, roomId);
    } catch {}
    props.onOpenRoom?.(roomId);
  };

  const peerFromProps =
    (props as any).peerId ||
    (props as any).otherPeerId ||
    "";

  const [otherPeerId, setOtherPeerId] = useState<string>(
    peerFromProps || getPeerFromUrl()
  );

  useEffect(() => {
    const next = peerFromProps || getPeerFromUrl();
    if (next !== otherPeerId) setOtherPeerId(next);
  }, [peerFromProps]);

  const sessionId = useMemo(() => {
    const dm = dmSessionId(myPeerId, otherPeerId);
    return dm || activeRoomId;
  }, [activeRoomId, myPeerId, otherPeerId]);

  const p2p = useP2PSession({
    sessionId,
    otherPeerId: otherPeerId || undefined,
    enabled: true,
  });

  const nextProps = {
    ...props,
    roomId: activeRoomId,
    onOpenRoom,

    p2p,
    p2pState: p2p.status,
    p2pChatLog: p2p.chatLog,
    p2pSendChat: p2p.sendChat,
    p2pMeId: p2p.myPeerId,
    p2pPeerId: p2p.otherPeerId,
    p2pEnabled: !!otherPeerId,
    p2pSessionId: sessionId,
  } as any;

  if (isDesktop) return <ChatRoomDesktop {...nextProps} />;
  return <ChatRoomMobile {...nextProps} />;
}