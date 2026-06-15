import type { BrainContext, SpaceAnswer } from './types';
import { rememberTurn, extractUserName } from './memoryEngine';
import { getUi } from './locales';
import { generateTalk } from './generativeCore';

function finishTalk(ctx: BrainContext, text: string): SpaceAnswer {
  rememberTurn({ memory: ctx.memory, query: ctx.query, intent: ctx.intent, found: [], locale: ctx.locale, subject: ctx.subject, tokens: ctx.rawTokens });
  return { text, blocks: [], mode: 'talk' };
}

function withName(ctx: BrainContext, text: string) {
  const name = extractUserName(ctx.query);
  if (!name) return text;
  return ctx.lang === 'ru'
    ? `Запомнил, ${name}. Буду обращаться так.`
    : `Got it, ${name}. I’ll remember that on this device.`;
}

export function tryDialogAnswer(ctx: BrainContext): SpaceAnswer | null {
  const ui = getUi(ctx.lang);

  if (ctx.intent === 'nameMemory') return finishTalk(ctx, withName(ctx, ui.nameSaved));
  if (ctx.intent === 'greeting') return finishTalk(ctx, generateTalk(ctx, ui.hello));
  if (ctx.intent === 'thanks') return finishTalk(ctx, generateTalk(ctx, ui.thanks));
  if (ctx.intent === 'capabilities') return finishTalk(ctx, generateTalk(ctx, [ui.capabilities]));
  if (ctx.intent === 'identity') return finishTalk(ctx, generateTalk(ctx, [ui.identity]));
  if (ctx.intent === 'liveness') return finishTalk(ctx, generateTalk(ctx, [ui.liveness]));
  if (ctx.intent === 'permissionTalk') return finishTalk(ctx, generateTalk(ctx, [ui.permissionTalk]));
  if (ctx.intent === 'smalltalk') return finishTalk(ctx, generateTalk(ctx, ui.smalltalk));

  if (ctx.isQuestionAboutSpace && !ctx.isExplicitSearch) {
    if (/(спрашивать|спросить|можно)/.test(ctx.normalized)) return finishTalk(ctx, generateTalk(ctx, [ui.capabilities]));
    return finishTalk(ctx, generateTalk(ctx, ui.smalltalk));
  }

  return null;
}
