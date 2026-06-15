import type { BrainContext } from './types';

export function applyReplyPolicy(ctx: BrainContext): Pick<BrainContext, 'shouldSearch' | 'shouldShowBlocks' | 'wantsChips'> {
  const dataIntent = ['recipe', 'weather', 'images', 'video', 'trend', 'source', 'fact', 'search', 'music'];
  const shouldSearch =
    dataIntent.includes(ctx.intent) &&
    (ctx.isExplicitSearch || ['weather', 'images', 'video', 'music'].includes(ctx.intent) || ctx.confidence >= 2) &&
    !ctx.isPureDialog &&
    !ctx.isProductQuestion;

  return {
    shouldSearch,
    shouldShowBlocks: shouldSearch,
    wantsChips: ctx.intent === 'advice' || ctx.intent === 'tunnel',
  };
}
