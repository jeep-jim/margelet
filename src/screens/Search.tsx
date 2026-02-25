import React, { useMemo, useState } from "react";

type Props = {
  onBack: () => void;
  onOpenRoom: (roomId: string) => void;
};

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

  const [q, setQ] = useState("");

  const results: Result[] = useMemo(() => {
    const base: Result[] = [
      { id: "r1", type: "room", title: "margeleT • общий", meta: "Public room (later)" },
      { id: "r2", type: "room", title: "Друзья", meta: "Private chats (later)" },
      { id: "f1", type: "file", title: "Design System (pdf)", meta: "shared by @jim • view / download" },
      { id: "u1", type: "user", title: "@jim", meta: "device-first account" },
    ];

    const s = q.trim().toLowerCase();
    if (!s) return base;
    return base.filter((x) => (x.title + " " + x.meta).toLowerCase().includes(s));
  }, [q]);

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
            MVP-логика позже: публичные узлы + индексация событий комнаты + лимиты доступа ссылок.
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
                  else alert("Откроем это позже ✅");
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