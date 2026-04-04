export type CountryCode =
  | "ru"
  | "en"
  | "ar"
  | "be"
  | "ca"
  | "hr"
  | "cs"
  | "nl"
  | "fi"
  | "fr"
  | "de"
  | "he"
  | "hu"
  | "id"
  | "it"
  | "kk"
  | "ko"
  | "ms"
  | "no"
  | "fa"
  | "pl"
  | "pt-br"
  | "sr"
  | "es"
  | "tr"
  | "uk"
  | "uz";

export type Country = {
  code: CountryCode;
  label: string;
  nativeLabel: string;
  enabled: boolean;
};

export const COUNTRIES: Country[] = [
  { code: "ru", label: "Russia", nativeLabel: "Русский", enabled: true },
  { code: "en", label: "English", nativeLabel: "English", enabled: true },
  { code: "de", label: "Germany", nativeLabel: "Deutsch", enabled: true },
  { code: "es", label: "Spain", nativeLabel: "Español", enabled: true },
  { code: "tr", label: "Turkey", nativeLabel: "Türkçe", enabled: true },
  { code: "fr", label: "France", nativeLabel: "Français", enabled: true },
  { code: "it", label: "Italy", nativeLabel: "Italiano", enabled: true },
  { code: "pt-br", label: "Brazil", nativeLabel: "Português (Brasil)", enabled: true },
  { code: "id", label: "Indonesia", nativeLabel: "Bahasa Indonesia", enabled: true },
  { code: "pl", label: "Poland", nativeLabel: "Polski", enabled: true },

  // остальные пока выключены
  { code: "ar", label: "Arabic", nativeLabel: "العربية", enabled: false },
  { code: "be", label: "Belarus", nativeLabel: "Беларуская", enabled: false },
  { code: "ca", label: "Catalan", nativeLabel: "Català", enabled: false },
  { code: "hr", label: "Croatia", nativeLabel: "Hrvatski", enabled: false },
  { code: "cs", label: "Czech", nativeLabel: "Čeština", enabled: false },
  { code: "nl", label: "Netherlands", nativeLabel: "Nederlands", enabled: false },
  { code: "fi", label: "Finland", nativeLabel: "Suomi", enabled: false },
  { code: "he", label: "Israel", nativeLabel: "עברית", enabled: false },
  { code: "hu", label: "Hungary", nativeLabel: "Magyar", enabled: false },
  { code: "kk", label: "Kazakhstan", nativeLabel: "Қазақша", enabled: false },
  { code: "ko", label: "Korea", nativeLabel: "한국어", enabled: false },
  { code: "ms", label: "Malaysia", nativeLabel: "Bahasa Melayu", enabled: false },
  { code: "no", label: "Norway", nativeLabel: "Norsk", enabled: false },
  { code: "fa", label: "Iran", nativeLabel: "فارسی", enabled: false },
  { code: "sr", label: "Serbia", nativeLabel: "Српски", enabled: false },
  { code: "uk", label: "Ukraine", nativeLabel: "Українська", enabled: false },
  { code: "uz", label: "Uzbekistan", nativeLabel: "Oʻzbek", enabled: false },
];