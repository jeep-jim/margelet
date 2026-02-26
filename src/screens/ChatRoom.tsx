import React, { useEffect, useMemo, useState, useCallback } from "react";
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

function getQS(name: string) {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) ?? "";
}

const ACTIVE_ROOM_KEY = "margelet_active_room_v1";

/**
 * ChatRoom orchestrator:
 * - chooses mobile/desktop
 * - keeps activeRoomId in localStorage
 * - wires P2P session (WebRTC DataChannel + KV signaling)
 * - supports “invite by link” via query params:
 *    ?sid=<sessionId>&to=<peerId-of-host>
 */
export default function ChatRoom(props: ChatRoomProps & { onOpenRoom?: (roomId: string) => void }) {
  const isDesktop = useMedia("(min-width: 1024px)");

  // device-first stable id
  const meId = useMemo(() => getOrCreatePeerId(), []);

  // active room (works even without router)
  const [activeRoomId, setActiveRoomId] = useState(() => {
    const fromLS = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_ROOM_KEY) : null;
    return props.roomId || fromLS || "margelet-public";
  });

  // sync if parent changes roomId
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

  // --- Invite-by-link support -----------------------------------------------
  // If user opened /room?sid=...&to=... => use it immediately
  const qsSid = getQS("sid");
  const qsTo = getQS("to");

  // sessionId: prefer sid from link, else current room
  const sessionId = qsSid || activeRoomId;

  // peerId: prefer "to" from link, else from props (model)
  const peerIdFromProps =
    (props as any).peerId ||
    (props as any).peerDeviceId ||
    (props as any).otherPeerId ||
    (props as any).otherDeviceId ||
    "";

  const peerId = (qsTo && qsTo !== meId ? qsTo : "") || peerIdFromProps || "";

  // default invite link: keep current page but set sid/to
  const inviteLink = useMemo(() => {
    if (typeof window === "undefined") return "";
    const u = new URL(window.location.href);
    u.searchParams.set("sid", sessionId);
    u.searchParams.set("to", meId);
    return u.toString();
  }, [meId, sessionId]);

  const copyInvite = useCallback(async () => {
    const link = (p2pAnyRef.current?.inviteLink as string) || inviteLink;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // fallback: open prompt
      window.prompt("Copy invite link:", link);
    }
  }, [inviteLink]);

  // --- P2P ---------------------------------------------------------
  // IMPORTANT: make it compatible with different hook signatures:
  // some versions expect { sessionId, otherPeerId }
  // yours currently expects { sessionId, meId, peerId }
  const p2p = useP2PSession({
    sessionId,
    meId,
    peerId,

    // compatibility aliases
    myPeerId: meId,
    otherPeerId: peerId,
    to: peerId,
    from: meId,
  } as any);

  // store ref so copyInvite can access p2p.inviteLink if hook provides it
  const p2pAnyRef = React.useRef<any>(null);
  useEffect(() => {
    p2pAnyRef.current = p2p as any;
  }, [p2p]);

  // normalize state/status
  const p2pState = (p2p as any).state ?? (p2p as any).status ?? "idle";

  // normalize chatLog/sendChat
  const p2pChatLog = (p2p as any).chatLog ?? [];
  const p2pSendChat = (p2p as any).sendChat ?? (async (_t: string) => {});

  // pass down to children, but keep roomId = activeRoomId (UI rooms list)
  const nextProps = useMemo(() => {
    return {
      ...props,
      roomId: activeRoomId,
      onOpenRoom,

      // P2P wiring
      p2p,
      p2pState,
      p2pStatus: p2pState,
      p2pChatLog,
      p2pSendChat,
      p2pMeId: meId,
      p2pPeerId: peerId,

      // Invite UX
      p2pInviteLink: (p2p as any).inviteLink || inviteLink,
      p2pCopyInvite: copyInvite,
    } as any;
  }, [props, activeRoomId, onOpenRoom, p2p, p2pState, p2pChatLog, p2pSendChat, meId, peerId, inviteLink, copyInvite]);

  if (isDesktop) return <ChatRoomDesktop {...nextProps} />;
  return <ChatRoomMobile {...nextProps} />;
}