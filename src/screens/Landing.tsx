import React, { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n";
import { SUPPORTED_LANGS, type Lang } from "../i18n/translations";

type TabKey = "search" | "files" | "chat" | "control";

const brand = {
  bgDark: "#272632",
  textLight: "#EAE5E3",

  pink: "#FFA3CE",
  violet: "#BE95FA",
  green: "#66D492",
  sand: "#E5C289",

  darkTabBg: "rgba(255,255,255,0.06)",
  darkLine: "rgba(255,255,255,0.08)",
  darkBorder: "rgba(255,255,255,0.10)",
};

const LANG_UI: Record<Lang, { flag: string; code: string }> = {
  en: { flag: "🇺🇸", code: "EN" },
  ru: { flag: "🇷🇺", code: "RU" },
  tr: { flag: "🇹🇷", code: "TR" },
  fa: { flag: "🇮🇷", code: "FA" },
  ar: { flag: "🇸🇦", code: "AR" },
  hi: { flag: "🇮🇳", code: "HI" },
  id: { flag: "🇮🇩", code: "ID" },
  pt: { flag: "🇧🇷", code: "PT" },
  es: { flag: "🇪🇸", code: "ES" },
  de: { flag: "🇩🇪", code: "DE" },
};

const tabs: Record<TabKey, { color: string; icon: string; titleKey: string; descKey: string }> = {
  search: { color: brand.pink, icon: "🔎", titleKey: "tab.search.title", descKey: "tab.search.desc" },
  files: { color: brand.sand, icon: "🔗", titleKey: "tab.files.title", descKey: "tab.files.desc" },
  chat: { color: brand.green, icon: "✉️", titleKey: "tab.chat.title", descKey: "tab.chat.desc" },
  control: { color: brand.violet, icon: "👀", titleKey: "tab.control.title", descKey: "tab.control.desc" },
};

function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="margeleT logo"
      role="img"
      style={{ display: "block" }}
    >
      <path d="M0 0H100L0 100V0Z" fill="#FFA3CE" />
      <path d="M100 0H150A50 50 0 0 1 200 50V100H100V0Z" fill="#BE95FA" />
      <path d="M200 100V200H100L200 100Z" fill="#66D492" />
      <circle cx="50" cy="150" r="50" fill="#E5C289" />
    </svg>
  );
}

function MonoLogo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ display: "block" }}
    >
      <g opacity="0.18" fill="currentColor">
        <path d="M0 0H100L0 100V0Z" />
        <path d="M100 0H150A50 50 0 0 1 200 50V100H100V0Z" />
        <path d="M200 100V200H100L200 100Z" />
        <circle cx="50" cy="150" r="50" />
      </g>
    </svg>
  );
}

