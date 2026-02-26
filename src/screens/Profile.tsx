import React, { useEffect, useMemo, useRef, useState } from "react";

type ProfileProps = {
  onBack?: () => void;
  onLogout?: () => void;
  displayName?: string;
  setDisplayName?: (v: string) => void;
  handle?: string; // "@jim"
  setHandle?: (v: string) => void;
};

type TabKey = "profile" | "devices" | "files";

const brand = {
  bg: "#272632",
  text: "#EAE5E3",
  muted: "rgba(234,229,227,0.70)",
  hint: "rgba(234,229,227,0.55)",
  line: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.10)",
  inputBg: "rgba(0,0,0,0.25)",
  pink: "#FFA3CE",
  violet: "#BE95FA",
  green: "#66D492",
};

const LS_AVATAR = "margelet_avatar_v1";
const LS_HANDLE = "margelet_handle_v1";
const LS_DEVICE_ID = "margeleT_device_id";
const LS_DEVICE_LABEL = "margelet_device_label";

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function CopyIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 9h10v10H9V9Z"
        stroke={brand.text}
        strokeOpacity="0.85"
        strokeWidth="1.6"
        rx="2"
      />
      <path
        d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke={brand.text}
        strokeOpacity="0.65"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

// локальный blacklist (потом подтянешь из админки)
const RESERVED = new Set(
  [
    "sex",
    "porn",
    "kill",
    "terror",
    "love",
    "kids",
    "children",
    "president",
    "money",
    "auto",
    "business",
    "god",
    "gods",
  ].map((s) => s.toLowerCase())
);

function normalizeHandle(raw: string) {
  let s = raw.trim();
  if (!s) return "";
  if (s.startsWith("@")) s = s.slice(1);
  s = s.toLowerCase();
  s = s.replace(/[^a-z0-9_]/g, "");
  return s ? `@${s}` : "";
}

function validateHandle(h: string) {
  const s = h.startsWith("@") ? h.slice(1) : h;
  if (!s) return { ok: false, reason: "empty" as const };
  if (s.length < 3) return { ok: false, reason: "short" as const };
  if (s.length > 20) return { ok: false, reason: "long" as const };
  if (!/^[a-z0-9_]+$/.test(s)) return { ok: false, reason: "chars" as const };
  if (RESERVED.has(s)) return { ok: false, reason: "reserved" as const };
  return { ok: true as const };
}

