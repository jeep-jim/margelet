const THEME_KEY = "margelet_theme";

export type Theme = "light" | "dark";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") {
    return saved;
  }

  return "light";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;

  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

export function initTheme() {
  applyTheme(getTheme());
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}