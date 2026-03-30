export type Locale = "ru" | "en";

export type TabId = "intro" | "feed" | "add" | "creator" | "source" | "admin";

export type FeedTag =
  | "all"
  | "people"
  | "animals"
  | "news"
  | "business"
  | "creativity"
  | "finance"
  | "education"
  | "technology"
  | "memes"
  | "sports"
  | "music"
  | "travel"
  | "food"
  | "other";

export type ContentTag = Exclude<FeedTag, "all">;

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

  tag: ContentTag;

  addedBy: {
    telegramId: string | null;
    username: string | null;
  };

  billing: {
    plan: "free" | "pro_1m" | "pro_3m" | "pro_12m";
    autopublishEnabled: boolean;
  };
};