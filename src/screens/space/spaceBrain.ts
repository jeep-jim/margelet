import type { IngestedPost, Locale } from '../../types/app';
import type { SpaceAnswer, SpaceBlock } from './brain/types';
import { buildContext } from './brain/contextEngine';
import { tryDialogAnswer } from './brain/dialogCortex';
import { tryClarify } from './brain/clarifier';
import { searchPosts } from './brain/searchFusion';
import { synthesizeFound, synthesizeNoResult, synthesizeSoftTalk } from './brain/answerSynthesizer';

export type { SpaceAnswer, SpaceBlock };

export function buildSpaceAnswer(params: { query: string; posts: IngestedPost[]; locale: Locale }): SpaceAnswer {
  const ctx = buildContext(params.query, params.posts, params.locale);

  // 1. Dialog Cortex: разговор, имя, личность, возможности — строго до поиска.
  const dialog = tryDialogAnswer(ctx);
  if (dialog) return dialog;

  // 2. If there is no search intent, keep the chat alive instead of forcing a fake search.
  if (!ctx.shouldSearch) return synthesizeSoftTalk(ctx);

  // 3. Clarifier: широкий запрос уточняем без кнопок и без мусорных постов.
  const clarify = tryClarify(ctx);
  if (clarify) return clarify;

  // 4. Search Fusion: attention tokens + memory + margeleT posts.
  const ranked = searchPosts(ctx);
  if (!ranked.length) return synthesizeNoResult(ctx);

  // 5. Answer Synthesizer + Block Planner: короткая фраза + блок только при явном запросе.
  return synthesizeFound(ctx, ranked);
}
