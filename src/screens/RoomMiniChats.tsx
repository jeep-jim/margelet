import React, { useEffect, useMemo, useRef, useState } from "react";

type Room = {
  id: string;
  title: string;
  subtitle?: string;
  emoji?: string;
  unread?: number;
  type?: "public" | "private";
  // optional
  avatar?: string;
  photo?: string;
  avatarUrl?: string;
  img?: string;
  status?: "online" | "offline";
};

type Props = {
  roomId: string;
  onBack?: () => void;
  onOpenRoom?: (roomId: string) => void;
};

const ROOMS_KEY = "margelet_rooms_v4";

function safeJson<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function pickAvatar(r: any) {
  return r?.avatar || r?.photo || r?.avatarUrl || r?.img || "";
}

function initials(name: string) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  const a = parts[0]?.[0] || "U";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : (parts[0]?.[1] || "");
  return (a + b).toUpperCase();
}

function seedFromString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function hue(seed: number) {
  return seed % 360;
}

export default function RoomMiniChats({ roomId, onBack, onOpenRoom }: Props) {
  const defaultRooms: Room[] = useMemo(
    () => [
      { id: "margelet-public", title: "margeleT • общий", subtitle: "Публичная комната (позже)", emoji: "🧩", unread: 0, type: "public" },
      { id: "friends", title: "Друзья", subtitle: "Приватные диалоги (позже)", emoji: "🤝", unread: 2, type: "private" },
    ],
    []
  );

  const [rooms, setRooms] = useState<Room[]>(() => {
    const parsed = safeJson<Room[]>(localStorage.getItem(ROOMS_KEY), []);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultRooms;
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ROOMS_KEY) {
        const parsed = safeJson<Room[]>(e.newValue, []);
        setRooms(Array.isArray(parsed) && parsed.length ? parsed : defaultRooms);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [defaultRooms]);

  const C = useMemo(() => {
    // мягкий тёмный (без стекла)
    return {
      text: "rgba(255,255,255,0.92)",
      hint: "rgba(255,255,255,0.58)",
      faint: "rgba(255,255,255,0.42)",
      line: "rgba(255,255,255,0.08)",
      line2: "rgba(255,255,255,0.06)",
      surface: "#121321",
      surface2: "#0f101a",
      chip: "rgba(255,255,255,0.06)",
      chip2: "rgba(0,0,0,0.35)",
      green: "rgba(80, 255, 176, 0.9)",
      violet: "#BE95FA",
      pink: "#FFA3CE",
    };
  }, []);

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const base = rooms.filter((r) => {
      // если вдруг где-то “files” как чат — прячем
      if (r.id === "files") return false;
      if ((r.title || "").toLowerCase() === "файлы") return false;
      return true;
    });
    if (!qq) return base;
    return base.filter((r) => (r.title + " " + (r.subtitle || "")).toLowerCase().includes(qq));
  }, [rooms, q]);

  // быстрые аватарки: берём первые N по "частоте" (пока просто первые)
  const quick = useMemo(() => filtered.slice(0, 10), [filtered]);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const recomputeArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < max - 2);
  };

  useEffect(() => {
    recomputeArrows();
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => recomputeArrows();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      el.removeEventListener("scroll", onScroll as any);
      window.removeEventListener("resize", onScroll);
    };
  }, [quick.length]);

  const scrollQuick = (dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  const S = useMemo(() => {
    const radius = 18;

    return {
      root: {
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        padding: 14,
        color: C.text,
      } as React.CSSProperties,

      header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 12,
      } as React.CSSProperties,

      brand: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 0,
      } as React.CSSProperties,

      logoDot: {
        width: 10,
        height: 10,
        borderRadius: 999,
        background: `linear-gradient(135deg, ${C.pink}, ${C.violet})`,
        boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
      } as React.CSSProperties,

      brandText: {
        fontWeight: 950,
        letterSpacing: 0.2,
        fontSize: 13,
        opacity: 0.95,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      } as React.CSSProperties,

      backBtn: {
        border: `1px solid ${C.line}`,
        background: "rgba(0,0,0,0.25)",
        color: C.text,
        borderRadius: 999,
        padding: "7px 10px",
        fontSize: 12,
        fontWeight: 900,
        cursor: "pointer",
      } as React.CSSProperties,

      searchWrap: {
        borderRadius: radius,
        border: `1px solid ${C.line}`,
        background: `linear-gradient(180deg, ${C.surface} 0%, ${C.surface2} 100%)`,
        padding: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
      } as React.CSSProperties,

      searchIcon: { opacity: 0.55, fontSize: 14 } as React.CSSProperties,

      input: {
        flex: 1,
        background: "transparent",
        border: "none",
        outline: "none",
        color: C.text,
        fontSize: 13,
        fontWeight: 700,
      } as React.CSSProperties,

      sectionTitle: {
        marginTop: 10,
        marginBottom: 8,
        fontSize: 11,
        fontWeight: 950,
        letterSpacing: 0.25,
        textTransform: "uppercase",
        color: C.hint,
      } as React.CSSProperties,

      quickRow: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
      } as React.CSSProperties,

      arrowBtn: (disabled: boolean) =>
        ({
          width: 28,
          height: 28,
          borderRadius: 999,
          border: `1px solid ${C.line}`,
          background: disabled ? "transparent" : "rgba(0,0,0,0.22)",
          color: disabled ? "rgba(255,255,255,0.25)" : C.text,
          cursor: disabled ? "default" : "pointer",
          fontWeight: 950,
          display: "grid",
          placeItems: "center",
          userSelect: "none",
        }) as React.CSSProperties,

      scroller: {
        flex: 1,
        display: "flex",
        gap: 10,
        overflowX: "auto",
        paddingBottom: 6,
        scrollbarWidth: "none",
      } as React.CSSProperties,

      bubble: (active: boolean, col: string) =>
        ({
          width: 44,
          height: 44,
          borderRadius: 999,
          border: `1px solid ${active ? "rgba(255,255,255,0.14)" : C.line}`,
          background: active ? `radial-gradient(120% 120% at 30% 20%, ${col}, rgba(0,0,0,0.65))` : C.chip2,
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
        }) as React.CSSProperties,

      avatarImg: { width: "100%", height: "100%", objectFit: "cover" } as React.CSSProperties,

      statusDot: (online: boolean) =>
        ({
          position: "absolute",
          bottom: 4,
          right: 4,
          width: 10,
          height: 10,
          borderRadius: 999,
          background: online ? C.green : "rgba(255,255,255,0.18)",
          border: "2px solid rgba(0,0,0,0.55)",
        }) as React.CSSProperties,

      unreadDot: {
        position: "absolute",
        top: -6,
        right: -6,
        minWidth: 18,
        height: 18,
        borderRadius: 999,
        background: `linear-gradient(135deg, ${C.pink}, ${C.violet})`,
        color: "#120f16",
        fontSize: 11,
        fontWeight: 950,
        display: "grid",
        placeItems: "center",
        padding: "0 6px",
        border: "2px solid rgba(0,0,0,0.55)",
      } as React.CSSProperties,

      list: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        overflow: "auto",
        paddingBottom: 6,
        minHeight: 0,
      } as React.CSSProperties,

      item: (active: boolean) =>
        ({
          width: "100%",
          display: "grid",
          gridTemplateColumns: "34px 1fr auto",
          alignItems: "center",
          gap: 10,
          textAlign: "left",
          borderRadius: 16,
          border: `1px solid ${active ? "rgba(255,255,255,0.14)" : C.line}`,
          background: active ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.18)",
          padding: "10px 10px",
          cursor: "pointer",
        }) as React.CSSProperties,

      emoji: {
        width: 34,
        height: 34,
        borderRadius: 14,
        display: "grid",
        placeItems: "center",
        background: C.chip,
        border: `1px solid ${C.line2}`,
      } as React.CSSProperties,

      meta: { minWidth: 0 } as React.CSSProperties,
      t: { fontWeight: 950, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } as React.CSSProperties,
      sub: {
        marginTop: 2,
        fontWeight: 750,
        fontSize: 12,
        color: C.hint,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      } as React.CSSProperties,

      badge: {
        minWidth: 22,
        height: 22,
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        border: `1px solid ${C.line}`,
        color: C.text,
        fontSize: 12,
        fontWeight: 950,
        display: "grid",
        placeItems: "center",
        padding: "0 7px",
      } as React.CSSProperties,
    };
  }, [C]);

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.brand}>
          <div style={S.logoDot} />
          <div style={S.brandText}>margeleT</div>
        </div>

        {!!onBack && (
          <button type="button" style={S.backBtn} onClick={onBack}>
            Back
          </button>
        )}
      </div>

      <div style={S.searchWrap}>
        <div style={S.searchIcon}>⌕</div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={S.input}
          placeholder="Поиск…"
          aria-label="Search"
        />
      </div>

      <div style={S.sectionTitle}>Быстрый доступ</div>

      <div style={S.quickRow}>
        <button type="button" style={S.arrowBtn(!canScrollLeft)} onClick={() => scrollQuick(-1)} aria-label="Left">
          ‹
        </button>

        <div ref={scrollerRef} style={S.scroller as any} onScroll={recomputeArrows}>
          {quick.map((r) => {
            const active = r.id === roomId;
            const ava = pickAvatar(r);
            const seed = seedFromString(r.id + r.title);
            const col = `hsla(${hue(seed)}, 90%, 72%, 0.55)`;
            const online = (r.status || "offline") === "online";
            const unread = r.unread || 0;

            return (
              <div key={r.id} style={{ position: "relative" }}>
                <button type="button" style={S.bubble(active, col)} onClick={() => onOpenRoom?.(r.id)} title={r.title}>
                  {ava ? <img src={ava} alt={r.title} style={S.avatarImg} /> : <div style={{ fontWeight: 950 }}>{initials(r.title)}</div>}
                </button>
                <div style={S.statusDot(online)} />
                {!!unread && <div style={S.unreadDot}>{unread}</div>}
              </div>
            );
          })}
        </div>

        <button type="button" style={S.arrowBtn(!canScrollRight)} onClick={() => scrollQuick(1)} aria-label="Right">
          ›
        </button>
      </div>

      <div style={S.sectionTitle}>Комнаты</div>

      <div style={S.list}>
        {filtered.map((r) => {
          const active = r.id === roomId;
          return (
            <button key={r.id} type="button" style={S.item(active)} onClick={() => onOpenRoom?.(r.id)}>
              <div style={S.emoji}>{r.emoji || "💬"}</div>
              <div style={S.meta}>
                <div style={S.t}>{r.title}</div>
                <div style={S.sub}>{r.subtitle || (r.type === "public" ? "Public" : "Private")}</div>
              </div>
              {!!r.unread && <div style={S.badge}>{r.unread}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}