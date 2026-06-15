import type { BrainContext } from './types';

export type ReasoningDecision = {
  action: 'talk' | 'clarify' | 'search' | 'answerFromMemory' | 'present' | 'tunnel';
  reason: string;
};

export function reasonNextStep(ctx: BrainContext): ReasoningDecision {
  if (['investor','product','monetization','architecture','growth','risk'].includes(ctx.intent)) return { action: 'present', reason: 'product-knowledge' };
  if (ctx.intent === 'tunnel') return { action: 'tunnel', reason: 'interest-tunnel' };
  if (ctx.intent === 'advice') return { action: 'clarify', reason: 'advice-needs-context' };
  if (ctx.intent === 'music' || ctx.intent === 'shopping') return { action: 'search', reason: 'media-or-shopping-request' };
  if (ctx.isPureDialog) return { action: 'talk', reason: 'dialog-first' };
  if (!ctx.shouldSearch) return { action: 'talk', reason: 'no-explicit-data-request' };
  if ((ctx.intent === 'weather' || ctx.intent === 'trend') && ctx.tokens.length <= 1) return { action: 'clarify', reason: 'broad-data-request' };
  if (ctx.rawTokens.length <= 1 && ctx.confidence < 2) return { action: 'clarify', reason: 'low-context' };
  if (ctx.intent === 'fact' && /\b(он|она|они|его|ее|её|he|she|they|it|him|her)\b/.test(ctx.normalized) && ctx.memory.lastResult) {
    return { action: 'answerFromMemory', reason: 'pronoun-follow-up' };
  }
  return { action: 'search', reason: 'explicit-request' };
}
