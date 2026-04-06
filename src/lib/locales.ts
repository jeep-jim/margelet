export type ActiveLocale =
  | "ru"
  | "en"
  | "de"
  | "es"
  | "tr"
  | "fr"
  | "it"
  | "pt-br"
  | "id"
  | "pl";

export type SiteLocale = ActiveLocale;

export type LocaleOption = {
  code: SiteLocale;
  label: string;
  nativeLabel: string;
  enabled: boolean;
};

export const SITE_LOCALES: LocaleOption[] = [
  { code: "ru", label: "Russia", nativeLabel: "Русский", enabled: true },
  { code: "en", label: "English", nativeLabel: "English", enabled: true },
  { code: "de", label: "Germany", nativeLabel: "Deutsch", enabled: true },
  { code: "es", label: "Spain", nativeLabel: "Español", enabled: true },
  { code: "tr", label: "Turkey", nativeLabel: "Türkçe", enabled: true },
  { code: "fr", label: "France", nativeLabel: "Français", enabled: true },
  { code: "it", label: "Italy", nativeLabel: "Italiano", enabled: true },
  {
    code: "pt-br",
    label: "Brazil",
    nativeLabel: "Português (Brasil)",
    enabled: true,
  },
  {
    code: "id",
    label: "Indonesia",
    nativeLabel: "Bahasa Indonesia",
    enabled: true,
  },
  { code: "pl", label: "Poland", nativeLabel: "Polski", enabled: true },
];

export const DEFAULT_LOCALE: SiteLocale = "en";

export function isSiteLocale(value: string): value is SiteLocale {
  return SITE_LOCALES.some((item) => item.code === value);
}

export function getLocaleOption(locale: SiteLocale) {
  return SITE_LOCALES.find((item) => item.code === locale) ?? SITE_LOCALES[0];
}