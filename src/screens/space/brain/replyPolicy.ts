import type { BrainContext } from './types';

export function applyReplyPolicy(ctx: BrainContext) {
  const explicit = ctx.isExplicitSearch;
  const media = ctx.intent === 'images' || ctx.intent === 'video';
  const dataIntent = ['recipe', 'weather', 'trend', 'source'].includes(ctx.intent);
  const factWithSubject = ctx.intent === 'fact' && ctx.tokens.length >= 2;
  const shouldSearch = !ctx.isPureDialog && (explicit || media || dataIntent || factWithSubject) && ctx.rawTokens.length > 0;
  const shouldShowBlocks = shouldSearch && (explicit || media || ctx.intent === 'recipe' || ctx.intent === 'trend' || ctx.intent === 'source' || ctx.intent === 'weather');
  return { shouldSearch, shouldShowBlocks };
}
