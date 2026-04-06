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
  t: <
    TSection extends keyof TranslationSchema,
    TKey extends keyof TranslationSchema[TSection]
  >(
    section: TSection,
    key: TKey
  ) => TranslationSchema[TSection][TKey];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SiteLocale>(() => getInitialLocale());

  useEffect(() => {
    persistLocale(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const messages = useMemo(() => getMessages(locale), [locale]);
  const enabledLocales = useMemo(() => getEnabledLocales(), []);

  const value = useMemo<LanguageContextValue>(() => {
    return {
      locale,
      setLocale: (nextLocale) => {
        setLocaleState(nextLocale);
      },
      messages,
      enabledLocales,
      t: (section, key) => messages[section][key],
    };
  }, [locale, messages, enabledLocales]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}