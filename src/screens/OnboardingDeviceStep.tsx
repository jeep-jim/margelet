import React, { useMemo, useState, useEffect } from "react";
import { useI18n } from "../i18n";

const brand = {
  bg: "#272632",
  text: "#EAE5E3",

  pink: "#FFA3CE",
  violet: "#BE95FA",
  green: "#66D492",

  surface: "rgba(255,255,255,0.06)",
  surface2: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.10)",

  inputBg: "rgba(0,0,0,0.25)",
  qrBg: "rgba(0,0,0,0.35)",

  ctaIdleBg: "#111111",
  ctaIdleText: "#BE95FA",

  ctaActiveBg: "#BE95FA",
  ctaActiveText: "#272632",
};


function readLsString(key: string): string {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return "";
    // usePersisted хранит JSON.stringify, но старый код мог хранить plain string
    const parsed = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : String(parsed ?? "");
  } catch {
    try {
      return localStorage.getItem(key) || "";
    } catch {
      return "";
    }
  }
}

function WalrusIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <ellipse cx="60" cy="70" rx="40" ry="28" fill={brand.violet} />
      <circle cx="60" cy="45" r="28" fill={brand.violet} />
      <circle cx="48" cy="42" r="8" stroke={brand.bg} strokeWidth="3" />
      <circle cx="72" cy="42" r="8" stroke={brand.bg} strokeWidth="3" />
      <line x1="56" y1="42" x2="64" y2="42" stroke={brand.bg} strokeWidth="3" />
      <circle cx="48" cy="42" r="3" fill={brand.bg} />
      <circle cx="72" cy="42" r="3" fill={brand.bg} />
      <rect x="50" y="58" width="6" height="18" rx="3" fill={brand.text} opacity="0.85" />
      <rect x="64" y="58" width="6" height="18" rx="3" fill={brand.text} opacity="0.85" />
    </svg>
  );
}

function DeviceTile({
  active,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: 18,
        border: `2px solid ${active ? brand.violet : brand.border}`,
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "0.2s ease",
      }}
    >
      {children}
    </div>
  );
}

function LaptopIcon({ active }: { active?: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect
        x="4"
        y="5"
        width="16"
        height="10"
        rx="2"
        stroke={active ? brand.violet : brand.text}
        strokeWidth="1.6"
      />
      <path
        d="M2 18h20"
        stroke={active ? brand.violet : brand.text}
        strokeWidth="1.6"
      />
    </svg>
  );
}

function PhoneIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="26" viewBox="0 0 24 24" fill="none">
      <rect
        x="7"
        y="3"
        width="10"
        height="18"
        rx="3"
        stroke={active ? brand.violet : brand.text}
        strokeWidth="1.6"
      />
      <circle cx="12" cy="17" r="1" fill={active ? brand.violet : brand.text} />
    </svg>
  );
}

function TabletIcon({ active }: { active?: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect
        x="5"
        y="4"
        width="14"
        height="16"
        rx="3"
        stroke={active ? brand.violet : brand.text}
        strokeWidth="1.6"
      />
    </svg>
  );
}

function MonitorIcon({ active }: { active?: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="4"
        width="18"
        height="12"
        rx="2"
        stroke={active ? brand.violet : brand.text}
        strokeWidth="1.6"
      />
      <path
        d="M8 20h8M12 16v4"
        stroke={active ? brand.violet : brand.text}
        strokeWidth="1.6"
      />
    </svg>
  );
}

