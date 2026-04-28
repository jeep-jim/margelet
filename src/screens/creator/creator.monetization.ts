import type { Locale } from "../../types/app";

export type CreatorPlan = "paid" | "barter";

export const CREATOR_PLACEMENT_DAYS = 30;

export type CreatorPricing = {
  country: Locale;
  stars: number;
  label: string;
  monthlyValueUsd: number;
};

function starsLabel(stars: number) {
  return `${new Intl.NumberFormat("ru-RU").format(stars)} Stars ⭐ / 1 месяц`;
}

const DEFAULT_PRICING: CreatorPricing = {
  country: "en",
  stars: 4900,
  label: starsLabel(4900),
  monthlyValueUsd: 49,
};

export const CREATOR_PRICING_BY_COUNTRY: Partial<Record<Locale, CreatorPricing>> = {
  ru: { country: "ru", stars: 2500, label: starsLabel(2500), monthlyValueUsd: 33 },
  uk: { country: "uk", stars: 2900, label: starsLabel(9900), monthlyValueUsd: 129 },
  en: { country: "en", stars: 4900, label: starsLabel(7900), monthlyValueUsd: 99 },
  in: { country: "in", stars: 1900, label: starsLabel(1900), monthlyValueUsd: 19 },
  fa: { country: "fa", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
  tr: { country: "tr", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
  "pt-br": { country: "pt-br", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
  kk: { country: "kk", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
  uz: { country: "uz", stars: 1900, label: starsLabel(1900), monthlyValueUsd: 19 },
  ae: { country: "ae", stars: 5900, label: starsLabel(5900), monthlyValueUsd: 59 },
  eg: { country: "eg", stars: 1900, label: starsLabel(1900), monthlyValueUsd: 19 },
  pk: { country: "pk", stars: 1900, label: starsLabel(1900), monthlyValueUsd: 19 },
  id: { country: "id", stars: 1900, label: starsLabel(1900), monthlyValueUsd: 19 },
  mx: { country: "mx", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
  sa: { country: "sa", stars: 5900, label: starsLabel(5900), monthlyValueUsd: 59 },
  es: { country: "es", stars: 3900, label: starsLabel(3900), monthlyValueUsd: 39 },
  it: { country: "it", stars: 3900, label: starsLabel(3900), monthlyValueUsd: 39 },
  fr: { country: "fr", stars: 3900, label: starsLabel(7900), monthlyValueUsd: 99 },
  de: { country: "de", stars: 3900, label: starsLabel(7900), monthlyValueUsd: 99 },
  ar: { country: "ar", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
  co: { country: "co", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
  za: { country: "za", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
  ng: { country: "ng", stars: 1900, label: starsLabel(1900), monthlyValueUsd: 19 },
  zh: { country: "zh", stars: 3900, label: starsLabel(5900), monthlyValueUsd: 39 },
  ms: { country: "ms", stars: 2900, label: starsLabel(2900), monthlyValueUsd: 29 },
};

export function getCreatorPricing(country: Locale): CreatorPricing {
  return CREATOR_PRICING_BY_COUNTRY[country] ?? DEFAULT_PRICING;
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

export function formatDaysLeft(endsAt: string | null) {
  const days = getDaysLeft(endsAt);
  if (days === null) return "—";
  if (days <= 0) return "истёк";
  if (days === 1) return "1 день";
  if (days >= 2 && days <= 4) return `${days} дня`;
  return `${days} дней`;
}

export function getPlacementStatusLabel(status: string) {
  if (status === "pending") return "ожидает";
  if (status === "active") return "активен";
  if (status === "paused") return "пауза";
  if (status === "expired") return "истёк";
  return "черновик";
}
