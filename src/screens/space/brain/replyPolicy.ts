import type { BrainContext } from './types';

export function applyReplyPolicy(ctx: BrainContext) {
  const explicit = ctx.isExplicitSearch;
  const media = ctx.intent === 'images' || ctx.intent === 'video';
  const dataIntent = ['recipe', 'weather', 'trend', 'source', 'fact'].includes(ctx.intent);
  const shouldSearch = !ctx.isPureDialog && (explicit || media || dataIntent) && ctx.rawTokens.length > 0;
  const shouldShowBlocks = shouldSearch && (explicit || media || ctx.intent === 'recipe' || ctx.intent === 'trend' || ctx.intent === 'source');
  return { shouldSearch, shouldShowBlocks };
}
