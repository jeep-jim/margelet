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
    intro: dict.intro ?? (locale === "ru" || locale === "ua" || locale === "kz" || locale === "uz" ? INTRO_FALLBACK_RU : INTRO_FALLBACK_EN),
  };
}

export const messages: Record<SiteLocale, TranslationSchema> = {
  ru: withIntroFallback(ru, "ru"),
  ua: withIntroFallback(ru, "ua"),
  us: withIntroFallback(en, "us"),
  in: withIntroFallback(en, "in"),
  ir: withIntroFallback(en, "ir"),
  tr: withIntroFallback(tr, "tr"),
  br: withIntroFallback(ptBr, "br"),
  kz: withIntroFallback(ru, "kz"),
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
  cn: withIntroFallback(en, "cn"),
  my: withIntroFallback(en, "my"),
};

export function getInitialLocale(): SiteLocale {
  const stored = getStoredLocale();
  if (stored) return stored;

  if (typeof navigator !== "undefined") {
    const browserLanguage = navigator.language.toLowerCase();

    if (isSiteLocale(browserLanguage)) {
      return browserLanguage;
    }

    if (browserLanguage.startsWith("pt")) return "br";
    if (browserLanguage.startsWith("ru")) return "ru";
    if (browserLanguage.startsWith("uk")) return "ua";
    if (browserLanguage.startsWith("de")) return "de";
    if (browserLanguage.startsWith("es")) return "es";
    if (browserLanguage.startsWith("tr")) return "tr";
    if (browserLanguage.startsWith("fr")) return "fr";
    if (browserLanguage.startsWith("it")) return "it";
    if (browserLanguage.startsWith("id")) return "id";
    if (browserLanguage.startsWith("fa")) return "ir";
    if (browserLanguage.startsWith("ar")) return "ae";
    if (browserLanguage.startsWith("ur")) return "pk";
    if (browserLanguage.startsWith("hi")) return "in";
    if (browserLanguage.startsWith("kk")) return "kz";
    if (browserLanguage.startsWith("uz")) return "uz";
    if (browserLanguage.startsWith("ms")) return "my";
    if (browserLanguage.startsWith("zh")) return "cn";
    if (browserLanguage.startsWith("en")) return "us";
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