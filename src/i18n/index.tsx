import React, { createContext, useContext, useMemo, useState } from "react";
import { SUPPORTED_LANGS, type Lang, translations } from "./translations";

const STORAGE_KEY = "margelet_lang";

function normalizeLangCandidate(raw: string): string {
  return raw.trim().toLowerCase();
}

function baseLang(raw: string): string {
  // "pt-BR" -> "pt", "ar-EG" -> "ar"
  return normalizeLangCandidate(raw).split("-")[0];
}

function detectInitialLang(): Lang {
  try {
    if (typeof navigator === "undefined") return "en";

    const candidates = Array.isArray(navigator.languages) && navigator.languages.length
      ? navigator.languages
      : [navigator.language || ""];

    for (const c of candidates) {
      const b = baseLang(c || "");
      if (SUPPORTED_LANGS.includes(b as Lang)) return b as Lang;
    }
    return "en";
  } catch {
    return "en";
  }
}

function readStoredLang(): Lang | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const b = baseLang(raw);
    return SUPPORTED_LANGS.includes(b as Lang) ? (b as Lang) : null;
  } catch {
    return null;
  }
}

function writeStoredLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {}
}

type I18nContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  cycleLang: () => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = readStoredLang();
    if (stored) return stored;
    const detected = detectInitialLang();
    writeStoredLang(detected);
    return detected;
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    writeStoredLang(l);
  };

  const cycleLang = () => {
    const idx = SUPPORTED_LANGS.indexOf(lang);
    const next = SUPPORTED_LANGS[(idx + 1) % SUPPORTED_LANGS.length];
    setLang(next);
  };

  const t = (key: string) => {
    // prefer current language
    const cur = translations[lang];
    if (cur && key in cur) return cur[key];

    // fallback to EN
    const en = translations.en;
    if (en && key in en) return en[key];

    // final fallback: show key (makes missing keys obvious in dev)
    return key;
  };

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, cycleLang, t }),
    [lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside <I18nProvider />");
  }
  return ctx;
}