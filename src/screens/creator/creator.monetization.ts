// 🔥 Импортируем единый тип CountryCode
import type { CountryCode } from "../../../api/lib/contracts.js";

export type CreatorPlan = "paid" | "barter";

export const CREATOR_PLACEMENT_DAYS = 30;

export type CreatorPricing = {
  country: CountryCode;
  stars: number;
  label: string;
  monthlyValueUsd: number;
};

const MONTH_LABELS: Partial<Record<CountryCode, string>> = {
  ru: "1 месяц",
  ua: "1 місяць",
  us: "1 month",
  in: "1 महीना",
  ir: "۱ ماه",
  tr: "1 ay",
  br: "1 mês",
  kz: "1 ай",
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
  cn: "1 个月",
  my: "1 bulan",
};

const NUMBER_LOCALE: Partial<Record<CountryCode, string>> = {
  ru: "ru-RU",
  ua: "uk-UA",
  us: "en-US",
  in: "hi-IN",
  ir: "fa-IR",
  tr: "tr-TR",
  br: "pt-BR",
  kz: "kk-KZ",
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
  cn: "zh-CN",
  my: "ms-MY",
};

export function starsLabel(stars: number, countryCode: CountryCode = "ru") {
  const locale = NUMBER_LOCALE[countryCode] ?? "en-US";
  const formatted = new Intl.NumberFormat(locale).format(stars);
  const monthLabel = MONTH_LABELS[countryCode] ?? MONTH_LABELS.us;
  return `${formatted} Stars ⭐ / ${monthLabel}`;
}

function pricing(country: CountryCode, stars: number, monthlyValueUsd: number): CreatorPricing {
  return {
    country,
    stars,
    label: starsLabel(stars, country),
    monthlyValueUsd,
  };
}

export const DEFAULT_PRICING: CreatorPricing = pricing("us", 7900, 99);

export const CREATOR_PRICING_BY_COUNTRY: Partial<Record<CountryCode, CreatorPricing>> = {
  ru: { country: "ru", stars: 2500, label: starsLabel(2500, "ru"), monthlyValueUsd: 33 },
  ua: { country: "ua", stars: 9900, label: starsLabel(9900, "ua"), monthlyValueUsd: 129 },
  us: { country: "us", stars: 7900, label: starsLabel(7900, "us"), monthlyValueUsd: 99 },
  in: { country: "in", stars: 1900, label: starsLabel(1900, "in"), monthlyValueUsd: 19 },
  ir: { country: "ir", stars: 2900, label: starsLabel(2900, "ir"), monthlyValueUsd: 29 },
  tr: { country: "tr", stars: 2900, label: starsLabel(2900, "tr"), monthlyValueUsd: 29 },
  br: { country: "br", stars: 2900, label: starsLabel(2900, "br"), monthlyValueUsd: 29 },
  kz: { country: "kz", stars: 2900, label: starsLabel(2900, "kz"), monthlyValueUsd: 29 },
  uz: { country: "uz", stars: 1900, label: starsLabel(1900, "uz"), monthlyValueUsd: 19 },
  ae: { country: "ae", stars: 7900, label: starsLabel(7900, "ae"), monthlyValueUsd: 79 },
  eg: { country: "eg", stars: 1900, label: starsLabel(1900, "eg"), monthlyValueUsd: 19 },
  pk: { country: "pk", stars: 1900, label: starsLabel(1900, "pk"), monthlyValueUsd: 19 },
  id: { country: "id", stars: 1900, label: starsLabel(1900, "id"), monthlyValueUsd: 19 },
  mx: { country: "mx", stars: 2900, label: starsLabel(2900, "mx"), monthlyValueUsd: 29 },
  sa: { country: "sa", stars: 5900, label: starsLabel(5900, "sa"), monthlyValueUsd: 59 },
  es: { country: "es", stars: 5900, label: starsLabel(5900, "es"), monthlyValueUsd: 59 },
  it: { country: "it", stars: 5900, label: starsLabel(5900, "it"), monthlyValueUsd: 59 },
  fr: { country: "fr", stars: 7900, label: starsLabel(7900, "fr"), monthlyValueUsd: 79 },
  de: { country: "de", stars: 9900, label: starsLabel(9900, "de"), monthlyValueUsd: 99 },
  ar: { country: "ar", stars: 2900, label: starsLabel(2900, "ar"), monthlyValueUsd: 29 },
  co: { country: "co", stars: 2900, label: starsLabel(2900, "co"), monthlyValueUsd: 29 },
  za: { country: "za", stars: 2900, label: starsLabel(2900, "za"), monthlyValueUsd: 29 },
  ng: { country: "ng", stars: 1900, label: starsLabel(1900, "ng"), monthlyValueUsd: 19 },
  cn: { country: "cn", stars: 5900, label: starsLabel(5900, "cn"), monthlyValueUsd: 59 },
  my: { country: "my", stars: 2900, label: starsLabel(2900, "my"), monthlyValueUsd: 29 },
};

