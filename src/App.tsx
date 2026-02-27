import React, { useEffect, useMemo, useState } from "react";
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

/** ---------- AUTH STORAGE LAYER (расширенный, рабочий) ---------- **/
const LS_IDENTITY = "margelet_identity_v1";
const LS_SESSION = "margelet_session_v1";
const LS_ACCOUNT = "margelet_account_v1";
const LS_HANDLE = "margelet_handle_v1";

type IdentityV1 = {
  deviceId: string;
  deviceName: string; // имя устройства, которое вводим в onboarding
  deviceLabel: string; // Windows • Chrome
};

type SessionV1 = {
  authed: true;
  ts: number;
};

type AccountV1 = {
  handle: string; // "@jim"
  displayName: string; // "Jim"
  pinHash: string; // sha256(pin)
  createdAt: number;
};

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson<T>(key: string, v: T) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
}

function hasIdentity(): boolean {
  const id = readJson<IdentityV1>(LS_IDENTITY);
  return !!(id && id.deviceId && id.deviceName);
}

function hasSession(): boolean {
  const s = readJson<SessionV1>(LS_SESSION);
  return !!(s && s.authed);
}

function ensureSession() {
  writeJson<SessionV1>(LS_SESSION, { authed: true, ts: Date.now() });
}

function readHandleCompat(): string {
  // handle может лежать JSON-строкой (через setItem(JSON.stringify))
  try {
    const raw = localStorage.getItem(LS_HANDLE);
    if (!raw) return "@you";
    const parsed = JSON.parse(raw);
    const v = typeof parsed === "string" ? parsed : String(parsed ?? "");
    const s = (v || "").trim();
    if (!s) return "@you";
    return s.startsWith("@") ? s : `@${s}`;
  } catch {
    try {
      const s = (localStorage.getItem(LS_HANDLE) || "").trim();
      if (!s) return "@you";
      return s.startsWith("@") ? s : `@${s}`;
    } catch {
      return "@you";
    }
  }
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buffer = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function App() {
  const { t } = useI18n();

  const [screen, setScreen] = usePersisted<Screen>("margelet_screen", "landing");
  const [tab, setTab] = usePersisted<TabKey>("margelet_tab", "control");

  // оставляем твои поля ради совместимости UI
  const [displayName, setDisplayName] = usePersisted<string>("margelet_display_name", "");
  const [deviceLabel] = usePersisted<string>("margelet_device_label", makeDefaultDeviceLabel());
  const [activeRoomId, setActiveRoomId] = usePersisted<string | null>("margelet_active_room_id", null);

  useEffect(() => {
    getOrCreateDeviceId();
  }, []);

  // ✅ Guard: нельзя в защищённые экраны без identity+session
  useEffect(() => {
    const protectedScreens: Screen[] = ["chats", "room", "profile", "search"];
    if (protectedScreens.includes(screen)) {
      if (!hasIdentity()) {
        setScreen("onboarding");
        return;
      }
      if (!hasSession()) {
        setScreen("onboarding");
        return;
      }
    }
  }, [screen, setScreen]);

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

  const account = readJson<AccountV1>(LS_ACCOUNT);
  const accountExists = !!(account && account.pinHash);

  // ✅ ROUTER
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
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden style={{ display: "block" }}>
                <path d="M19 11H7.9" stroke={brand.pink} strokeWidth="3" strokeLinecap="round" />
                <path d="M8.2 5.3L2.5 11l5.7 5.7V5.3Z" fill={brand.pink} />
              </svg>

              <span style={{ fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{t("header.back")}</span>
            </button>
          </header>

          <div style={{ height: 1, background: ui.line, marginTop: 12 }} />

          <div style={{ marginTop: 28 }}>
            <OnboardingDeviceStep
              accountExists={accountExists}
              accountDisplayName={account?.displayName || displayName || ""}
              accountHandle={account?.handle || readHandleCompat()}
              onContinue={async (deviceName, mode, pin4) => {
                const deviceId = getOrCreateDeviceId();
                const name = (deviceName || "").trim() || "My device";

                const pin = (pin4 || "").trim();
                if (!/^\d{4}$/.test(pin)) return;

                const pinHash = await sha256Hex(pin);

                // ✅ Create
                if (mode === "create") {
                  // identity
                  const identity: IdentityV1 = {
                    deviceId,
                    deviceName: name,
                    deviceLabel,
                  };
                  writeJson<IdentityV1>(LS_IDENTITY, identity);

                  // account
                  const newAccount: AccountV1 = {
                    handle: readHandleCompat(), // пока @you, потом поменяешь в профиле
                    displayName: name, // на MVP displayName = name (как у тебя сейчас)
                    pinHash,
                    createdAt: Date.now(),
                  };
                  writeJson<AccountV1>(LS_ACCOUNT, newAccount);

                  // UI compat
                  setDisplayName(name);

                  // session
                  ensureSession();
                  setScreen("chats");
                  return;
                }

                // ✅ Restore
                if (mode === "restore") {
                  const acc = readJson<AccountV1>(LS_ACCOUNT);
                  if (!acc) return;

                  if (acc.pinHash !== pinHash) {
                    // без “фейков”: просто не пускаем
                    // (alert пока ок, потом заменим на toast)
                    alert("Неверный PIN");
                    return;
                  }

                  // если на устройстве ещё нет identity (новый девайс) — создаём
                  if (!hasIdentity()) {
                    const identity: IdentityV1 = {
                      deviceId,
                      deviceName: name,
                      deviceLabel,
                    };
                    writeJson<IdentityV1>(LS_IDENTITY, identity);
                  }

                  // синкаем displayName в UI
                  setDisplayName(acc.displayName || name);

                  ensureSession();
                  setScreen("chats");
                  return;
                }
              }}
              onCreateNew={() => {
                // “Создать” из встречающего экрана
                // просто скажем onboarding перейти в create-mode (внутри компонента)
                // компонент сам переключится
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
        onLogout={() => {
          try {
            localStorage.removeItem(LS_SESSION);
            localStorage.setItem("margelet_active_room_id", JSON.stringify(null));
            localStorage.setItem("margelet_screen", JSON.stringify("landing"));
          } catch {}
          setActiveRoomId(null);
          setScreen("landing");
        }}
      />
    );
  }

  if (screen === "search") {
    return <Search onBack={goChats} onOpenRoom={(roomId) => openRoom(roomId)} />;
  }

  return (
    <Landing
      tab={tab}
      setTab={setTab}
      deviceLabel={deviceLabel}
      displayName={displayName || ""}
      onEnterChats={() => {
        if (hasIdentity() && hasSession()) setScreen("chats");
        else setScreen("onboarding");
      }}
      onEnterOnboarding={goOnboarding}
    />
  );
}