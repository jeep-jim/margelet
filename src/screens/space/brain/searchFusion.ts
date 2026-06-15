import type { IngestedPost } from '../../../types/app';
import type { BrainContext, RankedPost, SpaceIntent } from './types';
import { normalize, tokenize } from './text';

export function getPostSearchText(post: IngestedPost) {
  return normalize([
    post.text,
    post.source.title,
    post.source.handle,
    post.tag,
    ...(post.tags || []),
    post.sourceCountryCode || '',
  ].join(' '));
}

function hasIntentMedia(post: IngestedPost, intent: SpaceIntent) {
  if (intent === 'images') return post.media.some((item) => item.kind === 'image');
  if (intent === 'video') return post.media.some((item) => item.kind === 'video');
  if (intent === 'music') return post.media.some((item) => item.kind === 'audio') || /(music|музык|песн|трек|song|mp3|billie|джин)/.test(getPostSearchText(post));
  return true;
}

function rankPost(post: IngestedPost, ctx: BrainContext) {
  const haystack = getPostSearchText(post);
  let score = 0;
  let matched = 0;
  const tokenWeights = new Map(ctx.attention.map((item) => [item.token, item.weight]));
  const effectiveTokens = Array.from(new Set([...ctx.tokens, ...tokenize(ctx.searchQuery, 18)])).slice(0, 18);

  effectiveTokens.forEach((token) => {
    if (haystack.includes(token)) {
      matched += 1;
      score += Math.max(token.length > 4 ? 5.5 : 2.8, tokenWeights.get(token) || 0);
    }
  });

  if (!matched) return { score: 0, matched: 0 };

  const tagText = normalize([post.tag, ...(post.tags || [])].join(' '));
  if (ctx.intent === 'recipe' && /(recipe|food|cook|еда|кухн|готов|рецепт|пирог|салат|суп)/.test(tagText + ' ' + haystack)) score += 8;
  if (ctx.intent === 'images' && post.media.some((item) => item.kind === 'image')) score += 10;
  if (ctx.intent === 'video' && post.media.some((item) => item.kind === 'video')) score += 10;
  if (ctx.intent === 'music' && post.media.some((item) => item.kind === 'audio')) score += 16;
  if (ctx.intent === 'music' && /(music|музык|песн|трек|song|mp3|billie|джин|джексон|jackson|audio|аудио)/.test(haystack)) score += 8;
  if (ctx.intent === 'shopping' && /(купить|заказ|доставк|магазин|цена|руб|₽|товар|меню|ролл|суши|sale|shop|order|price)/.test(haystack)) score += 12;
  if (ctx.intent === 'source' && (haystack.includes(ctx.normalized) || haystack.includes(ctx.subject.toLowerCase()))) score += 14;
  if (ctx.intent === 'weather' && /(погод|weather|forecast|дожд|снег|ветер)/.test(haystack)) score += 8;
  if (ctx.intent === 'trend') score += Math.min(5, Math.max(0, post.links?.length || 0));

  const sourceBoost = ctx.memory.favoriteSources[post.source.handle] || 0;
  score += Math.min(2, sourceBoost * 0.25);

  const created = Date.parse(post.createdAt || '');
  if (Number.isFinite(created)) {
    const ageHours = Math.max(0, (Date.now() - created) / 36e5);
    score += Math.max(0, 3 - ageHours / 12);
  }

  if (post.source.verified) score += 0.8;
  if (post.media.length) score += 0.7;
  if (!hasIntentMedia(post, ctx.intent)) score -= 18;
  if (effectiveTokens.length >= 3 && matched < 2 && ctx.intent !== 'images' && ctx.intent !== 'video') score -= 10;
  if (!ctx.shouldSearch) score -= 30;

  return { score: Math.max(0, score), matched };
}

export function searchPosts(ctx: BrainContext): RankedPost[] {
  if (!ctx.shouldSearch) return [];

  return ctx.posts
    .map((post) => {
      const ranked = rankPost(post, ctx);
      return { post, score: ranked.score, matches: ranked.matched };
    })
    .filter(({ score, matches }) => {
      const mediaIntent = ctx.intent === 'images' || ctx.intent === 'video' || ctx.intent === 'music';
      const flexibleIntent = mediaIntent || ctx.intent === 'source' || ctx.intent === 'shopping';
      const needMatches = ctx.tokens.length >= 4 && !flexibleIntent ? 2 : 1;
      const minScore = mediaIntent ? 12 : ctx.intent === 'source' ? 10 : ctx.intent === 'shopping' ? 11 : 17;
      return score >= minScore && matches >= needMatches;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, ctx.intent === 'images' || ctx.intent === 'video' || ctx.intent === 'music' || ctx.intent === 'shopping' ? 7 : ctx.intent === 'source' ? 4 : 2);
}
