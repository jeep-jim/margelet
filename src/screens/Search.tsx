import React, { useMemo, useState } from "react";

type Props = {
  onBack: () => void;
  onOpenRoom: (roomId: string) => void;
};

/**
 * MVP: user id = @nickname (no phone contacts).
 * We store your nickname locally so you can DM others by searching @nickname.
 */
function getOrCreateMyHandle(storageKey = "margelet_handle_v1") {
  if (typeof window === "undefined") return "me";
  const cur = localStorage.getItem(storageKey);
  if (cur && cur.trim()) return cur.trim();

  // fallback: generate a short handle from random
  const seed =
    (globalThis.crypto as any)?.randomUUID?.()?.split("-")[0] ??
    Math.random().toString(16).slice(2, 8);

  const next = `user_${seed}`;
  try {
    localStorage.setItem(storageKey, next);
  } catch {}
  return next;
}

function dmRoomId(a: string, b: string) {
  const aa = (a || "").replace(/^@/, "").trim();
  const bb = (b || "").replace(/^@/, "").trim();
  if (!aa || !bb) return "";
  const [x, y] = [aa, bb].sort();
  return `dm:${x}:${y}`;
}

const brand = {
  bgDark: "#272632",
  textLight: "#EAE5E3",
  pink: "#FFA3CE",
  violet: "#BE95FA",
  green: "#66D492",
  sand: "#E5C289",
  line: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.10)",
};

type Result = {
  id: string;
  type: "room" | "file" | "user";
  title: string;
  meta: string;
};

export default function Search(props: Props) {
  const ui = useMemo(
    () => ({
      bg: brand.bgDark,
      text: brand.textLight,
      muted: "rgba(234,229,227,0.55)",
      panel: "rgba(255,255,255,0.04)",
      panel2: "rgba(0,0,0,0.26)",
      input: "rgba(0,0,0,0.35)",
    }),
    []
  );

  const myHandle = useMemo(() => getOrCreateMyHandle(), []);
  const myTag = `@${myHandle}`;

  const [q, setQ] = useState("");

  const results: Result[] = useMemo(() => {
    // NOTE: replace with real index later. Keeping your mock list but adding "me" pin.
    const base: Result[] = [
      { id: "r1", type: "room", title: "margeleT • общий", meta: "Public room (later)" },
      { id: "r2", type: "room", title: "Друзья", meta: "Private chats (later)" },
      { id: "f1", type: "file", title: "Design System (pdf)", meta: "shared by @jim • view / download" },

      // show my own tag so user understands identity
      { id: "me", type: "user", title: myTag, meta: "это ты (локальный аккаунт MVP)" },

      // sample user result
      { id: "u1", type: "user", title: "@jim", meta: "device-first account" },
    ];

    const s = q.trim().toLowerCase();
    if (!s) return base;

    // convenience: if user types without '@', still match
    const s2 = s.startsWith("@") ? s : `@${s}`;

    return base.filter((x) => {
      const hay = (x.title + " " + x.meta).toLowerCase();
      return hay.includes(s) || hay.includes(s2);
    });
  }, [q, myTag]);

  const pill = (label: string, color: string) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 30,
        padding: "0 12px",
        borderRadius: 999,
        border: `1px solid ${brand.border}`,
        background: "rgba(255,255,255,0.04)",
        color,
        fontWeight: 900,
        fontSize: 12,
      }}
    >
      {label}
    </span>
  );

  return (
    <div
      style={{
        background: ui.bg,
        color: ui.text,
        minHeight: "100vh",
        fontFamily:
          "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "clamp(16px, 4vw, 24px)" }}>
        {/* top */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="button"
            onClick={props.onBack}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: ui.muted,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 0,
              fontWeight: 950,
            }}
          >
            <span style={{ fontSize: 18 }}>←</span>
            Search
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            {pill("Rooms", brand.violet)}
            {pill("Users", brand.green)}
            {pill("Files", brand.sand)}
          </div>
        </div>

        <div style={{ height: 1, background: brand.line, marginTop: 12 }} />

        {/* input */}
        <div
          style={{
            marginTop: 14,
            borderRadius: 22,
            border: `1px solid ${brand.border}`,
            background: ui.panel,
            padding: 12,
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ищи людей, комнаты и файлы… (как Google, но P2P)"
            style={{
              width: "100%",
              height: 46,
              borderRadius: 16,
              border: `1px solid ${brand.border}`,
              background: ui.input,
              color: brand.textLight,
              padding: "0 14px",
              outline: "none",
              fontSize: 14,
            }}
          />
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.6, lineHeight: 1.35 }}>
            MVP: пишем людям по @nickname. Позже: публичные узлы + индексация + лимиты доступа ссылок.
          </div>
        </div>

        {/* results */}
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {results.map((r) => {
            const color =
              r.type === "room" ? brand.violet : r.type === "user" ? brand.green : brand.sand;

            const icon = r.type === "room" ? "💬" : r.type === "user" ? "👤" : "🔗";

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  if (r.type === "room" && r.title.includes("общий")) props.onOpenRoom("margelet_public");
                  else if (r.type === "room" && r.title.includes("Друзья")) props.onOpenRoom("friends");
                  else if (r.type === "user") {
                    const target = r.title.replace(/^@/, "").trim();
                    if (!target) return;
                    if (target === myHandle) {
                      // it's me — no-op for now
                      return;
                    }
                    const rid = dmRoomId(myHandle, target);
                    if (rid) props.onOpenRoom(rid);
                  } else {
                    alert("Откроем это позже ✅");
                  }
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "14px 14px",
                  borderRadius: 18,
                  border: `1px solid ${brand.border}`,
                  background: "rgba(0,0,0,0.22)",
                  cursor: "pointer",
                  color: brand.textLight,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{icon}</span>
                    <div style={{ fontWeight: 950, color }}>{r.title}</div>
                  </div>
                  <span style={{ opacity: 0.55, fontSize: 12 }}>open</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.7, lineHeight: 1.25 }}>
                  {r.meta}
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={props.onBack}
          style={{
            marginTop: 16,
            width: "100%",
            height: 52,
            borderRadius: 20,
            border: `1px solid ${brand.border}`,
            background: "rgba(0,0,0,0.28)",
            color: brand.violet,
            fontWeight: 950,
            cursor: "pointer",
          }}
        >
          Back to Chats
        </button>
      </div>
    </div>
  );
}