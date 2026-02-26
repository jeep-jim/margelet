import React, { useEffect, useMemo, useRef, useState } from "react";

type ProfileProps = {
  onBack?: () => void;
  displayName?: string;
  setDisplayName?: (v: string) => void;
  title?: string;
};

type TabKey = "profile" | "devices" | "files";

const brand = {
  bg: "#272632",
  text: "#EAE5E3",

  pink: "#FFA3CE",
  violet: "#BE95FA",
  green: "#66D492",

  panel: "#2E2D3B",
  panel2: "#323144",
  border: "rgba(255,255,255,0.10)",
  border2: "rgba(255,255,255,0.14)",

  inputBg: "rgba(0,0,0,0.22)",
  muted: "rgba(234,229,227,0.70)",
  hint: "rgba(234,229,227,0.55)",
};

const LS_AVATAR = "margelet_avatar_v1";

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

function IconPencil({ size = 16, color = brand.text }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20h9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowBack() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden style={{ display: "block" }}>
      <path d="M19 11H7.9" stroke={brand.pink} strokeWidth="3" strokeLinecap="round" />
      <path d="M8.2 5.3L2.5 11l5.7 5.7V5.3Z" fill={brand.pink} />
    </svg>
  );
}

export default function Profile({ onBack, displayName, setDisplayName, title }: ProfileProps) {
  const [tab, setTab] = useState<TabKey>("profile");

  const [nameLocal, setNameLocal] = useState<string>(displayName ?? "");
  useEffect(() => {
    if (typeof displayName === "string") setNameLocal(displayName);
  }, [displayName]);

  const [avatar, setAvatar] = useState<string>(() => localStorage.getItem(LS_AVATAR) || "");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [toast, setToast] = useState<string>("");
  const toastTimer = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 1400);
  };

  const deviceId = useMemo(() => {
    const v = localStorage.getItem("margeleT_device_id") || localStorage.getItem("margelet_device_id") || "";
    if (v) return v;
    // fallback: попробуем угадать
    const all = Object.keys(localStorage);
    const guessKey =
      all.find((k) => /device/i.test(k) && /id/i.test(k)) ||
      all.find((k) => /user/i.test(k) && /id/i.test(k)) ||
      "";
    const raw = guessKey ? localStorage.getItem(guessKey) : null;
    const parsed = safeParse<any>(raw, raw);
    if (typeof parsed === "string") return parsed;
    if (typeof parsed?.id === "string") return parsed.id;
    return "";
  }, []);

  const handle = useMemo(() => {
    const h = localStorage.getItem("margelet_handle_v1") || localStorage.getItem("margelet_handle") || "";
    if (h) return h.startsWith("@") ? h : `@${h}`;
    // если нет — показываем нейтрально
    return "@you";
  }, []);

  const inviteLink = useMemo(() => {
    const origin = window.location.origin;
    const uid = deviceId || "device";
    return `${origin}#invite=${encodeURIComponent(handle)}&d=${encodeURIComponent(uid)}`;
  }, [deviceId, handle]);

  const handleBack = () => {
    if (onBack) onBack();
    else window.history.back();
  };

  const handleSaveName = () => {
    const v = (nameLocal || "").trim();
    if (setDisplayName) setDisplayName(v);
    showToast("Сохранено");
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
    showToast("Фото обновлено");
  };

  const removePhoto = () => {
    setAvatar("");
    localStorage.removeItem(LS_AVATAR);
    showToast("Фото удалено");
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      showToast("Скопировано");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = inviteLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showToast("Скопировано");
    }
  };

  const logout = () => {
    // ВАЖНО: не чистим "всё подряд", иначе ты теряешь вообще весь UX.
    // Минимальный “выход” для MVP: убираем отображаемое имя + avatar (как будто “сброс профиля на устройстве”).
    try {
      localStorage.removeItem("margelet_display_name");
      localStorage.removeItem(LS_AVATAR);
      // экран/навигацию пусть App решает сам
    } catch {}
    window.location.href = "/";
  };

  const TabBtn = ({ k, label }: { k: TabKey; label: string }) => {
    const active = tab === k;
    return (
      <button
        type="button"
        onClick={() => setTab(k)}
        style={{
          padding: "10px 14px",
          borderRadius: 14,
          border: `1px solid ${active ? brand.border2 : brand.border}`,
          background: active ? brand.panel2 : "transparent",
          color: active ? brand.text : brand.muted,
          fontWeight: 800,
          fontSize: 14,
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
      }}
    >
      {/* Fix white scrollbar / page bg */}
      <style>
        {`
          html, body { background: ${brand.bg}; }
          body { margin: 0; }
          /* scrollbar */
          *::-webkit-scrollbar { width: 10px; height: 10px; }
          *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 999px; }
          *::-webkit-scrollbar-track { background: ${brand.bg}; }
        `}
      </style>

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
              color: brand.muted,
            }}
            aria-label="Back"
            title="Back"
          >
            <ArrowBack />
            <span style={{ fontWeight: 900, fontSize: 18, lineHeight: 1, color: brand.pink }}>Назад</span>
          </button>

          <button
            type="button"
            onClick={logout}
            style={{
              padding: "10px 14px",
              borderRadius: 16,
              border: `1px solid ${brand.border}`,
              background: brand.panel,
              color: brand.text,
              fontWeight: 800,
              cursor: "pointer",
            }}
            title="Выйти"
          >
            Выйти
          </button>
        </header>

        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginTop: 12 }} />

        {/* title */}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontSize: 44, fontWeight: 900, letterSpacing: -0.6, lineHeight: 1.05 }}>
            {title || "Профиль"}
          </div>
          <div style={{ marginTop: 6, color: brand.muted, fontSize: 14, fontWeight: 700 }}>
            {handle}
            {deviceId ? ` • id ${String(deviceId).slice(0, 8)}…` : ""}
          </div>
        </div>

        {/* tabs */}
        <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
          <TabBtn k="profile" label="Профиль" />
          <TabBtn k="devices" label="Устройства" />
          <TabBtn k="files" label="Файлы" />
        </div>

        {/* content */}
        <div
          style={{
            marginTop: 16,
            borderRadius: 22,
            border: `1px solid ${brand.border}`,
            background: brand.panel,
            padding: 16,
          }}
        >
          {tab === "profile" && (
            <>
              {/* top row: avatar + name */}
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {/* avatar */}
                <div style={{ position: "relative", width: 72, height: 72 }}>
                  <button
                    type="button"
                    onClick={pickPhoto}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 18,
                      border: `1px solid ${brand.border}`,
                      background: brand.panel2,
                      padding: 0,
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                    title="Фото"
                  >
                    {avatar ? (
                      <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 900,
                          fontSize: 28,
                          color: brand.text,
                        }}
                      >
                        {(nameLocal?.trim()?.[0] || "U").toUpperCase()}
                      </div>
                    )}
                  </button>

                  <div
                    style={{
                      position: "absolute",
                      right: -6,
                      bottom: -6,
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      border: `1px solid ${brand.border}`,
                      background: brand.panel,
                      display: "grid",
                      placeItems: "center",
                      pointerEvents: "none",
                    }}
                    aria-hidden
                  >
                    <IconPencil size={16} color={brand.violet} />
                  </div>

                  <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} style={{ display: "none" }} />
                </div>

                {/* name */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: brand.hint, fontWeight: 800 }}>Твоё имя (видно в чатах)</div>

                  <div style={{ marginTop: 8, display: "flex", gap: 10 }}>
                    <input
                      value={nameLocal}
                      onChange={(e) => setNameLocal(e.target.value)}
                      placeholder="Например: Jim"
                      style={{
                        flex: 1,
                        height: 44,
                        padding: "0 14px",
                        borderRadius: 16,
                        border: `1px solid ${brand.border}`,
                        background: brand.inputBg,
                        outline: "none",
                        color: brand.text,
                        fontSize: 15,
                        fontWeight: 700,
                      }}
                    />

                    <button
                      type="button"
                      onClick={handleSaveName}
                      style={{
                        height: 44,
                        padding: "0 16px",
                        borderRadius: 16,
                        border: `1px solid ${brand.border}`,
                        background: brand.violet,
                        color: brand.bg,
                        fontWeight: 900,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Сохранить
                    </button>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span
                      style={{
                        padding: "8px 10px",
                        borderRadius: 999,
                        border: `1px solid ${brand.border}`,
                        background: "transparent",
                        color: brand.muted,
                        fontWeight: 800,
                        fontSize: 12,
                      }}
                    >
                      {handle}
                    </span>

                    {deviceId && (
                      <span
                        style={{
                          padding: "8px 10px",
                          borderRadius: 999,
                          border: `1px solid ${brand.border}`,
                          background: "transparent",
                          color: brand.muted,
                          fontWeight: 800,
                          fontSize: 12,
                        }}
                      >
                        id • {String(deviceId).slice(0, 8)}
                      </span>
                    )}

                    {avatar ? (
                      <button
                        type="button"
                        onClick={removePhoto}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 999,
                          border: `1px solid ${brand.border}`,
                          background: "transparent",
                          color: "rgba(255,255,255,0.75)",
                          fontWeight: 800,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        Удалить фото
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* invite */}
              <div style={{ marginTop: 16, borderTop: `1px solid ${brand.border}`, paddingTop: 16 }}>
                <div style={{ fontSize: 13, color: brand.hint, fontWeight: 900 }}>Инвайт для привязки устройства</div>

                <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
                  <div
                    style={{
                      flex: 1,
                      height: 44,
                      padding: "0 14px",
                      borderRadius: 16,
                      border: `1px solid ${brand.border}`,
                      background: brand.inputBg,
                      display: "flex",
                      alignItems: "center",
                      overflow: "hidden",
                    }}
                    title={inviteLink}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: brand.muted,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        width: "100%",
                      }}
                    >
                      {inviteLink}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={copyInvite}
                    style={{
                      height: 44,
                      padding: "0 16px",
                      borderRadius: 16,
                      border: `1px solid ${brand.border}`,
                      background: brand.panel2,
                      color: brand.text,
                      fontWeight: 900,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Копировать
                  </button>
                </div>

                <div style={{ marginTop: 10, color: brand.hint, fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>
                  Это не “аккаунт на сервере”. Это привязка устройств между собой (device-first).
                </div>
              </div>
            </>
          )}

          {tab === "devices" && (
            <>
              <div style={{ fontSize: 16, fontWeight: 900 }}>Устройства</div>
              <div style={{ marginTop: 8, color: brand.muted, fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>
                Здесь будет список привязанных устройств и статус online/offline.
              </div>

              <div style={{ marginTop: 14, borderTop: `1px solid ${brand.border}`, paddingTop: 14 }}>
                <div style={{ color: brand.hint, fontWeight: 900, fontSize: 13 }}>Текущее устройство</div>
                <div
                  style={{
                    marginTop: 8,
                    padding: 14,
                    borderRadius: 18,
                    border: `1px solid ${brand.border}`,
                    background: brand.panel2,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 14 }}>Device</div>
                    <div style={{ marginTop: 4, color: brand.muted, fontWeight: 800, fontSize: 12 }}>
                      id • {deviceId ? String(deviceId).slice(0, 12) : "—"}
                    </div>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: 12, color: brand.green }}>online</div>
                </div>
              </div>
            </>
          )}

          {tab === "files" && (
            <>
              <div style={{ fontSize: 16, fontWeight: 900 }}>Файлы</div>
              <div style={{ marginTop: 8, color: brand.muted, fontSize: 14, fontWeight: 700, lineHeight: 1.35 }}>
                Здесь будет твой file hub: шеры, быстрый предпросмотр, история.
              </div>
            </>
          )}
        </div>

        {/* toast */}
        {toast && (
          <div style={{ position: "fixed", left: "50%", bottom: 18, transform: "translateX(-50%)", zIndex: 50 }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.55)",
                border: `1px solid ${brand.border}`,
                color: brand.text,
                fontWeight: 900,
                fontSize: 13,
              }}
            >
              {toast}
            </div>
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}