import { DEFAULT_LOCALE, isSiteLocale, type SiteLocale } from "../locales";

export const LANGUAGE_STORAGE_KEY = "margelet_locale";

export function getStoredLocale(): SiteLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (value && isSiteLocale(value)) {
    return value;
  }

  return DEFAULT_LOCALE;
}

export function setStoredLocale(locale: SiteLocale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
}