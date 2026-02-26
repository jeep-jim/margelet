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

const ACTIVE_ROOM_KEY = "margelet_active_room_v1";

export default function ChatRoom(props: ChatRoomProps & { onOpenRoom?: (roomId: string) => void }) {
  const isDesktop = useMedia("(min-width: 1024px)");

  // --- P2P (Phase 1) ---------------------------------------------------------
  // meId должен быть стабильным (device-first). Для MVP храним в localStorage.
  const meId = useMemo(() => getOrCreatePeerId(), []);

  // ✅ локальный activeRoom (чтобы клики слева работали даже без роутера)
  const [activeRoomId, setActiveRoomId] = useState(() => {
    const fromLS = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_ROOM_KEY) : null;
    return props.roomId || fromLS || "margelet-public";
  });

  // если родитель поменял roomId — синкаем
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

  // sessionId: используем текущую комнату как идентификатор сессии для signaling
  const sessionId = activeRoomId;

  // peerId: ждём, что его прокинут из модели чата (под разные имена полей)
  // Если peerId пустой — хук сам НЕ стартанёт (guard внутри useEffect).
  const peerId =
    (props as any).peerId ||
    (props as any).peerDeviceId ||
    (props as any).otherPeerId ||
    (props as any).otherDeviceId ||
    "";

  const p2p = useP2PSession({
    sessionId,
    meId,
    peerId,
  });

  // прокидываем всё как раньше, только roomId заменяем на activeRoomId
  const nextProps = useMemo(() => {
    return {
      ...props,
      roomId: activeRoomId,
      onOpenRoom,

      // P2P wiring (дети могут игнорить, но ChatRoomDesktop/Mobile смогут юзать)
      p2p,
      p2pState: p2p.state,
      p2pChatLog: p2p.chatLog,
      p2pSendChat: p2p.sendChat,
      p2pMeId: meId,
      p2pPeerId: peerId,
    } as any;
  }, [props, activeRoomId, onOpenRoom, p2p, meId, peerId]);

  if (isDesktop) return <ChatRoomDesktop {...nextProps} />;
  return <ChatRoomMobile {...nextProps} />;
}