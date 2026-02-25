export type Screen = "landing" | "onboarding" | "control" | "link";

export const SCREEN_KEY = "margelet_screen";

export function readScreen(fallback: Screen = "landing"): Screen {
  try {
    const raw = localStorage.getItem(SCREEN_KEY);
    return raw ? (JSON.parse(raw) as Screen) : fallback;
  } catch {
    return fallback;
  }
}

export function writeScreen(screen: Screen) {
  try {
    localStorage.setItem(SCREEN_KEY, JSON.stringify(screen));
  } catch {}
}