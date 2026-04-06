import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getEnabledLocales,
  getInitialLocale,
  getMessages,
  setLocale as persistLocale,
} from "../lib/i18n";
import type { TranslationSchema } from "../lib/i18n/types";
import type { SiteLocale } from "../lib/locales";

type LanguageContextValue = {
  locale: SiteLocale;
  setLocale: (locale: SiteLocale) => void;
  messages: TranslationSchema;
  enabledLocales: ReturnType<typeof getEnabledLocales>;
  t: (section: keyof TranslationSchema) => TranslationSchema[keyof TranslationSchema];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SiteLocale>(() => getInitialLocale());

  useEffect(() => {
    persistLocale(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const dict = useMemo(() => getMessages(locale), [locale]);
  const enabledLocales = useMemo(() => getEnabledLocales(), []);

  const value = useMemo<LanguageContextValue>(() => {
    return {
      locale,
      setLocale: setLocaleState,
      messages: dict,
      enabledLocales,
      t: (section) => dict[section],
    };
  }, [locale, dict, enabledLocales]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}