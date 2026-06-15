import type { IngestedPost, Locale } from '../../types/app';
import type { SpaceAnswer, SpaceBlock } from './brain/types';
import { runSpaceCore } from './brain/spaceOrchestrator';

export type { SpaceAnswer, SpaceBlock };

export function buildSpaceAnswer(params: { query: string; posts: IngestedPost[]; locale: Locale }): Promise<SpaceAnswer> {
  return runSpaceCore(params);
}
