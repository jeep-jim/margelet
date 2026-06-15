import type { SpaceMemory } from './types';

export function adjustLearning(memory: SpaceMemory, signal: 'talk' | 'search' | 'media' | 'short' | 'careful') {
  if (signal === 'talk') memory.userStyle.likesWarmTone += 0.2;
  if (signal === 'search') memory.userStyle.wantsSources += 0.12;
  if (signal === 'media') memory.userStyle.likesMedia += 0.2;
  if (signal === 'short') memory.userStyle.wantsShort += 0.16;
  if (signal === 'careful') memory.lastDialogMood = 'careful';
}
