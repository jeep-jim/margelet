import React, { useEffect, useMemo, useRef, useState } from "react";

type RoomType = "public" | "private";

type Room = {
  id: string;
  title: string;
  subtitle?: string;
  type: RoomType;
  emoji?: string;
  unread?: number; // UI-only mock badge
};

type Person = {
  id: string;
  name: string;
  status?: "online" | "offline";
  color?: string;
};

type TransferKind = "download" | "upload" | "stopped" | "watch";
type TransferState = "idle" | "active";

type Transfer = {
  id: string;
  filename: string;
  kind: TransferKind;
  progress: number; // 0..100
  peerId?: string; // link to Person.id
  peerLabel?: string; // "from: Друг" / "to: Nika" / "watch: Nika"
  speed?: string; // "2.1 MB/s"
  eta?: string; // "00:27"
};

type ChatsProps = {
  // Routing callbacks (API из App.tsx)
  onOpenRoom?: (roomId: string) => void;
  onOpenProfile?: () => void;
  onOpenSearch?: () => void;
  onBack?: () => void; // legacy, не используем на хабе

  // Back-compat (старые имена)
  onProfile?: () => void;
  onSearch?: () => void;

  // Data
  displayName?: string;
  deviceLabel?: string;

  // Optional setter (оставляем)
  setDisplayName?: (name: string) => void;
};

function nowId(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function Icon({
  name,
  size = 20,
}: {
  name:
    | "plus"
    | "search"
    | "chev"
    | "x"
    | "hash"
    | "folder"
    | "lock"
    | "upload"
    | "dots"
    | "play"
    | "pause"
    | "stop"
    | "open"
    | "spark";
  size?: number;
}) {
  const common: React.CSSProperties = { width: size, height: size, display: "block" };

  if (name === "plus") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeWidth="2" />
        <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "chev") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path
          d="M9 6l6 6-6 6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "x") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "hash") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M9 3L7 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M17 3l-2 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M4 9h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M3 15h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "folder") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path
          d="M3.5 7.2c0-1 .8-1.7 1.7-1.7h4l1.6 1.6h7.9c1 0 1.8.8 1.8 1.8v8.2c0 1-.8 1.8-1.8 1.8H5.2c-1 0-1.7-.8-1.7-1.8V7.2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "upload") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M12 16V6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path
          d="M8 9l4-4 4 4"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M5 18.2c1.6 1 4.1 1.8 7 1.8s5.4-.8 7-1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "dots") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M6 12h.01M12 12h.01M18 12h.01" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "play") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M9 7l10 5-10 5V7z" fill="currentColor" opacity="0.95" />
      </svg>
    );
  }

  if (name === "pause") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M7 6h4v12H7V6z" fill="currentColor" opacity="0.95" />
        <path d="M13 6h4v12h-4V6z" fill="currentColor" opacity="0.95" />
      </svg>
    );
  }

  if (name === "stop") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M7 7h10v10H7V7z" fill="currentColor" opacity="0.95" />
      </svg>
    );
  }

  if (name === "open") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M10 7h7v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M17 7l-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M7 17v2a2 2 0 002 2h8a2 2 0 002-2v-8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.75"
        />
      </svg>
    );
  }

  // spark (⚡)
  return (
    <svg style={common} viewBox="0 0 24 24" fill="none">
      <path
        d="M13 2L4 14h7l-1 8 10-14h-7l0-6z"
        fill="currentColor"
        opacity="0.95"
      />
    </svg>
  );
}

function IconBtn({
  title,
  onClick,
  children,
  color,
  bg,
  border,
  size = 40,
}: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
  color?: string;
  bg?: string;
  border?: string;
  size?: number;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        border: border ?? "none",
        background: bg ?? "transparent",
        padding: 0,
        display: "grid",
        placeItems: "center",
        cursor: onClick ? "pointer" : "default",
        color: color ?? "inherit",
      }}
    >
      {children}
    </button>
  );
}

function Modal({
  open,
  onClose,
  children,
  line,
  surface,
  text,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  line: string;
  surface: string;
  text: string;
}) {
  if (!open) return null;
  return (
    <div
      onMouseDown={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.32)",
        zIndex: 400,
        display: "grid",
        placeItems: "center",
        padding: 14,
      }}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          width: "min(520px, 100%)",
          borderRadius: 18,
          border: `1px solid ${line}`,
          background: surface,
          color: text,
          backdropFilter: "blur(14px)",
          overflow: "hidden",
          boxShadow: "0 24px 70px rgba(0,0,0,0.40)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Popover({
  open,
  anchorRef,
  onClose,
  children,
  line,
  surface,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement>;
  onClose: () => void;
  children: React.ReactNode;
  line: string;
  surface: string;
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const el = anchorRef.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const left = clamp(r.left, 10, window.innerWidth - 260);
    setPos({ top: r.bottom + 10, left });

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current && anchorRef.current.contains(t)) return;
      onClose();
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open, anchorRef, onClose]);

  if (!open || !pos) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: 250,
        borderRadius: 16,
        border: `1px solid ${line}`,
        background: surface,
        backdropFilter: "blur(12px)",
        overflow: "hidden",
        zIndex: 450,
        boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
      }}
    >
      {children}
    </div>
  );
}

