import React, { useMemo, useState } from "react";
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

function WalrusIcon({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <ellipse cx="60" cy="70" rx="40" ry="28" fill={brand.violet} />
      <circle cx="60" cy="45" r="28" fill={brand.violet} />

      <circle cx="48" cy="42" r="8" stroke={brand.bg} strokeWidth="3" />
      <circle cx="72" cy="42" r="8" stroke={brand.bg} strokeWidth="3" />
      <line x1="56" y1="42" x2="64" y2="42" stroke={brand.bg} strokeWidth="3" />

      <circle cx="48" cy="42" r="3" fill={brand.bg} />
      <circle cx="72" cy="42" r="3" fill={brand.bg} />

      {/* no pure white */}
      <rect x="50" y="58" width="6" height="18" rx="3" fill={brand.text} opacity="0.85" />
      <rect x="64" y="58" width="6" height="18" rx="3" fill={brand.text} opacity="0.85" />
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
  const [mode, setMode] = useState<"create" | "restore">("create");

  const hasName = deviceName.trim().length > 0;
  const isCreate = mode === "create";
  const isCtaDisabled = isCreate && !hasName;

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
      <style>
        {`
          .mgt-device-input::placeholder {
            color: ${ui.placeholder};
            opacity: 1;
          }
        `}
      </style>

      <div style={{ marginBottom: 40 }}>
        <h1
          style={{
            fontSize: 42,
            fontWeight: 800,
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          {t("onb.title")}
        </h1>

        <div
          style={{
            marginTop: 14,
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
          }}
        >
          <WalrusIcon size={52} />
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.4, color: ui.muted }}>
            {t("onb.subtitle.1")}
            <br />
            {t("onb.subtitle.2")}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 30 }}>
        <button
          type="button"
          onClick={() => setMode("create")}
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
          onClick={() => setMode("restore")}
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

      <div
        style={{
          padding: 24,
          borderRadius: 24,
          background: ui.cardBg,
          border: `1px solid ${ui.border}`,
        }}
      >
        {mode === "create" ? (
          <>
            <h3 style={{ margin: 0, marginBottom: 12 }}>
              {t("onb.card.create.title")}
            </h3>

            <input
              className="mgt-device-input"
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

            <p style={{ marginTop: 14, fontSize: 13, color: ui.hint }}>
              {t("onb.card.create.hint")}
            </p>
          </>
        ) : (
          <>
            <h3 style={{ margin: 0, marginBottom: 12 }}>
              {t("onb.card.restore.title")}
            </h3>

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
          </>
        )}
      </div>

      <button
        type="button"
        disabled={isCtaDisabled}
        onClick={() => {
          if (isCtaDisabled) return;
          onContinue?.(deviceName, mode);
        }}
        style={{
          marginTop: 30,
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