import type { SpaceCrawlResponse, SpaceOSDecision } from './types';
import type { SpaceBlock } from '../brain/types';
import { composeGalleryWidget, composeInfoWidget, composeMusicWidget } from './widgetComposer';

export type MediaResult = { text: string; blocks: SpaceBlock[] };

function ru(decision: SpaceOSDecision) {
  return decision.lang === 'ru';
}

export function composeMediaResult(data: SpaceCrawlResponse | null, decision: SpaceOSDecision): MediaResult {
  if (!data) return { text: '', blocks: [] };

  if (decision.tool === 'music') {
    const block = composeMusicWidget(data, decision);
    if (!block) return { text: '', blocks: [] };
    return {
      text: ru(decision)
        ? 'Нашёл музыку. Если у источника есть аудио-превью — включу прямо здесь 🎵'
        : 'I found music. If the source exposes an audio preview, I can play it here 🎵',
      blocks: [block],
    };
  }

  if (decision.tool === 'video') {
    const gallery = composeGalleryWidget(data, decision, 'video');
    if (gallery) {
      return {
        text: ru(decision) ? 'Собрал видео и превью из открытого веба 🎬' : 'I collected videos and previews from the open web 🎬',
        blocks: [gallery],
      };
    }
    const info = composeInfoWidget(data, decision);
    return info ? { text: ru(decision) ? 'Нашёл видео-источники 👇' : 'I found video sources 👇', blocks: [info] } : { text: '', blocks: [] };
  }

  if (decision.tool === 'images') {
    const block = composeGalleryWidget(data, decision, 'image');
    return block ? { text: ru(decision) ? 'Собрал картинки из открытого веба 🖼️' : 'I collected images from the open web 🖼️', blocks: [block] } : { text: '', blocks: [] };
  }

  return { text: '', blocks: [] };
}
