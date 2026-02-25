// src/lib/device.ts

export type DeviceKind = "mobile" | "tablet" | "desktop" | "unknown";

function detectKindFromUA(ua: string): DeviceKind {
  const s = ua.toLowerCase();

  // tablets first
  if (s.includes("ipad") || s.includes("tablet")) return "tablet";

  // mobile
  if (s.includes("mobi") || s.includes("iphone") || s.includes("android"))
    return "mobile";

  // desktop-ish
  if (s.includes("windows") || s.includes("macintosh") || s.includes("linux"))
    return "desktop";

  return "unknown";
}

function detectPlatform(ua: string): string {
  const s = ua.toLowerCase();

  if (s.includes("iphone") || s.includes("ipad") || s.includes("ios")) return "iOS";
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

export function makeDefaultDeviceLabel(): string {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const kind = detectKindFromUA(ua);
  const platform = detectPlatform(ua);
  const browser = detectBrowser(ua);

  if (kind === "tablet") return `${platform} Tablet • ${browser}`;
  if (kind === "mobile") return `${platform} • ${browser}`;
  if (kind === "desktop") return `${platform} • ${browser}`;

  return `Device • ${browser}`;
}

export function getOrCreateDeviceId(storageKey = "margelet_device_id"): string {
  try {
    const existing = localStorage.getItem(storageKey);
    if (existing) return existing;

    const canUUID =
      typeof crypto !== "undefined" &&
      typeof (crypto as any).randomUUID === "function";

    const id = canUUID
      ? (crypto as any).randomUUID()
      : `dev_${Math.random().toString(16).slice(2)}_${Date.now()}`;

    localStorage.setItem(storageKey, id);
    return id;
  } catch {
    return `dev_${Math.random().toString(16).slice(2)}_${Date.now()}`;
  }
}

/**
 * ✅ Backward-compatible exports (чтобы твой ControlCenter.tsx не падал)
 * Ты можешь потом переименовать импорты красиво, но сейчас — чтобы работало сразу.
 */
export const getDeviceLabel = makeDefaultDeviceLabel;

export function getDeviceId(storageKey = "margelet_device_id"): string {
  return getOrCreateDeviceId(storageKey);
}