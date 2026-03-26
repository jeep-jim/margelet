export type Locale = "ru" | "en";

export type TabId = "intro" | "feed" | "add" | "creator" | "source";

export type MediaType = "video" | "image";

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

export type Video = {
  id: number;
  mediaType: MediaType;
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
};