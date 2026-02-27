import React, { useEffect, useMemo, useRef, useState } from "react";
import ChatRoomMobile, { type ChatRoomProps } from "./ChatRoomMobile";
import RoomFilesSidebar from "./RoomFilesSidebar";

type DragSide = "left" | "right" | null;

const LS_LEFT = "margelet_ui_left_w_v2";
const LS_RIGHT = "margelet_ui_right_w_v2";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/**
 * margeleT Desktop v2
 * - мягкий тёмный стиль (без стекла/пластика)
 * - структура 3 колонок + resize
 * - визуальный язык ближе к главной (спокойные поверхности, тонкие линии)
 */
export default function ChatRoomDesktop(props: ChatRoomProps & { onOpenRoom?: (roomId: string) => void }) {
  const [rightOpen, setRightOpen] = useState(true);

  // P2P (optional props injected by ChatRoom.tsx)
  const p2pState = (props as any).p2pState as string | undefined;
  const p2pPeerId = (props as any).p2pPeerId as string | undefined;
  const p2pLastError = (props as any).p2p?.lastError as string | undefined;

  const [leftW, setLeftW] = useState(() => {
    const v = Number(localStorage.getItem(LS_LEFT));
    return Number.isFinite(v) && v > 0 ? v : 320;
  });
  const [rightW, setRightW] = useState(() => {
    const v = Number(localStorage.getItem(LS_RIGHT));
    return Number.isFinite(v) && v > 0 ? v : 380;
  });

  useEffect(() => {
    try {
      localStorage.setItem(LS_LEFT, String(leftW));
      localStorage.setItem(LS_RIGHT, String(rightW));
    } catch {}
  }, [leftW, rightW]);

  const drag = useRef<{ side: DragSide; startX: number; startLeft: number; startRight: number }>({
    side: null,
    startX: 0,
    startLeft: leftW,
    startRight: rightW,
  });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drag.current.side) return;
      const dx = e.clientX - drag.current.startX;

      if (drag.current.side === "left") setLeftW(clamp(drag.current.startLeft + dx, 260, 560));
      if (drag.current.side === "right") setRightW(clamp(drag.current.startRight - dx, 320, 620));
    };
    const onUp = () => {
      drag.current.side = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const T = useMemo(() => {
    const bg = "#0b0c12";
    const surface = "#121321";
    const surface2 = "#0f101a";
    const line = "rgba(255,255,255,0.08)";
    const line2 = "rgba(255,255,255,0.06)";
    const text = "rgba(255,255,255,0.92)";
    const hint = "rgba(255,255,255,0.58)";
    const shadow = "0 28px 90px rgba(0,0,0,0.68)";

    return {
      bg,
      surface,
      surface2,
      line,
      line2,
      text,
      hint,
      shadow,
    };
  }, []);

  const S = useMemo(() => {
    return {
      root: {
        height: "100dvh",
        width: "100%",
        background: T.bg,
        display: "grid",
        gridTemplateColumns: `${leftW}px 10px minmax(0,1fr) ${rightOpen ? "10px " + rightW + "px" : ""}`,
        padding: 12,
        gap: 0,
      } as React.CSSProperties,

      panel: {
        borderRadius: 20,
        border: `1px solid ${T.line}`,
        background: `linear-gradient(180deg, ${T.surface} 0%, ${T.surface2} 100%)`,
        boxShadow: T.shadow,
        overflow: "hidden",
        minHeight: 0,
      } as React.CSSProperties,

      center: {
        minWidth: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        position: "relative",
      } as React.CSSProperties,

      handle: {
        cursor: "col-resize",
        userSelect: "none",
        display: "grid",
        placeItems: "center",
      } as React.CSSProperties,

      handleBar: {
        width: 2,
        height: "64%",
        borderRadius: 999,
        background: T.line2,
      } as React.CSSProperties,

      floatBtn: {
        position: "absolute",
        top: 10,
        right: 10,
        zIndex: 30,
        border: `1px solid ${T.line}`,
        background: "rgba(0,0,0,0.35)",
        color: T.text,
        borderRadius: 999,
        padding: "7px 10px",
        fontSize: 12,
        fontWeight: 900,
        cursor: "pointer",
      } as React.CSSProperties,

      status: {
        position: "absolute",
        top: 12,
        left: 12,
        zIndex: 30,
        display: "flex",
        gap: 8,
        alignItems: "center",
        padding: "6px 10px",
        borderRadius: 999,
        border: `1px solid ${T.line}`,
        background: "rgba(0,0,0,0.35)",
        color: T.text,
        fontSize: 12,
        fontWeight: 900,
        maxWidth: 520,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      } as React.CSSProperties,
    };
  }, [T, leftW, rightW, rightOpen]);

  return (
    <div style={S.root}>
      {/* LEFT */}
      <aside style={S.panel}>
      </aside>

      {/* LEFT RESIZE */}
      <div
        style={S.handle}
        onMouseDown={(e) => {
          drag.current = { side: "left", startX: e.clientX, startLeft: leftW, startRight: rightW };
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
        title="Resize left panel"
      >
        <div style={S.handleBar} />
      </div>

      {/* CENTER */}
      <main style={{ ...S.panel, ...S.center }}>
        {(p2pState || p2pPeerId) && (
          <div style={S.status} title={p2pLastError || ""}>
            <span>🛰️ P2P:</span>
            <span style={{ opacity: 0.85 }}>{p2pState ?? "—"}</span>
            {p2pPeerId ? (
              <span style={{ opacity: 0.6, fontWeight: 800 }}>· peer: {p2pPeerId}</span>
            ) : (
              <span style={{ opacity: 0.6, fontWeight: 800 }}>· peer: (missing)</span>
            )}
            {p2pLastError ? <span style={{ opacity: 0.75 }}>· {p2pLastError}</span> : null}
          </div>
        )}

        <button type="button" style={S.floatBtn} onClick={() => setRightOpen((v) => !v)}>
          {rightOpen ? "Hide panel" : "Show panel"}
        </button>

        {/* embedded = обязательно для десктопа */}
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <ChatRoomMobile {...props} embedded />
        </div>
      </main>

      {/* RIGHT RESIZE + RIGHT */}
      {rightOpen && (
        <>
          <div
            style={S.handle}
            onMouseDown={(e) => {
              drag.current = { side: "right", startX: e.clientX, startLeft: leftW, startRight: rightW };
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
            title="Resize right panel"
          >
            <div style={S.handleBar} />
          </div>

          <aside style={S.panel}>
            <RoomFilesSidebar roomId={props.roomId} />
          </aside>
        </>
      )}
    </div>
  );
}