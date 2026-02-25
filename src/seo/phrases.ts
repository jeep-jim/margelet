import type { Lang } from "../i18n/translations";

export type SeoMeta = {
  title: string;
  description: string;
  keywords: string[]; // IMPORTANT: keep as separate array for clusters
};

/**
 * SEO plan (we'll fill together):
 * - Separate meta for each route/page.
 * - Each page has per-language meta.
 * - keywords[] is for planning + optional usage (some engines ignore meta keywords, but it's great for our own clustering).
 *
 * Later we can:
 * - Inject <title> and <meta name="description"> via react-helmet-async.
 * - Generate OpenGraph tags too.
 */
export const seo: Record<string, Partial<Record<Lang, SeoMeta>>> = {
  landing: {
    en: {
      title: "margeleT — your device is your cloud",
      description:
        "Private chat and instant file links. Your data stays on your devices — not on centralized servers.",
      keywords: [
        // TODO: we’ll build clusters here (search intent phrases)
      ],
    },
    ru: {
      title: "margeleT — твоё устройство это облако",
      description:
        "Приватный чат и мгновенные ссылки на файлы. Данные остаются на устройствах, а не на централизованных серверах.",
      keywords: [
        // TODO: мы соберём семантику под RU
      ],
    },
  },

  onboarding: {
    en: {
      title: "Set up your device — margeleT",
      description: "Create access through your device or restore via QR.",
      keywords: [],
    },
    ru: {
      title: "Подключи устройство — margeleT",
      description: "Создай доступ через устройство или восстанови через QR.",
      keywords: [],
    },
  },
};

/**
 * Utility (optional) - get meta with fallback to EN.
 */
export function getSeoMeta(pageKey: string, lang: Lang): SeoMeta | null {
  const page = seo[pageKey];
  if (!page) return null;

  const cur = page[lang];
  if (cur) return cur as SeoMeta;

  const en = page.en;
  return en ? (en as SeoMeta) : null;
}