export type SpaceSearchSource = {
  title: string;
  url: string;
  displayUrl?: string;
  snippet?: string;
  favicon?: string;
  score?: number;
  source?: 'duckduckgo' | 'wikipedia' | 'hackernews' | 'reddit' | 'archive' | 'direct' | 'telegram' | 'unknown';
};

export type SpaceExtractedPage = SpaceSearchSource & {
  text: string;
  lang?: string;
  image?: string;
  publishedAt?: string;
};

export type SpaceSpiderIntent =
  | 'answer'
  | 'news'
  | 'biography'
  | 'image'
  | 'video'
  | 'music'
  | 'shopping'
  | 'weather'
  | 'finance'
  | 'unknown';

export type SpaceSpiderRequest = {
  query: string;
  locale?: string;
  intent?: SpaceSpiderIntent;
  limit?: number;
};

export type SpaceSpiderAnswer = {
  query: string;
  title: string;
  answer: string;
  bullets: string[];
  sources: SpaceSearchSource[];
  confidence: number;
  createdAt: string;
  widgetHint?: 'sources' | 'bio' | 'images' | 'music' | 'weather' | 'chart' | 'products';
};
