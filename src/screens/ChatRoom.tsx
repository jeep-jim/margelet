import React, { useEffect, useMemo, useState } from "react";
import ChatRoomDesktop from "./ChatRoomDesktop";
import ChatRoomMobile, { type ChatRoomProps } from "./ChatRoomMobile";

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

  // прокидываем всё как раньше, только roomId заменяем на activeRoomId
  const nextProps = useMemo(() => {
    return {
      ...props,
      roomId: activeRoomId,
      onOpenRoom,
    } as any;
  }, [props, activeRoomId, onOpenRoom]);

  if (isDesktop) return <ChatRoomDesktop {...nextProps} />;
  return <ChatRoomMobile {...nextProps} />;
}