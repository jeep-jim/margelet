import type { IngestedPost } from '../../../types/app';
import type { RankedPost, SpaceBlock, SpaceIntent } from './types';
import { compactText } from './text';

function internalPostUrl(post: IngestedPost) {
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

  if (intent === 'images' || intent === 'video') {
    const gallery = buildGallery(found, intent === 'video' ? titles.video : titles.gallery);
    if (gallery) blocks.push(gallery);
    if (!gallery) blocks.push(postToBlock(best.post, best.score));
    return blocks;
  }

  blocks.push(postToBlock(best.post, best.score));
  return blocks;
}
