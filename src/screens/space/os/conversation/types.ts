import type { Locale } from '../../../../types/app';
import type { SpaceAnswer } from '../../brain/types';
import type { SpaceOSDecision, SpaceOSMemory } from '../types';

export type ConversationMood =
  | 'hello'
  | 'calm'
  | 'curious'
  | 'tired'
  | 'sad'
  | 'playful'
  | 'serious'
  | 'idea'
  | 'debate'
  | 'advice'
  | 'unknown';

export type ConversationNeed =
  | 'chat'
  | 'support'
  | 'advice'
  | 'explain'
  | 'debate'
  | 'idea'
  | 'identity'
  | 'capabilities';

export type ConversationContext = {
  query: string;
  normalized: string;
  locale: Locale;
  lang: 'ru' | 'en';
  mood: ConversationMood;
  need: ConversationNeed;
  decision: SpaceOSDecision;
  memory: SpaceOSMemory;
  userName: string;
  previousTopic: string;
  shouldStayInConversation: boolean;
};

export type ConversationResult = SpaceAnswer & {
  consumed: boolean;
};
