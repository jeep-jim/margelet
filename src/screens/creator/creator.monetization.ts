import type { Locale } from "../../types/app.js";

export type CreatorPlan = "paid" | "barter";

export const CREATOR_PLACEMENT_DAYS = 30;

export type CreatorPricing = {
  country: Locale;
  stars: number;
  label: string;
  monthlyValueUsd: number;
};

const MONTH_LABELS: Record<Locale, string> = {
  ru: "1 месяц",
  uk: "1 місяць",
  en: "1 month",
  in: "1 महीना",
  fa: "۱ ماه",
  tr: "1 ay",
  "pt-br": "1 mês",
  kk: "1 ай",
  uz: "1 oy",
  ae: "شهر واحد",
  eg: "شهر واحد",
  pk: "1 مہینہ",
  id: "1 bulan",
  mx: "1 mes",
  sa: "شهر واحد",
  es: "1 mes",
  it: "1 mese",
  fr: "1 mois",
  de: "1 Monat",
  ar: "1 mes",
  co: "1 mes",
  za: "1 month",
  ng: "1 month",
  zh: "1 个月",
  ms: "1 bulan",
};

const NUMBER_LOCALE: Record<Locale, string> = {
  ru: "ru-RU",
  uk: "uk-UA",
  en: "en-US",
  in: "hi-IN",
  fa: "fa-IR",
  tr: "tr-TR",
  "pt-br": "pt-BR",
  kk: "kk-KZ",
  uz: "uz-UZ",
  ae: "ar-AE",
  eg: "ar-EG",
  pk: "ur-PK",
  id: "id-ID",
  mx: "es-MX",
  sa: "ar-SA",
  es: "es-ES",
  it: "it-IT",
  fr: "fr-FR",
  de: "de-DE",
  ar: "es-AR",
  co: "es-CO",
  za: "en-ZA",
  ng: "en-NG",
  zh: "zh-CN",
  ms: "ms-MY",
};

export function starsLabel(stars: number, locale: Locale = "ru") {
  const formatted = new Intl.NumberFormat(NUMBER_LOCALE[locale] ?? "en-US").format(stars);
  return `${formatted} Stars ⭐ / ${MONTH_LABELS[locale] ?? MONTH_LABELS.en}`;
}

function pricing(country: Locale, stars: number, monthlyValueUsd: number): CreatorPricing {
  return {
    country,
    stars,
    label: starsLabel(stars, country),
    monthlyValueUsd,
  };
}

export const DEFAULT_PRICING: CreatorPricing = pricing("en", 7900, 99);

