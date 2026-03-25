export type Locale = "ru" | "en";

export type TabId = "intro" | "feed" | "add" | "creator" | "source";

export type MediaType = "video" | "image";

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
};