export type ActiveLocale =
  | "ru"
  | "uk"
  | "en"
  | "in"
  | "fa"
  | "tr"
  | "pt-br"
  | "kk"
  | "uz"
  | "ae"
  | "eg"
  | "pk"
  | "id"
  | "mx"
  | "sa"
  | "es"
  | "it"
  | "fr"
  | "de"
  | "ar"
  | "co"
  | "za"
  | "ng"
  | "zh"
  | "ms";

export type SiteLocale = ActiveLocale;

export type LocaleOption = {
  code: SiteLocale;
  label: string;
  nativeLabel: string;
  enabled: boolean;
};

export const SITE_LOCALES: LocaleOption[] = [
  { code: "ru", label: "Russia", nativeLabel: "Русский", enabled: true },
  { code: "uk", label: "Ukraine", nativeLabel: "Українська", enabled: true },
  { code: "en", label: "United States", nativeLabel: "English (US)", enabled: true },
  { code: "in", label: "India", nativeLabel: "हिन्दी", enabled: true },
  { code: "fa", label: "Iran", nativeLabel: "فارسی", enabled: true },
  { code: "tr", label: "Turkey", nativeLabel: "Türkçe", enabled: true },
  { code: "pt-br", label: "Brazil", nativeLabel: "Português (Brasil)", enabled: true },

  { code: "kk", label: "Kazakhstan", nativeLabel: "Қазақша", enabled: true },
  { code: "uz", label: "Uzbekistan", nativeLabel: "Oʻzbek", enabled: true },
  { code: "ae", label: "United Arab Emirates", nativeLabel: "العربية (UAE)", enabled: true },
  { code: "eg", label: "Egypt", nativeLabel: "العربية (Egypt)", enabled: true },
  { code: "pk", label: "Pakistan", nativeLabel: "اردو", enabled: true },
  { code: "id", label: "Indonesia", nativeLabel: "Bahasa Indonesia", enabled: true },
  { code: "mx", label: "Mexico", nativeLabel: "Español (México)", enabled: true },
  { code: "sa", label: "Saudi Arabia", nativeLabel: "العربية (Saudi Arabia)", enabled: true },

  { code: "es", label: "Spain", nativeLabel: "Español", enabled: true },
  { code: "it", label: "Italy", nativeLabel: "Italiano", enabled: true },
  { code: "fr", label: "France", nativeLabel: "Français", enabled: true },
  { code: "de", label: "Germany", nativeLabel: "Deutsch", enabled: true },
  { code: "ar", label: "Argentina", nativeLabel: "Español (Argentina)", enabled: true },
  { code: "co", label: "Colombia", nativeLabel: "Español (Colombia)", enabled: true },
  { code: "za", label: "South Africa", nativeLabel: "English (South Africa)", enabled: true },
  { code: "ng", label: "Nigeria", nativeLabel: "English (Nigeria)", enabled: true },

  { code: "zh", label: "China", nativeLabel: "中文", enabled: true },
  { code: "ms", label: "Malaysia", nativeLabel: "Bahasa Melayu", enabled: true },
];

export const DEFAULT_LOCALE: SiteLocale = "en";

export function isSiteLocale(value: string): value is SiteLocale {
  return SITE_LOCALES.some((item) => item.code === value);
}

export function getLocaleOption(locale: SiteLocale) {
  return SITE_LOCALES.find((item) => item.code === locale) ?? SITE_LOCALES[0];
}