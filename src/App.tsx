import React, { useEffect, useMemo, useRef, useState } from "react";
import OnboardingDeviceStep from "./screens/OnboardingDeviceStep";
import Chats from "./screens/Chats";
import ChatRoom from "./screens/ChatRoom";
import Profile from "./screens/Profile";
import Search from "./screens/Search";

import { useI18n } from "./i18n";
import { SUPPORTED_LANGS, type Lang } from "./i18n/translations";

/*
  margeleT — FIGMA LOCKED VERSION (fixed geometry)
  ✅ Dark-only
  ✅ Language auto-detect with EN fallback (handled in I18nProvider)
  ✅ Language dropdown (flags + 2 letters)
  ✅ Zoom-safe: header never goes 3 lines, never overflows
  ✅ Control tab: WHOLE head flips instantly (no smooth animation), only when active on landing
  ✅ Now: routing to Chats / Room / Profile / Search (App stays clean)
*/

type TabKey = "search" | "files" | "chat" | "control";
type Screen = "landing" | "onboarding" | "chats" | "room" | "profile" | "search";

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

const tabs: Record<
  TabKey,
  { color: string; icon: string; titleKey: string; descKey: string }
> = {
  search: {
    color: brand.pink,
    icon: "🔎",
    titleKey: "tab.search.title",
    descKey: "tab.search.desc",
  },
  files: {
    color: brand.sand,
    icon: "🔗",
    titleKey: "tab.files.title",
    descKey: "tab.files.desc",
  },
  chat: {
    color: brand.green,
    icon: "✉️",
    titleKey: "tab.chat.title",
    descKey: "tab.chat.desc",
  },
  control: {
    color: brand.violet,
    icon: "👀",
    titleKey: "tab.control.title",
    descKey: "tab.control.desc",
  },
};

function usePersisted<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {}
  }, [key, v]);
  return [v, setV] as const;
}

// --- Device label helpers ---
type DeviceKind = "mobile" | "tablet" | "desktop" | "unknown";

function detectKindFromUA(ua: string): DeviceKind {
  const s = ua.toLowerCase();
  if (s.includes("ipad") || s.includes("tablet")) return "tablet";
  if (s.includes("mobi") || s.includes("iphone") || s.includes("android"))
    return "mobile";
  if (s.includes("windows") || s.includes("macintosh") || s.includes("linux"))
    return "desktop";
  return "unknown";
}

function detectPlatform(ua: string): string {
  const s = ua.toLowerCase();
  if (s.includes("iphone") || s.includes("ipad")) return "iOS";
  if (s.includes("android")) return "Android";
  if (s.includes("macintosh") || s.includes("mac os")) return "macOS";
  if (s.includes("windows")) return "Windows";
  if (s.includes("linux")) return "Linux";
  return "Unknown OS";
}

function detectBrowser(ua: string): string {
  const s = ua.toLowerCase();
  if (s.includes("edg/")) return "Edge";
  if (s.includes("opr/") || s.includes("opera")) return "Opera";
  if (s.includes("firefox/")) return "Firefox";
  if (s.includes("safari/") && !s.includes("chrome/") && !s.includes("crios/"))
    return "Safari";
  if (s.includes("chrome/") || s.includes("crios/")) return "Chrome";
  return "Browser";
}

function makeDefaultDeviceLabel(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const kind = detectKindFromUA(ua);
  const platform = detectPlatform(ua);
  const browser = detectBrowser(ua);

  if (kind === "tablet") return `${platform} Tablet • ${browser}`;
  if (kind === "mobile") return `${platform} • ${browser}`;
  if (kind === "desktop") return `${platform} • ${browser}`;
  return `Device • ${browser}`;
}

