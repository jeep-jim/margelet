import type { BrainContext, SpaceAnswer } from './types';
import { rememberTurn } from './memoryEngine';
import { getUi } from './locales';

function isBroadSearch(ctx: BrainContext) {
  if (ctx.isPureDialog) return false;
  if (ctx.intent === 'weather' && ctx.tokens.length <= 1) return true;
  if (ctx.intent === 'trend' && ctx.tokens.length <= 1) return true;
  if (ctx.intent === 'search' && ctx.tokens.length <= 1 && ctx.confidence < 2) return true;
  return false;
}

export function tryClarify(ctx: BrainContext): SpaceAnswer | null {
  if (!isBroadSearch(ctx)) return null;
  const ui = getUi(ctx.lang);
  rememberTurn({ memory: ctx.memory, query: ctx.query, intent: ctx.intent, found: [], locale: ctx.locale, subject: ctx.subject, tokens: ctx.rawTokens });
  if (ctx.intent === 'weather') return { text: ui.weatherClarify, blocks: [], mode: 'clarify' };
  if (ctx.intent === 'trend') return { text: ui.trendClarify, blocks: [], mode: 'clarify' };
  return { text: ui.clarifySearch, blocks: [], mode: 'clarify' };
}