export default function Landing({
  tab,
  setTab,
  deviceLabel,
  displayName,
  onEnterChats,
  onEnterOnboarding,
}: {
  tab: TabKey;
  setTab: (v: TabKey) => void;
  deviceLabel: string;
  displayName: string;
  onEnterChats: () => void;
  onEnterOnboarding: () => void;
}) {
  const { lang, setLang, t } = useI18n();

  const ui = useMemo(
    () => ({
      bg: brand.bgDark,
      text: brand.textLight,
      muted: "rgba(234,229,227,0.55)",
      hint: "rgba(234,229,227,0.35)",
      line: brand.darkLine,
      border: brand.darkBorder,
      tabBg: brand.darkTabBg,
      ctaBg: "rgba(0,0,0,0.35)",
      ctaText: brand.violet,
      deviceBg: "rgba(0,0,0,0.12)",
      menuBg: "rgba(20, 19, 26, 0.92)",
      menuBorder: "rgba(255,255,255,0.10)",
    }),
    []
  );

  // FIGMA geometry (do not touch)
  const TAB_H = 75;
  const TAB_LIFT = 10;
  const INACTIVE_DROP = 10;
  const TABS_ROW_H = TAB_H + TAB_LIFT;
  const TAB_MIN_W = 77;
  const GAP = 10;

  const CARD_R = 20;
  const CARD_OVERLAP = 1;

  const tabTopR = (active: boolean) => (active ? { tl: 30, tr: 50 } : { tl: 20, tr: 30 });

  const activeTab = tabs[tab];

  // language dropdown
  const [langOpen, setLangOpen] = useState(false);
  const langWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!langWrapRef.current) return;
      if (!langWrapRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLangOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const selectLang = (l: Lang) => {
    setLang(l);
    setLangOpen(false);
  };

  // Control head flip: INSTANT toggles, no animation (landing-only)
  const shouldFlipControl = tab === "control";
  const [controlFlip, setControlFlip] = useState(false);

  useEffect(() => {
    if (!shouldFlipControl) {
      setControlFlip(false);
      return;
    }

    let alive = true;
    let timer: number | null = null;

    const delays = [900, 1600, 1200, 2300, 1100, 1800];

    const tick = () => {
      if (!alive) return;
      setControlFlip((v) => !v);
      const d = delays[Math.floor(Math.random() * delays.length)];
      timer = window.setTimeout(tick, d);
    };

    timer = window.setTimeout(tick, 1100);

    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [shouldFlipControl]);

  return (
    <div
      style={{
        background: ui.bg,
        color: ui.text,
        minHeight: "100vh",
        overflowX: "hidden",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      }}
    >
      {/* CTA hover: NO vertical movement */}
      <style>
        {`
          .mgt-cta {
            transition: filter 0.18s ease, box-shadow 0.18s ease;
            will-change: filter, box-shadow;
          }
          .mgt-cta:hover {
            filter: brightness(1.06);
            box-shadow: 0 14px 32px rgba(0,0,0,0.22);
          }
          .mgt-cta:active {
            filter: brightness(1.03);
            box-shadow: 0 10px 26px rgba(0,0,0,0.18);
          }
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "grid", placeItems: "center" }}>
              <LogoMark size={22} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, lineHeight: 1, color: ui.muted }}>
              margeleT
            </span>
          </div>

          {/* Language dropdown */}
          <div ref={langWrapRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: ui.muted,
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: 4,
                padding: 0,
              }}
              aria-label={t("header.lang.aria")}
              title={t("header.lang.aria")}
            >
              {(LANG_UI[lang]?.code ?? lang.toUpperCase()).toUpperCase()}
            </button>

            {langOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: 28,
                  width: 148,
                  borderRadius: 14,
                  background: ui.menuBg,
                  border: `1px solid ${ui.menuBorder}`,
                  boxShadow: "0 18px 50px rgba(0,0,0,0.45)",
                  padding: 6,
                  zIndex: 50,
                  backdropFilter: "blur(8px)",
                }}
              >
                {SUPPORTED_LANGS.map((l) => {
                  const active = l === lang;
                  const uiItem = LANG_UI[l];
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => selectLang(l)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "10px 10px",
                        borderRadius: 12,
                        border: "none",
                        cursor: "pointer",
                        background: active ? "rgba(190,149,250,0.18)" : "transparent",
                        color: active ? brand.violet : brand.textLight,
                        fontWeight: 800,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 16, lineHeight: 1 }}>{uiItem?.flag ?? "🌐"}</span>
                        <span style={{ letterSpacing: 0.6 }}>{uiItem?.code ?? l.toUpperCase()}</span>
                      </span>
                      {active && <span style={{ color: brand.violet, opacity: 0.9 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </header>

        <div style={{ height: 1, background: ui.line, marginTop: 12 }} />

        {/* HERO */}
        <div style={{ marginTop: 40 }}>
          <h1
            style={{
              margin: 0,
              fontWeight: 900,
              letterSpacing: -1.2,
              lineHeight: 0.92,
              fontSize: "clamp(44px, 12vw, 72px)",
              maxWidth: 720,
            }}
          >
            <span style={{ display: "block", whiteSpace: "normal" }}>{t("hero.line1")}</span>

            <span style={{ display: "block", marginTop: 6, whiteSpace: "normal" }}>
              <span
                style={{
                  fontSize: "0.58em",
                  lineHeight: 1,
                  display: "inline-block",
                  transform: "translateY(2px)",
                }}
                aria-hidden
              >
                ☁️
              </span>{" "}
              <span style={{ color: brand.pink }}>{t("hero.line2")}</span>
            </span>
          </h1>

          <p
            style={{
              marginTop: 16,
              fontSize: 16,
              lineHeight: 1.28,
              color: ui.muted,
              maxWidth: 620,
            }}
          >
            {t("hero.desc")}
          </p>
        </div>

        {/* TABS + CARD */}
        <div style={{ marginTop: 40 }}>
        {/* TABS */}
        <div
            style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
            alignItems: "end",
            }}
        >
            {(Object.keys(tabs) as TabKey[]).map((k, idx) => {
            const active = k === tab;
            const item = tabs[k];
            const isLast = idx === (Object.keys(tabs) as TabKey[]).length - 1;

            const r = active
                ? isLast
                ? { tl: 40, tr: 24 }
                : { tl: 24, tr: 40 }
                : { tl: 18, tr: 18 };

            const isControl = k === "control";
            const isFlipNow =
                isControl && active && shouldFlipControl && controlFlip;

            return (
                <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                style={{
                    height: active ? 80 : 65,
                    background: active ? item.color : ui.tabBg,
                    border: "none",
                    cursor: "pointer",
                    borderTopLeftRadius: r.tl,
                    borderTopRightRadius: r.tr,
                    display: "grid",
                    placeItems: "center",
                    fontSize: active ? 24 : 20,
                    overflow: "hidden",
                    transform: isFlipNow ? "scaleX(-1)" : "scaleX(1)",
                }}
                >
                {item.icon}
                </button>
            );
            })}
        </div>

        {/* CARD */}
        <div
            style={{
            background: activeTab.color,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            padding: "22px 24px",
            color: "#FFFFFF",
            boxShadow: "0 22px 55px rgba(0,0,0,0.30)",
            }}
        >
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10 }}>
            {t(activeTab.titleKey)}
            </div>

            <p
            style={{
                margin: 0,
                fontSize: 15,
                lineHeight: 1.25,
                fontWeight: 600,
            }}
            >
            {t(activeTab.descKey)}
            </p>
        </div>
        </div>

        {/* HINT */}
        <div style={{ marginTop: 28, display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ color: ui.hint, transform: "translateY(1px)" }}>
            <MonoLogo size={24} />
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.25, color: ui.hint, margin: 0 }}>{t("hint.text")}</p>
        </div>

        {/* DEVICE + CTA */}
        <div style={{ marginTop: 18 }}>
          <div
            style={{
              border: `1px solid ${ui.border}`,
              background: ui.deviceBg,
              borderRadius: 20,
              padding: "12px 20px",
              textAlign: "center",
            }}
          >
            <span style={{ color: ui.muted }}>{t("device.label")}</span>
            <span style={{ margin: "0 10px", color: brand.green }}>•</span>
            <strong style={{ color: brand.green }}>{deviceLabel}</strong>
          </div>

          <button
            className="mgt-cta"
            type="button"
            onClick={() => {
              if (displayName?.trim()) onEnterChats();
              else onEnterOnboarding();
            }}
            style={{
              marginTop: 16,
              width: "100%",
              padding: "14px 0",
              borderRadius: 20,
              background: ui.ctaBg,
              border: `1px solid ${ui.border}`,
              color: ui.ctaText,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t("cta.enter")}
          </button>
        </div>
      </div>
    </div>
  );
}