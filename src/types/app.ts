export type Locale = "ru" | "en";

export type TabId = "intro" | "feed" | "add" | "creator" | "source" | "admin";

export type MediaType = "video" | "image" | "text";

export type MediaItemType = Exclude<MediaType, "text">;

export type MediaKind =
  | "none"
  | "image"
  | "video"
  | "gif"
  | "audio"
  | "file"
  | "external_media";

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

export type LocalizedText = {
  ru: string;
  en: string;
};

export type PostMedia = {
  id: string;
  type: MediaItemType;
  url: string;
  poster?: string | null;
};

export type Video = {
  id: number;
  mediaType: MediaType;
  mediaKind?: MediaKind;
  media?: PostMedia[];

  title: LocalizedText;
  caption: LocalizedText;

  channel: string;
  avatar: string;
  handle: string;
  channelVerified?: boolean;

  views: string;
  likes: number;
  comments: number;
  duration: string;
  lang: string;
  postUrl: string;
  bg: string;
  tag?: ContentTag;

  previewUrl?: string | null;
  videoUrl?: string | null;
  poster?: string | null;
  audio?: string | null;
  file?: string | null;
  hasMediaInOriginal?: boolean;

  addedByTelegramId?: string | null;
  addedByUsername?: string | null;
};