import React, { useEffect, useMemo, useRef, useState } from "react";

type ProfileProps = {
  onBack: () => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  title?: string;

  /**
   * опционально: если в App у тебя есть своя логика выхода — прокинь её сюда
   * иначе сработает дефолтный "жёсткий выход" (clear storage + reload)
   */
  onLogout?: () => void;
};

const brand = {
  bg: "#272632",
  text: "#EAE5E3",
  muted: "rgba(234,229,227,0.55)",
  hint: "rgba(234,229,227,0.35)",
  line: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.10)",

  pink: "#FFA3CE",
  violet: "#BE95FA",
  green: "#66D492",
  sand: "#E5C289",

  card: "rgba(0,0,0,0.18)",
  chip: "rgba(255,255,255,0.08)",
};

const LS_USER_ID = "margelet_user_id";
const LS_AVATAR = "margelet_avatar"; // dataURL
const LS_DISPLAY_NAME = "margelet_display_name"; // на всякий, если используешь

function clampStr(s: string, max = 26) {
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

function getOrCreateUserId(key = LS_USER_ID) {
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `usr_${Math.random().toString(16).slice(2)}_${Date.now()}`;

    localStorage.setItem(key, id);
    return id;
  } catch {
    return `usr_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }
}

function copyText(text: string) {
  try {
    if (navigator?.clipboard?.writeText) return navigator.clipboard.writeText(text);
  } catch {}
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
  } catch {}
  document.body.removeChild(ta);
  return Promise.resolve();
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(new Error("File read error"));
    r.readAsDataURL(file);
  });
}

// очень простой ресайз, чтобы не хранить мегабайты
async function downscaleImage(dataUrl: string, maxSide = 512, quality = 0.86): Promise<string> {
  try {
    const img = new Image();
    img.src = dataUrl;

    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("Image load error"));
    });

    const w = img.width || 1;
    const h = img.height || 1;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;

    ctx.drawImage(img, 0, 0, tw, th);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return dataUrl;
  }
}

function hardLogout() {
  try {
    // максимально “жёстко” — чтобы не зависеть от того, какие ключи ты добавишь позже
    // но не трогаем чужие ключи, чистим только наше
    const toDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith("margelet_") || k.startsWith("LS_")) toDelete.push(k);
    }
    toDelete.forEach((k) => localStorage.removeItem(k));
  } catch {}

  // на старт (перезагрузка гарантирует “выход” даже если роутер/стейт залип)
  window.location.href = "/";
}

export default function Profile({
  onBack,
  displayName,
  setDisplayName,
  title,
  onLogout,
}: ProfileProps) {
  const [draft, setDraft] = useState(displayName || "");
  const [toast, setToast] = useState<string | null>(null);

  const [avatar, setAvatar] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft(displayName || "");
  }, [displayName]);

  useEffect(() => {
    try {
      const a = localStorage.getItem(LS_AVATAR);
      if (a) setAvatar(a);
    } catch {}
  }, []);

  const userId = useMemo(() => getOrCreateUserId(), []);
  const handle = useMemo(() => makeHandle(draft || displayName), [draft, displayName]);

  const inviteLink = useMemo(() => {
    const base = `${location.origin}${location.pathname}`.replace(/\/$/, "");
    return `${base}#invite=@${handle}&u=${encodeURIComponent(userId.slice(0, 8))}`;
  }, [handle, userId]);

  const initials = useMemo(() => {
    const n = (draft || displayName || "User").trim();
    const parts = n.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "U";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
  }, [draft, displayName]);

  const popToast = (t: string) => {
    setToast(t);
    window.setTimeout(() => setToast(null), 1400);
  };

  const save = () => {
    const clean = clampStr(draft, 32);
    setDraft(clean);
    setDisplayName(clean || "User");
    try {
      localStorage.setItem(LS_DISPLAY_NAME, clean || "User");
    } catch {}
    popToast("Сохранено ✅");
  };

  const onCopyInvite = async () => {
    await copyText(inviteLink);
    popToast("Ссылка скопирована 🔗");
  };

  const pickAvatar = () => fileRef.current?.click();

  const onAvatarFile = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      popToast("Нужна картинка 🖼️");
      return;
    }
    try {
      const raw = await readFileAsDataURL(file);
      const small = await downscaleImage(raw, 512, 0.86);
      setAvatar(small);
      try {
        localStorage.setItem(LS_AVATAR, small);
      } catch {}
      popToast("Фотка сохранена 📸");
    } catch {
      popToast("Не получилось загрузить 😬");
    }
  };

  const removeAvatar = () => {
    setAvatar(null);
    try {
      localStorage.removeItem(LS_AVATAR);
    } catch {}
    popToast("Фотка удалена 🗑️");
  };

  const doLogout = () => {
    const ok = window.confirm("Выйти из margeleT? (локальные данные будут очищены)");
    if (!ok) return;
    if (onLogout) onLogout();
    else hardLogout();
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
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "18px 18px 28px" }}>
        {/* Top bar (оставил стиль “Назад” как есть) */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: "transparent",
              border: "none",
              color: brand.muted,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: 0,
              fontWeight: 800,
            }}
            aria-label="Назад"
            title="Назад"
          >
            <span style={{ color: brand.pink, fontSize: 18 }}>←</span>
            <span style={{ fontSize: 14, letterSpacing: 0.2 }}>Назад</span>
          </button>

          <div style={{ textAlign: "center", lineHeight: 1.05 }}>
            <div style={{ fontWeight: 900, fontSize: 14, opacity: 0.95 }}>{title || "Профиль"}</div>
            <div style={{ fontSize: 12, color: brand.hint }}>
              @{handle} • id {userId.slice(0, 8)}
            </div>
          </div>

          <div style={{ width: 160, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            {toast ? (
              <div
                style={{
                  fontSize: 12,
                  color: brand.green,
                  fontWeight: 800,
                  padding: "8px 10px",
                  borderRadius: 12,
                  background: "rgba(102,212,146,0.10)",
                  border: "1px solid rgba(102,212,146,0.18)",
                  whiteSpace: "nowrap",
                }}
              >
                {toast}
              </div>
            ) : null}

            <button
              type="button"
              onClick={doLogout}
              style={{
                height: 34,
                padding: "0 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.20)",
                color: brand.muted,
                fontWeight: 900,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              title="Выйти"
            >
              Выйти
            </button>
          </div>
        </div>

        <div style={{ height: 1, background: brand.line, marginTop: 14 }} />

        {/* Profile Card */}
        <div
          style={{
            marginTop: 18,
            borderRadius: 26,
            border: `1px solid ${brand.border}`,
            background: brand.card,
            padding: "16px 16px 14px",
            boxShadow: "0 18px 48px rgba(0,0,0,0.28)",
          }}
        >
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 18,
                  background: "rgba(190,149,250,0.20)",
                  border: "1px solid rgba(190,149,250,0.22)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  fontSize: 18,
                  color: brand.violet,
                  userSelect: "none",
                  overflow: "hidden",
                }}
                aria-hidden
                title="Аватар"
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt="avatar"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  initials
                )}
              </div>

              {/* кнопки аватарки */}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={pickAvatar}
                  style={{
                    height: 30,
                    padding: "0 10px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,163,206,0.22)",
                    background: "rgba(255,163,206,0.14)",
                    color: brand.pink,
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Фото
                </button>

                <button
                  type="button"
                  onClick={removeAvatar}
                  disabled={!avatar}
                  style={{
                    height: 30,
                    padding: "0 10px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.18)",
                    color: avatar ? brand.muted : "rgba(234,229,227,0.25)",
                    fontWeight: 900,
                    cursor: avatar ? "pointer" : "not-allowed",
                  }}
                  title="Удалить фотку"
                >
                  Удалить
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => onAvatarFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: brand.hint, fontWeight: 800 }}>
                Твоё имя (будет видно в чатах)
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") save();
                    if (e.key === "Escape") setDraft(displayName || "");
                  }}
                  placeholder="Например: Jim"
                  style={{
                    width: "100%",
                    height: 44,
                    borderRadius: 16,
                    background: "rgba(0,0,0,0.22)",
                    border: `1px solid ${brand.border}`,
                    color: brand.text,
                    padding: "0 14px",
                    outline: "none",
                    fontWeight: 800,
                    letterSpacing: 0.2,
                  }}
                />

                <button
                  type="button"
                  onClick={save}
                  style={{
                    height: 44,
                    padding: "0 14px",
                    borderRadius: 16,
                    border: `1px solid rgba(190,149,250,0.22)`,
                    background: "rgba(190,149,250,0.16)",
                    color: brand.violet,
                    fontWeight: 900,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                  title="Сохранить"
                >
                  Save
                </button>
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: brand.muted,
                    background: brand.chip,
                    border: `1px solid ${brand.border}`,
                    padding: "8px 10px",
                    borderRadius: 999,
                  }}
                >
                  @{handle}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 900,
                    color: brand.muted,
                    background: brand.chip,
                    border: `1px solid ${brand.border}`,
                    padding: "8px 10px",
                    borderRadius: 999,
                  }}
                  title="Это локальный id (пока)"
                >
                  user • {userId.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>

          {/* Invite */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, color: brand.hint, fontWeight: 800 }}>
              Инвайт (пока мок, потом будет реальный)
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center" }}>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: 44,
                  borderRadius: 16,
                  background: "rgba(0,0,0,0.22)",
                  border: `1px solid ${brand.border}`,
                  display: "flex",
                  alignItems: "center",
                  padding: "0 14px",
                  color: brand.muted,
                  fontSize: 12,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={inviteLink}
              >
                {inviteLink}
              </div>

              <button
                type="button"
                onClick={onCopyInvite}
                style={{
                  height: 44,
                  padding: "0 14px",
                  borderRadius: 16,
                  border: `1px solid rgba(255,163,206,0.22)`,
                  background: "rgba(255,163,206,0.14)",
                  color: brand.pink,
                  fontWeight: 900,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
                title="Скопировать"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, color: brand.hint, fontSize: 12, lineHeight: 1.35 }}>
          <b style={{ color: brand.muted }}>Идея:</b> профиль = ядро идентичности без телефона:{" "}
          <b style={{ color: brand.muted }}>имя</b>, <b style={{ color: brand.muted }}>@ник</b>,{" "}
          <b style={{ color: brand.muted }}>инвайт</b>,{" "}
          <b style={{ color: brand.muted }}>устройства</b>. Дальше всё это пойдёт в комнаты и чат 😈
        </div>
      </div>
    </div>
  );
}