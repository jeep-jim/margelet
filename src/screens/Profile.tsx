import React, { useEffect, useMemo, useRef, useState } from "react";

type ProfileProps = {
  onBack: () => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  title?: string;
};

/**
 * Profile v2 (русский UI, без “пилюль”, без каши)
 * - цель: реальный центр продукта (identity + devices + shares)
 * - выход из системы: SOFT и HARD (HARD гарантированно возвращает на авторизацию)
 *
 * Важно:
 * Мы НЕ знаем точные ключи твоей авторизации — поэтому:
 * - soft logout чистит “похожие” ключи
 * - hard logout делает полный reset localStorage (гарантированно)
 */

const brand = {
  bg: "#272632",
  text: "#EAE5E3",
  muted: "rgba(234,229,227,0.62)",
  hint: "rgba(234,229,227,0.38)",
  line: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.10)",

  surface: "rgba(0,0,0,0.16)",
  surface2: "rgba(0,0,0,0.22)",
  surface3: "rgba(0,0,0,0.28)",

  pink: "#FFA3CE",
  violet: "#BE95FA",
  green: "#66D492",
  sand: "#E5C289",

  danger: "rgba(255, 120, 120, 0.92)",
};

type Device = {
  id: string;
  name: string;
  platform?: string;
  status?: "online" | "offline";
  lastSeen?: number;
  isThis?: boolean;
};

type ShareItem = {
  id: string;
  title: string;
  category: "Фото" | "Видео" | "Аудио" | "Документы" | "Другое";
  availability: "Только когда online" | "Всегда доступно (позже)";
  createdAt: number;
};

const LS_USER_ID = "margelet_user_id";
const LS_DEVICES = "margelet_devices_v2";
const LS_SHARES = "margelet_shares_v2";

function safeJson<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function clampStr(s: string, max = 32) {
  const t = (s ?? "").trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max) : t;
}

function makeHandle(name: string) {
  const base = (name || "user")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_\-а-яё]/gi, "");
  return base || "user";
}

