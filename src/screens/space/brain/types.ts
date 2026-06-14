import type { IngestedPost, Locale } from '../../../types/app';

export type SpaceIntent =
  | 'greeting'
  | 'thanks'
  | 'capabilities'
  | 'identity'
  | 'liveness'
  | 'smalltalk'
  | 'permissionTalk'
  | 'abilityCheck'
  | 'recipe'
  | 'weather'
  | 'images'
  | 'video'
  | 'trend'
  | 'source'
  | 'fact'
  | 'search';

export type SpaceMode = 'talk' | 'clarify' | 'answer' | 'show';

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

export type SpaceMemory = {
  turns: number;
  lastIntent: SpaceIntent | null;
  favoriteSources: Record<string, number>;
  topics: Record<string, number>;
  languageHints: Record<string, number>;
  lastUserWords: string[];
  lastSubject: string;
  lastResult: LastResultMemory | null;
  lastDialogMood: 'neutral' | 'warm' | 'curious' | 'searching';
  userStyle: {
    wantsShort: number;
    wantsSources: number;
    likesMedia: number;
    likesWarmTone: number;
  };
};

export type BrainContext = {
  query: string;
  normalized: string;
  tokens: string[];
  rawTokens: string[];
  locale: Locale;
  lang: string;
  memory: SpaceMemory;
  posts: IngestedPost[];
  intent: SpaceIntent;
  confidence: number;
  subject: string;
  isExplicitSearch: boolean;
  isQuestionAboutSpace: boolean;
  isPureDialog: boolean;
  wantsChips: boolean;
};

export type RankedPost = {
  post: IngestedPost;
  score: number;
  matches: number;
};
