export type Locale = "ru" | "en";

export type LocalizedText = {
  ru: string;
  en: string;
};

export type TabId = "intro" | "feed" | "add" | "creator";

export type Video = {
  id: number;
  title: LocalizedText;
  caption: LocalizedText;
  channel: string;
  avatar: string;
  handle: string;
  views: string;
  likes: number;
  comments: number;
  duration: string;
  lang: string;
  postUrl: string;
  bg: string;
};