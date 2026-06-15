import type { IngestedPost, Locale } from '../../../types/app';
import type { SpaceAnswer } from './types';
import { buildContext } from './contextEngine';
import { tryDialogAnswer } from './dialogCortex';
import { tryClarify } from './clarifier';
import { reasonNextStep } from './reasoningEngine';
import { searchPosts } from './searchFusion';
import { synthesizeFound, synthesizeNoResult, synthesizeSoftTalk } from './answerSynthesizer';

export function runSpaceCore(params: { query: string; posts: IngestedPost[]; locale: Locale }): SpaceAnswer {
  const ctx = buildContext(params.query, params.posts, params.locale);

  const dialog = tryDialogAnswer(ctx);
  if (dialog) return dialog;

  const decision = reasonNextStep(ctx);
  if (decision.action === 'talk') return synthesizeSoftTalk(ctx);
  if (decision.action === 'clarify') return tryClarify(ctx) || synthesizeSoftTalk(ctx);

  const clarify = tryClarify(ctx);
  if (clarify) return clarify;

  const ranked = searchPosts(ctx);
  if (!ranked.length) return synthesizeNoResult(ctx);

  return synthesizeFound(ctx, ranked);
}