export default function OnboardingDeviceStep({
  onContinue,
}: {
  onContinue?: (deviceName: string, mode: "create" | "restore") => void;
}) {
  const { t } = useI18n();

  const [deviceName, setDeviceName] = useState("");

  // "уже входил" = на девайсе есть локальный профиль (имя или handle)
  const initialName = useMemo(() => readLsString("margelet_display_name"), []);
  const initialHandle = useMemo(() => readLsString("margelet_handle_v1"), []);
  const initialKnown = initialName || initialHandle;

  // если уже входил — стартуем со вкладки "Войти"
  const [mode, setMode] = useState<"create" | "restore">(initialKnown ? "restore" : "create");
  const [deviceType, setDeviceType] = useState<"desktop" | "mobile" | "tablet">("desktop");

  // restore UX
  const [restoreMethod, setRestoreMethod] = useState<"password" | "qr">(initialKnown ? "password" : "qr");
  const [password, setPassword] = useState("");

  const [knownName, setKnownName] = useState<string>(initialName || "");
  const [knownHandle, setKnownHandle] = useState<string>(initialHandle || "");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPad|Tablet/i.test(ua)) setDeviceType("tablet");
    else if (/Mobi|Android|iPhone/i.test(ua)) setDeviceType("mobile");
    else setDeviceType("desktop");

    const name = readLsString("margelet_display_name");
    const handle = readLsString("margelet_handle_v1");

    setKnownName(name);
    setKnownHandle(handle);

    const hasKnown = !!(name || handle);

    // если уже входили — эта страница должна встречать: сразу "Войти"
    if (hasKnown) {
      setMode("restore");
      setRestoreMethod("password");
    } else {
      setMode("create");
      setRestoreMethod("qr");
    }
  }, []);

  const hasName = deviceName.trim().length > 0;
  const isCreate = mode === "create";
  const hasKnown = !!(knownName || knownHandle);

  const isCtaDisabled =
    (isCreate && !hasName) ||
    (!isCreate && restoreMethod === "password" && password.trim().length === 0) || // пароль обязателен (пока)
    (!isCreate && restoreMethod === "password" && !hasKnown); // без локального профиля парольный вход не показываем

  const ui = useMemo(
    () => ({
      border: brand.border,
      cardBg: brand.surface,
      tabIdleBg: brand.surface2,
      inputBg: brand.inputBg,
      muted: "rgba(234,229,227,0.70)",
      hint: "rgba(234,229,227,0.60)",
      placeholder: "rgba(234,229,227,0.35)",
      qrBg: brand.qrBg,

      ctaBg: isCtaDisabled ? brand.ctaIdleBg : brand.ctaActiveBg,
      ctaText: isCtaDisabled ? brand.ctaIdleText : brand.ctaActiveText,
      ctaOpacity: isCtaDisabled ? 0.92 : 1,
      ctaFilter: isCtaDisabled ? "saturate(0.9)" : "none",
    }),
    [isCtaDisabled]
  );

  return (
    <div style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
      {/* ВЕРХ НЕ ТРОГАЕМ ВООБЩЕ */}
      <div style={{ marginBottom: 40 }}>
        <h1
          style={{
            fontSize: 42,
            fontWeight: 800,
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          {mode === "restore" && (knownName || knownHandle) ? `Привет, ${knownName || knownHandle}!` : t("onb.title")}
        </h1>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
            maxWidth: 520,
          }}
        >
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.35, color: ui.muted }}>
            {mode === "restore" && (knownName || knownHandle) ? (
              <>Введи свой пароль {knownName || knownHandle}</>
            ) : (
              <>
                {t("onb.subtitle.1")}
                <br />
                {t("onb.subtitle.2")}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Устройства */}
      {mode === "create" && (
        <div style={{ display: "flex", gap: 14, marginBottom: 22 }}>
          <DeviceTile active={deviceType === "desktop"}>
            <LaptopIcon active={deviceType === "desktop"} />
          </DeviceTile>
          <DeviceTile active={deviceType === "mobile"}>
            <PhoneIcon active={deviceType === "mobile"} />
          </DeviceTile>
          <DeviceTile active={deviceType === "tablet"}>
            <TabletIcon active={deviceType === "tablet"} />
          </DeviceTile>
          <DeviceTile>
            <MonitorIcon />
          </DeviceTile>
        </div>
      )}

      {/* Кнопки Create/Restore */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button
          type="button"
          onClick={() => { setMode("create"); }}
          style={{
            flex: 1,
            padding: "12px 0",
            borderRadius: 16,
            border: `1px solid ${ui.border}`,
            background: mode === "create" ? brand.violet : ui.tabIdleBg,
            color: mode === "create" ? brand.bg : brand.text,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {t("onb.mode.create")}
        </button>

        <button
          type="button"
          onClick={() => { setMode("restore"); setRestoreMethod(hasKnown ? "password" : "qr"); }}
          style={{
            flex: 1,
            padding: "12px 0",
            borderRadius: 16,
            border: `1px solid ${ui.border}`,
            background: mode === "restore" ? brand.green : ui.tabIdleBg,
            color: mode === "restore" ? brand.bg : brand.text,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {t("onb.mode.restore")}
        </button>
      </div>

      {/* CREATE */}
      {mode === "create" ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <WalrusIcon size={39} />
            <span
              style={{
                fontSize: 13,
                color: ui.hint,
                fontWeight: 400,
              }}
            >
              {t("onb.card.create.title")}
            </span>
          </div>

          <input
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
            placeholder={t("onb.card.create.placeholder")}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 16,
              border: `1px solid ${ui.border}`,
              background: ui.inputBg,
              fontSize: 15,
              outline: "none",
              color: brand.text,
              caretColor: brand.violet,
            }}
          />
        </>
      ) : (
        /* RESTORE (встречающий) */
        <>
          <div
            style={{
              padding: 24,
              borderRadius: 24,
              background: ui.cardBg,
              border: `1px solid ${ui.border}`,
            }}
          >
            {/* Если уже есть локальный профиль — показываем пароль первым экраном */}
            {hasKnown ? (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <WalrusIcon size={22} />
                  <span style={{ fontSize: 13, color: ui.hint, fontWeight: 400 }}>
                    {knownHandle ? `@${knownHandle}` : knownName}
                  </span>
                </div>

                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={`Пароль ${knownName || knownHandle}`}
                  type="password"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 16,
                    border: `1px solid ${ui.border}`,
                    background: ui.inputBg,
                    fontSize: 15,
                    outline: "none",
                    color: brand.text,
                    caretColor: brand.violet,
                  }}
                />
              </>
            ) : null}

            {/* QR restore — всегда видно как отдельная "вторая линия" */}
            <button
              type="button"
              onClick={() => setRestoreMethod("qr")}
              style={{
                width: "100%",
                marginTop: hasKnown ? 14 : 0,
                padding: "12px 14px",
                borderRadius: 16,
                border: `1px solid ${ui.border}`,
                background: restoreMethod === "qr" || !hasKnown ? ui.tabIdleBg : "transparent",
                color: brand.text,
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              Восстановить через QR
            </button>

            {(restoreMethod === "qr" || !hasKnown) && (
              <>
                <div
                  style={{
                    marginTop: 12,
                    height: 180,
                    borderRadius: 20,
                    background: ui.qrBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    color: ui.hint,
                  }}
                >
                  {t("onb.card.restore.box")}
                </div>

                <div style={{ marginTop: 10, fontSize: 13, color: ui.hint }}>
                  {t("onb.restore.qr.hint")}
                </div>
              </>
            )}
          </div>
        </>)}

      {/* CTA */}
      <button
        type="button"
        disabled={isCtaDisabled}
        onClick={() => {
          if (isCtaDisabled) return;

          // маленький мостик: если restore/password — сохраняем пароль временно для следующего шага
          if (mode === "restore") {
            localStorage.setItem("margelet_restore_method_v1", restoreMethod);
            if (restoreMethod === "password") {
              localStorage.setItem("margelet_restore_password_v1", password);
            } else {
              localStorage.removeItem("margelet_restore_password_v1");
            }
          }

          onContinue?.(deviceName, mode);
        }}
        style={{
          marginTop: 10,
          width: "100%",
          padding: "16px 0",
          borderRadius: 20,
          border: `1px solid ${ui.border}`,
          background: ui.ctaBg,
          color: ui.ctaText,
          fontWeight: 800,
          fontSize: 15,
          cursor: isCtaDisabled ? "not-allowed" : "pointer",
          transition: "0.2s ease",
          opacity: ui.ctaOpacity,
          filter: ui.ctaFilter,
        }}
      >
        {t("onb.cta.continue")}
      </button>
    </div>
  );
}