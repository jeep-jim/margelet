import type { ActiveLocale } from "../lib/locales";

export type Locale = ActiveLocale;

export type TabId = "intro" | "feed" | "add" | "creator" | "source" | "admin";

export type FeedTag =
  | "all"

  // parents
  | "news"
  | "politics"
  | "economy"
  | "business"
  | "finance"
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

  // finance
  | "finance_all"
  | "finance_banks"
  | "finance_investing"
  | "finance_trading"
  | "finance_personal"
  | "crypto"
  | "finance_other"

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
  | "food_places"
  | "food_products"
  | "food_other"

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

  // legacy single-tag support
  tag: ContentTag;

  // new multi-tag support
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
  sourceCountryCode?: string | null;

  status?: PostStatus;
  role?: UserRole;

  moderation?: {
    status: PostStatus;
    reason: string | null;
    reviewedAt: string | null;
  };
};