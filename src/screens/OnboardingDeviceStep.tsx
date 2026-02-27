import React, { useMemo, useRef, useState, useEffect } from "react";
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

function sanitizePin(raw: string) {
  return (raw || "").replace(/[^\d]/g, "").slice(0, 4);
}

export default function OnboardingDeviceStep({
  onContinue,
}: {
  onContinue?: (deviceName: string, mode: "create" | "restore", pin4: string) => void;
}) {
  const { t } = useI18n();

  const [deviceName, setDeviceName] = useState("");

  const initialName = useMemo(() => readLsString("margelet_display_name"), []);
  const initialHandle = useMemo(() => readLsString("margelet_handle_v1"), []);
  const initialKnown = initialName || initialHandle;

  const [mode, setMode] = useState<"create" | "restore">(initialKnown ? "restore" : "create");
  const [deviceType, setDeviceType] = useState<"desktop" | "mobile" | "tablet">("desktop");

  const [knownName, setKnownName] = useState<string>(initialName || "");
  const [knownHandle, setKnownHandle] = useState<string>(initialHandle || "");

  // PIN
  const [pin, setPin] = useState("");
  const [pinFocused, setPinFocused] = useState(false);
  const [revealPin, setRevealPin] = useState(false);
  const [pinError, setPinError] = useState("");

  const pinInputRef = useRef<HTMLInputElement | null>(null);

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

    if (hasKnown) {
      setMode("restore");
    } else {
      setMode("create");
    }
  }, []);

  const ui = useMemo(
    () => ({
      border: brand.border,
      tabIdleBg: brand.surface2,
      inputBg: brand.inputBg,
      muted: "rgba(234,229,227,0.70)",
      hint: "rgba(234,229,227,0.60)",
      qrBg: brand.qrBg,

      ctaBg: brand.ctaActiveBg,
      ctaText: brand.ctaActiveText,
    }),
    []
  );

  const hasName = deviceName.trim().length > 0;
  const hasPin = /^\d{4}$/.test(pin);
  const hasKnown = !!(knownName || knownHandle);

  const isCreate = mode === "create";

  const isCtaDisabled = (isCreate && (!hasName || !hasPin)) || (!isCreate && (!hasKnown || !hasPin));

  const activeIndex = Math.min(pin.length, 3);

  const focusPin = () => {
    pinInputRef.current?.focus();
    setPinFocused(true);
  };

  const PinCell = ({ idx }: { idx: number }) => {
    const filled = idx < pin.length;
    const isActive = pinFocused && idx === activeIndex;

    return (
      <button
        type="button"
        onClick={focusPin}
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          border: `2px solid ${isActive ? brand.violet : brand.border}`,
          background: "rgba(0,0,0,0.10)",
          display: "grid",
          placeItems: "center",
          cursor: "text",
          padding: 0,
        }}
        aria-label={`PIN ${idx + 1}`}
      >
        {filled ? (
          <span style={{ fontSize: 22, fontWeight: 900, color: brand.text, opacity: 0.95 }}>
            {revealPin ? pin[idx] : "•"}
          </span>
        ) : isActive ? (
          <span
            className="margelet-pin-caret"
            style={{
              width: 2,
              height: 22,
              borderRadius: 2,
              background: "rgba(234,229,227,0.85)",
              display: "block",
            }}
          />
        ) : (
          <span style={{ width: 10, height: 10, borderRadius: 10, background: "transparent", display: "block" }} />
        )}
      </button>
    );
  };

  const EyeCell = () => {
    return (
      <button
        type="button"
        onClick={() => setRevealPin((v) => !v)}
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          border: `2px solid ${brand.border}`,
          background: "rgba(0,0,0,0.10)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          padding: 0,
        }}
        aria-label="Показать PIN"
        title={revealPin ? "Скрыть" : "Показать"}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>{revealPin ? "🙈" : "👀"}</span>
      </button>
    );
  };

  return (
    <div style={{ width: "100%", maxWidth: 560, margin: "0 auto" }}>
      <style>{`
        @keyframes margeleTPinBlink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
        .margelet-pin-caret { animation: margeleTPinBlink 1s infinite; }
      `}</style>

      {/* ВЕРХ НЕ ТРОГАЕМ */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.05, margin: 0 }}>
          {mode === "restore" && (knownName || knownHandle) ? `Привет, ${knownName || knownHandle}!` : t("onb.title")}
        </h1>

        <div style={{ marginTop: 16, display: "flex", gap: 14, alignItems: "flex-start", maxWidth: 520 }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.35, color: ui.muted }}>
            {mode === "restore" && (knownName || knownHandle) ? (
              <>Введи свой PIN</>
            ) : (
              <>
                {t("onb.subtitle.1")}
                <br />
                {t("onb.subtitle.2")}
              </>
            )}
          </p>

          {mode === "restore" && (
            <button
              type="button"
              onClick={() => {
                // пока просто UX: очистить ввод
                setPin("");
                setPinError("");
                focusPin();
              }}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "none",
                color: brand.pink,
                fontWeight: 900,
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 6,
              }}
              title="Забыл"
            >
              Забыл
            </button>
          )}
        </div>
      </div>

      {/* Устройства (только Create) */}
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
          onClick={() => {
            setMode("create");
            setPin("");
            setPinError("");
            setRevealPin(false);
          }}
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
          Создать
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("restore");
            setPin("");
            setPinError("");
            setRevealPin(false);
          }}
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
          Войти
        </button>
      </div>

      {/* CREATE: имя устройства */}
      {mode === "create" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 22 }}>🦭</span>
            <span style={{ fontSize: 13, color: ui.hint, fontWeight: 400 }}>{t("onb.card.create.title")}</span>
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
              marginBottom: 14,
            }}
          />

          <div style={{ fontSize: 12, fontWeight: 900, color: ui.hint, marginBottom: 10 }}>
            Придумай PIN (4 цифры)
          </div>

          {/* PIN row (без контейнеров-карточек) */}
          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 10 }}>
            <PinCell idx={0} />
            <PinCell idx={1} />
            <PinCell idx={2} />
            <PinCell idx={3} />
            <EyeCell />
          </div>

          <div style={{ fontSize: 13, color: ui.hint, marginBottom: 12 }}>
            PIN обязателен. Можно сменить в профиле.
          </div>
        </>
      )}

      {/* RESTORE: привет + handle + PIN (без контейнера) */}
      {mode === "restore" && (
        <>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>🦭</span>
            <span style={{ fontSize: 14, color: brand.text, fontWeight: 900, opacity: 0.9 }}>
              {knownHandle?.trim() || "@you"}
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 12 }}>
            <PinCell idx={0} />
            <PinCell idx={1} />
            <PinCell idx={2} />
            <PinCell idx={3} />
            <EyeCell />
          </div>

          {pinError ? (
            <div style={{ textAlign: "center", marginTop: -4, marginBottom: 10, fontSize: 12, color: "rgba(255,120,160,0.95)", fontWeight: 900 }}>
              {pinError}
            </div>
          ) : (
            <div style={{ textAlign: "center", marginTop: -4, marginBottom: 10, fontSize: 12, color: ui.hint }}>
              Введи 4 цифры PIN
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (!hasKnown) return;
              if (!/^\d{4}$/.test(pin)) return;

              // лёгкая проверка прямо тут, чтобы App не дергать без надобности:
              const stored = readLsString("margelet_pin_v1");
              if (stored && stored !== pin) {
                setPinError("Неверный PIN");
                setPin("");
                focusPin();
                return;
              }

              onContinue?.("", "restore", pin);
            }}
            style={{
              width: "100%",
              padding: "16px 0",
              borderRadius: 20,
              border: `1px solid ${ui.border}`,
              background: "rgba(0,0,0,0.35)",
              color: brand.violet,
              fontWeight: 900,
              fontSize: 15,
              cursor: !hasKnown || !hasPin ? "not-allowed" : "pointer",
              opacity: !hasKnown || !hasPin ? 0.6 : 1,
              marginBottom: 14,
            }}
            disabled={!hasKnown || !hasPin}
          >
            Войти
          </button>

          {/* QR restore block (оставляем как у тебя) */}
          <button
            type="button"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 16,
              border: `1px solid ${ui.border}`,
              background: ui.tabIdleBg,
              color: brand.text,
              fontWeight: 800,
              cursor: "pointer",
              textAlign: "left",
              marginBottom: 12,
            }}
          >
            Восстановить через QR
          </button>

          <div
            style={{
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

      {/* CTA для Create */}
      {mode === "create" && (
        <button
          type="button"
          disabled={isCtaDisabled}
          onClick={() => {
            if (isCtaDisabled) return;
            onContinue?.(deviceName, "create", pin);
          }}
          style={{
            marginTop: 10,
            width: "100%",
            padding: "16px 0",
            borderRadius: 20,
            border: `1px solid ${ui.border}`,
            background: isCtaDisabled ? brand.ctaIdleBg : ui.ctaBg,
            color: isCtaDisabled ? brand.ctaIdleText : ui.ctaText,
            fontWeight: 800,
            fontSize: 15,
            cursor: isCtaDisabled ? "not-allowed" : "pointer",
            transition: "0.2s ease",
            opacity: isCtaDisabled ? 0.92 : 1,
            filter: isCtaDisabled ? "saturate(0.9)" : "none",
          }}
        >
          {t("onb.cta.continue")}
        </button>
      )}

      {/* скрытый input под PIN */}
      <input
        ref={pinInputRef}
        value={pin}
        onChange={(e) => {
          const v = sanitizePin(e.target.value);
          setPin(v);
          setPinError("");
        }}
        onFocus={() => setPinFocused(true)}
        onBlur={() => setPinFocused(false)}
        inputMode="numeric"
        pattern="\d*"
        type="tel"
        maxLength={4}
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
          width: 1,
          height: 1,
        }}
      />
    </div>
  );
}