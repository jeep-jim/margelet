export type Locale =
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

/**
 * 🔥 ЕДИНЫЙ СЛОЙ ПРАВИЛ ДЛЯ SEO + COUNTRY MAPPING
 * Это теперь источник правды для всех countryCode преобразований
 */
export const SEO_LOCALE_META = {
  ru: { htmlLang: "ru", hreflang: "ru-RU", countryCode: "ru" },
  uk: { htmlLang: "uk", hreflang: "uk-UA", countryCode: "uk" },
  en: { htmlLang: "en", hreflang: "en-US", countryCode: "en" },
  in: { htmlLang: "hi", hreflang: "hi-IN", countryCode: "in" },
  fa: { htmlLang: "fa", hreflang: "fa-IR", countryCode: "fa" },
  tr: { htmlLang: "tr", hreflang: "tr-TR", countryCode: "tr" },
  "pt-br": { htmlLang: "pt-BR", hreflang: "pt-BR", countryCode: "pt-br" },
  kk: { htmlLang: "kk", hreflang: "kk-KZ", countryCode: "kk" },
  uz: { htmlLang: "uz", hreflang: "uz-UZ", countryCode: "uz" },
  ae: { htmlLang: "ar", hreflang: "ar-AE", countryCode: "ae" },
  eg: { htmlLang: "ar", hreflang: "ar-EG", countryCode: "eg" },
  pk: { htmlLang: "ur", hreflang: "ur-PK", countryCode: "pk" },
  id: { htmlLang: "id", hreflang: "id-ID", countryCode: "id" },
  mx: { htmlLang: "es", hreflang: "es-MX", countryCode: "mx" },
  sa: { htmlLang: "ar", hreflang: "ar-SA", countryCode: "sa" },
  es: { htmlLang: "es", hreflang: "es-ES", countryCode: "es" },
  it: { htmlLang: "it", hreflang: "it-IT", countryCode: "it" },
  fr: { htmlLang: "fr", hreflang: "fr-FR", countryCode: "fr" },
  de: { htmlLang: "de", hreflang: "de-DE", countryCode: "de" },
  ar: { htmlLang: "es", hreflang: "es-AR", countryCode: "ar" },
  co: { htmlLang: "es", hreflang: "es-CO", countryCode: "co" },
  za: { htmlLang: "en", hreflang: "en-ZA", countryCode: "za" },
  ng: { htmlLang: "en", hreflang: "en-NG", countryCode: "ng" },
  zh: { htmlLang: "zh", hreflang: "zh-CN", countryCode: "zh" },
  ms: { htmlLang: "ms", hreflang: "ms-MY", countryCode: "ms" },
} as const;

export type FeedTag =
  | "all"
  | "news"
  | "politics"
  | "war"
  | "economy"
  | "business"
  | "finance"
  | "crypto"
  | "technology"
  | "ai"
  | "science"
  | "space"
  | "education"
  | "history"
  | "culture"
  | "art"
  | "design"
  | "books"
  | "cinema"
  | "series"
  | "music"
  | "gaming"
  | "memes"
  | "humor"
  | "sports"
  | "mma"
  | "travel"
  | "food"
  | "recipes"
  | "health"
  | "fitness"
  | "psychology"
  | "relationships"
  | "fashion"
  | "beauty"
  | "photography"
  | "nature"
  | "animals"
  | "people"
  | "celebrities"
  | "marketing"
  | "startups"
  | "jobs"
  | "real_estate"
  | "auto"
  | "gadgets"
  | "parenting"
  | "telegram"
  | "creativity"
  | "other";

export type ContentTag = Exclude<FeedTag, "all">;
export type PostStatus = "published" | "pending" | "blocked";
export type UserRole = "user" | "channel_owner" | "admin";

/**
 * 🔥 ЕДИНЫЙ СТАНДАРТ COUNTRY CODE
 * ВСЕГДА lowercase — это теперь правило системы
 */
export type CountryCode = keyof typeof SEO_LOCALE_META;

export type TrustedSourceStatus = "active" | "paused";

export type TrustedSource = {
  id: string;
  countryCode: CountryCode;
  handle: string;
  title: string;
  avatarUrl: string | null;
  avatarOverride?: string | null;
  verified?: boolean;
  defaultTag: ContentTag;
  tags: ContentTag[];
  status: TrustedSourceStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  lastCheckedAt: string | null;
  lastImportedAt: string | null;
  lastSeenPostId: number | null;
  importedPostsCount: number;
  lastRefreshCursorPostId?: number | null;
};

export type IngestedPost = {
  id: number;
  postUrl: string;
  source: {
    handle: string;
    title: string;
    avatar: string | null;
    verified: boolean;
  };
  text: string;
  links: Array<{
    label: string | null;
    url: string;
  }>;
  contentType:
    | "text"
    | "image"
    | "gallery"
    | "gif"
    | "video"
    | "audio"
    | "file"
    | "mixed"
    | "external_media";
  media: Array<{
    id: string;
    kind: "image" | "video" | "audio" | "file";
    url: string;
    poster?: string | null;
    mimeType?: string | null;
    fileName?: string | null;
    width?: number | null;
    height?: number | null;
    duration?: number | null;
  }>;
  hasMediaInOriginal: boolean;
  fallbackReason: null | "not_fetched" | "expired" | "unsupported" | "blocked";
  createdAt: string;
  expiresAt: string;
  ttlHours: number;
  mediaRefreshedAt?: string | null;
  tag: ContentTag;
  tags?: ContentTag[];
  addedBy: {
    telegramId: string | null;
    username: string | null;
  };
  billing: {
    plan: "free" | "pro_1m" | "pro_3m" | "pro_12m";
    autopublishEnabled: boolean;
  };
  sourceId?: string | null;
  sourceCountryCode?: CountryCode | null;
  status?: PostStatus;
  role?: UserRole;
  moderation?: {
    status: PostStatus;
    reason: string | null;
    reviewedAt: string | null;
  };
};