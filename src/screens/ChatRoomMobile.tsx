import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

type ThemeMode = "dark" | "light";

type Msg = {
  id: string;
  ts: number;
  from: "me" | "other" | "system";
  text: string;
};

export type ChatRoomProps = {
  roomId: string;
  onBack?: () => void;

  // App routing callbacks (new names)
  onOpenProfile?: () => void;
  onOpenSearch?: () => void;

  // Back-compat (old names)
  onProfile?: () => void;
  onSearch?: () => void;

  // Data
  displayName?: string;
  deviceLabel?: string;

  // Layout helper: when rendered inside Desktop column
  embedded?: boolean;

  // Allow passing extra props without TS explosions while we refactor
  [key: string]: any;
};

function nowId() {
  return `m_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString([], { year: "numeric", month: "long", day: "numeric" });
}

function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToInt(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function Icon({
  name,
  size = 20,
}: {
  name:
    | "back"
    | "morzha"
    | "smile"
    | "clip"
    | "send"
    | "search"
    | "phone"
    | "chevDown"
    | "mic"
    | "x"
    | "down"
    | "edit"
    | "trash"
    | "react"
    | "check";
  size?: number;
}) {
  const common: React.CSSProperties = { width: size, height: size, display: "block" };

  if (name === "back") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M14.5 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "smile") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" />
        <path d="M8.5 10.2h.01M15.5 10.2h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M8.2 14.2c.9 1.4 2.2 2.1 3.8 2.1s2.9-.7 3.8-2.1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "clip") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path
          d="M8.5 12.5l6.9-6.9a3 3 0 114.2 4.2l-8.6 8.6a5 5 0 11-7.1-7.1l9.2-9.2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "send") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M5 12h13" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M14 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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

  if (name === "phone") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path
          d="M7 3h3l1 5-2 1c1.1 2.6 3.3 4.8 5.9 5.9l1-2 5 1v3c0 1.1-.9 2-2 2A15 15 0 013 7c0-1.1.9-2 2-2z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "chevDown") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "mic") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M12 14a3 3 0 003-3V7a3 3 0 10-6 0v4a3 3 0 003 3z" stroke="currentColor" strokeWidth="2" />
        <path d="M19 11a7 7 0 01-14 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

  if (name === "down") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M12 5v12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M7 13l5 5 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "edit") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path
          d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4 11.5-11.5z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "trash") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 7V5h6v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 7l1 14h8l1-14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "react") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path
          d="M12 21s-7-4.6-7-10a4 4 0 017-2 4 4 0 017 2c0 5.4-7 10-7 10z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg style={common} viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // placeholder for morzha + default
  return (
    <svg style={common} viewBox="0 0 24 24" fill="none">
      <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" stroke="currentColor" strokeWidth="2" />
      <path d="M8 13c1.2 1 2.6 1.5 4 1.5s2.8-.5 4-1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M6.8 14.7l-2 1M6.8 12.8l-2-1M17.2 14.7l2 1M17.2 12.8l2-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBtn({
  title,
  onClick,
  children,
  color,
}: {
  title: string;
  onClick?: () => void;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{
        width: 36,
        height: 36,
        border: "none",
        background: "transparent",
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

function AutoGrowTextarea({
  value,
  onChange,
  onSend,
  placeholder,
  bg,
  border,
  color,
  inputRef,
  onFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  placeholder: string;
  bg: string;
  border: string;
  color: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  onFocus?: () => void;
}) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);
  const ref = inputRef ?? innerRef;

  useEffect(() => {
    const ta = ref.current;
    if (!ta) return;
    ta.style.height = "44px";
    const h = clamp(ta.scrollHeight, 44, 120);
    ta.style.height = `${h}px`;
    ta.style.overflowY = "hidden";
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => onFocus?.()}
      style={{
        width: "100%",
        resize: "none",
        borderRadius: 18,
        border: `1px solid ${border}`,
        background: bg,
        color,
        padding: "12px 48px 12px 44px",
        outline: "none",
        fontSize: 15,
        lineHeight: 1.35,
        height: 44,
        maxHeight: 120,
        overflowY: "hidden",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        display: "block",
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSend();
        }
      }}
    />
  );
}

export default function ChatRoomMobile(props: ChatRoomProps) {
  const openProfile = props.onOpenProfile ?? props.onProfile;
  const openSearch = props.onOpenSearch ?? props.onSearch;


  // --- P2P wiring (injected by ChatRoom.tsx) --------------------------------
  const p2pState = (props as any).p2pState as string | undefined;
  const p2pChatLog = ((props as any).p2pChatLog ?? (props as any).p2p?.chatLog) as
    | Array<{ from: string; text: string; ts: number }>
    | undefined;
  const p2pSendChat = ((props as any).p2pSendChat ?? (props as any).p2p?.sendChat) as
    | ((t: string) => boolean)
    | undefined;
  const p2pMeId = ((props as any).p2pMeId ?? (props as any).p2pMeId) as string | undefined;
  const p2pPeerId = ((props as any).p2pPeerId ?? (props as any).peerId ?? (props as any).peerDeviceId) as
    | string
    | undefined;

  const p2pEnabled = !!p2pSendChat && !!p2pPeerId;

  // --- Mobile keyboard fix (iOS/Android) -------------------------------------
  const [keyboardInset, setKeyboardInset] = useState(0);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (props.embedded) return; // desktop embedded: keyboard handled by container
    const vv = (window as any).visualViewport as VisualViewport | undefined;
    if (!vv) return;

    const update = () => {
      // keyboardInset = сколько "съело" viewport по высоте
      const inset = Math.max(0, Math.round(window.innerHeight - vv.height - (vv.offsetTop || 0)));
      setKeyboardInset(inset);
      // когда клавиатура открылась и фокус в инпуте — держим низ
      if (document.activeElement === inputRef.current) {
        requestAnimationFrame(() => {
          
        });
      }
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("orientationchange", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.embedded]);

  const title = useMemo(() => {
    if (props.roomId === "margelet-public") return "margeleT • общий";
    if (props.roomId === "friends") return "Друзья";
    if (props.roomId === "files") return "Файлы";
    return "Комната";
  }, [props.roomId]);

  const storeKey = `margelet_room_msgs_${props.roomId}`;
  const themeKey = `margelet_room_theme`;

  const [mode] = useState<ThemeMode>(() => {
    try {
      const v = localStorage.getItem(themeKey);
      return v === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  const ui = useMemo(() => {
    const isDark = mode === "dark";
    return {
      pageBg: isDark ? "#272632" : "#F5F4F8",
      headerBg: isDark ? "#1E1D27" : "#FFFFFF",
      composerBg: isDark ? "#1E1D27" : "#FFFFFF",
      line: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
      text: isDark ? "#EAE5E3" : "#1E1B22",
      hint: isDark ? "rgba(234,229,227,0.45)" : "rgba(30,27,34,0.45)",

      green: "#66D492",
      pink: "#FF73C6",
      violet: "#BE95FA",

      bubbleMe: isDark ? "#3B2F4C" : "#E7DCFF",
      bubbleOther: isDark ? "#3A3946" : "#FFFFFF",
      bubbleSystem: isDark ? "#2B2A35" : "#ECEAF3",

      inputBg: isDark ? "#2B2A35" : "#F3F2F7",
      inputBorder: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",

      back: "#FF73C6",
      shadow: isDark ? "0 3px 8px rgba(0,0,0,0.10)" : "0 5px 12px rgba(0,0,0,0.10)",
    };
  }, [mode]);

    const [msgs, setMsgs] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(storeKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Msg[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

// Собираем единый список сообщений:
  // - локальные system/моки (msgs)
  // - P2P chat log (из useP2PSession)
  const displayMsgs: Msg[] = useMemo(() => {
    const out: Msg[] = [];

    // локальные сообщения (system + fallback)
    out.push(...msgs);

    // P2P: превращаем в Msg, чтобы не переписывать UI
    if (p2pChatLog && p2pChatLog.length) {
      const me = p2pMeId ?? meIdFallback();
      for (let i = 0; i < p2pChatLog.length; i++) {
        const m = p2pChatLog[i];
        const from = m.from === me ? "me" : "other";
        out.push({
          id: `p2p_${m.ts}_${i}`,
          ts: m.ts,
          from,
          text: m.text,
        });
      }
    }

    // сортируем по времени (моки могут быть с прошлым ts)
    out.sort((a, b) => a.ts - b.ts);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgs, p2pChatLog, p2pMeId]);

  function meIdFallback() {
    // если ChatRoom.tsx ещё не прокинул — используем стабильный localStorage id
    try {
      const v = localStorage.getItem("margelet_peer_id_v1");
      if (v) return v;
    } catch {}
    return "me";
  }


  useEffect(() => {
    try {
      localStorage.setItem(storeKey, JSON.stringify(msgs));
    } catch {}
  }, [msgs, storeKey]);

  const [text, setText] = useState("");

  const listRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 👇 флаг “насильно вниз”
  const forceScrollRef = useRef(false);
  const [showJump, setShowJump] = useState(false);

  const [callMenuOpen, setCallMenuOpen] = useState(false);
  const [datesMenuOpen, setDatesMenuOpen] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const [hoverId, setHoverId] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);

  const storageInfo = useMemo(() => {
    const approxFreeGb = 48; // mock
    const folder = `/margeleT/rooms/${props.roomId}`;
    return { approxFreeGb, folder };
  }, [props.roomId]);

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    // ✅ самый надежный якорь: sentinel в конце списка
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior, block: "end" });
      return;
    }
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const isNearBottom = () => {
    const el = listRef.current;
    if (!el) return true;
    const distance = el.scrollHeight - (el.scrollTop + el.clientHeight);
    return distance < 140;
  };

  useLayoutEffect(() => {
    // ✅ если forceScroll — всегда вниз (это для send)
    if (forceScrollRef.current) {
      forceScrollRef.current = false;
      scrollToBottom("auto");
      requestAnimationFrame(() => scrollToBottom("auto"));
      return;
    }

    // обычное поведение — держим низ только если юзер уже внизу
    if (isNearBottom()) scrollToBottom("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMsgs.length]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onScroll = () => setShowJump(!isNearBottom());

    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // пока печатаешь — если ты внизу, держим низ
  useEffect(() => {
    if (!text) return;
    if (isNearBottom()) scrollToBottom("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const pushSystem = (t: string) => {
    forceScrollRef.current = true;
    setMsgs((p) => [...p, { id: nowId(), ts: Date.now(), from: "system", text: t }]);
  };

  const openUserProfile = (who: "me" | "other") => {
    pushSystem(`Профиль пользователя: ${who === "me" ? (props.displayName?.trim() || "User") : "Друг"} (позже)`);
  };

  const daysIndex = useMemo(() => {
    const map = new Map<string, { label: string; firstMsgId: string; ts: number }>();
    for (const m of displayMsgs) {
      if (m.from === "system") continue;
      const k = dayKey(m.ts);
      if (!map.has(k)) map.set(k, { label: fmtDate(m.ts), firstMsgId: m.id, ts: m.ts });
    }
    return Array.from(map.values()).sort((a, b) => a.ts - b.ts);
  }, [displayMsgs]);

  const scrollToMsg = (id: string) => {
    const el = listRef.current;
    if (!el) return;
    const node = el.querySelector(`[data-msg-id="${id}"]`) as HTMLElement | null;
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ✅ ВАЖНОЕ: всегда вниз при send, даже если был наверху
  const send = () => {
    const v = text.trim();
    if (!v) return;

    forceScrollRef.current = true;

    // 1) P2P first (если включён)
    if (p2pSendChat && p2pPeerId) {
      const ok = p2pSendChat(v);
      if (ok) {
        setText("");
        // держим низ (особенно на мобилке с клавой)
        requestAnimationFrame(() => {
          scrollToBottom("smooth");
          requestAnimationFrame(() => scrollToBottom("smooth"));
        });
        return;
      }

      // если не отправилось — покажем системку и оставим fallback
      setMsgs((prev) => [
        ...prev,
        {
          id: nowId(),
          ts: Date.now(),
          from: "system",
          text: p2pState === "connecting" ? "🛰️ P2P ещё подключается…" : "🛰️ P2P не готов (нет канала).",
        },
      ]);
    }

    // 2) Fallback (локальный мок, чтобы UI не был пустой)
    setMsgs((prev) => [...prev, { id: nowId(), ts: Date.now(), from: "me", text: v }]);
    setText("");

    requestAnimationFrame(() => {
      scrollToBottom("smooth");
      requestAnimationFrame(() => scrollToBottom("smooth"));
    });

    // Мок-ответ оставляем только если P2P не включён
    if (!p2pEnabled) {
      window.setTimeout(() => {
        const shouldAutoScroll = isNearBottom();
        if (shouldAutoScroll) forceScrollRef.current = true;

        setMsgs((prev) => [
          ...prev,
          { id: nowId(), ts: Date.now(), from: "other", text: "Ок. Сейчас подключим настоящий P2P чат 😈" },
        ]);
      }, 600);
    }
  };

  const editMsg = (id: string) => {
    const cur = displayMsgs.find((m) => m.id === id);
    if (!cur || cur.from === "system") return;
    const next = window.prompt("Редактировать сообщение:", cur.text);
    if (next === null) return;
    setMsgs((p) => p.map((m) => (m.id === id ? { ...m, text: next } : m)));
  };

  const deleteMsg = (id: string) => {
    const cur = displayMsgs.find((m) => m.id === id);
    if (!cur || cur.from === "system") return;
    const ok = window.confirm("Удалить сообщение у себя?");
    if (!ok) return;
    setMsgs((p) => p.filter((m) => m.id !== id));
  };

  const reactMsg = (id: string) => {
    const cur = displayMsgs.find((m) => m.id === id);
    if (!cur || cur.from === "system") return;
    pushSystem("Реакции: позже 😉");
  };

  const toggleSelectMode = (on: boolean) => {
    setSelectMode(on);
    setSelected({});
    setHoverId(null);
    setCallMenuOpen(false);
  };

  const toggleSelected = (id: string) => {
    setSelected((p) => ({ ...p, [id]: !p[id] }));
  };

  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected]);

  const deleteSelectedForMe = () => {
    if (selectedIds.length === 0) return;
    const ok = window.confirm(`Удалить выбранные сообщения у себя? (${selectedIds.length})`);
    if (!ok) return;
    setMsgs((p) => p.filter((m) => !selectedIds.includes(m.id)));
    toggleSelectMode(false);
  };

  const deleteSelectedForAll = () => {
    const onlyMine = selectedIds.filter((id) => displayMsgs.find((m) => m.id === id)?.from === "me");
    if (onlyMine.length === 0) return;
    const ok = window.confirm(`Удалить у всех (только твои)? (${onlyMine.length})`);
    if (!ok) return;

    setMsgs((p) => p.filter((m) => !onlyMine.includes(m.id)));
    toggleSelectMode(false);
    pushSystem(`Удаление у всех: мок (${onlyMine.length}) — позже сделаем tombstone/репликацию.`);
  };

  const startRecording = () => {
    if (recording) return;
    setRecording(true);
    pushSystem("🎙️ Запись голосового… (мок) держи кнопку");
  };
  const stopRecording = () => {
    if (!recording) return;
    setRecording(false);
    forceScrollRef.current = true;
    setMsgs((prev) => [...prev, { id: nowId(), ts: Date.now(), from: "me", text: "🎤 Голосовое сообщение (мок)" }]);
    requestAnimationFrame(() => {
      scrollToBottom("smooth");
      requestAnimationFrame(() => scrollToBottom("smooth"));
    });
  };

  const patternShapes = useMemo(() => {
    const seed = hashStringToInt(`${props.roomId}_${mode}_pattern_v3`);
    const rnd = mulberry32(seed);
    const colors = [ui.violet, ui.pink, ui.green];

    const shapes: Array<{ kind: "circle" | "square" | "tri"; x: number; y: number; s: number; r: number; c: string; o: number }> = [];
    for (let i = 0; i < 16; i++) {
      const kind = rnd() < 0.34 ? "circle" : rnd() < 0.5 ? "square" : "tri";
      shapes.push({
        kind,
        x: 8 + rnd() * 84,
        y: 10 + rnd() * 80,
        s: 30 + rnd() * 22,
        r: rnd() * 360,
        c: colors[Math.floor(rnd() * colors.length)],
        o: 0.032,
      });
    }
    return shapes;
  }, [props.roomId, mode, ui.violet, ui.pink, ui.green]);

  const openChatProfile = () => pushSystem("Профиль чата: (позже) аватар, название, участники, настройки…");

  const doCall = () => {
    setCallMenuOpen(false);
    pushSystem("Call: скоро подключим WebRTC.");
  };
  const doVideo = () => {
    setCallMenuOpen(false);
    pushSystem("Video: скоро подключим WebRTC.");
  };

  const copyFolder = async () => {
    const p = storageInfo.folder;
    try {
      if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(p);
      pushSystem(`📁 Папка: ${p} (скопировано)`);
    } catch {
      pushSystem(`📁 Папка: ${p}`);
    }
  };

  const hasText = text.trim().length > 0;

  // ✅ Telegram-like grouping: closer gap, no duplicate header, inner corners less rounded
  const Bubble = ({ m, prev, next }: { m: Msg; prev?: Msg; next?: Msg }) => {
    const isMe = m.from === "me";
    const isSystem = m.from === "system";

    const showDate = !prev || dayKey(prev.ts) !== dayKey(m.ts);
    const dateLabel = fmtDate(m.ts);

    const bubbleBg = isSystem ? ui.bubbleSystem : isMe ? ui.bubbleMe : ui.bubbleOther;

    const sameDayPrev = !!prev && dayKey(prev.ts) === dayKey(m.ts);
    const sameDayNext = !!next && dayKey(next.ts) === dayKey(m.ts);

    const groupedPrev = !isSystem && !!prev && prev.from === m.from && prev.from !== "system" && sameDayPrev;
    const groupedNext = !isSystem && !!next && next.from === m.from && next.from !== "system" && sameDayNext;

    const showHeader = !isSystem && !groupedPrev;

    // расстояние: внутри группы в 2 раза ближе
    const blockTop = !prev ? 0 : showDate ? 8 : groupedPrev ? 7 : 14;

    // радиусы: внутренние углы меньше, начало/конец — как было
    const radius = (() => {
      if (isSystem) return "16px";
      // tl tr br bl
      if (isMe) {
        const tl = 18;
        const tr = groupedPrev ? 10 : 6;
        const br = groupedNext ? 10 : 18;
        const bl = 18;
        return `${tl}px ${tr}px ${br}px ${bl}px`;
      } else {
        const tl = groupedPrev ? 10 : 6;
        const tr = 18;
        const br = 18;
        const bl = groupedNext ? 10 : 18;
        return `${tl}px ${tr}px ${br}px ${bl}px`;
      }
    })();

    const name = isMe ? props.displayName?.trim() || "User" : "Друг";
    const nameColor = isMe ? ui.green : ui.pink;
    const time = fmtTime(m.ts);

    const inSelect = selectMode && m.from !== "system";
    const checked = !!selected[m.id];

    const rowJustify = isSystem ? "center" : isMe ? "flex-end" : "flex-start";
    const maxWidth = isSystem ? "76%" : "72%";

    return (
      <>
        {showDate && !isSystem && (
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
            <button
              type="button"
              onClick={() => setDatesMenuOpen(true)}
              style={{
                border: `1px solid ${ui.line}`,
                background: mode === "dark" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.55)",
                color: ui.hint,
                padding: "6px 10px",
                borderRadius: 999,
                fontSize: 12,
                cursor: "pointer",
                backdropFilter: "blur(6px)",
              }}
              title="Перейти по дням"
              aria-label="Перейти по дням"
            >
              {dateLabel}
            </button>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: rowJustify, marginTop: blockTop }}>
          <div
            data-msg-id={m.id}
            onMouseEnter={() => setHoverId(m.id)}
            onMouseLeave={() => setHoverId((x) => (x === m.id ? null : x))}
            onContextMenu={(e) => {
              if (m.from === "system") return;
              e.preventDefault();
              if (!selectMode) setSelectMode(true);
              toggleSelected(m.id);
            }}
            onPointerDown={(e) => {
              if (m.from === "system") return;
              if (e.pointerType !== "touch") return;

              const id = m.id;
              let fired = false;

              const t = window.setTimeout(() => {
                fired = true;
                if (!selectMode) setSelectMode(true);
                setSelected((p) => ({ ...p, [id]: true }));
              }, 420);

              const clear = () => {
                window.clearTimeout(t);
                window.removeEventListener("pointerup", clear);
                window.removeEventListener("pointercancel", clear);
                window.removeEventListener("pointermove", clear);
              };

              window.addEventListener("pointerup", clear, { once: true });
              window.addEventListener("pointercancel", clear, { once: true });
              window.addEventListener(
                "pointermove",
                () => {
                  if (fired) return;
                  clear();
                },
                { once: true }
              );
            }}
            style={{
              position: "relative",
              width: "fit-content",
              maxWidth,
              background: bubbleBg,
              borderRadius: radius,
              padding: isSystem ? "10px 12px" : showHeader ? "10px 12px 12px" : "10px 12px",
              color: ui.text,
              boxShadow: ui.shadow,
              outline: inSelect && checked ? `2px solid ${ui.violet}` : "none",
              overflow: "visible",
              marginRight: isMe ? 2 : 0,
              marginLeft: isMe ? 0 : 2,
            }}
          >
            {showHeader && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 6,
                  fontSize: 12,
                }}
              >
                {isMe ? (
                  <>
                    <span style={{ color: ui.hint, fontSize: 11 }}>{time}</span>
                    <button
                      type="button"
                      onClick={() => openUserProfile("me")}
                      style={{
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        cursor: "pointer",
                        fontWeight: 900,
                        color: nameColor,
                        whiteSpace: "nowrap",
                      }}
                      title="Открыть профиль"
                      aria-label="Открыть профиль"
                    >
                      {name}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => openUserProfile("other")}
                      style={{
                        border: "none",
                        background: "transparent",
                        padding: 0,
                        cursor: "pointer",
                        fontWeight: 900,
                        color: nameColor,
                        whiteSpace: "nowrap",
                      }}
                      title="Открыть профиль"
                      aria-label="Открыть профиль"
                    >
                      {name}
                    </button>
                    <span style={{ color: ui.hint, fontSize: 11 }}>{time}</span>
                  </>
                )}
              </div>
            )}

            <div
              style={{
                fontSize: 15,
                lineHeight: 1.35,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
                maxWidth: "100%",
              }}
            >
              {m.text}
            </div>

            {!isSystem && !selectMode && hoverId === m.id && (
              <div
                style={{
                  position: "absolute",
                  top: -10,
                  right: isMe ? 6 : 8,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "6px 8px",
                  borderRadius: 12,
                  background: mode === "dark" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.7)",
                  border: `1px solid ${ui.line}`,
                  backdropFilter: "blur(6px)",
                }}
              >
                <button
                  type="button"
                  title="Реакция"
                  onClick={() => reactMsg(m.id)}
                  style={{ border: "none", background: "transparent", color: ui.text, cursor: "pointer" }}
                >
                  <Icon name="react" size={18} />
                </button>

                <button
                  type="button"
                  title="Редактировать"
                  onClick={() => editMsg(m.id)}
                  style={{ border: "none", background: "transparent", color: ui.text, cursor: "pointer" }}
                >
                  <Icon name="edit" size={18} />
                </button>

                <button
                  type="button"
                  title="Удалить"
                  onClick={() => deleteMsg(m.id)}
                  style={{ border: "none", background: "transparent", color: "#ff6b6b", cursor: "pointer" }}
                >
                  <Icon name="trash" size={18} />
                </button>
              </div>
            )}

            {!isSystem && selectMode && (
              <button
                type="button"
                onClick={() => toggleSelected(m.id)}
                title={checked ? "Снять выделение" : "Выделить"}
                aria-label={checked ? "Снять выделение" : "Выделить"}
                style={{
                  position: "absolute",
                  top: -12,
                  left: -12,
                  width: 28,
                  height: 28,
                  borderRadius: 10,
                  border: `1px solid ${ui.line}`,
                  background: checked ? ui.violet : mode === "dark" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.65)",
                  display: "grid",
                  placeItems: "center",
                  color: checked ? "#111" : ui.text,
                  cursor: "pointer",
                }}
              >
                {checked ? <Icon name="check" size={16} /> : null}
              </button>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div
      onPointerDown={(e) => {
        if (props.embedded) return;
        const t = e.target as HTMLElement | null;
        const tag = t?.tagName?.toLowerCase();
        // если тап не по инпуту/кнопке — убираем клаву
        if (tag !== "textarea" && tag !== "input" && tag !== "button" && tag !== "svg" && tag !== "path") {
          const ae = document.activeElement as HTMLElement | null;
          if (ae && (ae.tagName === "TEXTAREA" || ae.tagName === "INPUT")) ae.blur();
        }
      }}
      style={{
        minHeight: props.embedded ? 0 : "100dvh",
        height: props.embedded ? "100%" : "100dvh",
        background: ui.pageBg,
        color: ui.text,
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Pattern fixed (не скроллится вместе с пузырями) */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(980px, 100%)",
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 0,
        }}
      >
        {patternShapes.map((s, i) => {
          const style: React.CSSProperties = {
            position: "absolute",
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.s,
            height: s.s,
            transform: `translate(-50%, -50%) rotate(${s.r}deg)`,
            opacity: s.o,
          };

          if (s.kind === "circle") return <div key={i} style={{ ...style, borderRadius: 999, background: s.c }} />;
          if (s.kind === "square") return <div key={i} style={{ ...style, borderRadius: 6, background: s.c }} />;
          return (
            <div
              key={i}
              style={{
                ...style,
                width: 0,
                height: 0,
                borderLeft: `${s.s / 2}px solid transparent`,
                borderRight: `${s.s / 2}px solid transparent`,
                borderBottom: `${s.s}px solid ${s.c}`,
                background: "transparent",
              }}
            />
          );
        })}
      </div>

      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: ui.headerBg,
          borderBottom: `1px solid ${ui.line}`,
        }}
      >
        <div style={{ maxWidth: 980, width: "100%", margin: "0 auto", padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="mr-mobileBack" style={{ marginLeft: -6 }}>
              <IconBtn title="Назад" onClick={props.onBack} color={ui.back}>
                <Icon name="back" size={22} />
              </IconBtn>
            </div>

            <button
              type="button"
              onClick={() => openProfile?.()}
              title="Меню аккаунта"
              aria-label="Меню аккаунта"
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                border: `1px solid ${ui.line}`,
                background: mode === "dark" ? "#2B2A35" : "#F3F2F7",
                color: ui.text,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
              }}
            >
              <Icon name="morzha" size={18} />
            </button>

            <button
              type="button"
              onClick={openChatProfile}
              title="Профиль чата"
              aria-label="Профиль чата"
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                textAlign: "left",
                cursor: "pointer",
                flex: 1,
                minWidth: 0,
                color: ui.text,
              }}
            >
              <div style={{ fontWeight: 950, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
              <div style={{ fontSize: 12, color: ui.hint, marginTop: 2 }}>
                device: <span style={{ color: ui.green, fontWeight: 900 }}>{props.displayName?.trim() || "—"}</span>
              </div>
            </button>

            {/* ✅ ЧИСТЫЙ UX: если selectMode — прячем звонок/поиск и показываем “Снять” */}
            {!selectMode ? (
              <>
                {/* Call menu */}
                <div style={{ position: "relative" }}>
                  <IconBtn title="Звонок/Видео" onClick={() => setCallMenuOpen((v) => !v)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Icon name="phone" size={20} />
                      <Icon name="chevDown" size={16} />
                    </div>
                  </IconBtn>

                  {callMenuOpen && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 42,
                        width: 180,
                        borderRadius: 14,
                        border: `1px solid ${ui.line}`,
                        background: mode === "dark" ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.85)",
                        backdropFilter: "blur(10px)",
                        overflow: "hidden",
                        zIndex: 50,
                      }}
                    >
                      <button
                        type="button"
                        onClick={doCall}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "none",
                          background: "transparent",
                          color: ui.text,
                          cursor: "pointer",
                          textAlign: "left",
                          fontWeight: 800,
                        }}
                      >
                        📞 Позвонить
                      </button>
                      <div style={{ height: 1, background: ui.line }} />
                      <button
                        type="button"
                        onClick={doVideo}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "none",
                          background: "transparent",
                          color: ui.text,
                          cursor: "pointer",
                          textAlign: "left",
                          fontWeight: 800,
                        }}
                      >
                        🎥 Видео
                      </button>
                    </div>
                  )}
                </div>

                <IconBtn title="Поиск" onClick={() => openSearch?.()}>
                  <Icon name="search" size={20} />
                </IconBtn>
</>
            ) : (
              <button
                type="button"
                onClick={() => toggleSelectMode(false)}
                title="Снять выделение"
                aria-label="Снять выделение"
                style={{
                  height: 34,
                  padding: "0 12px",
                  borderRadius: 12,
                  border: `1px solid ${ui.line}`,
                  background: mode === "dark" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.65)",
                  color: ui.text,
                  fontWeight: 950,
                  cursor: "pointer",
                }}
              >
                Отменить
              </button>
            )}
          </div>
        </div>

        {/* Полоса только в режиме выделения */}
        {selectMode && (
          <div style={{ borderTop: `1px solid ${ui.line}` }}>
            <div
              style={{
                maxWidth: 980,
                width: "100%",
                margin: "0 auto",
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center", color: ui.hint, fontSize: 12 }}>
                <span>
                  storage: <span style={{ color: ui.text, fontWeight: 800 }}>~{storageInfo.approxFreeGb} GB free</span>
                </span>

                <button
                  type="button"
                  onClick={copyFolder}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                    fontWeight: 900,
                    color: ui.violet,
                  }}
                  title="Открыть/скопировать путь (пока копируем)"
                  aria-label="Открыть/скопировать путь (пока копируем)"
                >
                  Папка
                </button>
              </div>

              <div style={{ flex: 1 }} />

              <div style={{ fontWeight: 900, color: ui.text }}>
                Выбрано: <span style={{ color: ui.violet }}>{selectedIds.length}</span>
              </div>

              {/* ✅ На мобилке: “У всех” под “У меня” и вправо */}
              <div className="mr-selActions" style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={deleteSelectedForMe}
                  disabled={selectedIds.length === 0}
                  style={{
                    border: `1px solid ${ui.line}`,
                    background: mode === "dark" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.65)",
                    color: ui.text,
                    padding: "8px 10px",
                    borderRadius: 12,
                    cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  🗑 У меня
                </button>

                <button
                  type="button"
                  onClick={deleteSelectedForAll}
                  disabled={selectedIds.length === 0}
                  style={{
                    border: `1px solid ${ui.line}`,
                    background: mode === "dark" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.65)",
                    color: ui.text,
                    padding: "8px 10px",
                    borderRadius: 12,
                    cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
                    fontWeight: 900,
                    whiteSpace: "nowrap",
                  }}
                >
                  🧨 У всех (мои)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ position: "relative", flex: 1, minHeight: 0, zIndex: 1 }}>
        {/* ВАЖНО: этот контейнер на всю ширину и именно он скроллится,
            поэтому скроллбар будет справа (у края центральной колонки) */}
        <div style={{ height: "100%", position: "relative" }}>
          <div
            ref={listRef}
            style={{
              height: "100%",
              overflowY: "auto",
              overflowX: "hidden",
              display: "block",
              position: "relative",
              zIndex: 1,
            }}
          >
            {/* А вот этот блок только для центрирования контента */}
            <div
              style={{
                maxWidth: 980,
                width: "100%",
                margin: "0 auto",
                padding: props.embedded
                  ? "16px 12px 92px"
                  : `16px 12px calc(92px + env(safe-area-inset-bottom) + ${keyboardInset}px)`,
              }}
            >
              
              {displayMsgs.length === 0 && (
                <div
                  style={{
                    padding: "18px 14px",
                    border: `1px dashed ${ui.line}`,
                    borderRadius: 16,
                    background: mode === "dark" ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.75)",
                    color: ui.text,
                    maxWidth: 520,
                    margin: "24px auto 0",
                  }}
                >
                  <div style={{ fontWeight: 950, fontSize: 16, marginBottom: 6 }}>Пока нет сообщений</div>
                  <div style={{ opacity: 0.72, fontWeight: 700, lineHeight: 1.35 }}>
                    Напиши первое сообщение снизу 👇
                  </div>

                  {p2pEnabled && !p2pPeerId && (
                    <div style={{ marginTop: 10, opacity: 0.78, fontWeight: 800, lineHeight: 1.35 }}>
                      🛰️ Для P2P нужен <span style={{ color: ui.violet }}>peerId</span> собеседника (device id).
                    </div>
                  )}
                </div>
              )}

{displayMsgs.map((m, idx) => (
                <Bubble
                  key={m.id}
                  m={m}
                  prev={idx > 0 ? displayMsgs[idx - 1] : undefined}
                  next={idx < displayMsgs.length - 1 ? displayMsgs[idx + 1] : undefined}
                />
              ))}

              {/* ✅ якорь внизу: самый надежный способ прыгать к последнему */}
              <div ref={bottomRef} />
            </div>
          </div>

          {showJump && (
            <button
              type="button"
              onClick={() => scrollToBottom("smooth")}
              title="Вниз"
              aria-label="Вниз"
              style={{
                position: "absolute",
                right: 14,
                bottom: 102,
                width: 44,
                height: 44,
                borderRadius: 16,
                border: `1px solid ${ui.line}`,
                background: mode === "dark" ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.75)",
                color: ui.text,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                backdropFilter: "blur(6px)",
                zIndex: 2,
              }}
            >
              <Icon name="down" size={20} />
            </button>
          )}

          {datesMenuOpen && (
            <div
              onClick={() => setDatesMenuOpen(false)}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.18)",
                zIndex: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 12,
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "min(420px, 100%)",
                  borderRadius: 16,
                  border: `1px solid ${ui.line}`,
                  background: mode === "dark" ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.92)",
                  backdropFilter: "blur(12px)",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px" }}>
                  <div style={{ fontWeight: 950 }}>Дни переписки</div>
                  <button
                    type="button"
                    onClick={() => setDatesMenuOpen(false)}
                    style={{ border: "none", background: "transparent", color: ui.text, cursor: "pointer" }}
                    aria-label="Закрыть"
                    title="Закрыть"
                  >
                    <Icon name="x" size={18} />
                  </button>
                </div>
                <div style={{ height: 1, background: ui.line }} />
                <div style={{ maxHeight: 360, overflowY: "auto" }}>
                  {daysIndex.length === 0 ? (
                    <div style={{ padding: 12, color: ui.hint }}>Пока нет сообщений по дням.</div>
                  ) : (
                    daysIndex.map((d) => (
                      <button
                        key={d.firstMsgId}
                        type="button"
                        onClick={() => {
                          setDatesMenuOpen(false);
                          scrollToMsg(d.firstMsgId);
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "none",
                          background: "transparent",
                          color: ui.text,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {d.label}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Composer */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          transform: props.embedded ? undefined : keyboardInset ? `translateY(-${keyboardInset}px)` : undefined,
          zIndex: 12,
          background: ui.composerBg,
          borderTop: `1px solid ${ui.line}`,
          paddingBottom: props.embedded ? 0 : "env(safe-area-inset-bottom)",
        }}
      >
        <div style={{ maxWidth: 980, width: "100%", margin: "0 auto", padding: "10px 12px" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
              {/* иконки по центру строки ввода */}
              <button
                type="button"
                title="Эмодзи (позже)"
                aria-label="Эмодзи (позже)"
                onClick={() => pushSystem("Emoji: позже (панель реакций/стикеров).")}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 30,
                  height: 30,
                  border: "none",
                  background: "transparent",
                  color: ui.hint,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                }}
              >
                <Icon name="smile" size={18} />
              </button>

              {!hasText ? (
                <button
                  type="button"
                  title="Прикрепить (позже)"
                  aria-label="Прикрепить (позже)"
                  onClick={() => pushSystem("Attach: позже (P2P шаринг/ссылки).")}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 32,
                    height: 32,
                    border: "none",
                    background: "transparent",
                    color: ui.hint,
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                  }}
                >
                  <Icon name="clip" size={20} />
                </button>
              ) : (
                <button
                  type="button"
                  title={recording ? "Запись…" : "Отправить (удержи для голоса)"}
                  aria-label={recording ? "Запись…" : "Отправить (удержи для голоса)"}
                  onClick={() => {
                    if (!recording) send();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    startRecording();
                  }}
                  onMouseUp={(e) => {
                    e.preventDefault();
                    stopRecording();
                  }}
                  onMouseLeave={(e) => {
                    e.preventDefault();
                    stopRecording();
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    startRecording();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    stopRecording();
                  }}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 32,
                    height: 32,
                    border: "none",
                    background: "transparent",
                    color: recording ? ui.green : ui.violet,
                    display: "grid",
                    placeItems: "center",
                    cursor: "pointer",
                  }}
                >
                  {recording ? <Icon name="mic" size={20} /> : <Icon name="send" size={20} />}
                </button>
              )}

              <AutoGrowTextarea
                value={text}
                onChange={setText}
                onSend={send}
                placeholder="Напиши сообщение…"
                bg={ui.inputBg}
                border={ui.inputBorder}
                color={ui.text}
                inputRef={inputRef}
                onFocus={() => {
                  // когда открылась клавиатура — держим низ
                  requestAnimationFrame(() => {
                    scrollToBottom("auto");
                    requestAnimationFrame(() => scrollToBottom("auto"));
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .mr-mobileBack { display: none; }
        @media (max-width: 640px) { .mr-mobileBack { display: block; } }

        /* ✅ мобилка: экшены выделения столбиком вправо (У всех под У меня) */
        @media (max-width: 640px) {
          .mr-selActions {
            width: 100%;
            flex-direction: column;
            align-items: flex-end;
            gap: 8px;
            margin-top: 6px;
          }
        }
      `}</style>
    </div>
  );
}