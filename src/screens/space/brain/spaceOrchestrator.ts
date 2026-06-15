import type { IngestedPost, Locale } from '../../../types/app';
import type { SpaceAnswer } from './types';
import { runSpaceRuntime } from './spaceRuntime';

export function runSpaceCore(params: { query: string; posts: IngestedPost[]; locale: Locale }): Promise<SpaceAnswer> {
  return runSpaceRuntime(params);
}
