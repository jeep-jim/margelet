import { DEFAULT_LOCALE, SITE_LOCALES, isSiteLocale, type SiteLocale } from "../locales";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { id } from "./id";
import { it } from "./it";
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
    intro: dict.intro ?? (locale === "ru" || locale === "uk" || locale === "kk" || locale === "uz" ? INTRO_FALLBACK_RU : INTRO_FALLBACK_EN),
  };
}

export const messages: Record<SiteLocale, TranslationSchema> = {
  ru: withIntroFallback(ru, "ru"),
  uk: withIntroFallback(ru, "uk"),
  en: withIntroFallback(en, "en"),
  in: withIntroFallback(en, "in"),
  fa: withIntroFallback(en, "fa"),
  tr: withIntroFallback(tr, "tr"),
  "pt-br": withIntroFallback(ptBr, "pt-br"),
  kk: withIntroFallback(ru, "kk"),
  uz: withIntroFallback(ru, "uz"),
  ae: withIntroFallback(en, "ae"),
  eg: withIntroFallback(en, "eg"),
  pk: withIntroFallback(en, "pk"),
  id: withIntroFallback(id, "id"),
  mx: withIntroFallback(es, "mx"),
  sa: withIntroFallback(en, "sa"),
  es: withIntroFallback(es, "es"),
  it: withIntroFallback(it, "it"),
  fr: withIntroFallback(fr, "fr"),
  de: withIntroFallback(de, "de"),
  ar: withIntroFallback(es, "ar"),
  co: withIntroFallback(es, "co"),
  za: withIntroFallback(en, "za"),
  ng: withIntroFallback(en, "ng"),
  zh: withIntroFallback(en, "zh"),
  ms: withIntroFallback(en, "ms"),
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
    if (browserLanguage.startsWith("uk")) return "uk";
    if (browserLanguage.startsWith("de")) return "de";
    if (browserLanguage.startsWith("es")) return "es";
    if (browserLanguage.startsWith("tr")) return "tr";
    if (browserLanguage.startsWith("fr")) return "fr";
    if (browserLanguage.startsWith("it")) return "it";
    if (browserLanguage.startsWith("id")) return "id";
    if (browserLanguage.startsWith("fa")) return "fa";
    if (browserLanguage.startsWith("ar")) return "ae";
    if (browserLanguage.startsWith("ur")) return "pk";
    if (browserLanguage.startsWith("hi")) return "in";
    if (browserLanguage.startsWith("kk")) return "kk";
    if (browserLanguage.startsWith("uz")) return "uz";
    if (browserLanguage.startsWith("ms")) return "ms";
    if (browserLanguage.startsWith("zh")) return "zh";
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