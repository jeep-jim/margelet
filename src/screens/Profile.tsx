import React, { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n";

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
  muted: "rgba(234,229,227,0.70)",
  hint: "rgba(234,229,227,0.55)",

  pink: "#FFA3CE",
  violet: "#BE95FA",
  green: "#66D492",

  line: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.10)",

  surface: "rgba(255,255,255,0.06)",
  surface2: "rgba(255,255,255,0.05)",

  inputBg: "rgba(0,0,0,0.25)",

  ctaIdleBg: "#111111",
  ctaIdleText: "#BE95FA",

  ctaActiveBg: "#BE95FA",
  ctaActiveText: "#272632",
};

const LS_AVATAR = "margelet_avatar_v1";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

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

function CopyIcon({ size = 18, color = brand.text }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 9h10v10H9V9Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BackIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ display: "block" }}
    >
      <path d="M19 11H7.9" stroke={brand.pink} strokeWidth="3" strokeLinecap="round" />
      <path d="M8.2 5.3L2.5 11l5.7 5.7V5.3Z" fill={brand.pink} />
    </svg>
  );
}

export default function Profile({ onBack, displayName, setDisplayName }: ProfileProps) {
  const { t } = useI18n();

  const [tab, setTab] = useState<TabKey>("profile");

  const [nameLocal, setNameLocal] = useState<string>(displayName ?? "");
  useEffect(() => {
    if (typeof displayName === "string") setNameLocal(displayName);
  }, [displayName]);

  const [avatar, setAvatar] = useState<string>(() => localStorage.getItem(LS_AVATAR) || "");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [toast, setToast] = useState<string>("");

  const deviceId = useMemo(() => {
    const raw = localStorage.getItem("margeleT_device_id") || localStorage.getItem("margelet_device_id");
    return raw || "";
  }, []);

  const deviceLabel = useMemo(() => {
    const raw = localStorage.getItem("margelet_device_label");
    return raw || "";
  }, []);

  const userId = useMemo(() => {
    // мягкий guess (не ломаемся)
    const all = Object.keys(localStorage);
    const guessKey =
      all.find((k) => /user/i.test(k) && /id/i.test(k)) ||
      all.find((k) => /user/i.test(k)) ||
      all.find((k) => /device/i.test(k) && /id/i.test(k)) ||
      "";
    const raw = guessKey ? localStorage.getItem(guessKey) : null;
    if (!raw) return "";
    const v = safeParse<any>(raw, raw);
    if (typeof v === "string") return v;
    if (typeof v?.id === "string") return v.id;
    if (typeof v?.userId === "string") return v.userId;
    return "";
  }, []);

  const handleBack = () => {
    if (onBack) onBack();
    else window.history.back();
  };

  const handleSaveName = () => {
    const v = nameLocal.trim();
    if (setDisplayName) setDisplayName(v);
    setToast("Сохранено");
    setTimeout(() => setToast(""), 1200);
  };

  const inviteLink = useMemo(() => {
    const origin = window.location.origin;
    // пока нет реального @nickname — не придумываем. оставим просто device/user
    const uid = userId || deviceId || "user";
    return `${origin}#invite=${encodeURIComponent(uid)}`;
  }, [userId, deviceId]);

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setToast("Скопировано");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = inviteLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setToast("Скопировано");
    } finally {
      setTimeout(() => setToast(""), 1200);
    }
  };

  const pickPhoto = () => fileRef.current?.click();

  const onPickFile: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      setToast("Нужна картинка");
      setTimeout(() => setToast(""), 1200);
      return;
    }

    const b64 = await toBase64(f);
    setAvatar(b64);
    localStorage.setItem(LS_AVATAR, b64);
    setShowPhotoMenu(false);
    setToast("Фото обновлено");
    setTimeout(() => setToast(""), 1200);
  };

  const removePhoto = () => {
    setAvatar("");
    localStorage.removeItem(LS_AVATAR);
    setShowPhotoMenu(false);
    setToast("Фото удалено");
    setTimeout(() => setToast(""), 1200);
  };

  const logout = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = "/";
  };

  const hasName = nameLocal.trim().length > 0;

  const ui = useMemo(
    () => ({
      maxW: 700,
      pad: "clamp(16px, 4vw, 24px)",
      ctaBg: hasName ? brand.ctaActiveBg : brand.ctaIdleBg,
      ctaText: hasName ? brand.ctaActiveText : brand.ctaIdleText,
      ctaOpacity: hasName ? 1 : 0.92,
    }),
    [hasName]
  );

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
          border: "none",
          background: active ? brand.surface : "transparent",
          color: active ? brand.text : "rgba(234,229,227,0.60)",
          fontWeight: 800,
          fontSize: 14,
          cursor: "pointer",
          transition: "0.2s ease",
        }}
      >
        {label}
      </button>
    );
  };

  const displayTitle = (displayName?.trim() || nameLocal.trim() || "you").trim();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: brand.bg,
        color: brand.text,
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      <style>
        {`
          html, body { background: ${brand.bg}; }
          body { overflow-x: hidden; }
          /* убрать "белый скролл" и сделать аккуратно */
          *::-webkit-scrollbar { width: 10px; height: 10px; }
          *::-webkit-scrollbar-track { background: ${brand.bg}; }
          *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 10px; border: 2px solid ${brand.bg}; }
          *::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }

          .mgt-input::placeholder { color: rgba(234,229,227,0.35); opacity: 1; }
        `}
      </style>

      <div style={{ maxWidth: ui.maxW, margin: "0 auto", padding: ui.pad }}>
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
            aria-label={t("header.back")}
            title={t("header.back")}
          >
            <BackIcon />
            <span style={{ fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{t("header.back")}</span>
          </button>

          <button
            type="button"
            onClick={logout}
            style={{
              height: 36,
              padding: "0 14px",
              borderRadius: 14,
              border: "none",
              background: brand.surface,
              color: brand.text,
              fontWeight: 800,
              cursor: "pointer",
              transition: "0.2s ease",
            }}
            title="Выйти"
          >
            Выйти
          </button>
        </header>

        <div style={{ height: 1, background: brand.line, marginTop: 12 }} />

        {/* title = avatar + name */}
        <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14 }}>
          <button
            type="button"
            onClick={() => setShowPhotoMenu(true)}
            style={{
              width: 52,
              height: 52,
              borderRadius: 999,
              border: "none",
              background: brand.surface,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
            title="Фото"
          >
            {avatar ? (
              <img
                src={avatar}
                alt="avatar"
                style={{ width: 52, height: 52, borderRadius: 999, objectFit: "cover" }}
              />
            ) : (
              <span style={{ fontWeight: 900, fontSize: 20 }}>
                {(displayTitle[0] || "U").toUpperCase()}
              </span>
            )}
          </button>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 900,
                lineHeight: 1.05,
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
              title={displayTitle}
            >
              {displayTitle}
            </div>

            {(userId || deviceId) && (
              <div style={{ marginTop: 6, fontSize: 13, color: brand.hint }}>
                id {String(userId || deviceId).slice(0, 10)}…
              </div>
            )}
          </div>
        </div>

        {/* tabs */}
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <TabBtn k="profile" label="Профиль" />
          <TabBtn k="devices" label="Устройства" />
          <TabBtn k="files" label="Файлы" />
        </div>

        {/* content */}
        <div style={{ marginTop: 18 }}>
          {tab === "profile" && (
            <div>
              {/* name */}
              <div style={{ fontSize: 13, color: brand.hint, fontWeight: 700, marginBottom: 10 }}>
                Твоё имя (видно в чатах)
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input
                  className="mgt-input"
                  value={nameLocal}
                  onChange={(e) => setNameLocal(e.target.value)}
                  placeholder="Например: Jim"
                  style={{
                    flex: "1 1 240px",
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
                  onClick={handleSaveName}
                  disabled={!hasName}
                  style={{
                    flex: "0 0 auto",
                    height: 46,
                    padding: "0 16px",
                    borderRadius: 16,
                    border: "none",
                    background: ui.ctaBg,
                    color: ui.ctaText,
                    fontWeight: 900,
                    cursor: hasName ? "pointer" : "not-allowed",
                    transition: "0.2s ease",
                    opacity: ui.ctaOpacity,
                  }}
                >
                  Сохранить
                </button>
              </div>

              {/* invite */}
              <div style={{ marginTop: 18, fontSize: 13, color: brand.hint, fontWeight: 700, marginBottom: 10 }}>
                Инвайт для привязки устройства
              </div>

              <button
                type="button"
                onClick={copyInvite}
                style={{
                  width: "100%",
                  height: 46,
                  borderRadius: 16,
                  border: `1px solid ${brand.border}`, // это не "кнопка" по виду, это строка-инпут
                  background: brand.inputBg,
                  color: brand.text,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "0 12px 0 14px",
                  cursor: "pointer",
                }}
                title="Скопировать"
              >
                <span
                  style={{
                    fontSize: 14,
                    color: "rgba(234,229,227,0.78)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {inviteLink}
                </span>

                <span style={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 12, background: brand.surface2 }}>
                  <CopyIcon color="rgba(234,229,227,0.85)" />
                </span>
              </button>

              <div style={{ marginTop: 10, fontSize: 13, color: brand.hint }}>
                Профиль хранится локально на устройстве. Сервер ничего не хранит.
              </div>
            </div>
          )}

          {tab === "devices" && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Устройства</div>

              <div style={{ fontSize: 13, color: brand.hint, lineHeight: 1.4 }}>
                Текущее устройство:{" "}
                <span style={{ color: "rgba(234,229,227,0.92)", fontWeight: 800 }}>
                  {deviceLabel || "Device"}
                </span>
                {deviceId ? (
                  <>
                    {" "}
                    • id <span style={{ color: "rgba(234,229,227,0.75)" }}>{deviceId.slice(0, 8)}…</span>
                  </>
                ) : null}
                {" "}
                • состояние <span style={{ color: brand.green, fontWeight: 900 }}>online</span>
              </div>

              <div style={{ marginTop: 14, height: 1, background: brand.line }} />

              <div style={{ marginTop: 14, fontSize: 13, color: brand.hint, lineHeight: 1.4 }}>
                Здесь позже появится список привязанных устройств и подтверждение входа (QR).
              </div>
            </div>
          )}

          {tab === "files" && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Файлы</div>
              <div style={{ fontSize: 13, color: brand.hint, lineHeight: 1.4 }}>
                Здесь будет история шеров и быстрый доступ к файлам на твоих устройствах.
              </div>
            </div>
          )}
        </div>

        {/* photo menu modal */}
        {showPhotoMenu && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              background: "rgba(0,0,0,0.60)",
              display: "grid",
              placeItems: "center",
              padding: 16,
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowPhotoMenu(false);
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 420,
                borderRadius: 20,
                background: brand.bg,
                border: `1px solid ${brand.border}`,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 900 }}>Фото профиля</div>
              <div style={{ marginTop: 6, fontSize: 13, color: brand.hint, lineHeight: 1.35 }}>
                Всё хранится локально на устройстве.
              </div>

              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <button
                  type="button"
                  onClick={pickPhoto}
                  style={{
                    height: 44,
                    borderRadius: 16,
                    border: "none",
                    background: brand.surface,
                    color: brand.text,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Выбрать фото
                </button>

                <button
                  type="button"
                  onClick={removePhoto}
                  disabled={!avatar}
                  style={{
                    height: 44,
                    borderRadius: 16,
                    border: "none",
                    background: avatar ? "rgba(255,80,80,0.16)" : brand.surface2,
                    color: avatar ? "rgba(255,200,200,0.95)" : "rgba(234,229,227,0.35)",
                    fontWeight: 900,
                    cursor: avatar ? "pointer" : "not-allowed",
                  }}
                >
                  Удалить фото
                </button>

                <button
                  type="button"
                  onClick={() => setShowPhotoMenu(false)}
                  style={{
                    height: 44,
                    borderRadius: 16,
                    border: "none",
                    background: "transparent",
                    color: "rgba(234,229,227,0.75)",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Закрыть
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onPickFile}
                  style={{ display: "none" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* toast */}
        {toast && (
          <div style={{ position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)", zIndex: 60 }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.70)",
                border: `1px solid ${brand.border}`,
                color: brand.text,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {toast}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}