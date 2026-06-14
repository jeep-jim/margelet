import type { IngestedPost } from '../../../types/app';
import type { RankedPost, SpaceBlock, SpaceIntent } from './types';
import { compactText } from './text';

export function postToBlock(post: IngestedPost, score: number): SpaceBlock {
  return {
    type: 'post',
    title: post.source.title || post.source.handle || 'Telegram',
    subtitle: post.source.handle ? `@${post.source.handle.replace(/^@/, '')}` : 'Telegram',
    text: compactText(post.text, 360),
    url: post.postUrl,
    sourceHandle: post.source.handle,
    sourceAvatar: post.source.avatar,
    media: post.media.slice(0, 4).map((item) => ({ kind: item.kind, url: item.url, poster: item.poster || null })),
    createdAt: post.createdAt,
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
          postUrl: post.postUrl,
        })),
    )
    .slice(0, 6);

  if (!items.length) return null;
  return { type: 'gallery', title, items };
}

export function planBlocks(ranked: RankedPost[], intent: SpaceIntent, titles: { gallery: string; video: string }) {
  const found = ranked.map((item) => item.post);
  const best = ranked[0];
  const blocks: SpaceBlock[] = [];

  if (!best) return blocks;

  if (intent === 'images' || intent === 'video') {
    const gallery = buildGallery(found, intent === 'video' ? titles.video : titles.gallery);
    if (gallery) blocks.push(gallery);
    if (!gallery) blocks.push(postToBlock(best.post, best.score));
    return blocks;
  }

  blocks.push(postToBlock(best.post, best.score));
  return blocks;
}