export default function Chats(props: ChatsProps) {
  const openProfile = props.onOpenProfile ?? props.onProfile;
  const openSearch = props.onOpenSearch ?? props.onSearch;

  const brand = useMemo(
    () => ({
      bg: "#272632",
      headerBg: "#1E1D27",
      text: "#EAE5E3",
      muted: "rgba(234,229,227,0.70)",
      hint: "rgba(234,229,227,0.42)",
      line: "rgba(255,255,255,0.10)",
      border: "rgba(255,255,255,0.10)",
      surface: "rgba(255,255,255,0.06)",
      surface2: "rgba(255,255,255,0.05)",

      pink: "#FF73C6", // private
      violet: "#BE95FA", // public
      green: "#66D492", // download
      sand: "#E5C289", // stopped
      watch: "#BE95FA", // watch (violet)

      shadow: "0 6px 16px rgba(0,0,0,0.18)",
    }),
    []
  );

  const isDesktop = useMediaQuery("(min-width: 980px)");

  // ---------- Data: rooms ----------
  const STORAGE_KEY = "margelet_rooms_v4";
  const PEOPLE_KEY = "margelet_people_v1";

  const defaults: Room[] = useMemo(
    () => [
      { id: "margelet-public", title: "margeleT • общий", subtitle: "Публичная комната (позже)", type: "public", emoji: "🧩", unread: 0 },
      { id: "friends", title: "Друзья", subtitle: "Приватные диалоги (позже)", type: "private", emoji: "🤝", unread: 2 },
      { id: "files", title: "Файлы", subtitle: "Шары, ссылки, доступы (позже)", type: "private", emoji: "🗂️", unread: 0 },
    ],
    []
  );

  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw) as Room[];
      if (!Array.isArray(parsed) || parsed.length === 0) return defaults;

      const map = new Map(parsed.map((r) => [r.id, r]));
      for (const d of defaults) if (!map.has(d.id)) map.set(d.id, d);
      return Array.from(map.values());
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
    } catch {}
  }, [rooms]);

  // ---------- Data: people ----------
  const [people, setPeople] = useState<Person[]>(() => {
    const seed: Person[] = [
      { id: "me", name: props.displayName?.trim() || "User", status: "online", color: brand.green },
      { id: "p1", name: "Друг", status: "online", color: brand.pink },
      { id: "p2", name: "Nika", status: "offline", color: brand.violet },
      { id: "p3", name: "Max", status: "offline", color: brand.sand },
    ];
    try {
      const raw = localStorage.getItem(PEOPLE_KEY);
      if (!raw) return seed;
      const parsed = JSON.parse(raw) as Person[];
      return Array.isArray(parsed) && parsed.length ? parsed : seed;
    } catch {
      return seed;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  useEffect(() => {
    try {
      localStorage.setItem(PEOPLE_KEY, JSON.stringify(people));
    } catch {}
  }, [people]);

  const meName = (props.displayName?.trim() || "User").slice(0, 24);
  const deviceLabel = (props.deviceLabel?.trim() || "").slice(0, 24);

  // ---------- Create modal ----------
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<RoomType>("private");

  const canCreate = newTitle.trim().length >= 2;

  const createRoom = () => {
    if (!canCreate) return;
    const r: Room = {
      id: nowId("room"),
      title: newTitle.trim(),
      subtitle: newType === "public" ? "Публичная комната" : "Приватная комната",
      type: newType,
      emoji: newType === "public" ? "🌍" : "🔒",
      unread: 0,
    };
    setRooms((prev) => [r, ...prev]);
    setNewTitle("");
    setNewType("private");
    setCreateOpen(false);
    props.onOpenRoom?.(r.id);
  };

  // ---------- Mobile tabs ----------
  const [activeTab, setActiveTab] = useState<"chats" | "files">("chats");

  // ---------- Actions: desktop buttons / mobile + menu ----------
  const [actionOpen, setActionOpen] = useState(false);
  const actionBtnRef = useRef<HTMLButtonElement | null>(null);

  const doCreateChat = () => {
    setActionOpen(false);
    setCreateOpen(true);
  };

  const doShareFile = () => {
    setActionOpen(false);
    window.alert("📎 Share file (mock) — позже подключим P2P шаринг/ссылки.");
  };

  // ---------- UI helpers ----------
  const getPerson = (id?: string) => (id ? people.find((p) => p.id === id) : undefined);

  const AvatarSquare = ({
    label,
    color,
    online,
    size = 44,
    rounded = 16,
  }: {
    label: string;
    color: string;
    online?: boolean;
    size?: number;
    rounded?: number;
  }) => (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        border: `1px solid ${brand.border}`,
        background: "rgba(0,0,0,0.25)",
        display: "grid",
        placeItems: "center",
        position: "relative",
        color,
        fontWeight: 950,
      }}
    >
      {label.slice(0, 1).toUpperCase()}
      <div
        style={{
          position: "absolute",
          right: -2,
          bottom: -2,
          width: 11,
          height: 11,
          borderRadius: 999,
          background: online ? brand.green : "rgba(255,255,255,0.18)",
          border: `2px solid ${brand.bg}`,
        }}
      />
    </div>
  );

  // ---------- Cards ----------
  const RoomCard = ({ r }: { r: Room }) => {
    const accent = r.type === "public" ? brand.violet : brand.pink;
    const icon =
      r.id === "margelet-public" ? (
        <Icon name="hash" size={18} />
      ) : r.id === "files" ? (
        <Icon name="folder" size={18} />
      ) : r.type === "private" ? (
        <Icon name="lock" size={18} />
      ) : (
        <Icon name="hash" size={18} />
      );

    const unread = r.unread ?? 0;

    return (
      <button
        type="button"
        onClick={() => props.onOpenRoom?.(r.id)}
        style={{
          width: "100%",
          textAlign: "left",
          borderRadius: 22,
          border: `1px solid ${brand.border}`,
          background: brand.surface,
          padding: "14px 14px",
          cursor: "pointer",
          transition: "transform 0.14s ease, filter 0.14s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.06)";
          (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.filter = "none";
          (e.currentTarget as HTMLButtonElement).style.transform = "none";
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              border: `1px solid ${brand.border}`,
              background: "rgba(0,0,0,0.22)",
              display: "grid",
              placeItems: "center",
              color: accent,
            }}
          >
            {r.emoji ? <span style={{ fontSize: 18 }}>{r.emoji}</span> : icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  fontWeight: 950,
                  fontSize: 16,
                  color: accent,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.title}
              </div>
              <div style={{ flex: 1 }} />
              {unread > 0 && (
                <div
                  style={{
                    minWidth: 18,
                    height: 18,
                    borderRadius: 999,
                    padding: "0 6px",
                    display: "grid",
                    placeItems: "center",
                    background: accent,
                    color: brand.bg,
                    fontWeight: 950,
                    fontSize: 12,
                  }}
                >
                  {unread}
                </div>
              )}
              {unread === 0 && <div style={{ width: 8, height: 8, borderRadius: 999, background: accent, opacity: 0.75 }} />}
            </div>
            {r.subtitle ? (
              <div style={{ marginTop: 4, color: brand.hint, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.subtitle}
              </div>
            ) : null}
          </div>

          <div style={{ color: brand.hint }}>
            <Icon name="chev" size={18} />
          </div>
        </div>
      </button>
    );
  };

  // ---------- People (mobile chips) ----------
  const PersonChip = ({ p }: { p: Person }) => {
    const col = p.color ?? brand.violet;
    const online = p.status === "online";
    return (
      <button
        type="button"
        onClick={() => {
          const target = rooms.find((r) => r.id === "friends")?.id ?? "friends";
          props.onOpenRoom?.(target);
        }}
        style={{
          border: `1px solid ${brand.border}`,
          background: brand.surface2,
          borderRadius: 18,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          cursor: "pointer",
          minWidth: 0,
          boxShadow: brand.shadow,
        }}
        title={p.name}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: "rgba(0,0,0,0.25)",
              border: `1px solid ${brand.border}`,
              display: "grid",
              placeItems: "center",
              color: col,
              fontWeight: 950,
            }}
          >
            {p.name.slice(0, 1).toUpperCase()}
          </div>
          <div
            style={{
              position: "absolute",
              right: -1,
              bottom: -1,
              width: 10,
              height: 10,
              borderRadius: 999,
              background: online ? brand.green : "rgba(255,255,255,0.18)",
              border: `2px solid ${brand.bg}`,
            }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: brand.text, fontWeight: 950, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
        </div>
      </button>
    );
  };

  // ---------- Header ----------
  const ShellHeader = () => {
    // Desktop: no + in header. Mobile: + stays.
    return (
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 200,
          background: brand.headerBg,
          borderBottom: `1px solid ${brand.line}`,
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* Left: cabinet button (square) */}
          <button
            type="button"
            onClick={() => openProfile?.()}
            title="Кабинет"
            aria-label="Кабинет"
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              border: `1px solid ${brand.border}`,
              background: "rgba(0,0,0,0.25)",
              color: brand.text,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <div style={{ transform: "translateY(-1px)", opacity: 0.95 }}>🦭</div>
          </button>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 950,
                  fontSize: 18,
                  color: brand.green,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {meName}
              </div>

              {deviceLabel ? (
                <div style={{ color: brand.hint, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {deviceLabel}
                </div>
              ) : null}

              <div style={{ flex: 1 }} />
            </div>
          </div>

          {/* Right: search always */}
          {!isDesktop && (
            <>
              {/* Mobile: + action menu */}
              <IconBtn
                title="Действия"
                onClick={() => setActionOpen((v) => !v)}
                color={brand.violet}
                bg={"rgba(190,149,250,0.10)"}
                border={`1px solid ${brand.border}`}
              >
                <span ref={actionBtnRef as any} style={{ display: "grid", placeItems: "center" }}>
                  <Icon name="plus" size={22} />
                </span>
              </IconBtn>
            </>
          )}

          <IconBtn
            title="Поиск"
            onClick={() => openSearch?.()}
            color={brand.text}
            bg={"rgba(255,255,255,0.04)"}
            border={`1px solid ${brand.border}`}
          >
            <Icon name="search" size={20} />
          </IconBtn>

          {/* Mobile popover */}
          {!isDesktop && (
            <Popover
              open={actionOpen}
              onClose={() => setActionOpen(false)}
              anchorRef={actionBtnRef as any}
              line={brand.line}
              surface={"rgba(0,0,0,0.55)"}
            >
              <div style={{ padding: 10 }}>
                <div style={{ color: brand.hint, fontSize: 12, fontWeight: 900, padding: "4px 8px 8px" }}>Создать</div>

                <button
                  type="button"
                  onClick={doCreateChat}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: `1px solid ${brand.border}`,
                    background: "rgba(255,255,255,0.05)",
                    color: brand.text,
                    borderRadius: 14,
                    padding: "10px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontWeight: 950,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 14,
                      border: `1px solid ${brand.border}`,
                      background: "rgba(190,149,250,0.14)",
                      color: brand.violet,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="hash" size={18} />
                  </div>
                  Создать чат / комнату
                </button>

                <div style={{ height: 10 }} />

                <button
                  type="button"
                  onClick={doShareFile}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: `1px solid ${brand.border}`,
                    background: "rgba(255,255,255,0.05)",
                    color: brand.text,
                    borderRadius: 14,
                    padding: "10px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontWeight: 950,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 14,
                      border: `1px solid ${brand.border}`,
                      background: "rgba(102,212,146,0.14)",
                      color: brand.green,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="upload" size={18} />
                  </div>
                  Поделиться файлом
                </button>
              </div>
            </Popover>
          )}
        </div>
      </div>
    );
  };

  function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          flex: 1,
          height: 38,
          borderRadius: 999,
          border: `1px solid ${brand.border}`,
          background: active ? "rgba(190,149,250,0.16)" : brand.surface2,
          color: active ? brand.violet : brand.text,
          fontWeight: 950,
          cursor: "pointer",
        }}
      >
        {label}
      </button>
    );
  }

  // ---------- Left sidebar ----------
  const LeftSidebar = () => (
    <div
      style={{
        borderRight: `1px solid ${brand.line}`,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: "calc(100vh - 72px)",
      }}
    >
      {/* Cabinet mini */}
      <div
        style={{
          border: `1px solid ${brand.border}`,
          background: brand.surface,
          borderRadius: 22,
          padding: 14,
          boxShadow: brand.shadow,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <AvatarSquare label={meName} color={brand.violet} online size={46} rounded={18} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 950, color: brand.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meName}</div>
            {deviceLabel ? <div style={{ color: brand.hint, fontSize: 12 }}>{deviceLabel}</div> : null}
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: `1px solid ${brand.border}`,
              background: "rgba(0,0,0,0.18)",
              color: brand.hint,
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            🔒 private-by-default
          </div>
          <div
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: `1px solid ${brand.border}`,
              background: "rgba(0,0,0,0.18)",
              color: brand.hint,
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            ⚡ p2p links
          </div>
        </div>
      </div>

      {/* People (no per-row card; rows separated by lines) */}
      <div
        style={{
          border: `1px solid ${brand.border}`,
          background: brand.surface,
          borderRadius: 22,
          padding: 14,
          boxShadow: brand.shadow,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ color: brand.text, fontWeight: 950 }}>Люди</div>
          <div style={{ color: brand.hint, fontSize: 12 }}>{people.length}</div>
        </div>

        <div style={{ marginTop: 12 }}>
          {people.map((p, idx) => (
            <React.Fragment key={p.id}>
              <PersonRowBare p={p} />
              {idx !== people.length - 1 && <div style={{ height: 1, background: brand.line, opacity: 0.8, margin: "10px 0" }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Pinned */}
      <div
        style={{
          border: `1px solid ${brand.border}`,
          background: brand.surface,
          borderRadius: 22,
          padding: 14,
          boxShadow: brand.shadow,
        }}
      >
        <div style={{ color: brand.text, fontWeight: 950 }}>Закрепы</div>
        <div style={{ marginTop: 10, color: brand.hint, fontSize: 12, lineHeight: 1.35 }}>
          Позже тут будет: избранные чаты, шаренные папки, активные девайсы и быстрый доступ к файлам.
        </div>
      </div>
    </div>
  );

  const PersonRowBare = ({ p }: { p: Person }) => {
    const col = p.color ?? brand.violet;
    const online = p.status === "online";

    return (
      <button
        type="button"
        onClick={() => {
          const target = rooms.find((r) => r.id === "friends")?.id ?? "friends";
          props.onOpenRoom?.(target);
        }}
        style={{
          width: "100%",
          textAlign: "left",
          border: "none",
          background: "transparent",
          padding: "4px 2px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: brand.text,
        }}
        title={p.name}
        aria-label={p.name}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: "rgba(0,0,0,0.25)",
              border: `1px solid ${brand.border}`,
              display: "grid",
              placeItems: "center",
              color: col,
              fontWeight: 950,
            }}
          >
            {p.name.slice(0, 1).toUpperCase()}
          </div>
          <div
            style={{
              position: "absolute",
              right: -1,
              bottom: -1,
              width: 11,
              height: 11,
              borderRadius: 999,
              background: online ? brand.green : "rgba(255,255,255,0.18)",
              border: `2px solid ${brand.bg}`,
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: brand.text, fontWeight: 950, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
        </div>

        <div style={{ color: brand.hint }}>
          <Icon name="chev" size={18} />
        </div>
      </button>
    );
  };

  // ---------- Right panel ----------
  const RightPanel = () => (
    <div
      style={{
        borderLeft: `1px solid ${brand.line}`,
        padding: 14,
        minHeight: "calc(100vh - 72px)",
      }}
    >
      <div
        style={{
          border: `1px solid ${brand.border}`,
          background: brand.surface,
          borderRadius: 22,
          padding: 14,
          boxShadow: brand.shadow,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ color: brand.text, fontWeight: 950 }}>Контекст</div>

          {/* Desktop: second button here (no +) */}
          <button
            type="button"
            onClick={doShareFile}
            style={{
              height: 30,
              borderRadius: 999,
              border: `1px solid ${brand.border}`,
              background: "rgba(102,212,146,0.10)",
              color: brand.green,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "0 10px",
              fontWeight: 950,
              fontSize: 12,
            }}
            title="Поделиться файлом"
            aria-label="Поделиться файлом"
          >
            <Icon name="upload" size={16} />
            Поделиться
          </button>
        </div>

        <div style={{ height: 1, background: brand.line, margin: "12px 0" }} />

        <div style={{ display: "grid", gap: 10 }}>
          <MiniCard title="storage" value="~48 GB free" />
          <MiniCard title="folder" value={`/margeleT/rooms/${"margelet-public"}`} />
          <MiniCard title="recent" value="пока пусто (подключим позже)" />
        </div>

        <div style={{ height: 1, background: brand.line, margin: "12px 0" }} />

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ color: brand.text, fontWeight: 950 }}>Shared</div>
          <div style={{ color: brand.hint, fontSize: 12 }}>local</div>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                border: `1px solid ${brand.border}`,
                background: brand.surface2,
                borderRadius: 18,
                padding: 12,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 14,
                  border: `1px solid ${brand.border}`,
                  background: "rgba(0,0,0,0.22)",
                  display: "grid",
                  placeItems: "center",
                  color: brand.sand,
                }}
              >
                <Icon name="folder" size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: brand.text, fontWeight: 950, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  Shared item #{i + 1}
                </div>
                <div style={{ color: brand.hint, fontSize: 11 }}>P2P link • local only</div>
              </div>
              <div style={{ color: brand.hint }}>
                <Icon name="chev" size={18} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const MiniCard = ({ title, value }: { title: string; value: string }) => (
    <div
      style={{
        border: `1px solid ${brand.border}`,
        background: brand.surface2,
        borderRadius: 18,
        padding: 12,
      }}
    >
      <div style={{ color: brand.hint, fontSize: 12 }}>{title}</div>
      <div style={{ marginTop: 4, color: brand.text, fontWeight: 950, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}
      </div>
    </div>
  );

  // ---------- Main list ----------
  const MobilePeopleRail = () => (
    <div style={{ overflowX: "auto", paddingBottom: 6 }}>
      <div style={{ display: "flex", gap: 10, padding: "0 14px" }}>
        {people.map((p) => (
          <PersonChip key={p.id} p={p} />
        ))}
      </div>
    </div>
  );

  const MobileTabsRow = () => (
    <div style={{ padding: "10px 14px 0" }}>
      <div style={{ display: "flex", gap: 10 }}>
        <TabBtn label="Чаты" active={activeTab === "chats"} onClick={() => setActiveTab("chats")} />
        <TabBtn label="Файлы" active={activeTab === "files"} onClick={() => setActiveTab("files")} />
      </div>
    </div>
  );

  const MainList = () => {
    const filtered =
      activeTab === "files"
        ? rooms.filter((r) => r.id === "files")
        : rooms.filter((r) => r.id !== "files");

    return (
      <div style={{ padding: 14, paddingBottom: 110 /* space for P2P footer */ }}>
        {!isDesktop && <MobileTabsRow />}
        {!isDesktop && <div style={{ paddingTop: 12 }} />}
        {!isDesktop && <MobilePeopleRail />}

        <div style={{ padding: "10px 0 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ color: brand.text, fontWeight: 950, fontSize: 16 }}>{activeTab === "files" ? "Хранилище" : "Комнаты"}</div>
            <div style={{ flex: 1 }} />

            {/* Desktop: first action button here (no + in header) */}
            {isDesktop && (
              <button
                type="button"
                onClick={doCreateChat}
                style={{
                  height: 30,
                  borderRadius: 999,
                  border: `1px solid ${brand.border}`,
                  background: "rgba(190,149,250,0.10)",
                  color: brand.violet,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 10px",
                  fontWeight: 950,
                  fontSize: 12,
                }}
                title="Создать чат / комнату"
                aria-label="Создать чат / комнату"
              >
                <Icon name="plus" size={16} />
                Создать
              </button>
            )}
          </div>

          <div style={{ marginTop: 6, color: brand.hint, fontSize: 12 }}>
            {activeTab === "files" ? "Шары, ссылки, доступы. Всё локально на устройствах." : "Приватные чаты, публичные комнаты и быстрые входы."}
          </div>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((r) => (
            <RoomCard key={r.id} r={r} />
          ))}
        </div>
      </div>
    );
  };

  // ---------- P2P footer (always bottom) ----------
  const [p2pExpanded, setP2pExpanded] = useState(false);

  const [p2pState, setP2pState] = useState<TransferState>("active");
  const [transfers, setTransfers] = useState<Transfer[]>(() => [
    { id: "t1", filename: "item_76a3.bin", kind: "download", progress: 100, peerId: "p1", peerLabel: "from: Друг", speed: "", eta: "" },
    { id: "t2", filename: "item_42de.bin", kind: "download", progress: 68, peerId: "p2", peerLabel: "from: Nika", speed: "2.1 MB/s", eta: "00:27" },
    { id: "t3", filename: "design-pack.zip", kind: "upload", progress: 100, peerId: "p1", peerLabel: "to: Друг", speed: "6.2 MB/s", eta: "00:41" },
    { id: "t4", filename: "video-call.webm", kind: "stopped", progress: 100, peerId: "p2", peerLabel: "to: Nika", speed: "1.1 MB/s", eta: "03:12" },
    { id: "t5", filename: "movie-stream.mp4", kind: "watch", progress: 42, peerId: "p3", peerLabel: "watch: Max", speed: "live", eta: "" },
  ]);

  const transferAccent = (k: TransferKind) => {
    if (k === "download") return brand.green;
    if (k === "upload") return brand.pink;
    if (k === "watch") return brand.watch;
    return brand.sand; // stopped
  };

  const transferLabel = (t: Transfer) => {
    if (t.progress >= 100 && t.kind !== "stopped") return "done";
    if (t.kind === "download") return "download";
    if (t.kind === "upload") return "upload";
    if (t.kind === "watch") return "watch";
    return "stopped";
  };

  const activeTransfer = useMemo(() => {
    // pick first non-done OR any watch OR any stopped; priority: active progress <100, then watch, then last
    const notDone = transfers.find((t) => t.progress < 100 && t.kind !== "stopped");
    if (notDone) return notDone;
    const watch = transfers.find((t) => t.kind === "watch");
    if (watch) return watch;
    return transfers[0] ?? null;
  }, [transfers]);

  const overallAccent = activeTransfer ? transferAccent(activeTransfer.kind) : brand.hint;
  const overallProgress = activeTransfer ? clamp(activeTransfer.progress, 0, 100) : 0;

  const onOpenFolder = (t: Transfer) => {
    window.alert(`📁 Open folder (mock): ${t.filename}`);
  };

  const onTogglePause = (t: Transfer) => {
    // UI-only mock: flip between active/stopped for demonstration
    setTransfers((prev) =>
      prev.map((x) => {
        if (x.id !== t.id) return x;
        if (x.kind === "stopped") return { ...x, kind: "download" }; // resume as download mock
        return { ...x, kind: "stopped" };
      })
    );
  };

  const onRemoveTransfer = (t: Transfer) => {
    setTransfers((prev) => prev.filter((x) => x.id !== t.id));
  };

  const P2PFooter = () => (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 300,
        background: "rgba(0,0,0,0.25)",
        backdropFilter: "blur(12px)",
        borderTop: `1px solid ${brand.line}`,
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>
        {/* Collapsed status bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
              flex: 1,
            }}
          >
            <div style={{ color: overallAccent, display: "grid", placeItems: "center" }}>
              <Icon name="spark" size={18} />
            </div>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <div style={{ color: brand.text, fontWeight: 950, fontSize: 13 }}>P2P</div>
                <div style={{ color: brand.hint, fontSize: 12 }}>{p2pState}</div>
                <div style={{ flex: 1 }} />
                {activeTransfer ? (
                  <div style={{ color: brand.hint, fontSize: 12, whiteSpace: "nowrap" }}>
                    {activeTransfer.filename} • {transferLabel(activeTransfer)}
                  </div>
                ) : (
                  <div style={{ color: brand.hint, fontSize: 12 }}>idle</div>
                )}
              </div>

              <div
                style={{
                  marginTop: 6,
                  height: 4,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.10)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${overallProgress}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: overallAccent,
                    transition: "width 0.25s ease",
                  }}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setP2pExpanded((v) => !v)}
            style={{
              height: 32,
              borderRadius: 999,
              border: `1px solid ${brand.border}`,
              background: "rgba(255,255,255,0.04)",
              color: brand.text,
              cursor: "pointer",
              padding: "0 10px",
              fontWeight: 950,
              fontSize: 12,
              whiteSpace: "nowrap",
            }}
          >
            {p2pExpanded ? "Свернуть" : "Развернуть"}
          </button>
        </div>

        {/* Expanded list: no card container; rows with separators */}
        {p2pExpanded && (
          <div style={{ padding: "0 14px 12px" }}>
            <div style={{ height: 1, background: brand.line, marginBottom: 10 }} />

            <div style={{ display: "grid", gap: 0 }}>
              {transfers.map((t, idx) => {
                const accent = transferAccent(t.kind);
                const label = transferLabel(t);
                const pct = clamp(t.progress, 0, 100);
                const isDone = pct >= 100 && t.kind !== "stopped";

                const peer = getPerson(t.peerId);
                const peerColor = peer?.color ?? accent;
                const peerOnline = peer?.status === "online";

                return (
                  <React.Fragment key={t.id}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "44px 1fr 140px",
                        gap: 12,
                        alignItems: "center",
                        padding: "10px 0",
                      }}
                    >
                      {/* Avatar instead of dots */}
                      <div style={{ display: "grid", placeItems: "center" }}>
                        {peer ? (
                          <AvatarSquare
                            label={peer.name}
                            color={peerColor}
                            online={peerOnline}
                            size={40}
                            rounded={14}
                          />
                        ) : (
                          <AvatarSquare
                            label={"U"}
                            color={peerColor}
                            online
                            size={40}
                            rounded={14}
                          />
                        )}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
                          <div
                            style={{
                              color: brand.text,
                              fontWeight: 950,
                              fontSize: 13,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {t.filename}
                          </div>

                          <div style={{ color: accent, fontSize: 12, fontWeight: 950, whiteSpace: "nowrap" }}>
                            {label}
                          </div>

                          <div style={{ flex: 1 }} />

                          <div style={{ color: brand.hint, fontSize: 12, whiteSpace: "nowrap" }}>{pct}%</div>
                        </div>

                        <div
                          style={{
                            marginTop: 6,
                            height: 4,
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.10)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              borderRadius: 999,
                              background: isDone ? brand.green : accent,
                              transition: "width 0.25s ease",
                            }}
                          />
                        </div>

                        <div style={{ marginTop: 6, display: "flex", gap: 10, color: brand.hint, fontSize: 11 }}>
                          <div style={{ whiteSpace: "nowrap" }}>{t.peerLabel ?? "—"}</div>
                          <div style={{ flex: 1 }} />
                          {t.speed ? <div style={{ whiteSpace: "nowrap" }}>{t.speed}</div> : null}
                          {t.eta ? <div style={{ whiteSpace: "nowrap" }}>{t.eta}</div> : null}
                        </div>
                      </div>

                      {/* Controls: pause/resume + open folder + remove */}
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <IconBtn
                          title={t.kind === "stopped" ? "Продолжить" : "Пауза"}
                          onClick={() => onTogglePause(t)}
                          color={brand.text}
                          bg={"rgba(255,255,255,0.04)"}
                          border={`1px solid ${brand.border}`}
                          size={34}
                        >
                          {t.kind === "stopped" ? <Icon name="play" size={18} /> : <Icon name="pause" size={18} />}
                        </IconBtn>

                        {/* Folder instead of X */}
                        <IconBtn
                          title="Папка файла"
                          onClick={() => onOpenFolder(t)}
                          color={brand.text}
                          bg={"rgba(255,255,255,0.04)"}
                          border={`1px solid ${brand.border}`}
                          size={34}
                        >
                          <Icon name="folder" size={18} />
                        </IconBtn>

                        <IconBtn
                          title="Убрать"
                          onClick={() => onRemoveTransfer(t)}
                          color={brand.hint}
                          bg={"rgba(255,255,255,0.03)"}
                          border={`1px solid ${brand.border}`}
                          size={34}
                        >
                          <Icon name="x" size={18} />
                        </IconBtn>
                      </div>
                    </div>

                    {idx !== transfers.length - 1 && <div style={{ height: 1, background: brand.line, opacity: 0.85 }} />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ---------- Layout ----------
  return (
    <div
      style={{
        minHeight: "100vh",
        background: brand.bg,
        color: brand.text,
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      <ShellHeader />

      {/* Desktop layout: Left | Main | Right */}
      {isDesktop ? (
        <div
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "320px 1fr 340px",
            minHeight: "calc(100vh - 72px)",
          }}
        >
          <LeftSidebar />
          <div style={{ minWidth: 0 }}>
            <MainList />
          </div>
          <RightPanel />
        </div>
      ) : (
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          <MainList />
        </div>
      )}

      {/* P2P footer always */}
      <P2PFooter />

      {/* Create room modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} line={brand.line} surface={"rgba(0,0,0,0.55)"} text={brand.text}>
        <div style={{ padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>Создать комнату</div>
          <button
            type="button"
            onClick={() => setCreateOpen(false)}
            style={{ border: "none", background: "transparent", color: brand.text, cursor: "pointer" }}
            aria-label="Закрыть"
            title="Закрыть"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div style={{ height: 1, background: brand.line }} />

        <div style={{ padding: 14, display: "grid", gap: 12 }}>
          <div>
            <div style={{ color: brand.hint, fontSize: 12, marginBottom: 8 }}>Название</div>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Например: дизайн / команда / семья…"
              style={{
                width: "100%",
                height: 44,
                borderRadius: 14,
                border: `1px solid ${brand.border}`,
                background: "rgba(255,255,255,0.06)",
                color: brand.text,
                padding: "0 12px",
                outline: "none",
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <div style={{ color: brand.hint, fontSize: 12, marginBottom: 8 }}>Тип</div>
            <div style={{ display: "flex", gap: 10 }}>
              {/* PRIVATE = pink */}
              <button
                type="button"
                onClick={() => setNewType("private")}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 999,
                  border: `1px solid ${brand.border}`,
                  background: newType === "private" ? "rgba(255,115,198,0.18)" : "rgba(255,255,255,0.05)",
                  color: newType === "private" ? brand.pink : brand.text,
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                🔒 Приватная
              </button>

              {/* PUBLIC = violet */}
              <button
                type="button"
                onClick={() => setNewType("public")}
                style={{
                  flex: 1,
                  height: 40,
                  borderRadius: 999,
                  border: `1px solid ${brand.border}`,
                  background: newType === "public" ? "rgba(190,149,250,0.18)" : "rgba(255,255,255,0.05)",
                  color: newType === "public" ? brand.violet : brand.text,
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                🌍 Публичная
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={createRoom}
            disabled={!canCreate}
            style={{
              height: 44,
              borderRadius: 16,
              border: `1px solid ${brand.border}`,
              background: canCreate ? "rgba(190,149,250,0.22)" : "rgba(255,255,255,0.06)",
              color: canCreate ? brand.violet : brand.hint,
              fontWeight: 950,
              cursor: canCreate ? "pointer" : "not-allowed",
            }}
          >
            Создать
          </button>

          <div style={{ color: brand.hint, fontSize: 12, lineHeight: 1.35 }}>
            Сейчас это мок. Позже: настройки комнаты, участники, права, репликация и P2P-шаринг файлов.
          </div>
        </div>
      </Modal>
    </div>
  );
}

/** Hook: media query */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const m = window.matchMedia(query);

    const update = () => setMatches(!!m.matches);
    update();

    // Safari compatibility
    if ((m as any).addEventListener) {
      m.addEventListener("change", update);
      return () => m.removeEventListener("change", update);
    } else {
      m.addListener(update);
      return () => m.removeListener(update);
    }
  }, [query]);

  return matches;
}