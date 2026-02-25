import React, { useEffect, useMemo, useRef, useState } from "react";
import OnboardingDeviceStep from "./screens/OnboardingDeviceStep";
import Chats from "./screens/Chats";
import ChatRoom from "./screens/ChatRoom";
import Profile from "./screens/Profile";
import Search from "./screens/Search";
import Landing from "./screens/Landing";

import { useI18n } from "./i18n";

type TabKey = "search" | "files" | "chat" | "control";
type Screen = "landing" | "onboarding" | "chats" | "room" | "profile" | "search";

const brand = {
  bgDark: "#272632",
  textLight: "#EAE5E3",

  pink: "#FFA3CE",
  violet: "#BE95FA",
  green: "#66D492",

  darkLine: "rgba(255,255,255,0.08)",
  darkBorder: "rgba(255,255,255,0.10)",
};

// persist helper
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
  if (s.includes("mobi") || s.includes("iphone") || s.includes("android")) return "mobile";
  if (s.includes("windows") || s.includes("macintosh") || s.includes("linux")) return "desktop";
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
  if (s.includes("safari/") && !s.includes("chrome/") && !s.includes("crios/")) return "Safari";
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

export default function App() {
  const { t } = useI18n();

  const [screen, setScreen] = usePersisted<Screen>("margelet_screen", "landing");
  const [tab, setTab] = usePersisted<TabKey>("margelet_tab", "control");

  const [displayName, setDisplayName] = usePersisted<string>("margelet_display_name", "");
  const [deviceLabel] = usePersisted<string>("margelet_device_label", makeDefaultDeviceLabel());

  const [activeRoomId, setActiveRoomId] = usePersisted<string | null>("margelet_active_room_id", null);

  useEffect(() => {
    getOrCreateDeviceId();
  }, []);

  const ui = useMemo(
    () => ({
      bg: brand.bgDark,
      text: brand.textLight,
      muted: "rgba(234,229,227,0.55)",
      line: brand.darkLine,
      border: brand.darkBorder,
    }),
    []
  );

  const goLanding = () => setScreen("landing");
  const goOnboarding = () => setScreen("onboarding");
  const goChats = () => setScreen("chats");
  const goProfile = () => setScreen("profile");
  const goSearch = () => setScreen("search");

  const openRoom = (roomId: string) => {
    setActiveRoomId(roomId);
    setScreen("room");
  };

  // ✅ ROUTER (simple, no react-router yet)
  if (screen === "onboarding") {
    return (
      <div
        style={{
          background: ui.bg,
          color: ui.text,
          minHeight: "100vh",
          fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
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
                <path d="M19 11H7.9" stroke={brand.pink} strokeWidth="3" strokeLinecap="round" />
                <path d="M8.2 5.3L2.5 11l5.7 5.7V5.3Z" fill={brand.pink} />
              </svg>

              <span style={{ fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{t("header.back")}</span>
            </button>
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
    return <Profile displayName={displayName || "User"} setDisplayName={setDisplayName} onBack={goChats} />;
  }

  if (screen === "search") {
    return <Search onBack={goChats} onOpenRoom={(roomId) => openRoom(roomId)} />;
  }

  // ✅ landing moved to Landing.tsx
  return (
    <Landing
      tab={tab}
      setTab={setTab}
      deviceLabel={deviceLabel}
      displayName={displayName || ""}
      onEnterChats={goChats}
      onEnterOnboarding={goOnboarding}
    />
  );
}