function getOrCreateDeviceId(storageKey = "margeleT_device_id"): string {
  try {
    const existing = localStorage.getItem(storageKey);
    if (existing) return existing;

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `dev_${Math.random().toString(16).slice(2)}_${Date.now()}`;

    localStorage.setItem(storageKey, id);
    return id;
  } catch {
    return `dev_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }
}

// --- Lang UI (flags + 2 letters) ---
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

export default function App() {
  const { lang, setLang, t } = useI18n();

  const [screen, setScreen] = usePersisted<Screen>("margelet_screen", "landing");
  const [tab, setTab] = usePersisted<TabKey>("margelet_tab", "control");

  const [displayName, setDisplayName] = usePersisted<string>(
    "margelet_display_name",
    ""
  );

  const [deviceLabel] = usePersisted<string>(
    "margelet_device_label",
    makeDefaultDeviceLabel()
  );

  const [activeRoomId, setActiveRoomId] = usePersisted<string | null>(
    "margelet_active_room_id",
    null
  );

  useEffect(() => {
    getOrCreateDeviceId();
  }, []);

  const activeTab = tabs[tab];

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

  const tabTopR = (active: boolean) =>
    active ? { tl: 30, tr: 50 } : { tl: 20, tr: 30 };

  const goLanding = () => setScreen("landing");
  const goOnboarding = () => setScreen("onboarding");
  const goChats = () => setScreen("chats");
  const goProfile = () => setScreen("profile");
  const goSearch = () => setScreen("search");

  const openRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    setScreen("room");
  };

  // --- language dropdown ---
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

  // --- Control head flip: INSTANT toggles, no animation ---
  const shouldFlipControl = screen === "landing" && tab === "control";
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

  // ✅ ROUTER (simple, no react-router yet)
  if (screen === "onboarding") {
    return (
      <div
        style={{
          background: ui.bg,
          color: ui.text,
          minHeight: "100vh",
          fontFamily:
            "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
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
              onClick={goLanding}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: ui.muted,
              }}
              aria-label={t("header.back")}
              title={t("header.back")}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
                style={{ display: "block" }}
              >
                <path
                  d="M19 11H7.9"
                  stroke={brand.pink}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path d="M8.2 5.3L2.5 11l5.7 5.7V5.3Z" fill={brand.pink} />
              </svg>

              <span style={{ fontWeight: 800, fontSize: 18, lineHeight: 1 }}>
                {t("header.back")}
              </span>
            </button>

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
                          <span style={{ fontSize: 16, lineHeight: 1 }}>
                            {uiItem?.flag ?? "🌐"}
                          </span>
                          <span style={{ letterSpacing: 0.6 }}>
                            {uiItem?.code ?? l.toUpperCase()}
                          </span>
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

          <div style={{ marginTop: 28 }}>
            <OnboardingDeviceStep
              onContinue={(deviceName) => {
                setDisplayName(deviceName?.trim() || "User");
                setScreen("chats");
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (screen === "chats") {
    return (
      <Chats
        displayName={displayName || "User"}
        deviceLabel={deviceLabel}
        onBack={goLanding}
        onOpenRoom={(roomId) => openRoom(roomId)}
        onOpenProfile={goProfile}
        onOpenSearch={goSearch}
      />
    );
  }

  if (screen === "room") {
    return (
      <ChatRoom
        roomId={activeRoomId || "margelet_public"}
        displayName={displayName || "User"}
        onBack={goChats}
        onOpenProfile={goProfile}
        onOpenSearch={goSearch}
      />
    );
  }

  if (screen === "profile") {
    return (
      <Profile
        displayName={displayName || "User"}
        setDisplayName={setDisplayName}
        onBack={goChats}
      />
    );
  }

  if (screen === "search") {
    return (
      <Search
        onBack={goChats}
        onOpenRoom={(roomId) => openRoom(roomId)}
      />
    );
  }

  // --- landing (your design, kept) ---
  return (
    <div
      style={{
        background: ui.bg,
        color: ui.text,
        minHeight: "100vh",
        overflowX: "hidden",
        fontFamily:
          "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
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

      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "clamp(16px, 4vw, 24px)",
        }}
      >
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
            <span
              style={{
                fontWeight: 800,
                fontSize: 18,
                lineHeight: 1,
                color: ui.muted,
              }}
            >
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
                        background: active
                          ? "rgba(190,149,250,0.18)"
                          : "transparent",
                        color: active ? brand.violet : brand.textLight,
                        fontWeight: 800,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 16, lineHeight: 1 }}>
                          {uiItem?.flag ?? "🌐"}
                        </span>
                        <span style={{ letterSpacing: 0.6 }}>
                          {uiItem?.code ?? l.toUpperCase()}
                        </span>
                      </span>
                      {active && (
                        <span style={{ color: brand.violet, opacity: 0.9 }}>✓</span>
                      )}
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
              fontSize: "clamp(44px, min(6vw, 64px), 72px)",
              lineHeight: 1.02,
              fontWeight: 800,
              maxWidth: "100%",
              letterSpacing: -0.6,
              margin: 0,
            }}
          >
            <span
              style={{
                display: "block",
                color: brand.violet,
                whiteSpace: "nowrap",
              }}
            >
              {t("hero.line1")}
            </span>

            <span
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: 8,
                whiteSpace: "nowrap",
              }}
            >
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
              </span>

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
        <div style={{ marginTop: 40, position: "relative" }}>
          <div
            style={{
              height: TABS_ROW_H,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: GAP,
              alignItems: "end",
              position: "relative",
              zIndex: 5,
            }}
          >
            {(Object.keys(tabs) as TabKey[]).map((k, idx) => {
              const active = k === tab;
              const item = tabs[k];
              const isLast = idx === (Object.keys(tabs) as TabKey[]).length - 1;

              const r = active
                ? isLast
                  ? { tl: 50, tr: 30 }
                  : { tl: 30, tr: 50 }
                : tabTopR(false);

              const isControl = k === "control";
              const isFlipNow =
                isControl && active && shouldFlipControl && controlFlip;

              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTab(k)}
                  style={{
                    height: active ? TAB_H + TAB_LIFT : TAB_H - INACTIVE_DROP,
                    minWidth: TAB_MIN_W,
                    width: "100%",
                    background: active ? item.color : ui.tabBg,
                    border: "none",
                    cursor: "pointer",
                    borderTopLeftRadius: r.tl,
                    borderTopRightRadius: r.tr,
                    borderBottomLeftRadius: 0,
                    borderBottomRightRadius: 0,
                    display: "grid",
                    placeItems: "center",
                    fontSize: active ? 24 : 20,
                    lineHeight: 1,
                    padding: 0,
                    position: "relative",
                    zIndex: active ? 6 : 5,
                    overflow: "hidden",
                    transform: isFlipNow ? "scaleX(-1)" : "scaleX(1)",
                    transition: "none",
                  }}
                  aria-label={t(item.titleKey)}
                  title={t(item.titleKey)}
                >
                  {item.icon}
                </button>
              );
            })}
          </div>

          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: TABS_ROW_H - (CARD_OVERLAP + 0),
              height: CARD_OVERLAP + 20,
              background: activeTab.color,
              zIndex: 5,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              marginTop: -CARD_OVERLAP,
              background: activeTab.color,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
              borderBottomLeftRadius: CARD_R,
              borderBottomRightRadius: CARD_R,
              padding: "22px 24px",
              color: "#FFFFFF",
              position: "relative",
              zIndex: 4,
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
          <p style={{ fontSize: 13, lineHeight: 1.25, color: ui.hint, margin: 0 }}>
            {t("hint.text")}
          </p>
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
              if (displayName?.trim()) goChats();
              else goOnboarding();
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
            {displayName?.trim() ? t("cta.enter") : t("cta.enter")}
          </button>
        </div>
      </div>
    </div>
  );
}