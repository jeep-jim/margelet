import { SITE_LOCALES } from "../../lib/locales";
import type { Locale } from "../../types/app";
import {
  INTRO_LANGUAGE_STORAGE_KEY,
  TELEGRAM_BOT_ID,
  TG_STORAGE_KEY,
} from "./creator.constants";
import type { TgUser } from "./creator.types";

import type { CountryCode } from "../../../api/lib/contracts";
import { normalizeCountryCode } from "../../../api/lib/contracts";

export const getCreatorCountry = (input: string | null | undefined): CountryCode => {
  return normalizeCountryCode(input);
};

export function isStandaloneMode() {
  if (typeof window === "undefined") return false;

  const byMedia = window.matchMedia("(display-mode: standalone)").matches;
  const byNavigator = Boolean(
    (window.navigator as Navigator & { standalone?: boolean }).standalone
  );

  return byMedia || byNavigator;
}

export function isIosDevice() {
  if (typeof window === "undefined") return false;

  const ua = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform?.toLowerCase() || "";
  const maxTouchPoints = window.navigator.maxTouchPoints || 0;

  const classicIos =
    /iphone|ipad|ipod/.test(ua) || /iphone|ipad|ipod/.test(platform);

  const ipadOs = platform === "macintel" && maxTouchPoints > 1;

  return classicIos || ipadOs;
}

export function getTelegramAuthUrl() {
  const origin = window.location.origin;
  return `https://oauth.telegram.org/auth?bot_id=${TELEGRAM_BOT_ID}&origin=${origin}&request_access=write`;
}

export function getLocaleOption(locale: Locale) {
  return SITE_LOCALES.find((item) => item.code === locale);
}

export function readTelegramUserFromStorage(): TgUser | null {
  const raw = localStorage.getItem(TG_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TgUser;
  } catch {
    localStorage.removeItem(TG_STORAGE_KEY);
    return null;
  }
}

export function readLocaleFromStorage(key: string, fallback: Locale): Locale {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  const exists = SITE_LOCALES.some((item) => item.code === raw);
  return exists ? (raw as Locale) : fallback;
}

export function readIntroLocaleFromStorage(fallback: Locale) {
  return readLocaleFromStorage(INTRO_LANGUAGE_STORAGE_KEY, fallback);
}

export function buildAlphabeticalLocales() {
  const sorted = [...SITE_LOCALES].sort((a, b) =>
    a.nativeLabel.localeCompare(b.nativeLabel, undefined, {
      sensitivity: "base",
    })
  );

  const ruIndex = sorted.findIndex((item) => item.code === "ru");
  if (ruIndex === -1) return sorted;

  const [ru] = sorted.splice(ruIndex, 1);
  sorted.splice(Math.min(3, sorted.length), 0, ru);

  return sorted;
}
