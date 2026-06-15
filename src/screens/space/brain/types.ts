import type { IngestedPost, Locale } from '../../../types/app';

export type SpaceLanguage = 'ru' | 'us' | string;

export type SpaceIntent =
  | 'greeting'
  | 'thanks'
  | 'capabilities'
  | 'identity'
  | 'liveness'
  | 'smalltalk'
  | 'permissionTalk'
  | 'nameMemory'
  | 'investor'
  | 'product'
  | 'monetization'
  | 'architecture'
  | 'growth'
  | 'risk'
  | 'tunnel'
  | 'music'
  | 'shopping'
  | 'advice'
  | 'recipe'
  | 'weather'
  | 'images'
  | 'video'
  | 'trend'
  | 'source'
  | 'fact'
  | 'search';

export type SpaceMode = 'talk' | 'clarify' | 'answer' | 'show' | 'present';

export type SpaceBlock =
  | {
      type: 'post';
      title: string;
      subtitle: string;
      text: string;
      url: string;
      sourceHandle: string;
      sourceAvatar: string | null;
      media: Array<{ kind: 'image' | 'video' | 'audio' | 'file'; url: string; poster?: string | null }>;
      createdAt: string;
      score: number;
    }
  | {
      type: 'quote';
      title: string;
      subtitle: string;
      text: string;
      url: string;
      sourceAvatar: string | null;
      media?: Array<{ kind: 'image' | 'video' | 'audio' | 'file'; url: string; poster?: string | null }>;
      score: number;
    }
  | {
      type: 'gallery';
      title: string;
      items: Array<{
        url: string;
        poster?: string | null;
        kind: 'image' | 'video' | 'audio' | 'file';
        sourceTitle: string;
        postUrl: string;
      }>;
    }
  | {
      type: 'music';
      title: string;
      subtitle: string;
      tracks: Array<{
        title: string;
        sourceTitle: string;
        postUrl: string;
        audioUrl?: string | null;
      }>;
    }
  | {
      type: 'shop';
      title: string;
      subtitle: string;
      items: Array<{ title: string; price?: string; sourceTitle: string; postUrl: string; image?: string | null }>;
    }
  | {
      type: 'tunnel';
      title: string;
      subtitle: string;
      topic: string;
      people: Array<{ name: string; note: string; avatar?: string | null }>;
      cta: string;
    }
  | {
      type: 'weather';
      city: string;
      title: string;
      summary: string;
      sourceTitle?: string;
      sourceAvatar?: string | null;
    }
  | {
      type: 'stat';
      title: string;
      value: string;
      caption: string;
      tone?: 'blue' | 'green' | 'orange' | 'violet';
    }
  | {
      type: 'timeline';
      title: string;
      items: Array<{ label: string; text: string }>;
    }
  | {
      type: 'investor';
      title: string;
      subtitle: string;
      points: string[];
      accent?: string;
    }
  | {
      type: 'chips';
      title: string;
      items: string[];
    };

export type SpaceAnswer = {
  text: string;
  blocks: SpaceBlock[];
  mode: SpaceMode;
};

export type LastResultMemory = {
  query: string;
  subject: string;
  intent: SpaceIntent;
  postTitle?: string;
  postText?: string;
  sourceTitle?: string;
  sourceHandle?: string;
  createdAt?: string;
  at: number;
};

export type SpaceMood = 'neutral' | 'warm' | 'curious' | 'playful' | 'careful' | 'searching' | 'presenting';
export type SpaceState = 'listening' | 'thinking' | 'discovering' | 'connecting' | 'explaining' | 'presenting' | 'investing';

export type SpaceMemory = {
  turns: number;
  lastIntent: SpaceIntent | null;
  favoriteSources: Record<string, number>;
  topics: Record<string, number>;
  phrases: Record<string, number>;
  languageHints: Record<string, number>;
  lastUserWords: string[];
  lastSubject: string;
  lastResult: LastResultMemory | null;
  lastDialogMood: SpaceMood;
  lastSpaceState: SpaceState;
  userName: string;
  userFacts: Record<string, string>;
  userStyle: {
    wantsShort: number;
    wantsSources: number;
    likesMedia: number;
    likesWarmTone: number;
    likesPlayful: number;
  };
};

export type AttentionSignal = {
  token: string;
  weight: number;
  source: 'query' | 'memory' | 'subject' | 'post' | 'topic' | 'entity' | 'product';
};

export type BrainContext = {
  query: string;
  normalized: string;
  tokens: string[];
  rawTokens: string[];
  locale: Locale;
  lang: SpaceLanguage;
  memory: SpaceMemory;
  posts: IngestedPost[];
  intent: SpaceIntent;
  confidence: number;
  subject: string;
  isExplicitSearch: boolean;
  isQuestionAboutSpace: boolean;
  isProductQuestion: boolean;
  isPureDialog: boolean;
  wantsChips: boolean;
  mood: SpaceMood;
  state: SpaceState;
  attention: AttentionSignal[];
  shouldSearch: boolean;
  shouldShowBlocks: boolean;
  searchQuery: string;
};

export type RankedPost = {
  post: IngestedPost;
  score: number;
  matches: number;
};
