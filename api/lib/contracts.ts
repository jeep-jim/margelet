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

  // parents
  | "news"
  | "politics"
  | "economy"
  | "business"
  | "marketplaces"
  | "finance"
  | "electronics"
  | "technology"
  | "science"
  | "education"
  | "culture"
  | "gaming"
  | "humor"
  | "sports"
  | "fitness"
  | "health"
  | "travel"
  | "food"
  | "food_service"
  | "psychology"
  | "fashion"
  | "nature"
  | "people"
  | "marketing"
  | "startups"
  | "jobs"
  | "real_estate"
  | "auto"
  | "telegram"
  | "creativity"
  | "other"

  // news
  | "news_all"
  | "news_world"
  | "news_breaking"
  | "news_regions"
  | "news_incidents"
  | "news_investigations"
  | "news_good"
  | "news_no_negative"

  // politics
  | "politics_all"
  | "politics_world"
  | "politics_government"
  | "politics_elections"
  | "politics_conflicts"
  | "war"
  | "politics_opinion"
  | "politics_other"

  // economy
  | "economy_all"
  | "economy_macro"
  | "economy_markets"
  | "economy_industry"
  | "economy_energy"
  | "economy_logistics"
  | "economy_other"

  // business
  | "business_all"
  | "business_companies"
  | "business_entrepreneurship"
  | "business_ecommerce"
  | "business_management"
  | "business_cases"
  | "business_other"

  // marketplaces
  | "marketplaces"

  // finance
  | "finance_all"
  | "finance_banks"
  | "finance_payment_systems"
  | "finance_investing"
  | "finance_trading"
  | "finance_personal"
  | "crypto"
  | "finance_other"

  // electronics
  | "electronics_home_appliances"
  | "electronics_pc"
  | "electronics_construction"
  | "electronics_trends"
  | "electronics_brands"
  | "electronics_delivery"
  | "electronics_reviews"

  // technology
  | "technology_all"
  | "technology_software"
  | "technology_dev"
  | "technology_web"
  | "internet"
  | "gadgets"
  | "ai"
  | "technology_other"

  // science
  | "science_all"
  | "science_research"
  | "science_discoveries"
  | "science_medicine"
  | "space"
  | "science_other"

  // education
  | "education_all"
  | "education_courses"
  | "education_languages"
  | "education_self"
  | "history"
  | "books"
  | "education_other"

  // culture
  | "culture_all"
  | "art"
  | "design"
  | "photography"
  | "cinema"
  | "series"
  | "music"
  | "culture_other"

  // gaming
  | "gaming_all"
  | "gaming_mobile"
  | "gaming_pc"
  | "gaming_console"
  | "gaming_esports"
  | "gaming_other"

  // humor
  | "humor_all"
  | "memes"
  | "humor_ironical"
  | "humor_satire"
  | "humor_other"

  // sports
  | "sports_all"
  | "sports_championships"
  | "sports_matches"
  | "sports_news"
  | "sports_people"
  | "sports_transfers"
  | "sports_analytics"
  | "sports_other"

  // fitness
  | "fitness_all"
  | "fitness_training"
  | "fitness_nutrition"
  | "fitness_body"
  | "fitness_other"

  // health
  | "health_all"
  | "health_medicine"
  | "health_research"
  | "health_food"
  | "health_advice"
  | "health_other"

  // travel
  | "travel_all"
  | "travel_rest"
  | "travel_countries"
  | "travel_routes"
  | "travel_hotels"
  | "travel_other"

  // food
  | "food_all"
  | "recipes"
  | "food_products"
  | "food_other"

  // food service
  | "food_service_places"
  | "food_service_delivery"
  | "food_service_products"
  | "food_service_new"
  | "food_service_jobs"
  | "food_service_software"
  | "food_service_reviews"

  // psychology
  | "psychology_all"
  | "psychology_self"
  | "relationships"
  | "parenting"
  | "psychology_other"

  // fashion
  | "fashion_all"
  | "beauty"
  | "fashion_style"
  | "fashion_brands"
  | "fashion_other"

  // nature
  | "nature_all"
  | "animals"
  | "nature_ecology"
  | "nature_plants"
  | "nature_other"

  // people
  | "people_all"
  | "people_blogs"
  | "celebrities"
  | "people_interviews"
  | "people_other"

  // marketing
  | "marketing_all"
  | "marketing_smm"
  | "marketing_ads"
  | "marketing_brand"
  | "marketing_other"

  // startups
  | "startups_all"
  | "startups_cases"
  | "startups_founders"
  | "startups_invest"
  | "startups_other"

  // jobs
  | "jobs_all"
  | "jobs_vacancies"
  | "jobs_remote"
  | "jobs_parttime"
  | "jobs_career"
  | "jobs_freelance"
  | "jobs_resume"
  | "jobs_interviews"
  | "jobs_learning"
  | "jobs_other"

  // real estate
  | "real_estate_all"
  | "real_estate_housing"
  | "real_estate_invest"
  | "real_estate_build"
  | "real_estate_other"

  // transport
  | "transport_auto"
  | "transport_moto"
  | "transport_other"
  | "transport_reviews"
  | "transport_other2"

  // telegram
  | "telegram_all"
  | "telegram_channels"
  | "telegram_bots"
  | "telegram_ton"
  | "telegram_updates"
  | "telegram_other"

  // creativity
  | "creativity_all"
  | "creativity_handmade"
  | "creativity_inspiration"
  | "creativity_other"

  // other
  | "other_all"
  | "other_misc";  

export type ContentTag = Exclude<FeedTag, "all">;

export type PostStatus = "published" | "pending" | "blocked";
export type UserRole = "user" | "channel_owner" | "admin";

/* =========================
   TRUSTED SOURCES
========================= */

export type TrustedSourceStatus = "active" | "paused" | "blocked";

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

