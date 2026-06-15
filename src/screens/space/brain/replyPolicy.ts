import type { BrainContext } from './types';

export function applyReplyPolicy(ctx: BrainContext): Pick<BrainContext, 'shouldSearch' | 'shouldShowBlocks' | 'wantsChips'> {
  const productIntent = ['investor','product','monetization','architecture','growth','risk'].includes(ctx.intent);
  if (productIntent) return { shouldSearch: false, shouldShowBlocks: true, wantsChips: false };

  if (ctx.isPureDialog || ctx.isQuestionAboutSpace) {
    return { shouldSearch: false, shouldShowBlocks: false, wantsChips: false };
  }

  const mediaIntent = ctx.intent === 'images' || ctx.intent === 'video';
  const clearDataIntent = ['recipe','weather','trend','source','fact','search'].includes(ctx.intent) || mediaIntent;
  const hasEnoughContext = ctx.tokens.length >= 2 || ctx.confidence >= 2 || mediaIntent;
  const shouldSearch = Boolean(ctx.isExplicitSearch || (clearDataIntent && hasEnoughContext && !ctx.normalized.endsWith('?')));

  if (!shouldSearch) return { shouldSearch: false, shouldShowBlocks: false, wantsChips: false };

  const shouldShowBlocks = mediaIntent || ctx.intent === 'weather' || ctx.intent === 'recipe' || ctx.intent === 'trend' || ctx.isExplicitSearch;
  return { shouldSearch, shouldShowBlocks, wantsChips: false };
}
