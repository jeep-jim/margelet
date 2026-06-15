import type { IngestedPost, Locale } from '../../../types/app';
import type { SpaceAnswer, SpaceBlock } from '../brain/types';

export type SpaceOSTool =
  | 'chat'
  | 'weather'
  | 'music'
  | 'images'
  | 'video'
  | 'finance'
  | 'shopping'
  | 'biography'
  | 'profile'
  | 'tunnel'
  | 'product'
  | 'web'
  | 'telegram';

export type SpaceOSDecision = {
  tool: SpaceOSTool;
  confidence: number;
  query: string;
  subject: string;
  locale: Locale;
  lang: 'ru' | 'en';
  useInternet: boolean;
  useTelegram: boolean;
  useProductDeck: boolean;
  reason: string;
};

export type SpaceOSMemory = {
  turns: number;
  userName: string;
  lastTopic: string;
  lastTool: SpaceOSTool | null;
  userTone: 'neutral' | 'warm' | 'playful' | 'direct';
  createdAt: number;
  updatedAt: number;
};

export type SpaceOSInput = {
  query: string;
  posts: IngestedPost[];
  locale: Locale;
};

export type SpaceOSOutput = SpaceAnswer;
export type SpaceOSBlock = SpaceBlock;

export type SpaceCrawlResponse = {
  ok?: boolean;
  tool?: string;
  title?: string;
  summary?: string;
  city?: string;
  temp?: number;
  wind?: number;
  code?: number;
  source?: string;
  image?: string | null;
  url?: string;
  facts?: string[];
  current?: { temperature?: number; wind?: number; label?: string };
  daily?: Array<{ date: string; min: number; max: number; code?: number; label?: string }>;
  items?: Array<{
    title: string;
    subtitle?: string;
    url?: string;
    image?: string | null;
    audioUrl?: string | null;
    sourceTitle?: string;
    duration?: string;
    price?: string;
    kind?: 'image' | 'video' | 'audio' | 'file';
    poster?: string | null;
  }>;
  points?: Array<{ label: string; value: number }>;
};