export const CREATOR_PRICING_BY_COUNTRY: Partial<Record<Locale, CreatorPricing>> = {
  ru: { country: "ru", stars: 2500, label: starsLabel(2500), monthlyValueUsd: 33 },
  uk: { country: "uk", stars: 9900, label: starsLabel(9900), monthlyValueUsd: 129 },
  en: { country: "en", stars: 7900, label: starsLabel(7900), monthlyValueUsd: 99 },
  in: { country: "in", stars: 1900, label: starsLabel(1900), monthlyValueUsd: 19 },
  fa: { country: "fa", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
  tr: { country: "tr", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
  "pt-br": { country: "pt-br", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
  kk: { country: "kk", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
  uz: { country: "uz", stars: 1900, label: starsLabel(1900), monthlyValueUsd: 19 },
  ae: { country: "ae", stars: 7900, label: starsLabel(7900), monthlyValueUsd: 79 },
  eg: { country: "eg", stars: 1900, label: starsLabel(1900), monthlyValueUsd: 19 },
  pk: { country: "pk", stars: 1900, label: starsLabel(1900), monthlyValueUsd: 19 },
  id: { country: "id", stars: 1900, label: starsLabel(1900), monthlyValueUsd: 19 },
  mx: { country: "mx", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
  sa: { country: "sa", stars: 5900, label: starsLabel(5900), monthlyValueUsd: 59 },
  es: { country: "es", stars: 5900, label: starsLabel(5900), monthlyValueUsd: 59 },
  it: { country: "it", stars: 5900, label: starsLabel(5900), monthlyValueUsd: 59 },
  fr: { country: "fr", stars: 7900, label: starsLabel(7900), monthlyValueUsd: 79 },
  de: { country: "de", stars: 9900, label: starsLabel(9900), monthlyValueUsd: 99 },
  ar: { country: "ar", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
  co: { country: "co", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
  za: { country: "za", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
  ng: { country: "ng", stars: 1900, label: starsLabel(1900), monthlyValueUsd: 19 },
  zh: { country: "zh", stars: 5900, label: starsLabel(5900), monthlyValueUsd: 59 },
  ms: { country: "ms", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
};


export function getCreatorPricing(country: Locale, uiLocale: Locale = country): CreatorPricing {
  const base = CREATOR_PRICING_BY_COUNTRY[country] ?? DEFAULT_PRICING;
  return {
    ...base,
    label: starsLabel(base.stars, uiLocale),
  };
}

export function addPlacementDays(from: Date, days = CREATOR_PLACEMENT_DAYS) {
  const next = new Date(from);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

export function getDaysLeft(endsAt: string | null) {
  if (!endsAt) return null;

  const diff = Date.parse(endsAt) - Date.now();
  if (!Number.isFinite(diff)) return null;

  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function getPlacementStatusLabel(status: string, locale: Locale = "ru") {
  const labels: Record<Locale, Record<string, string>> = {
    ru: { pending: "ожидает", active: "активен", paused: "пауза", expired: "истёк", draft: "черновик" },
    uk: { pending: "очікує", active: "активний", paused: "пауза", expired: "завершено", draft: "чернетка" },
    en: { pending: "pending", active: "active", paused: "paused", expired: "expired", draft: "draft" },
    in: { pending: "प्रतीक्षा", active: "सक्रिय", paused: "रुका", expired: "समाप्त", draft: "ड्राफ्ट" },
    fa: { pending: "در انتظار", active: "فعال", paused: "متوقف", expired: "پایان‌یافته", draft: "پیش‌نویس" },
    tr: { pending: "beklemede", active: "aktif", paused: "duraklatıldı", expired: "süresi doldu", draft: "taslak" },
    "pt-br": { pending: "pendente", active: "ativo", paused: "pausado", expired: "expirado", draft: "rascunho" },
    kk: { pending: "күтуде", active: "белсенді", paused: "пауза", expired: "аяқталды", draft: "черновик" },
    uz: { pending: "kutilmoqda", active: "faol", paused: "pauza", expired: "tugagan", draft: "qoralama" },
    ae: { pending: "قيد الانتظار", active: "نشط", paused: "متوقف", expired: "منتهي", draft: "مسودة" },
    eg: { pending: "قيد الانتظار", active: "نشط", paused: "متوقف", expired: "منتهي", draft: "مسودة" },
    pk: { pending: "منتظر", active: "فعال", paused: "روکا ہوا", expired: "ختم", draft: "مسودہ" },
    id: { pending: "menunggu", active: "aktif", paused: "jeda", expired: "kedaluwarsa", draft: "draf" },
    mx: { pending: "pendiente", active: "activo", paused: "pausa", expired: "vencido", draft: "borrador" },
    sa: { pending: "قيد الانتظار", active: "نشط", paused: "متوقف", expired: "منتهي", draft: "مسودة" },
    es: { pending: "pendiente", active: "activo", paused: "pausa", expired: "vencido", draft: "borrador" },
    it: { pending: "in attesa", active: "attivo", paused: "pausa", expired: "scaduto", draft: "bozza" },
    fr: { pending: "en attente", active: "actif", paused: "pause", expired: "expiré", draft: "brouillon" },
    de: { pending: "wartet", active: "aktiv", paused: "pausiert", expired: "abgelaufen", draft: "Entwurf" },
    ar: { pending: "pendiente", active: "activo", paused: "pausa", expired: "vencido", draft: "borrador" },
    co: { pending: "pendiente", active: "activo", paused: "pausa", expired: "vencido", draft: "borrador" },
    za: { pending: "pending", active: "active", paused: "paused", expired: "expired", draft: "draft" },
    ng: { pending: "pending", active: "active", paused: "paused", expired: "expired", draft: "draft" },
    zh: { pending: "等待中", active: "已启用", paused: "暂停", expired: "已过期", draft: "草稿" },
    ms: { pending: "menunggu", active: "aktif", paused: "jeda", expired: "tamat", draft: "draf" },
  };

  return (labels[locale] ?? labels.en)[status] ?? (labels[locale] ?? labels.en).draft;
}

export function formatDaysLeft(endsAt: string | null, locale: Locale = "ru") {
  const days = getDaysLeft(endsAt);
  if (days === null) return "—";
  if (days <= 0) return getPlacementStatusLabel("expired", locale);

  const dayLabels: Record<Locale, [string, string]> = {
    ru: ["день", "дней"], uk: ["день", "днів"], en: ["day", "days"], in: ["दिन", "दिन"], fa: ["روز", "روز"], tr: ["gün", "gün"],
    "pt-br": ["dia", "dias"], kk: ["күн", "күн"], uz: ["kun", "kun"], ae: ["يوم", "أيام"], eg: ["يوم", "أيام"], pk: ["دن", "دن"],
    id: ["hari", "hari"], mx: ["día", "días"], sa: ["يوم", "أيام"], es: ["día", "días"], it: ["giorno", "giorni"], fr: ["jour", "jours"],
    de: ["Tag", "Tage"], ar: ["día", "días"], co: ["día", "días"], za: ["day", "days"], ng: ["day", "days"], zh: ["天", "天"], ms: ["hari", "hari"],
  };

  const [one, many] = dayLabels[locale] ?? dayLabels.en;
  return `${days} ${days === 1 ? one : many}`;
}
