export type CountryCode =
  | "ru"
  | "ua"
  | "us"
  | "in"
  | "ir"
  | "tr"
  | "br"
  | "kz"
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
  | "cn"
  | "my";

/**
 * 🔥 ЕДИНАЯ SEO + COUNTRY CONFIG СИСТЕМА
 * ВСЯ СИСТЕМА ИСПОЛЬЗУЕТ ТОЛЬКО ЭТИ COUNTRY CODES
 */
export const SEO_LOCALE_META: Record<
  CountryCode,
  {
    label: string;
    htmlLang: string;
    hreflang: string;
    countryCode: CountryCode;
  }
> = {
  ru: {
    label: "RU",
    htmlLang: "ru",
    hreflang: "ru-RU",
    countryCode: "ru",
  },

  ua: {
    label: "UA",
    htmlLang: "uk",
    hreflang: "uk-UA",
    countryCode: "ua",
  },

  us: {
    label: "US",
    htmlLang: "en",
    hreflang: "en-US",
    countryCode: "us",
  },

  in: {
    label: "IN",
    htmlLang: "hi",
    hreflang: "hi-IN",
    countryCode: "in",
  },

  ir: {
    label: "IR",
    htmlLang: "fa",
    hreflang: "fa-IR",
    countryCode: "ir",
  },

  tr: {
    label: "TR",
    htmlLang: "tr",
    hreflang: "tr-TR",
    countryCode: "tr",
  },

  br: {
    label: "BR",
    htmlLang: "pt-BR",
    hreflang: "pt-BR",
    countryCode: "br",
  },

  kz: {
    label: "KZ",
    htmlLang: "kk",
    hreflang: "kk-KZ",
    countryCode: "kz",
  },

  uz: {
    label: "UZ",
    htmlLang: "uz",
    hreflang: "uz-UZ",
    countryCode: "uz",
  },

  ae: {
    label: "AE",
    htmlLang: "ar",
    hreflang: "ar-AE",
    countryCode: "ae",
  },

  eg: {
    label: "EG",
    htmlLang: "ar",
    hreflang: "ar-EG",
    countryCode: "eg",
  },

  pk: {
    label: "PK",
    htmlLang: "ur",
    hreflang: "ur-PK",
    countryCode: "pk",
  },

  id: {
    label: "ID",
    htmlLang: "id",
    hreflang: "id-ID",
    countryCode: "id",
  },

  mx: {
    label: "MX",
    htmlLang: "es",
    hreflang: "es-MX",
    countryCode: "mx",
  },

  sa: {
    label: "SA",
    htmlLang: "ar",
    hreflang: "ar-SA",
    countryCode: "sa",
  },

  es: {
    label: "ES",
    htmlLang: "es",
    hreflang: "es-ES",
    countryCode: "es",
  },

  it: {
    label: "IT",
    htmlLang: "it",
    hreflang: "it-IT",
    countryCode: "it",
  },

  fr: {
    label: "FR",
    htmlLang: "fr",
    hreflang: "fr-FR",
    countryCode: "fr",
  },

  de: {
    label: "DE",
    htmlLang: "de",
    hreflang: "de-DE",
    countryCode: "de",
  },

  ar: {
    label: "AR",
    htmlLang: "es",
    hreflang: "es-AR",
    countryCode: "ar",
  },

  co: {
    label: "CO",
    htmlLang: "es",
    hreflang: "es-CO",
    countryCode: "co",
  },

  za: {
    label: "ZA",
    htmlLang: "en",
    hreflang: "en-ZA",
    countryCode: "za",
  },

  ng: {
    label: "NG",
    htmlLang: "en",
    hreflang: "en-NG",
    countryCode: "ng",
  },

  cn: {
    label: "CN",
    htmlLang: "zh",
    hreflang: "zh-CN",
    countryCode: "cn",
  },

  my: {
    label: "MY",
    htmlLang: "ms",
    hreflang: "ms-MY",
    countryCode: "my",
  },
};

/**
 * 🔥 ЕДИНАЯ НОРМАЛИЗАЦИЯ COUNTRY CODE
 * ВСЯ СИСТЕМА ДОЛЖНА ИСПОЛЬЗОВАТЬ ТОЛЬКО ЕЁ
 */
const COUNTRY_CODE_MAP: Record<string, CountryCode> = {
  ru: "ru",

  ua: "ua",
  uk: "ua",

  us: "us",
  en: "us",

  in: "in",

  ir: "ir",
  fa: "ir",

  tr: "tr",

  br: "br",
  "pt-br": "br",

  kz: "kz",
  kk: "kz",

  uz: "uz",

  ae: "ae",

  eg: "eg",

  pk: "pk",

  id: "id",

  mx: "mx",

  sa: "sa",

  es: "es",

  it: "it",

  fr: "fr",

  de: "de",

  ar: "ar",

  co: "co",

  za: "za",

  ng: "ng",

  cn: "cn",
  zh: "cn",

  my: "my",
  ms: "my",
};

export function normalizeCountryCode(
  value: string | null | undefined,
): CountryCode {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  return COUNTRY_CODE_MAP[normalized] || "ru";
}

/* =========================
   TAGS / POSTS / USERS
========================= */

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

/* =========================
   TRUSTED SOURCES
========================= */

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

/* =========================
   POSTS
========================= */

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

