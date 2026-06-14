import type { IngestedPost, Locale } from '../../types/app';
import type { SpaceAnswer, SpaceBlock } from './brain/types';
import { buildContext } from './brain/contextEngine';
import { tryDialogAnswer } from './brain/dialogCortex';
import { tryClarify } from './brain/clarifier';
import { searchPosts } from './brain/searchFusion';
import { synthesizeFound, synthesizeNoResult } from './brain/answerSynthesizer';

export type { SpaceAnswer, SpaceBlock };

export function buildSpaceAnswer(params: { query: string; posts: IngestedPost[]; locale: Locale }): SpaceAnswer {
  const ctx = buildContext(params.query, params.posts, params.locale);

  // 1. Dialog Cortex: разговор о себе, приветствия, поболтать, проверка возможностей.
  const dialog = tryDialogAnswer(ctx);
  if (dialog) return dialog;

  // 2. Clarifier: широкий поисковый запрос сначала уточняем, без облачков-предложек.
  const clarify = tryClarify(ctx);
  if (clarify) return clarify;

  // 3. Search Fusion: только если это реально поисковый/аналитический запрос.
  const ranked = searchPosts(ctx);
  if (!ranked.length) return synthesizeNoResult(ctx);

  // 4. Answer Synthesizer + Block Planner: короткая фраза + аккуратный блок.
  return synthesizeFound(ctx, ranked);
}
