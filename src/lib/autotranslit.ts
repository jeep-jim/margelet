const STORAGE_KEY = "margelet_autotranslit";
const CHANGE_EVENT = "margelet-autotranslit-change";

export const MARGELET_TRANSLATE_EVENT = CHANGE_EVENT;

const COUNTRY_LANGUAGE: Record<string, string> = {
  ru: "ru",
  uk: "uk",
  ua: "uk",
  en: "en",
  us: "en",
  cn: "zh-CN",
  zh: "zh-CN",
  fa: "fa",
  ir: "fa",
  ar: "es",
  co: "es",
  mx: "es",
  es: "es",
  ae: "ar",
  sa: "ar",
  eg: "ar",
  br: "pt",
  "pt-br": "pt",
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
  ms: "ms",
  my: "ms",
};

const GTRANSLATE_LANGUAGE: Record<string, string> = {
  ru: "ru",
  uk: "uk",
  ua: "uk",
  en: "en",
  us: "en",
  cn: "zh-CN",
  zh: "zh-CN",
  "zh-cn": "zh-CN",
  fa: "fa",
  ir: "fa",
  ar: "ar",
  ae: "ar",
  sa: "ar",
  eg: "ar",
  br: "pt",
  pt: "pt",
  "pt-br": "pt",
  es: "es",
  mx: "es",
  co: "es",
  de: "de",
  fr: "fr",
  it: "it",
  tr: "tr",
  in: "hi",
  hi: "hi",
  id: "id",
  pk: "ur",
  ur: "ur",
  uz: "uz",
  kz: "kk",
  kk: "kk",
  za: "en",
  ng: "en",
  ms: "ms",
  my: "ms",
};

function emitChange() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

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
    emitChange();
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
  const code = String(countryCode || "")
    .trim()
    .toLowerCase();
  return COUNTRY_LANGUAGE[code] || code || "auto";
}

export function getGTranslateLanguage(locale?: string | null) {
  const code = String(locale || "")
    .trim()
    .toLowerCase();
  return GTRANSLATE_LANGUAGE[code] || code || "en";
}

export function sameTranslateLanguage(a?: string | null, b?: string | null) {
  const left = getGTranslateLanguage(a).toLowerCase();
  const right = getGTranslateLanguage(b).toLowerCase();

  if (!left || !right || left === "auto" || right === "auto") return false;
  if (left === right) return true;

  const leftBase = left.split("-")[0];
  const rightBase = right.split("-")[0];
  return Boolean(leftBase && rightBase && leftBase === rightBase);
}

function getGTranslateSelect(): HTMLSelectElement | null {
  return document.querySelector<HTMLSelectElement>(
    ".gtranslate_wrapper select",
  );
}

function chooseOption(select: HTMLSelectElement, lang: string) {
  const target = getGTranslateLanguage(lang);
  const normalized = target.toLowerCase();
  const option = Array.from(select.options).find((item) => {
    const value = String(item.value || "").toLowerCase();
    const text = String(item.textContent || "").toLowerCase();

    return (
      value === normalized ||
      value.endsWith(`|${normalized}`) ||
      value.includes(`/${normalized}`) ||
      text === normalized
    );
  });

  if (!option) return false;

  select.value = option.value;
  option.selected = true;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

export function requestGTranslate(locale?: string | null, attempt = 0) {
  if (typeof document === "undefined") return;

  try {
    (window as unknown as { __MARGELET_PROTECT_TRANSLATE_UI__?: (root: Document) => void }).__MARGELET_PROTECT_TRANSLATE_UI__?.(document);
  } catch {
    // ignore
  }

  const select = getGTranslateSelect();
  if (select && chooseOption(select, getGTranslateLanguage(locale))) return;

  if (attempt >= 30) return;
  window.setTimeout(() => requestGTranslate(locale, attempt + 1), 200);
}

function expireCookie(name: string) {
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = `${name}=; expires=${expires}; path=/`;
  document.cookie = `${name}=; expires=${expires}; path=/; domain=${window.location.hostname}`;
  document.cookie = `${name}=; expires=${expires}; path=/; domain=.${window.location.hostname}`;
}

export function clearGTranslate({ reload = false }: { reload?: boolean } = {}) {
  if (typeof document === "undefined") return;

  expireCookie("googtrans");
  expireCookie("googtransopt");

  const select = getGTranslateSelect();
  if (select) {
    select.selectedIndex = 0;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  if (reload) {
    window.location.reload();
  }
}

export function applyAutotranslit(enabled: boolean, locale?: string | null) {
  setAutotranslit(enabled);

  if (enabled) {
    requestGTranslate(locale);
    return;
  }

  clearGTranslate({ reload: false });
}
