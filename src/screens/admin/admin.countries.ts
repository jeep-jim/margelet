export type CountryCode =
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

export type Country = {
  code: CountryCode;
  label: string;
  nativeLabel: string;
  enabled: boolean;
};

export const COUNTRIES: Country[] = [
  // Tier 1
  { code: "ru", label: "Russia", nativeLabel: "Русский", enabled: true },
  { code: "uk", label: "Ukraine", nativeLabel: "Українська", enabled: true },
  { code: "in", label: "India", nativeLabel: "हिन्दी", enabled: true },
  { code: "fa", label: "Iran", nativeLabel: "فارسی", enabled: true },
  { code: "tr", label: "Turkey", nativeLabel: "Türkçe", enabled: true },
  { code: "pt-br", label: "Brazil", nativeLabel: "Português (Brasil)", enabled: true },
  { code: "en", label: "United States", nativeLabel: "English (US)", enabled: true },

  // Tier 2
  { code: "kk", label: "Kazakhstan", nativeLabel: "Қазақша", enabled: true },
  { code: "uz", label: "Uzbekistan", nativeLabel: "Oʻzbek", enabled: true },
  { code: "ae", label: "United Arab Emirates", nativeLabel: "العربية", enabled: true },
  { code: "eg", label: "Egypt", nativeLabel: "العربية", enabled: true },
  { code: "pk", label: "Pakistan", nativeLabel: "اردو", enabled: true },
  { code: "id", label: "Indonesia", nativeLabel: "Bahasa Indonesia", enabled: true },
  { code: "mx", label: "Mexico", nativeLabel: "Español (México)", enabled: true },
  { code: "sa", label: "Saudi Arabia", nativeLabel: "العربية", enabled: true },

  // Tier 3
  { code: "es", label: "Spain", nativeLabel: "Español", enabled: true },
  { code: "it", label: "Italy", nativeLabel: "Italiano", enabled: true },
  { code: "fr", label: "France", nativeLabel: "Français", enabled: true },
  { code: "de", label: "Germany", nativeLabel: "Deutsch", enabled: true },
  { code: "ar", label: "Argentina", nativeLabel: "Español (Argentina)", enabled: true },
  { code: "co", label: "Colombia", nativeLabel: "Español (Colombia)", enabled: true },
  { code: "za", label: "South Africa", nativeLabel: "English (South Africa)", enabled: true },
  { code: "ng", label: "Nigeria", nativeLabel: "English (Nigeria)", enabled: true },

  // Extra global expansion
  { code: "zh", label: "China", nativeLabel: "中文", enabled: true },
  { code: "ms", label: "Malaysia", nativeLabel: "Bahasa Melayu", enabled: true },
];