import type { BrainContext } from './types';

export function maybeHumor(ctx: BrainContext) {
  if (ctx.mood !== 'playful') return '';
  if (ctx.lang === 'ru') return ctx.memory.userStyle.likesPlayful > 1 ? ' Без занудства.' : '';
  return ctx.memory.userStyle.likesPlayful > 1 ? ' No boring mode.' : '';
}
