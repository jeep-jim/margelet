import type { Locale } from "../../types/app";

export const TELEGRAM_BOT_ID = "8298054487";
export const TG_STORAGE_KEY = "margelet_tg_user";
export const LANGUAGE_STORAGE_KEY = "margelet_locale";
export const INTRO_LANGUAGE_STORAGE_KEY = "margelet_intro_locale";
export const INTRO_SEEN_STORAGE_KEY = "margelet-intro-seen";

export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  de: "DE",
  es: "ES",
  tr: "TR",
  fr: "FR",
  it: "IT",
  "pt-br": "PT",
  id: "ID",
  pl: "PL",
  ru: "RU",
};