export default function Profile({
  onBack,
  onLogout,
  displayName,
  setDisplayName,
  handle,
  setHandle,
}: ProfileProps) {
  const [tab, setTab] = useState<TabKey>("profile");

  const [nameLocal, setNameLocal] = useState<string>(displayName ?? "");
  useEffect(() => {
    if (typeof displayName === "string") setNameLocal(displayName);
  }, [displayName]);

  const [handleLocal, setHandleLocal] = useState<string>(handle ?? "");
  useEffect(() => {
    if (typeof handle === "string") setHandleLocal(handle);
  }, [handle]);

  const [avatar, setAvatar] = useState<string>(() => localStorage.getItem(LS_AVATAR) || "");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [toast, setToast] = useState<string>("");
  const [handleError, setHandleError] = useState<string>("");

  const deviceId = useMemo(() => localStorage.getItem(LS_DEVICE_ID) || "", []);
  const deviceLabel = useMemo(() => localStorage.getItem(LS_DEVICE_LABEL) || "", []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1400);
  };

  const handleBack = () => {
    if (onBack) onBack();
    else window.history.back();
  };

  const saveName = () => {
    const v = nameLocal.trim();
    if (!v) return;
    setDisplayName?.(v);
    showToast("Сохранено ✅");
  };

  const saveHandle = () => {
    const h = normalizeHandle(handleLocal);
    const v = validateHandle(h);
    if (!v.ok) {
      if (v.reason === "short") setHandleError("Минимум 3 символа");
      else if (v.reason === "long") setHandleError("Максимум 20 символов");
      else if (v.reason === "chars") setHandleError("Только латиница, цифры и _");
      else if (v.reason === "reserved") setHandleError("Это имя запрещено");
      else setHandleError("Укажи ник");
      return;
    }
    setHandleError("");
    setHandleLocal(h);
    setHandle?.(h);
    try {
      localStorage.setItem(LS_HANDLE, JSON.stringify(h));
    } catch {}
    showToast("Ник сохранён ✅");
  };

  const pickPhoto = () => fileRef.current?.click();

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      showToast("Нужна картинка");
      return;
    }
    const b64 = await toBase64(f);
    setAvatar(b64);
    localStorage.setItem(LS_AVATAR, b64);
    showToast("Фото обновлено ✅");
  };

  const removePhoto = () => {
    setAvatar("");
    localStorage.removeItem(LS_AVATAR);
    showToast("Фото удалено ✅");
  };

  const inviteLink = useMemo(() => {
    const origin = window.location.origin;
    const h = handleLocal?.trim() || "@you";
    const uid = deviceId || "device";
    return `${origin}#invite=${encodeURIComponent(h)}&d=${encodeURIComponent(uid)}`;
  }, [handleLocal, deviceId]);

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      showToast("Скопировано ✅");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = inviteLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("Скопировано ✅");
    }
  };

  const logout = () => {
    // IMPORTANT: не стираем identity
    onLogout?.();
    showToast("Выход ✅");
  };

  const TabBtn = ({ k, label }: { k: TabKey; label: string }) => {
    const active = tab === k;
    return (
      <button
        type="button"
        onClick={() => setTab(k)}
        style={{
          height: 38,
          padding: "0 14px",
          borderRadius: 14,
          background: active ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
          color: active ? brand.text : "rgba(234,229,227,0.65)",
          border: "none",
          fontWeight: 800,
          cursor: "pointer",
          transition: "0.15s ease",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: brand.bg,
        color: brand.text,
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        overflowX: "hidden",
      }}
    >
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "clamp(16px, 4vw, 24px)" }}>
        {/* header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 2,
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: brand.text,
              opacity: 0.9,
            }}
            title="Назад"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden style={{ display: "block" }}>
              <path d="M19 11H7.9" stroke={brand.pink} strokeWidth="3" strokeLinecap="round" />
              <path d="M8.2 5.3L2.5 11l5.7 5.7V5.3Z" fill={brand.pink} />
            </svg>
            <span style={{ fontWeight: 900, fontSize: 18, lineHeight: 1 }}>Назад</span>
          </button>

          <button
            type="button"
            onClick={logout}
            style={{
              height: 38,
              padding: "0 14px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.06)",
              color: brand.text,
              border: "none",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Выйти
          </button>
        </header>

        <div style={{ height: 1, background: brand.line, marginTop: 12 }} />

        {/* top identity row */}
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={pickPhoto}
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              border: `1px solid ${brand.border}`,
              background: "rgba(255,255,255,0.04)",
              overflow: "hidden",
              cursor: "pointer",
              padding: 0,
            }}
            title="Фото"
          >
            {avatar ? (
              <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", fontWeight: 900 }}>
                {(nameLocal?.trim()?.[0] || "U").toUpperCase()}
              </div>
            )}
          </button>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1, marginBottom: 4 }}>
              {nameLocal?.trim() || "Профиль"}
            </div>
            <div style={{ fontSize: 13, color: brand.hint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {handleLocal?.trim() || "@you"}
              {deviceId ? ` • id ${String(deviceId).slice(0, 8)}…` : ""}
            </div>
          </div>
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} style={{ display: "none" }} />

        {/* tabs */}
        <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
          <TabBtn k="profile" label="Профиль" />
          <TabBtn k="devices" label="Устройства" />
          <TabBtn k="files" label="Файлы" />
        </div>

        {/* content */}
        <div style={{ marginTop: 18 }}>
          {tab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Display name */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: brand.hint, marginBottom: 8 }}>
                  Имя (видно в чатах)
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    value={nameLocal}
                    onChange={(e) => setNameLocal(e.target.value)}
                    placeholder="Например: Jim"
                    style={{
                      flex: 1,
                      height: 46,
                      padding: "0 14px",
                      borderRadius: 16,
                      border: `1px solid ${brand.border}`,
                      background: brand.inputBg,
                      color: brand.text,
                      outline: "none",
                      fontSize: 15,
                    }}
                  />
                  <button
                    type="button"
                    onClick={saveName}
                    style={{
                      height: 46,
                      padding: "0 16px",
                      borderRadius: 16,
                      background: brand.violet,
                      color: brand.bg,
                      border: "none",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    Сохранить
                  </button>
                </div>
              </div>

              {/* Handle */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: brand.hint, marginBottom: 8 }}>
                  Никнейм (@username)
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    value={handleLocal}
                    onChange={(e) => {
                      setHandleLocal(e.target.value);
                      setHandleError("");
                    }}
                    onBlur={() => {
                      // мягко нормализуем
                      const n = normalizeHandle(handleLocal);
                      if (n) setHandleLocal(n);
                    }}
                    placeholder="@jim"
                    style={{
                      flex: 1,
                      height: 46,
                      padding: "0 14px",
                      borderRadius: 16,
                      border: `1px solid ${handleError ? "rgba(255,80,120,0.45)" : brand.border}`,
                      background: brand.inputBg,
                      color: brand.text,
                      outline: "none",
                      fontSize: 15,
                    }}
                  />
                  <button
                    type="button"
                    onClick={saveHandle}
                    style={{
                      height: 46,
                      padding: "0 16px",
                      borderRadius: 16,
                      background: "rgba(190,149,250,0.18)",
                      color: brand.violet,
                      border: "none",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    Ок
                  </button>
                </div>

                {handleError ? (
                  <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,120,160,0.95)", fontWeight: 800 }}>
                    {handleError}
                  </div>
                ) : (
                  <div style={{ marginTop: 8, fontSize: 12, color: brand.hint }}>
                    3–20 символов, латиница/цифры/_, без запрещённых слов.
                  </div>
                )}
              </div>

              {/* Invite row (full width, copy icon at end) */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, color: brand.hint, marginBottom: 8 }}>
                  Инвайт для привязки устройства
                </div>

                <button
                  type="button"
                  onClick={copyInvite}
                  style={{
                    width: "100%",
                    height: 46,
                    borderRadius: 16,
                    border: `1px solid ${brand.border}`,
                    background: brand.inputBg,
                    color: brand.text,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "0 12px 0 14px",
                    cursor: "pointer",
                  }}
                  title="Скопировать"
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: brand.muted,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {inviteLink}
                  </span>
                  <CopyIcon />
                </button>

                <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={!avatar}
                    style={{
                      height: 38,
                      padding: "0 14px",
                      borderRadius: 14,
                      background: avatar ? "rgba(255,80,120,0.16)" : "rgba(255,255,255,0.05)",
                      color: avatar ? "rgba(255,160,190,0.95)" : "rgba(234,229,227,0.30)",
                      border: "none",
                      fontWeight: 900,
                      cursor: avatar ? "pointer" : "not-allowed",
                    }}
                  >
                    Удалить фото
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "devices" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>Устройства</div>
              <div style={{ fontSize: 13, color: brand.hint }}>
                Текущее устройство: <span style={{ color: brand.text, opacity: 0.9 }}>{deviceLabel || "Device"}</span>
              </div>
              <div style={{ fontSize: 13, color: brand.hint }}>
                Статус: <span style={{ color: brand.green, fontWeight: 900 }}>online</span>
              </div>
              <div style={{ height: 1, background: brand.line }} />
              <div style={{ fontSize: 13, color: brand.hint }}>
                Дальше тут будет список устройств, подтверждения входа, QR, и синк.
              </div>
            </div>
          )}

          {tab === "files" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>Файлы</div>
              <div style={{ fontSize: 13, color: brand.hint }}>
                Тут будут твои shares/история/кеш — локально на устройстве.
              </div>
            </div>
          )}
        </div>

        {toast && (
          <div style={{ position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)" }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.65)",
                color: brand.text,
                fontWeight: 900,
                fontSize: 13,
                border: `1px solid ${brand.border}`,
              }}
            >
              {toast}
            </div>
          </div>
        )}

        <div style={{ height: 18 }} />
      </div>
    </div>
  );
}