export function getCreatorPricing(country: CountryCode, uiCountryCode: CountryCode = country): CreatorPricing {
  const base = CREATOR_PRICING_BY_COUNTRY[country] ?? DEFAULT_PRICING;
  return {
    ...base,
    label: starsLabel(base.stars, uiCountryCode),
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

export function getPlacementStatusLabel(status: string, countryCode: CountryCode = "ru") {
  const labels: Partial<Record<CountryCode, Record<string, string>>> = {
    ru: { pending: "ожидает", active: "активен", paused: "пауза", expired: "истёк", draft: "черновик" },
    ua: { pending: "очікує", active: "активний", paused: "пауза", expired: "завершено", draft: "чернетка" },
    us: { pending: "pending", active: "active", paused: "paused", expired: "expired", draft: "draft" },
    in: { pending: "प्रतीक्षा", active: "सक्रिय", paused: "रुका", expired: "समाप्त", draft: "ड्राफ्ट" },
    ir: { pending: "در انتظار", active: "فعال", paused: "متوقف", expired: "پایان‌یافته", draft: "پیش‌نویس" },
    tr: { pending: "beklemede", active: "aktif", paused: "duraklatıldı", expired: "süresi doldu", draft: "taslak" },
    br: { pending: "pendente", active: "ativo", paused: "pausado", expired: "expirado", draft: "rascunho" },
    kz: { pending: "күтуде", active: "белсенді", paused: "пауза", expired: "аяқталды", draft: "черновик" },
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
    cn: { pending: "等待中", active: "已启用", paused: "暂停", expired: "已过期", draft: "草稿" },
    my: { pending: "menunggu", active: "aktif", paused: "jeda", expired: "tamat", draft: "draf" },
  };

  const countryLabels = labels[countryCode];
  if (!countryLabels) {
    return status;
  }
  return countryLabels[status] ?? status;
}

export function formatDaysLeft(endsAt: string | null, countryCode: CountryCode = "ru") {
  const days = getDaysLeft(endsAt);
  if (days === null) return "—";
  if (days <= 0) return getPlacementStatusLabel("expired", countryCode);

  const dayLabels: Partial<Record<CountryCode, [string, string]>> = {
    ru: ["день", "дней"],
    ua: ["день", "днів"],
    us: ["day", "days"],
    in: ["दिन", "दिन"],
    ir: ["روز", "روز"],
    tr: ["gün", "gün"],
    br: ["dia", "dias"],
    kz: ["күн", "күн"],
    uz: ["kun", "kun"],
    ae: ["يوم", "أيام"],
    eg: ["يوم", "أيام"],
    pk: ["دن", "دن"],
    id: ["hari", "hari"],
    mx: ["día", "días"],
    sa: ["يوم", "أيام"],
    es: ["día", "días"],
    it: ["giorno", "giorni"],
    fr: ["jour", "jours"],
    de: ["Tag", "Tage"],
    ar: ["día", "días"],
    co: ["día", "días"],
    za: ["day", "days"],
    ng: ["day", "days"],
    cn: ["天", "天"],
    my: ["hari", "hari"],
  };

  const pair = dayLabels[countryCode];
  if (!pair) {
    return `${days} days`;
  }

  const [one, many] = pair;
  return `${days} ${days === 1 ? one : many}`;
}