import React, { useMemo, useState, useEffect, useRef } from "react";
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

function readPin(): string {
  return readLsString("margelet_pin_v1");
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

function WalrusGlassesButton({ active }: { active?: boolean }) {
  // морж в очках 😎 — кнопка показать/скрыть PIN
  return (
    <svg width="28" height="28" viewBox="0 0 64 64" fill="none" aria-hidden style={{ display: "block" }}>
      <circle cx="32" cy="32" r="26" fill={active ? "rgba(190,149,250,0.22)" : "rgba(255,255,255,0.06)"} />
      <circle cx="32" cy="34" r="16" fill={brand.violet} opacity="0.22" />
      <rect x="16" y="28" width="14" height="10" rx="5" fill="rgba(0,0,0,0.35)" stroke="rgba(234,229,227,0.55)" />
      <rect x="34" y="28" width="14" height="10" rx="5" fill="rgba(0,0,0,0.35)" stroke="rgba(234,229,227,0.55)" />
      <path d="M30 32h4" stroke="rgba(234,229,227,0.55)" strokeWidth="2" strokeLinecap="round" />
      <path d="M23 42c3 2 15 2 18 0" stroke="rgba(234,229,227,0.35)" strokeWidth="2" strokeLinecap="round" />
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
      <rect x="4" y="5" width="16" height="10" rx="2" stroke={active ? brand.violet : brand.text} strokeWidth="1.6" />
      <path d="M2 18h20" stroke={active ? brand.violet : brand.text} strokeWidth="1.6" />
    </svg>
  );
}

function PhoneIcon({ active }: { active?: boolean }) {
  return (
    <svg width="22" height="26" viewBox="0 0 24 24" fill="none">
      <rect x="7" y="3" width="10" height="18" rx="3" stroke={active ? brand.violet : brand.text} strokeWidth="1.6" />
      <circle cx="12" cy="17" r="1" fill={active ? brand.violet : brand.text} />
    </svg>
  );
}

function TabletIcon({ active }: { active?: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="4" width="14" height="16" rx="3" stroke={active ? brand.violet : brand.text} strokeWidth="1.6" />
    </svg>
  );
}

function MonitorIcon({ active }: { active?: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="12" rx="2" stroke={active ? brand.violet : brand.text} strokeWidth="1.6" />
      <path d="M8 20h8M12 16v4" stroke={active ? brand.violet : brand.text} strokeWidth="1.6" />
    </svg>
  );
}

function isValidPin(pin: string) {
  return /^\d{4}$/.test(pin);
}

function PinCells({
  label,
  value,
  onChange,
  error,
  helper,
  showDigits,
  onToggleShow,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  helper?: string;
  showDigits: boolean;
  onToggleShow: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [focused, setFocused] = useState(false);

  const digits = value.slice(0, 4).split("");
  const activeIndex = Math.min(digits.length, 3);

  return (
    <div>
      <style>{`
        @keyframes pinBlink { 0%{opacity:0.0} 45%{opacity:0.0} 55%{opacity:1.0} 100%{opacity:1.0} }
        .pinCaret { width:2px; height:18px; border-radius:2px; background:${brand.violet}; animation: pinBlink 1s infinite; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div style={{ fontSize: 13, color: "rgba(234,229,227,0.60)", fontWeight: 700 }}>{label}</div>

        <button
          type="button"
          onClick={onToggleShow}
          style={{
            width: 38,
            height: 38,
            borderRadius: 14,
            border: `1px solid ${brand.border}`,
            background: "rgba(255,255,255,0.04)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
          }}
          title={showDigits ? "Скрыть" : "Показать"}
          aria-label={showDigits ? "Скрыть PIN" : "Показать PIN"}
        >
          <WalrusGlassesButton active={showDigits} />
        </button>
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.focus()}
        style={{
          width: "100%",
          border: `1px solid ${error ? "rgba(255,80,120,0.45)" : brand.border}`,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 22,
          padding: 16,
          cursor: "text",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          {new Array(4).fill(0).map((_, i) => {
            const filled = typeof digits[i] !== "undefined";
            const isActive = focused && i === activeIndex;
            const showCaret = isActive && value.length < 4;

            return (
              <div
                key={i}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  border: `2px solid ${isActive ? brand.violet : "rgba(255,255,255,0.08)"}`,
                  background: "rgba(0,0,0,0.22)",
                  display: "grid",
                  placeItems: "center",
                  position: "relative",
                }}
              >
                {filled ? (
                  <div style={{ fontWeight: 900, fontSize: 20, color: brand.text, letterSpacing: 1 }}>
                    {showDigits ? digits[i] : "•"}
                  </div>
                ) : showCaret ? (
                  <div className="pinCaret" />
                ) : (
                  <div style={{ width: 10, height: 10, borderRadius: 10, background: "transparent" }} />
                )}
              </div>
            );
          })}
        </div>

        <input
          ref={inputRef}
          value={value}
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={4}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => {
            const next = (e.target.value || "").replace(/\D/g, "").slice(0, 4);
            onChange(next);
          }}
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
            width: 1,
            height: 1,
          }}
        />
      </button>

      {error ? (
        <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,120,160,0.95)", fontWeight: 800 }}>
          {error}
        </div>
      ) : helper ? (
        <div style={{ marginTop: 10, fontSize: 12, color: "rgba(234,229,227,0.55)", fontWeight: 700 }}>
          {helper}
        </div>
      ) : null}
    </div>
  );
}

export default function OnboardingDeviceStep({
  mode,
  onModeChange,
  onContinue,
}: {
  mode: "create" | "restore";
  onModeChange?: (m: "create" | "restore") => void;
  onContinue?: (payload: { deviceName: string; mode: "create" | "restore"; pin: string }) => void;
}) {
  const { t } = useI18n();

  const [deviceName, setDeviceName] = useState("");

  // "уже входил" = на девайсе есть локальный профиль (имя или handle)
  const [knownName, setKnownName] = useState<string>(() => readLsString("margelet_display_name"));
  const [knownHandle, setKnownHandle] = useState<string>(() => readLsString("margelet_handle_v1"));
  const hasKnown = !!(knownName || knownHandle);

  const [deviceType, setDeviceType] = useState<"desktop" | "mobile" | "tablet">("desktop");

  // PIN
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  // ошибки
  const [pinError, setPinError] = useState<string>("");
  const [nameError, setNameError] = useState<string>("");

  // restore UX
  const [restoreMethod, setRestoreMethod] = useState<"password" | "qr">("password");

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPad|Tablet/i.test(ua)) setDeviceType("tablet");
    else if (/Mobi|Android|iPhone/i.test(ua)) setDeviceType("mobile");
    else setDeviceType("desktop");

    const name = readLsString("margelet_display_name");
    const handle = readLsString("margelet_handle_v1");
    setKnownName(name);
    setKnownHandle(handle);

    // если профиля нет — restoreMethod по умолчанию QR
    if (!(name || handle)) setRestoreMethod("qr");
  }, []);

  useEffect(() => {
    // если пришли снаружи (App) в restore — встречаем PIN
    if (mode === "restore") setRestoreMethod(hasKnown ? "password" : "qr");
    if (mode === "create") setRestoreMethod("qr");
    setPin("");
    setPinError("");
    setNameError("");
  }, [mode, hasKnown]);

  const ui = useMemo(
    () => ({
      border: brand.border,
      cardBg: brand.surface,
      tabIdleBg: brand.surface2,
      inputBg: brand.inputBg,
      muted: "rgba(234,229,227,0.70)",
      hint: "rgba(234,229,227,0.60)",
      qrBg: brand.qrBg,
    }),
    []
  );

  const isCreate = mode === "create";

  const isCtaDisabled = (() => {
    if (isCreate) {
      const okName = deviceName.trim().length > 0;
      const okPin = isValidPin(pin);
      return !(okName && okPin);
    }

    // restore
    if (restoreMethod === "qr") return false; // QR можно нажать "Продолжить" (потом сделаем реальный сканер)
    if (!hasKnown) return true;
    return !isValidPin(pin);
  })();

  const ctaBg = isCtaDisabled ? brand.ctaIdleBg : brand.ctaActiveBg;
  const ctaText = isCtaDisabled ? brand.ctaIdleText : brand.ctaActiveText;

  const tryContinue = () => {
    setPinError("");
    setNameError("");

    if (mode === "create") {
      if (!deviceName.trim()) {
        setNameError("Назови устройство");
        return;
      }
      if (!isValidPin(pin)) {
        setPinError("PIN должен быть из 4 цифр");
        return;
      }
      onContinue?.({ deviceName, mode, pin });
      return;
    }

    // restore
    if (restoreMethod === "qr") {
      // пока просто оставляем вход через QR следующим шагом (ты хотел без фейков — тут не пускаю в чаты)
      // Но UI не ломаем: можно нажать — и дальше уже ты подключишь реальный restore.
      // Если хочешь, тут можно будет показывать "Скоро".
      onContinue?.({ deviceName: "", mode, pin: "" });
      return;
    }

    if (!hasKnown) {
      setPinError("На этом устройстве нет сохранённого профиля");
      return;
    }

    const saved = readPin();
    if (!isValidPin(pin)) {
      setPinError("PIN должен быть из 4 цифр");
      return;
    }
    if (saved && pin !== saved) {
      setPinError("Неверный PIN");
      return;
    }

    onContinue?.({ deviceName: "", mode, pin });
  };

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
          {mode === "restore" && hasKnown ? `Привет, ${knownName || knownHandle}!` : t("onb.title")}
        </h1>

        <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.35, color: ui.muted, maxWidth: 520 }}>
            {mode === "restore" && hasKnown ? (
              <>Введи свой PIN</>
            ) : (
              <>
                {t("onb.subtitle.1")}
                <br />
                {t("onb.subtitle.2")}
              </>
            )}
          </p>

          {mode === "restore" ? (
            <button
              type="button"
              onClick={() => setRestoreMethod("qr")}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                color: brand.pink,
                fontWeight: 900,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 4,
                whiteSpace: "nowrap",
                opacity: 0.9,
              }}
              title="Забыл"
            >
              Забыл
            </button>
          ) : null}
        </div>
      </div>

      {/* Устройства (только create) */}
      {mode === "create" && (
        <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 22 }}>
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

      {/* Кнопки Create/Sign in */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button
          type="button"
          onClick={() => onModeChange?.("create")}
          style={{
            flex: 1,
            padding: "12px 0",
            borderRadius: 16,
            border: `1px solid ${ui.border}`,
            background: mode === "create" ? brand.violet : ui.tabIdleBg,
            color: mode === "create" ? brand.bg : brand.text,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {t("onb.mode.create")}
        </button>

        <button
          type="button"
          onClick={() => onModeChange?.("restore")}
          style={{
            flex: 1,
            padding: "12px 0",
            borderRadius: 16,
            border: `1px solid ${ui.border}`,
            background: mode === "restore" ? brand.green : ui.tabIdleBg,
            color: mode === "restore" ? brand.bg : brand.text,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {t("onb.mode.restore")}
        </button>
      </div>

      {/* CREATE */}
      {mode === "create" ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <WalrusIcon size={39} />
            <span style={{ fontSize: 13, color: ui.hint, fontWeight: 400 }}>{t("onb.card.create.title")}</span>
          </div>

          <input
            value={deviceName}
            onChange={(e) => {
              setDeviceName(e.target.value);
              setNameError("");
            }}
            placeholder={t("onb.card.create.placeholder")}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 16,
              border: `1px solid ${nameError ? "rgba(255,80,120,0.45)" : ui.border}`,
              background: ui.inputBg,
              fontSize: 15,
              outline: "none",
              color: brand.text,
              caretColor: brand.violet,
            }}
          />

          {nameError ? (
            <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,120,160,0.95)", fontWeight: 800 }}>
              {nameError}
            </div>
          ) : null}

          <div style={{ marginTop: 14 }}>
            <PinCells
              label="Придумай PIN (4 цифры)"
              value={pin}
              onChange={(v) => {
                setPin(v);
                setPinError("");
              }}
              error={pinError}
              helper="PIN обязателен. Можно сменить в профиле."
              showDigits={showPin}
              onToggleShow={() => setShowPin((s) => !s)}
            />
          </div>
        </>
      ) : (
        // RESTORE (встречающий)
        <div
          style={{
            padding: 24,
            borderRadius: 24,
            background: ui.cardBg,
            border: `1px solid ${ui.border}`,
          }}
        >
          {hasKnown ? (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 14 }}>
                <WalrusIcon size={22} />
                <span style={{ fontSize: 13, color: ui.hint, fontWeight: 800 }}>
                  {knownHandle ? (knownHandle.startsWith("@") ? knownHandle : `@${knownHandle}`) : knownName}
                </span>
              </div>

              <PinCells
                label=""
                value={pin}
                onChange={(v) => {
                  setPin(v);
                  setPinError("");
                }}
                error={pinError}
                helper=""
                showDigits={showPin}
                onToggleShow={() => setShowPin((s) => !s)}
              />

              <button
                type="button"
                disabled={!isValidPin(pin)}
                onClick={tryContinue}
                style={{
                  marginTop: 14,
                  width: "100%",
                  padding: "16px 0",
                  borderRadius: 20,
                  border: `1px solid ${ui.border}`,
                  background: "#0E0E0E",
                  color: brand.violet,
                  fontWeight: 900,
                  fontSize: 15,
                  cursor: isValidPin(pin) ? "pointer" : "not-allowed",
                  opacity: isValidPin(pin) ? 1 : 0.55,
                }}
              >
                Войти
              </button>
            </>
          ) : (
            <div style={{ fontSize: 13, color: ui.hint, fontWeight: 800 }}>
              На этом устройстве нет сохранённого профиля.
            </div>
          )}

          {/* QR restore */}
          <button
            type="button"
            onClick={() => setRestoreMethod("qr")}
            style={{
              width: "100%",
              marginTop: 14,
              padding: "14px 14px",
              borderRadius: 18,
              border: `1px solid ${ui.border}`,
              background: "rgba(255,255,255,0.04)",
              color: brand.text,
              fontWeight: 900,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            Восстановить через QR
          </button>

          {restoreMethod === "qr" ? (
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
          ) : null}
        </div>
      )}

      {/* CTA (для create оставляем общий) */}
      {mode === "create" ? (
        <button
          type="button"
          disabled={isCtaDisabled}
          onClick={tryContinue}
          style={{
            marginTop: 10,
            width: "100%",
            padding: "16px 0",
            borderRadius: 20,
            border: `1px solid ${ui.border}`,
            background: ctaBg,
            color: ctaText,
            fontWeight: 900,
            fontSize: 15,
            cursor: isCtaDisabled ? "not-allowed" : "pointer",
            transition: "0.2s ease",
            opacity: isCtaDisabled ? 0.92 : 1,
            filter: isCtaDisabled ? "saturate(0.9)" : "none",
          }}
        >
          {t("onb.cta.continue")}
        </button>
      ) : null}
    </div>
  );
}