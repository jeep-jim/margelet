import type { IngestedPost } from '../../../types/app';
import type { RankedPost, SpaceBlock, SpaceIntent } from './types';
import { compactText } from './text';

export function internalPostUrl(post: IngestedPost) {
  const handle = String(post.source.handle || 'telegram').replace(/^@+/, '').trim() || 'telegram';
  const postId = String(post.postUrl || post.id || '').split('/').filter(Boolean).pop()?.replace(/\?single$/, '') || String(post.id || '');
  return `/${handle}/${postId}`;
}

export function postToBlock(post: IngestedPost, score: number): SpaceBlock {
  return {
    type: 'quote',
    title: post.source.title || post.source.handle || 'Telegram',
    subtitle: post.source.handle ? `@${post.source.handle.replace(/^@/, '')}` : 'margeleT source',
    text: compactText(post.text, 280),
    url: internalPostUrl(post),
    sourceAvatar: post.source.avatar,
    media: post.media.slice(0, 2).map((item) => ({ kind: item.kind, url: item.url, poster: item.poster || null })),
    score,
  };
}

export function buildGallery(posts: IngestedPost[], title: string): SpaceBlock | null {
  const items = posts
    .flatMap((post) =>
      post.media
        .filter((item) => item.kind === 'image' || item.kind === 'video')
        .slice(0, 3)
        .map((item) => ({
          url: item.url,
          poster: item.poster || null,
          kind: item.kind,
          sourceTitle: post.source.title || post.source.handle || 'Telegram',
          postUrl: internalPostUrl(post),
        })),
    )
    .slice(0, 6);

  if (!items.length) return null;
  return { type: 'gallery', title, items };
}

function buildShopBlock(posts: IngestedPost[], subject: string): SpaceBlock | null {
  const items = posts.slice(0, 5).map((post) => {
    const image = post.media.find((item) => item.kind === 'image')?.url || post.media.find((item) => item.kind === 'video')?.poster || null;
    const price = post.text.match(/(?:\d[\d\s.,]{1,10})\s?(?:₽|руб|р\.|usd|\$)/i)?.[0];
    return {
      title: compactText(post.text || subject || post.source.title || 'товар', 86),
      price: price || undefined,
      sourceTitle: post.source.title || post.source.handle || 'Telegram',
      postUrl: internalPostUrl(post),
      image,
    };
  });
  if (!items.length) return null;
  return {
    type: 'shop',
    title: subject ? `Подборка: ${subject}` : 'Товарные карточки из margeleT',
    subtitle: 'Показываю найденное в Telegram-потоке. Покупку лучше проверять у источника.',
    items,
  };
}

function buildMusicBlock(posts: IngestedPost[], subject: string): SpaceBlock | null {
  const tracks = posts
    .flatMap((post) => {
      const audio = post.media.find((item) => item.kind === 'audio');
      return [{
        title: compactText(post.text || subject || post.source.title || 'track', 84),
        sourceTitle: post.source.title || post.source.handle || 'Telegram',
        postUrl: internalPostUrl(post),
        audioUrl: audio?.url || null,
      }];
    })
    .slice(0, 5);
  if (!tracks.length) return null;
  return {
    type: 'music',
    title: subject ? `Музыка: ${subject}` : 'Музыка из margeleT',
    subtitle: 'Если у поста есть аудио — можно включить прямо здесь. Иначе открою пост с треком.',
    tracks,
  };
}

function buildWeatherBlock(post: IngestedPost | undefined, city: string): SpaceBlock | null {
  if (!post) return null;
  return {
    type: 'weather',
    city: city || 'город',
    title: city ? `Погодный сигнал: ${city}` : 'Погодный сигнал из Telegram',
    summary: compactText(post.text, 210),
    sourceTitle: post.source.title || post.source.handle || 'margeleT',
    sourceAvatar: post.source.avatar,
  };
}

export function buildTunnelBlock(topic: string): SpaceBlock {
  const cleanTopic = topic || 'общая тема';
  return {
    type: 'tunnel',
    title: '🧲 Туннель интереса',
    subtitle: 'Пока это локальный черновик режима. Переписки не храним как соцсеть.',
    topic: cleanTopic,
    people: [
      { name: 'Катя', note: 'ищет людей по похожей теме' },
      { name: 'Саша', note: 'может быть рядом по интересу' },
    ],
    cta: 'Открыть туннель на 24 часа',
  };
}

export function planBlocks(ranked: RankedPost[], intent: SpaceIntent, titles: { gallery: string; video: string }, shouldShowBlocks = true, subject = '') {
  if (!shouldShowBlocks) return [];
  const found = ranked.map((item) => item.post);
  const best = ranked[0];
  const blocks: SpaceBlock[] = [];

  if (!best) return blocks;

  if (intent === 'weather') {
    const weather = buildWeatherBlock(best.post, subject);
    if (weather) return [weather];
  }

  if (intent === 'music') {
    const music = buildMusicBlock(found, subject);
    if (music) return [music];
  }

  if (intent === 'shopping') {
    const shop = buildShopBlock(found, subject);
    if (shop) return [shop];
  }

  if (intent === 'images' || intent === 'video' || intent === 'film') {
    const gallery = buildGallery(found, (intent === 'video' || intent === 'film') ? titles.video : titles.gallery);
    if (gallery) blocks.push(gallery);
    if (!gallery) blocks.push(postToBlock(best.post, best.score));
    return blocks;
  }

  blocks.push(postToBlock(best.post, best.score));
  return blocks;
}
