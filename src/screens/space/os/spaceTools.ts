import type { IngestedPost } from '../../../types/app';
import type { SpaceBlock } from './types';
import type { SpaceCrawlResponse, SpaceOSDecision } from './types';
import { runWebSearchTool } from './tools/webSearchTool';
import { runBrowserCrawl } from './browserTools';
import { composeMediaResult } from './mediaEngine';
import {
  composeChartWidget,
  composeInfoWidget,
  composeShopWidget,
  composeWeatherWidget,
} from './widgetComposer';

async function crawl(tool: string, q: string): Promise<SpaceCrawlResponse | null> {
  try {
    const response = await fetch(`/api/space-crawl?tool=${encodeURIComponent(tool)}&q=${encodeURIComponent(q)}`, { headers: { accept: 'application/json' } });
    if (response.ok) {
      const data = await response.json() as SpaceCrawlResponse;
      if (data?.ok || data?.items?.length || data?.points?.length) return data;
    }
  } catch {
    // Vite localhost does not serve Vercel API routes. Fall back to browser-safe public APIs.
  }
  return runBrowserCrawl(tool, q);
}

function internalPostUrl(post: IngestedPost) {
  const handle = String(post.source.handle || 'telegram').replace(/^@+/, '') || 'telegram';
  const postId = String(post.postUrl || post.id).split('/').filter(Boolean).pop()?.replace(/\?single$/, '') || String(post.id);
  return `/${handle}/${postId}`;
}

function textOf(post: IngestedPost) {
  return `${post.source.title} ${post.source.handle} ${post.text}`.toLowerCase();
}

function hasMeaningfulExternal(blocks: SpaceBlock[]) {
  return blocks.some((block) => !['quote', 'post'].includes(block.type));
}

function leadFor(decision: SpaceOSDecision) {
  if (decision.lang !== 'ru') {
    if (decision.tool === 'weather') return 'Here is the live weather widget.';
    if (decision.tool === 'music') return 'I found audio options. Tap any track to play it.';
    if (decision.tool === 'images') return 'I collected a visual grid.';
    if (decision.tool === 'finance') return 'I built a quick chart.';
    if (decision.tool === 'shopping') return 'I found shopping options.';
    if (decision.tool === 'video') return 'I collected video/source results.';
    return 'I searched the open web first and assembled this.';
  }
  if (decision.tool === 'weather') return 'Показываю живую погоду 🌤️';
  if (decision.tool === 'music') return 'Нашёл аудио-варианты. Нажми на трек — включу 🎵';
  if (decision.tool === 'images') return 'Собрал визуальную подборку 🖼️';
  if (decision.tool === 'finance') return 'Собрал быстрый график 📈';
  if (decision.tool === 'shopping') return 'Нашёл варианты покупки 🛒';
  if (decision.tool === 'video') return 'Собрал видео и источники 🎬';
  return 'Сначала проверил открытый интернет и собрал выжимку.';
}

export function searchTelegramSupplement(posts: IngestedPost[], decision: SpaceOSDecision, limit = 2): SpaceBlock[] {
  if (!decision.useTelegram) return [];
  const tokens = decision.subject.toLowerCase().split(/\s+/).filter((t) => t.length > 2).slice(0, 8);
  if (!tokens.length) return [];
  const ranked = posts
    .map((post) => {
      const hay = textOf(post);
      const score = tokens.reduce((sum, token) => sum + (hay.includes(token) ? 1 : 0), 0) + (post.media?.length ? 0.25 : 0);
      return { post, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked.map(({ post, score }) => ({
    type: 'quote' as const,
    title: post.source.title || post.source.handle || 'Telegram',
    subtitle: post.source.handle ? `@${post.source.handle.replace(/^@/, '')}` : 'margeleT signal',
    text: post.text || 'Пост без текста.',
    url: internalPostUrl(post),
    sourceAvatar: post.source.avatar || null,
    media: post.media?.slice(0, 2).map((m) => ({ kind: m.kind, url: m.url, poster: m.poster || null })) || [],
    score,
  }));
}

async function deepWebFallback(decision: SpaceOSDecision): Promise<{ text: string; blocks: SpaceBlock[] }> {
  const result = await runWebSearchTool(decision.subject || decision.query, decision.locale);
  const answer = result.answer;
  if (!answer.sources.length && !answer.answer) return { text: '', blocks: [] };
  const block: SpaceBlock = {
    type: 'webInfo',
    title: answer.title || decision.subject || decision.query,
    summary: answer.answer || answer.bullets[0] || '',
    sourceTitle: 'Deep Search',
    url: answer.sources[0]?.url || '',
    facts: answer.bullets.length ? answer.bullets : answer.sources.slice(0, 5).map((source) => `${source.title} — ${source.displayUrl || source.url}`),
  };
  return {
    text: decision.lang === 'ru' ? 'Проверил несколько открытых источников 👇' : 'I checked several open sources 👇',
    blocks: [block],
  };
}

export async function runInternetTool(decision: SpaceOSDecision): Promise<{ text: string; blocks: SpaceBlock[] }> {
  const q = decision.subject || decision.query;

  if (decision.tool === 'weather') {
    const data = await crawl('weather', q);
    const widget = data?.ok ? composeWeatherWidget(data, decision) : null;
    return widget ? { text: leadFor(decision), blocks: [widget] } : deepWebFallback(decision);
  }

  if (decision.tool === 'images' || decision.tool === 'music') {
    const data = await crawl(decision.tool, q);
    const media = composeMediaResult(data, decision);
    return media.blocks.length ? media : deepWebFallback(decision);
  }

  if (decision.tool === 'finance') {
    const data = await crawl('finance', q);
    const widget = data ? composeChartWidget(data, decision) : null;
    return widget ? { text: leadFor(decision), blocks: [widget] } : deepWebFallback(decision);
  }

  if (decision.tool === 'shopping') {
    const data = await crawl('shopping', q);
    const widget = data ? composeShopWidget(data, decision) : null;
    return widget ? { text: leadFor(decision), blocks: [widget] } : deepWebFallback(decision);
  }

  if (decision.tool === 'video') {
    const data = await crawl('video', q);
    const media = composeMediaResult(data, decision);
    return media.blocks.length ? media : deepWebFallback(decision);
  }

  if (decision.tool === 'biography') {
    const data = await crawl('wiki', q);
    const widget = data?.ok ? composeInfoWidget(data, decision) : null;
    if (widget) return { text: decision.lang === 'ru' ? 'Собрал короткую справку 👇' : 'I collected a compact reference 👇', blocks: [widget] };
    return deepWebFallback(decision);
  }

  if (decision.tool === 'web' || decision.tool === 'profile') {
    const deep = await deepWebFallback(decision);
    if (hasMeaningfulExternal(deep.blocks)) return deep;
    const data = await crawl('web', q);
    const widget = data ? composeInfoWidget(data, decision) : null;
    return widget ? { text: leadFor(decision), blocks: [widget] } : deep;
  }

  return { text: '', blocks: [] };
}
