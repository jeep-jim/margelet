export type Locale = "ru" | "en";

export type TabId = "intro" | "feed" | "add" | "creator" | "source" | "admin";

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

  addedBy: {
    telegramId: string | null;
    username: string | null;
  };

  billing: {
    plan: "free" | "pro_1m" | "pro_3m" | "pro_12m";
    autopublishEnabled: boolean;
  };

  status?: PostStatus;
  role?: UserRole;

  moderation?: {
    status: PostStatus;
    reason: string | null;
    reviewedAt: string | null;
  };
};