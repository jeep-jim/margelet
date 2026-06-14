import type { BrainContext, SpaceAnswer } from './types';
import { rememberTurn } from './memoryEngine';
import { getUi } from './locales';
import { pick } from './text';

function finishTalk(ctx: BrainContext, text: string): SpaceAnswer {
  rememberTurn({ memory: ctx.memory, query: ctx.query, intent: ctx.intent, found: [], locale: ctx.locale, subject: ctx.subject, tokens: ctx.rawTokens });
  return { text, blocks: [], mode: 'talk' };
}

export function tryDialogAnswer(ctx: BrainContext): SpaceAnswer | null {
  const ui = getUi(ctx.lang);
  const seed = ctx.query.length + ctx.memory.turns + ctx.rawTokens.join('').length;

  if (ctx.intent === 'greeting') return finishTalk(ctx, pick(ui.hello, seed));
  if (ctx.intent === 'thanks') return finishTalk(ctx, pick(ui.thanks, seed));
  if (ctx.intent === 'capabilities') return finishTalk(ctx, ui.capabilities);
  if (ctx.intent === 'identity') return finishTalk(ctx, ui.identity);
  if (ctx.intent === 'liveness') return finishTalk(ctx, ui.liveness);
  if (ctx.intent === 'permissionTalk') return finishTalk(ctx, ui.permissionTalk);
  if (ctx.intent === 'smalltalk') return finishTalk(ctx, pick(ui.smalltalk, seed));
  if (ctx.intent === 'abilityCheck') {
    const text = /(видео|video|ролик|clip)/.test(ctx.normalized) ? ui.abilityVideo : ui.abilitySearch;
    return finishTalk(ctx, text);
  }

  // Safety net: any question about Space itself stays in dialog mode unless there is a direct search command.
  if (ctx.isQuestionAboutSpace && !ctx.isExplicitSearch) {
    if (/(спрашивать|спросить|можно)/.test(ctx.normalized)) return finishTalk(ctx, ui.capabilities);
    return finishTalk(ctx, pick(ui.smalltalk, seed));
  }

  return null;
}
