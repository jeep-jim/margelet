import type { IngestedPost, Locale } from '../../../types/app';

export type SpaceLanguage = 'ru' | 'en';

export type SpaceAnswerMode = 'talk' | 'show' | 'present';

export type SpaceMediaKind = 'image' | 'video' | 'audio' | 'file';

export type SpaceBlock =
  | {
      type: 'weather';
      city?: string;
      title: string;
      summary: string;
      sourceTitle?: string;
      sourceAvatar?: string | null;
      daily?: Array<{ date: string; min: number; max: number; code?: number; label?: string }>;
    }
  | {
      type: 'gallery';
      title: string;
      items: Array<{ url: string; poster?: string | null; kind: SpaceMediaKind; sourceTitle?: string; postUrl: string }>;
    }
  | {
      type: 'webInfo';
      title: string;
      summary: string;
      sourceTitle?: string;
      url?: string;
      image?: string | null;
      facts?: string[];
    }
  | {
      type: 'chart';
      title: string;
      subtitle?: string;
      sourceTitle?: string;
      points: Array<{ label: string; value: number }>;
    }
  | {
      type: 'music';
      title: string;
      subtitle?: string;
      tracks: Array<{ title: string; sourceTitle: string; postUrl: string; audioUrl?: string | null }>;
    }
  | {
      type: 'tunnel';
      title: string;
      subtitle: string;
      topic: string;
      people: Array<{ name: string; note: string }>;
      cta: string;
    }
  | {
      type: 'chips';
      title: string;
      items: string[];
    }
  | {
      type: 'shop';
      title: string;
      subtitle?: string;
      items: Array<{ title: string; price?: string; sourceTitle?: string; postUrl: string; image?: string | null }>;
    }
  | {
      type: 'quote';
      title: string;
      subtitle?: string;
      text: string;
      url: string;
      sourceAvatar?: string | null;
      media?: Array<{ kind: SpaceMediaKind; url: string; poster?: string | null }>;
      score?: number;
    }
  | {
      type: 'investor';
      title: string;
      subtitle: string;
      points: string[];
      accent: string;
    }
  | {
      type: 'timeline';
      title: string;
      items: Array<{ label: string; text: string }>;
    }
  | {
      type: 'stat';
      title: string;
      value: string;
      caption: string;
      tone?: 'blue' | 'green' | 'orange' | 'violet';
    };

export type SpaceAnswer = {
  text: string;
  blocks: SpaceBlock[];
  mode?: SpaceAnswerMode;
};

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
  lang: SpaceLanguage;
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
  recentTurns?: Array<{ role: 'user' | 'space'; text: string; at: number }>;
  lastTrack?: string;
  lastArtist?: string;
  lastCity?: string;
  interests?: string[];
  nickName?: string;
  codeWords?: string[];
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
    kind?: SpaceMediaKind;
    poster?: string | null;
  }>;
  points?: Array<{ label: string; value: number }>;
};
