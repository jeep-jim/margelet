import { DEFAULT_LOCALE, SITE_LOCALES, isSiteLocale, type SiteLocale } from "../locales";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { id } from "./id";
import { it } from "./it";
import { pl } from "./pl";
import { ptBr } from "./pt-br";
import { ru } from "./ru";
import { getStoredLocale, setStoredLocale } from "./storage";
import { tr } from "./tr";
import type { Locale, TranslationSchema } from "./types";

export const messages: Record<Locale, TranslationSchema> = {
  ru,
  en,
  de,
  es,
  tr,
  fr,
  it,
  "pt-br": ptBr,
  id,
  pl,
};

export function getInitialLocale(): SiteLocale {
  const stored = getStoredLocale();
  if (stored) return stored;

  if (typeof navigator !== "undefined") {
    const browserLanguage = navigator.language.toLowerCase();

    if (isSiteLocale(browserLanguage)) {
      return browserLanguage;
    }

    if (browserLanguage.startsWith("pt")) return "pt-br";
    if (browserLanguage.startsWith("ru")) return "ru";
    if (browserLanguage.startsWith("de")) return "de";
    if (browserLanguage.startsWith("es")) return "es";
    if (browserLanguage.startsWith("tr")) return "tr";
    if (browserLanguage.startsWith("fr")) return "fr";
    if (browserLanguage.startsWith("it")) return "it";
    if (browserLanguage.startsWith("id")) return "id";
    if (browserLanguage.startsWith("pl")) return "pl";
    if (browserLanguage.startsWith("en")) return "en";
  }

  return DEFAULT_LOCALE;
}

export function getMessages(locale: SiteLocale): TranslationSchema {
  return messages[locale] ?? messages[DEFAULT_LOCALE];
}

export function setLocale(locale: SiteLocale) {
  setStoredLocale(locale);
}

export function getEnabledLocales() {
  return SITE_LOCALES.filter((item) => item.enabled);
}

export function t<
  TSection extends keyof TranslationSchema,
  TKey extends keyof TranslationSchema[TSection]
>(locale: SiteLocale, section: TSection, key: TKey): TranslationSchema[TSection][TKey] {
  const dict = getMessages(locale);
  return dict[section][key];
}