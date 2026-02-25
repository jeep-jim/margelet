import React, { useMemo, useState } from "react";

type SharedItem = {
  id?: string;
  name?: string;
  filename?: string;
  url?: string;
  size?: number;
  ts?: number;
  kind?: string;
  [k: string]: any;
};

type Props = { roomId: string };

function safeJson<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function bytes(n?: number) {
  if (!n || n <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function extractLinks(text: string) {
  const out: string[] = [];
  const re = /(https?:\/\/[^\s)\]}>,\"']+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.push(m[1]);
  return out;
}

function tidyUrl(url: string) {
  try {
    const u = new URL(url);
    const host = u.host.replace(/^www\./, "");
    const path = u.pathname.length > 18 ? u.pathname.slice(0, 18) + "…" : u.pathname;
    return `${host}${path === "/" ? "" : path}`;
  } catch {
    return url;
  }
}

function fmtDate(ts?: number) {
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function RoomFilesSidebar({ roomId }: Props) {
  const [tab, setTab] = useState<"files" | "links">("files");
  const [q, setQ] = useState("");

  const sharedKey = `margelet:shared:${roomId}`;
  const sharedFiles = useMemo(() => {
    const parsed = safeJson<SharedItem[]>(localStorage.getItem(sharedKey), []);
    return Array.isArray(parsed) ? parsed : [];
  }, [roomId, sharedKey]);

  // Links from room messages (настоящие shared из Chats)
  const msgKey = `margelet_room_msgs_${roomId}`;
  const linksFromMsgs = useMemo(() => {
    const msgs = safeJson<any[]>(localStorage.getItem(msgKey), []);
    const links: SharedItem[] = [];
    if (Array.isArray(msgs)) {
      for (const m of msgs) {
        const text = String(m?.text ?? "");
        const ts = Number(m?.ts ?? 0) || undefined;
        for (const url of extractLinks(text))
          links.push({
            id: String(m?.id ?? url),
            url,
            name: tidyUrl(url),
            ts,
            kind: "link",
          });
      }
    }
    // uniq by url
    const seen = new Set<string>();
    return links.filter((l) => {
      if (!l.url) return false;
      if (seen.has(l.url)) return false;
      seen.add(l.url);
      return true;
    });
  }, [roomId, msgKey]);

  const list = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const base = tab === "files" ? sharedFiles : linksFromMsgs;
    if (!qq) return base;
    return base.filter((x) => {
      const s = `${x.name || ""} ${x.filename || ""} ${x.url || ""}`.toLowerCase();
      return s.includes(qq);
    });
  }, [q, tab, sharedFiles, linksFromMsgs]);

  const C = useMemo(() => {
    return {
      text: "rgba(255,255,255,0.92)",
      hint: "rgba(255,255,255,0.58)",
      line: "rgba(255,255,255,0.08)",
      line2: "rgba(255,255,255,0.06)",
      surface: "#121321",
      surface2: "#0f101a",
      chip: "rgba(255,255,255,0.06)",
      chip2: "rgba(0,0,0,0.24)",
      violet: "#BE95FA",
      pink: "#FFA3CE",
    };
  }, []);

  const S = useMemo(() => {
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

      title: {
        fontWeight: 950,
        fontSize: 13,
        letterSpacing: 0.2,
        opacity: 0.95,
      } as React.CSSProperties,

      tabs: {
        display: "flex",
        gap: 6,
        padding: 6,
        borderRadius: 999,
        border: `1px solid ${C.line}`,
        background: "rgba(0,0,0,0.18)",
      } as React.CSSProperties,

      tabBtn: (active: boolean) =>
        ({
          border: `1px solid ${active ? "rgba(255,255,255,0.12)" : "transparent"}`,
          background: active ? "rgba(255,255,255,0.06)" : "transparent",
          color: active ? C.text : C.hint,
          borderRadius: 999,
          padding: "7px 10px",
          fontSize: 12,
          fontWeight: 900,
          cursor: "pointer",
        }) as React.CSSProperties,

      searchWrap: {
        borderRadius: 16,
        border: `1px solid ${C.line}`,
        background: `linear-gradient(180deg, ${C.surface} 0%, ${C.surface2} 100%)`,
        padding: "10px 10px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
      } as React.CSSProperties,

      input: {
        flex: 1,
        background: "transparent",
        border: "none",
        outline: "none",
        color: C.text,
        fontSize: 13,
        fontWeight: 750,
      } as React.CSSProperties,

      list: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        overflow: "auto",
        paddingBottom: 6,
        minHeight: 0,
      } as React.CSSProperties,

      item: {
        display: "grid",
        gridTemplateColumns: "38px 1fr",
        gap: 10,
        alignItems: "center",
        textAlign: "left",
        padding: 10,
        borderRadius: 16,
        border: `1px solid ${C.line}`,
        background: "rgba(0,0,0,0.18)",
      } as React.CSSProperties,

      icon: (kind: "file" | "link") =>
        ({
          width: 38,
          height: 38,
          borderRadius: 16,
          display: "grid",
          placeItems: "center",
          background: C.chip,
          border: `1px solid ${C.line2}`,
          color: kind === "link" ? C.violet : C.pink,
          fontWeight: 950,
        }) as React.CSSProperties,

      name: {
        fontWeight: 950,
        fontSize: 13,
        overflow: "hidden",
        whiteSpace: "nowrap",
        textOverflow: "ellipsis",
      } as React.CSSProperties,

      meta: {
        marginTop: 3,
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        fontSize: 12,
        fontWeight: 750,
        color: C.hint,
      } as React.CSSProperties,

      link: {
        color: C.text,
        textDecoration: "none",
        display: "block",
      } as React.CSSProperties,

      empty: {
        borderRadius: 18,
        border: `1px dashed ${C.line}`,
        background: "rgba(0,0,0,0.10)",
        color: C.hint,
        padding: 14,
        fontSize: 13,
        fontWeight: 800,
      } as React.CSSProperties,
    };
  }, [C]);

  return (
    <div style={S.root}>
      <div style={S.header}>
        <div style={S.title}>Shared</div>

        <div style={S.tabs}>
          <button type="button" style={S.tabBtn(tab === "files")} onClick={() => setTab("files")}>
            Files
          </button>
          <button type="button" style={S.tabBtn(tab === "links")} onClick={() => setTab("links")}>
            Links
          </button>
        </div>
      </div>

      <div style={S.searchWrap}>
        <div style={{ opacity: 0.55 }}>⌕</div>
        <input value={q} onChange={(e) => setQ(e.target.value)} style={S.input} placeholder="Поиск…" aria-label="Search" />
      </div>

      <div style={S.list}>
        {list.length === 0 ? (
          <div style={S.empty}>{tab === "files" ? "Пока нет файлов в комнате." : "Пока нет ссылок в сообщениях."}</div>
        ) : (
          list.map((it, idx) => {
            const isLink = tab === "links" || (it.kind || "") === "link" || !!it.url;
            const label = isLink ? "↗" : "⧉";
            const title = it.name || it.filename || it.url || "Item";
            const metaA = isLink ? tidyUrl(it.url || "") : bytes(it.size);
            const metaB = fmtDate(it.ts);

            const body = (
              <div style={{ minWidth: 0 }}>
                <div style={S.name} title={title}>
                  {title}
                </div>
                <div style={S.meta}>
                  {!!metaA && <span>{metaA}</span>}
                  {!!metaB && <span>{metaB}</span>}
                </div>
              </div>
            );

            if (isLink && it.url) {
              return (
                <a key={(it.id || it.url || "") + idx} href={it.url} target="_blank" rel="noreferrer" style={S.link}>
                  <div style={S.item}>
                    <div style={S.icon("link")}>{label}</div>
                    {body}
                  </div>
                </a>
              );
            }

            return (
              <div key={(it.id || it.name || it.filename || "") + idx} style={S.item}>
                <div style={S.icon("file")}>{label}</div>
                {body}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}