function getOrCreateUserId() {
  try {
    const existing = localStorage.getItem(LS_USER_ID);
    if (existing) return existing;

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `usr_${Math.random().toString(16).slice(2)}_${Date.now()}`;

    localStorage.setItem(LS_USER_ID, id);
    return id;
  } catch {
    return `usr_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }
}

function now() {
  return Date.now();
}

function fmtWhen(ts?: number) {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function initialsFromName(name: string) {
  const n = (name || "User").trim();
  const parts = n.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts.length > 1 ? parts[1]?.[0] ?? "" : parts[0]?.[1] ?? "";
  return (a + b).toUpperCase();
}

async function copyText(text: string) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}

function detectPlatform() {
  const ua = navigator.userAgent || "";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Web";
}

function softLogout() {
  try {
    const keys = Object.keys(localStorage);

    // удаляем все ключи, похожие на auth/session/token/login
    const authLike = (k: string) =>
      /(auth|token|session|login|password|passwd|jwt|bearer)/i.test(k) ||
      /^margelet_(auth|token|session|login)/i.test(k) ||
      k === "margelet_user" ||
      k === "margelet_me" ||
      k === "margelet_profile";

    for (const k of keys) {
      if (authLike(k)) localStorage.removeItem(k);
    }

    // специальный “флажок” на случай, если проект его использует
    localStorage.setItem("margelet_logged_in", "0");
    localStorage.removeItem("margelet_logged_in_at");
  } catch {}
}

function hardLogout() {
  try {
    localStorage.clear();
  } catch {}
}

function goToAuthStart() {
  // максимально “всегда работает”:
  // - сбрасываем hash
  // - уходим на корень
  try {
    if (location.hash) location.hash = "";
  } catch {}
  try {
    window.location.replace("/");
  } catch {
    try {
      window.location.href = "/";
    } catch {
      window.location.reload();
    }
  }
}

export default function Profile({ onBack, displayName, setDisplayName, title }: ProfileProps) {
  const [draft, setDraft] = useState(displayName || "");
  const [toast, setToast] = useState<string | null>(null);

  const [tab, setTab] = useState<"Профиль" | "Устройства" | "Файлы">("Профиль");

  const [confirmExit, setConfirmExit] = useState(false);

  const userId = useMemo(() => getOrCreateUserId(), []);
  const handle = useMemo(() => makeHandle(draft || displayName), [draft, displayName]);
  const initials = useMemo(() => initialsFromName(draft || displayName), [draft, displayName]);

  const inviteLink = useMemo(() => {
    const base = `${location.origin}${location.pathname}`.replace(/\/$/, "");
    return `${base}#invite=@${handle}&u=${encodeURIComponent(userId.slice(0, 8))}`;
  }, [handle, userId]);

  const [devices, setDevices] = useState<Device[]>(() => safeJson<Device[]>(localStorage.getItem(LS_DEVICES), []));
  const [shares, setShares] = useState<ShareItem[]>(() => safeJson<ShareItem[]>(localStorage.getItem(LS_SHARES), []));

  // shares form
  const [shareTitle, setShareTitle] = useState("");
  const [shareCat, setShareCat] = useState<ShareItem["category"]>("Фото");
  const [shareAvail, setShareAvail] = useState<ShareItem["availability"]>("Только когда online");

  const toastTimer = useRef<number | null>(null);
  const pushToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1500);
  };

  useEffect(() => {
    try {
      localStorage.setItem(LS_DEVICES, JSON.stringify(devices));
    } catch {}
  }, [devices]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_SHARES, JSON.stringify(shares));
    } catch {}
  }, [shares]);

  // ensure current device exists
  useEffect(() => {
    const platform = detectPlatform();
    const thisId = `dev_${userId.slice(0, 8)}_${platform.toLowerCase()}`;

    setDevices((prev) => {
      const exists = prev.some((d) => d.id === thisId);
      const next = exists
        ? prev.map((d) =>
            d.id === thisId ? { ...d, isThis: true, platform, status: "online", lastSeen: now() } : { ...d, isThis: false }
          )
        : [
            {
              id: thisId,
              name: `Текущее устройство (${platform})`,
              platform,
              status: "online",
              lastSeen: now(),
              isThis: true,
            },
            ...prev.map((d) => ({ ...d, isThis: false })),
          ];
      return next;
    });
  }, [userId]);

  useEffect(() => {
    setDraft(displayName || "");
  }, [displayName]);

  // styles
  const S = useMemo(() => {
    const card: React.CSSProperties = {
      borderRadius: 22,
      border: `1px solid ${brand.border}`,
      background: brand.surface,
      boxShadow: "0 18px 55px rgba(0,0,0,0.35)",
    };

    const field: React.CSSProperties = {
      height: 44,
      borderRadius: 16,
      border: `1px solid rgba(255,255,255,0.10)`,
      background: brand.surface2,
      color: brand.text,
      outline: "none",
      padding: "0 14px",
      fontWeight: 800,
      fontSize: 14,
      letterSpacing: 0.15,
    };

    const btn: React.CSSProperties = {
      height: 44,
      borderRadius: 16,
      border: "1px solid transparent",
      background: "rgba(255,255,255,0.06)",
      color: brand.text,
      fontWeight: 900,
      fontSize: 13,
      cursor: "pointer",
      padding: "0 14px",
    };

    const btnPrimary: React.CSSProperties = {
      ...btn,
      background: "rgba(190,149,250,0.18)",
      color: brand.violet,
      border: "1px solid rgba(190,149,250,0.20)",
    };

    const btnPink: React.CSSProperties = {
      ...btn,
      background: "rgba(255,163,206,0.16)",
      color: brand.pink,
      border: "1px solid rgba(255,163,206,0.20)",
    };

    const btnDanger: React.CSSProperties = {
      ...btn,
      background: "rgba(255,120,120,0.10)",
      color: brand.danger,
      border: "1px solid rgba(255,120,120,0.18)",
    };

    const iconBtn: React.CSSProperties = {
      width: 40,
      height: 40,
      borderRadius: 14,
      border: "1px solid transparent",
      background: "rgba(255,255,255,0.06)",
      color: brand.text,
      display: "grid",
      placeItems: "center",
      cursor: "pointer",
      userSelect: "none",
    };

    const tabBtn = (active: boolean): React.CSSProperties => ({
      height: 40,
      borderRadius: 14,
      border: `1px solid ${active ? "rgba(255,255,255,0.12)" : "transparent"}`,
      background: active ? "rgba(255,255,255,0.08)" : "transparent",
      color: active ? brand.text : brand.hint,
      fontWeight: 900,
      fontSize: 13,
      padding: "0 12px",
      cursor: "pointer",
    });

    return { card, field, btn, btnPrimary, btnPink, btnDanger, iconBtn, tabBtn };
  }, []);

  const saveName = () => {
    const clean = clampStr(draft, 32);
    setDraft(clean);
    setDisplayName(clean || "User");
    pushToast("Имя сохранено ✅");
  };

  const addDeviceMock = () => {
    const id = `dev_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`.slice(0, 42);
    const platform = ["Android", "iOS", "Windows", "macOS"][Math.floor(Math.random() * 4)];
    const name = platform === "Android" ? "Телефон" : platform === "iOS" ? "iPhone" : platform;

    setDevices((prev) => [
      ...prev,
      {
        id,
        name: `${name} (привязан)`,
        platform,
        status: "offline",
        lastSeen: now() - 1000 * 60 * (10 + Math.floor(Math.random() * 240)),
      },
    ]);
    pushToast("Устройство добавлено (мок) 🧩");
  };

  const renameDevice = (id: string) => {
    const cur = devices.find((d) => d.id === id);
    const v = window.prompt("Имя устройства:", cur?.name || "");
    if (!v) return;
    setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, name: clampStr(v, 28) } : d)));
    pushToast("Переименовано ✍️");
  };

  const removeDevice = (id: string) => {
    const cur = devices.find((d) => d.id === id);
    if (cur?.isThis) return pushToast("Текущее устройство удалить нельзя 😈");
    if (!window.confirm("Удалить устройство?")) return;
    setDevices((prev) => prev.filter((d) => d.id !== id));
    pushToast("Удалено 🗑️");
  };

  const addShare = () => {
    const t = clampStr(shareTitle, 52);
    if (!t) return pushToast("Название пустое 😅");

    const item: ShareItem = {
      id: `share_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`.slice(0, 48),
      title: t,
      category: shareCat,
      availability: shareAvail,
      createdAt: now(),
    };

    setShares((prev) => [item, ...prev]);
    setShareTitle("");
    pushToast("Шара добавлена 💾");
  };

  const removeShare = (id: string) => {
    if (!window.confirm("Убрать шару?")) return;
    setShares((prev) => prev.filter((s) => s.id !== id));
    pushToast("Убрано 🧹");
  };

  const exitSoft = () => {
    setConfirmExit(false);
    softLogout();
    pushToast("Вы вышли ✅");
    // даём тосту мигнуть и уводим
    window.setTimeout(goToAuthStart, 180);
  };

  const exitHard = () => {
    setConfirmExit(false);
    hardLogout();
    pushToast("Сброс выполнен ✅");
    window.setTimeout(goToAuthStart, 180);
  };

  // custom select (no ugly native arrow flush)
  const Select = ({
    value,
    onChange,
    options,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: string[];
  }) => {
    return (
      <div style={{ position: "relative", flex: 1, minWidth: 190 }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            ...S.field,
            width: "100%",
            paddingRight: 44,
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
          } as any}
        >
          {options.map((o) => (
            <option key={o} value={o} style={{ background: "#1f1e2a", color: brand.text }}>
              {o}
            </option>
          ))}
        </select>

        <div
          style={{
            pointerEvents: "none",
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            width: 22,
            height: 22,
            borderRadius: 10,
            background: "rgba(255,255,255,0.06)",
            display: "grid",
            placeItems: "center",
            color: brand.hint,
            fontWeight: 900,
            fontSize: 12,
          }}
        >
          ▾
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: brand.bg, color: brand.text, overflowX: "hidden" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "18px 18px 30px" }}>
        {/* Header (тихий, без новых “стилей кнопок”) */}
        <div style={{ display: "grid", gridTemplateColumns: "44px 1fr 44px", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={onBack}
            style={S.iconBtn}
            aria-label="Назад"
            title="Назад"
          >
            ←
          </button>

          <div style={{ textAlign: "center", lineHeight: 1.1 }}>
            <div style={{ fontWeight: 900, fontSize: 14 }}>{title || "Профиль"}</div>
            <div style={{ fontSize: 12, color: brand.hint }}>
              @{handle} • id {userId.slice(0, 8)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setConfirmExit(true)}
            style={{ ...S.iconBtn, color: brand.danger }}
            aria-label="Выйти"
            title="Выйти"
          >
            ⎋
          </button>
        </div>

        <div style={{ height: 1, background: brand.line, marginTop: 14 }} />

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <button type="button" onClick={() => setTab("Профиль")} style={S.tabBtn(tab === "Профиль")}>
            Профиль
          </button>
          <button type="button" onClick={() => setTab("Устройства")} style={S.tabBtn(tab === "Устройства")}>
            Устройства
          </button>
          <button type="button" onClick={() => setTab("Файлы")} style={S.tabBtn(tab === "Файлы")}>
            Файлы
          </button>
        </div>

        {/* Content */}
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {/* PROFILE TAB */}
          {tab === "Профиль" && (
            <div style={{ ...S.card, padding: 16 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${brand.border}`,
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    color: brand.violet,
                    userSelect: "none",
                  }}
                  title="Аватар (локально)"
                >
                  {initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: brand.hint, fontWeight: 800 }}>Твоё имя (видно в чатах)</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10, marginTop: 8 }}>
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveName();
                        if (e.key === "Escape") setDraft(displayName || "");
                      }}
                      placeholder="Например: Тест"
                      style={{ ...S.field, width: "100%" }}
                    />
                    <button type="button" onClick={saveName} style={S.btnPrimary}>
                      Сохранить
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div
                      style={{
                        padding: "8px 10px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.06)",
                        border: `1px solid ${brand.border}`,
                        color: brand.hint,
                        fontWeight: 900,
                        fontSize: 12,
                      }}
                    >
                      @{handle}
                    </div>
                    <div
                      style={{
                        padding: "8px 10px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.06)",
                        border: `1px solid ${brand.border}`,
                        color: brand.hint,
                        fontWeight: 900,
                        fontSize: 12,
                      }}
                    >
                      user • {userId.slice(0, 8)}
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await copyText(`@${handle}`);
                        pushToast(ok ? "Ник скопирован ✅" : "Не получилось скопировать 😕");
                      }}
                      style={S.btn}
                      title="Скопировать ник"
                    >
                      Коп. @
                    </button>
                  </div>
                </div>
              </div>

              {/* Invite */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: brand.hint, fontWeight: 900 }}>Инвайт (привязка устройства)</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10, marginTop: 8 }}>
                  <div
                    style={{
                      ...S.field,
                      display: "flex",
                      alignItems: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: brand.muted,
                    }}
                    title={inviteLink}
                  >
                    {inviteLink}
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await copyText(inviteLink);
                      pushToast(ok ? "Инвайт скопирован ✅" : "Не получилось 😕");
                    }}
                    style={S.btnPink}
                  >
                    Копировать
                  </button>
                </div>

                <div
                  style={{
                    marginTop: 12,
                    borderRadius: 20,
                    border: `1px dashed rgba(255,255,255,0.14)`,
                    background: "rgba(0,0,0,0.12)",
                    padding: 14,
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 18,
                      background: "rgba(0,0,0,0.12)",
                      border: `1px solid ${brand.border}`,
                      display: "grid",
                      placeItems: "center",
                      color: brand.sand,
                      fontWeight: 900,
                      userSelect: "none",
                    }}
                  >
                    QR
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900, color: brand.sand, fontSize: 13 }}>Привязка через QR</div>
                    <div style={{ fontSize: 12, color: brand.hint, marginTop: 4 }}>
                      Сейчас можно тестировать через инвайт-ссылку. Дальше добавим сканер и подпись.
                    </div>
                  </div>

                  <button type="button" onClick={addDeviceMock} style={S.btn}>
                    Добавить (мок)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DEVICES TAB */}
          {tab === "Устройства" && (
            <div style={{ ...S.card, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 14 }}>Устройства</div>
                  <div style={{ fontSize: 12, color: brand.hint, marginTop: 4 }}>
                    Здесь будет реальная связка (QR) и статусы. Сейчас — рабочий мок для тестов.
                  </div>
                </div>
                <button type="button" onClick={addDeviceMock} style={S.btnPrimary}>
                  Добавить
                </button>
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {devices
                  .slice()
                  .sort((a, b) => Number(!!b.isThis) - Number(!!a.isThis))
                  .map((d) => {
                    const isOnline = d.status === "online";
                    return (
                      <div
                        key={d.id}
                        style={{
                          borderRadius: 20,
                          border: `1px solid ${brand.border}`,
                          background: "rgba(0,0,0,0.12)",
                          padding: 12,
                          display: "grid",
                          gridTemplateColumns: "46px 1fr auto",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 18,
                            background: "rgba(255,255,255,0.06)",
                            border: `1px solid ${brand.border}`,
                            display: "grid",
                            placeItems: "center",
                            color: isOnline ? brand.green : brand.hint,
                            fontWeight: 900,
                            userSelect: "none",
                          }}
                          title={isOnline ? "online" : "offline"}
                        >
                          {isOnline ? "●" : "○"}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 900, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {d.name}
                            {d.isThis ? <span style={{ color: brand.pink, marginLeft: 8 }}>(это устройство)</span> : null}
                          </div>
                          <div style={{ fontSize: 12, color: brand.hint, marginTop: 3 }}>
                            {d.platform || "Device"} • последнее: {fmtWhen(d.lastSeen)}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <button type="button" onClick={() => renameDevice(d.id)} style={S.btn}>
                            Переименовать
                          </button>
                          <button type="button" onClick={() => removeDevice(d.id)} style={S.btnDanger}>
                            Удалить
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* FILES TAB */}
          {tab === "Файлы" && (
            <div style={{ ...S.card, padding: 16 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 14 }}>Хранилище / P2P Shares</div>
                <div style={{ fontSize: 12, color: brand.hint, marginTop: 4 }}>
                  Файлы остаются у владельца. Если устройство оффлайн — его файлы оффлайн.
                </div>
              </div>

              <div
                style={{
                  marginTop: 12,
                  borderRadius: 20,
                  border: `1px solid ${brand.border}`,
                  background: "rgba(0,0,0,0.12)",
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 12, color: brand.hint, fontWeight: 900 }}>Добавить шару (папка/набор)</div>

                <input
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  placeholder='Например: "Фото 2026" или "Work docs"'
                  style={{ ...S.field, width: "100%", marginTop: 8 }}
                />

                <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <Select
                    value={shareCat}
                    onChange={(v) => setShareCat(v as any)}
                    options={["Фото", "Видео", "Аудио", "Документы", "Другое"]}
                  />
                  <Select
                    value={shareAvail}
                    onChange={(v) => setShareAvail(v as any)}
                    options={["Только когда online", "Всегда доступно (позже)"]}
                  />

                  <button type="button" onClick={addShare} style={S.btnPrimary}>
                    Добавить
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {shares.length === 0 ? (
                  <div style={{ color: brand.hint, fontSize: 12 }}>Пока нет шар.</div>
                ) : (
                  shares.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        borderRadius: 20,
                        border: `1px solid ${brand.border}`,
                        background: "rgba(0,0,0,0.12)",
                        padding: 12,
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.title}
                        </div>
                        <div style={{ fontSize: 12, color: brand.hint, marginTop: 3 }}>
                          {s.category} • {s.availability} • добавлено: {fmtWhen(s.createdAt)}
                        </div>
                      </div>

                      <button type="button" onClick={() => removeShare(s.id)} style={S.btnDanger}>
                        Удалить
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Small note */}
          <div style={{ color: brand.hint, fontSize: 12, lineHeight: 1.35 }}>
            <b style={{ color: brand.muted }}>Profile</b> — это центр продукта: identity + devices + shares. Дальше сюда добавим настройки звонков/микросервера, и реальную QR-привязку.
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast ? (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 18,
            transform: "translateX(-50%)",
            padding: "10px 12px",
            borderRadius: 16,
            background: "rgba(0,0,0,0.55)",
            border: `1px solid ${brand.border}`,
            color: brand.text,
            fontWeight: 900,
            fontSize: 12,
            zIndex: 50,
            maxWidth: "92vw",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      ) : null}

      {/* Exit confirm */}
      {confirmExit ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.60)",
            display: "grid",
            placeItems: "center",
            zIndex: 60,
            padding: 16,
          }}
          onMouseDown={() => setConfirmExit(false)}
        >
          <div
            style={{
              width: "min(560px, 96vw)",
              borderRadius: 22,
              border: `1px solid ${brand.border}`,
              background: "rgba(22,20,30,0.96)",
              boxShadow: "0 30px 90px rgba(0,0,0,0.60)",
              padding: 16,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={{ fontWeight: 950, fontSize: 14 }}>Выйти из системы?</div>
            <div style={{ marginTop: 6, color: brand.hint, fontSize: 12, lineHeight: 1.35 }}>
              Если обычный выход не сработает (из-за неизвестного ключа авторизации), используй <b>Жёсткий выход</b> — он точно вернёт на экран авторизации.
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14, flexWrap: "wrap" }}>
              <button type="button" onClick={() => setConfirmExit(false)} style={S.btn}>
                Отмена
              </button>
              <button type="button" onClick={exitSoft} style={S.btnPrimary} title="Чистит auth/session/token/login и уводит на /">
                Выйти
              </button>
              <button type="button" onClick={exitHard} style={S.btnDanger} title="Полный сброс localStorage и переход на /">
                Жёсткий выход
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}