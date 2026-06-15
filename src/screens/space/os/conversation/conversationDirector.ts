import type { SpaceBlock } from '../../brain/types';
import type { Locale } from '../../../../types/app';
import type { SpaceOSDecision, SpaceOSMemory } from '../types';
import { tryLocalLlmReply } from '../localLlmOS';
import type { ConversationResult } from './types';

function isExplicitTool(decision: SpaceOSDecision) {
  return decision.tool !== 'chat' && decision.tool !== 'web' && decision.tool !== 'telegram';
}

function chipsBlock(): SpaceBlock {
  return {
    type: 'chips',
    title: 'Попробуй так',
    items: ['погода Москва', 'включи Billie Jean', 'кто такой Моцарт', 'купить сахар', 'покажи картинки котов'],
  };
}

export async function runConversationDirector(input: {
  query: string;
  locale: Locale;
  decision: SpaceOSDecision;
  memory: SpaceOSMemory;
}): Promise<ConversationResult | null> {
  if (isExplicitTool(input.decision)) return null;

  const q = input.query.toLowerCase().replace(/ё/g, 'е');
  if (/что\s+ты\s+умеешь|возможности|help|что\s+можешь/.test(q)) {
    return {
      consumed: true,
      text: 'Я могу поговорить, поискать в открытом интернете, показать погоду, музыку, картинки, видео, графики, товары и свежие сигналы margeleT.',
      blocks: [chipsBlock()],
      mode: 'talk',
    };
  }

  const llm = await tryLocalLlmReply({
    query: input.query,
    locale: input.locale,
    decision: input.decision,
    memory: input.memory,
  });

  if (llm) return { consumed: true, text: llm, blocks: [], mode: 'talk' };
  return null;
}
