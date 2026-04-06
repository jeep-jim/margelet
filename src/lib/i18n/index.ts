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
import type { TranslationSchema } from "./types";

const INTRO_FALLBACK_EN = en.intro;
const INTRO_FALLBACK_RU = ru.intro;

function withIntroFallback(dict: TranslationSchema, locale: SiteLocale): TranslationSchema {
  return {
    ...dict,
    intro: dict.intro ?? (locale === "ru" ? INTRO_FALLBACK_RU : INTRO_FALLBACK_EN),
  };
}

export const messages: Record<SiteLocale, TranslationSchema> = {
  ru: withIntroFallback(ru, "ru"),
  en: withIntroFallback(en, "en"),
  de: withIntroFallback(de, "de"),
  es: withIntroFallback(es, "es"),
  tr: withIntroFallback(tr, "tr"),
  fr: withIntroFallback(fr, "fr"),
  it: withIntroFallback(it, "it"),
  "pt-br": withIntroFallback(ptBr, "pt-br"),
  id: withIntroFallback(id, "id"),
  pl: withIntroFallback(pl, "pl"),
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