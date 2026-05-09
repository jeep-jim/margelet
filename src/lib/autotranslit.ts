const STORAGE_KEY = "margelet_autotranslit";

export function getAutotranslit(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAutotranslit(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    window.dispatchEvent(new Event("margelet-autotranslit-change"));
  } catch {
    // ignore
  }
}

export function toggleAutotranslit(): boolean {
  const next = !getAutotranslit();
  setAutotranslit(next);
  return next;
}

export function getCountryLanguage(countryCode?: string | null) {
  const code = String(countryCode || "").toLowerCase();

  const map: Record<string, string> = {
    ru: "ru",
    uk: "uk",
    en: "en",
    us: "en",
    cn: "zh-CN",
    zh: "zh-CN",
    fa: "fa",
    ir: "fa",
    ar: "ar",
    ae: "ar",
    sa: "ar",
    eg: "ar",
    br: "pt-BR",
    "pt-br": "pt-BR",
    es: "es",
    mx: "es",
    ar_country: "es",
    de: "de",
    fr: "fr",
    it: "it",
    tr: "tr",
    in: "hi",
    id: "id",
    pk: "ur",
    uz: "uz",
    kz: "kk",
    za: "en",
    ng: "en",
    co: "es",
    ms: "ms",
  };

  return map[code] || code || "auto";
}

export function applyBrowserTranslateMode(sourceLang?: string | null) {
  const lang = sourceLang || "auto";

  try {
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("translate", "yes");
    document.body.setAttribute("translate", "no");
    document.body.classList.toggle("margelet-translate-mode", getAutotranslit());
  } catch {
    // ignore
  }
}

export function setTranslateUrlMode(enabled: boolean, sourceLang?: string | null, targetLang?: string | null) {
  const url = new URL(window.location.href);

  if (enabled) {
    url.searchParams.set("translate", "1");
    if (sourceLang) url.searchParams.set("sl", sourceLang);
    if (targetLang) url.searchParams.set("tl", targetLang);
  } else {
    url.searchParams.delete("translate");
    url.searchParams.delete("sl");
    url.searchParams.delete("tl");
  }

  window.history.replaceState(null, "", url.toString());
}