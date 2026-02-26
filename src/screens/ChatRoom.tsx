import React, { useEffect, useMemo, useState } from "react";
import ChatRoomDesktop from "./ChatRoomDesktop";
import ChatRoomMobile, { type ChatRoomProps } from "./ChatRoomMobile";
import { useP2PSession } from "../webrtc/useP2PSession";

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

function getSidFromUrl(): string {
  if (typeof window === "undefined") return "";
  try {
    return new URL(window.location.href).searchParams.get("sid") ?? "";
  } catch {
    return "";
  }
}

// MVP: use @handle as "account id" for routing in KV.
// Profile can later allow editing it; for now it's stored locally.
function getOrCreateMyHandle(storageKey = "margelet_handle_v1") {
  if (typeof window === "undefined") return "me";
  const cur = localStorage.getItem(storageKey);
  if (cur && cur.trim()) return cur.trim();

  const seed =
    (globalThis.crypto as any)?.randomUUID?.()?.split("-")[0] ??
    Math.random().toString(16).slice(2, 8);

  const next = `user_${seed}`;
  try {
    localStorage.setItem(storageKey, next);
  } catch {}
  return next;
}

function parseDmRoom(roomId: string): { a: string; b: string } | null {
  // dm:alice:bob
  if (!roomId?.startsWith("dm:")) return null;
  const parts = roomId.split(":");
  if (parts.length < 3) return null;
  const a = (parts[1] || "").trim();
  const b = (parts[2] || "").trim();
  if (!a || !b) return null;
  return { a, b };
}

const ACTIVE_ROOM_KEY = "margelet_active_room_v1";

export default function ChatRoom(props: ChatRoomProps & { onOpenRoom?: (roomId: string) => void }) {
  const isDesktop = useMedia("(min-width: 1024px)");
  const myHandle = useMemo(() => getOrCreateMyHandle(), []);

  // active room local (so left list works even without router)
  const [activeRoomId, setActiveRoomId] = useState(() => {
    const fromLS = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_ROOM_KEY) : null;
    return props.roomId || fromLS || "margelet-public";
  });

  // if parent changed roomId — sync
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

  // If opened via invite link, we can use sid directly (optional).
  const sidFromUrl = useMemo(() => getSidFromUrl(), []);
  const sessionId = sidFromUrl || activeRoomId;

  // otherPeerId:
  // - for DM rooms: parse "dm:a:b" and pick the other one
  // - or allow external props.otherPeerId
  const otherFromProps =
    (props as any).otherPeerId ||
    (props as any).peerId ||
    (props as any).peerDeviceId ||
    (props as any).otherDeviceId ||
    "";

  const [otherPeerId, setOtherPeerId] = useState<string>(() => {
    const dm = parseDmRoom(activeRoomId);
    if (dm) return dm.a === myHandle ? dm.b : dm.a;
    return otherFromProps || "";
  });

  // keep otherPeerId updated when room changes
  useEffect(() => {
    const dm = parseDmRoom(activeRoomId);
    if (dm) {
      const next = dm.a === myHandle ? dm.b : dm.a;
      if (next !== otherPeerId) setOtherPeerId(next);
      return;
    }
    const next = otherFromProps || "";
    if (next !== otherPeerId) setOtherPeerId(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId, otherFromProps, myHandle]);

  const p2p = useP2PSession({
    sessionId,
    myPeerId: myHandle,
    otherPeerId: otherPeerId || undefined,
    enabled: true,
    onPeerDiscovered: (pid) => {
      // if other is empty (invite flow), latch the first inbound peer
      if (!otherPeerId) setOtherPeerId(pid);
    },
  });

  // pass down everything; children can use p2pSendChat etc
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
      p2pMeId: p2p.myPeerId,
      p2pPeerId: p2p.otherPeerId,
      p2pEnabled: !!otherPeerId,
      p2pSessionId: sessionId,
      p2pInviteLink: p2p.inviteLink,
    } as any;
  }, [props, activeRoomId, onOpenRoom, otherPeerId, p2p, sessionId]);

  if (isDesktop) return <ChatRoomDesktop {...nextProps} />;
  return <ChatRoomMobile {...nextProps} />;
}