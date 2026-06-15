import type { BrainContext } from './types';

export function applyReplyPolicy(ctx: BrainContext): Pick<BrainContext, 'shouldSearch' | 'shouldShowBlocks' | 'wantsChips'> {
  const dataIntent = ['recipe', 'weather', 'images', 'video', 'film', 'trend', 'source', 'fact', 'search', 'music', 'shopping'];
  const shouldSearch =
    dataIntent.includes(ctx.intent) &&
    (ctx.isExplicitSearch || ['weather', 'images', 'video', 'film', 'music', 'shopping'].includes(ctx.intent) || ctx.confidence >= 2) &&
    !ctx.isPureDialog &&
    !ctx.isProductQuestion;

  return {
    shouldSearch,
    shouldShowBlocks: shouldSearch,
    wantsChips: ctx.intent === 'advice' || ctx.intent === 'tunnel',
  };
}
