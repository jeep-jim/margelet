const THEME_KEY = "margelet_theme";

export type Theme = "light" | "dark";

function setThemeMeta(theme: Theme) {
  if (typeof document === "undefined") return;

  const color = theme === "dark" ? "#17212b" : "#f5f7fb";

  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }

  meta.content = color;

  let colorSchemeMeta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
  if (!colorSchemeMeta) {
    colorSchemeMeta = document.createElement("meta");
    colorSchemeMeta.name = "color-scheme";
    document.head.appendChild(colorSchemeMeta);
  }

  colorSchemeMeta.content = theme;
  document.documentElement.style.backgroundColor = color;
  document.body.style.backgroundColor = color;
  document.documentElement.style.colorScheme = theme;
  document.body.style.colorScheme = theme;
}

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";

  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") {
    return saved;
  }

  return "dark";
}

export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;

  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  setThemeMeta(theme);
}

export function initTheme() {
  applyTheme(getTheme());
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}