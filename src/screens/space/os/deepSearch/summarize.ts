import type { SpaceExtractedPage, SpaceSearchSource, SpaceSpiderAnswer } from './spiderTypes';
import { compactOneLine, splitSentences, tokenizeForSearch } from './textTools';

function bestSentences(query: string, pages: SpaceExtractedPage[], max = 5) {
  const tokens = new Set(tokenizeForSearch(query));
  const scored: { text: string; score: number }[] = [];
  for (const page of pages) {
    for (const sentence of splitSentences(`${page.snippet || ''}. ${page.text}`)) {
      const sentenceTokens = tokenizeForSearch(sentence);
      const score = sentenceTokens.reduce((sum, token) => sum + (tokens.has(token) ? 2 : 0), 0) + Math.min(sentenceTokens.length / 18, 2);
      if (score > 0) scored.push({ text: sentence, score });
    }
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .map((item) => compactOneLine(item.text, 180))
    .filter((text, index, list) => list.indexOf(text) === index)
    .slice(0, max);
}

export function summarizeSpiderAnswer(query: string, pages: SpaceExtractedPage[], sources: SpaceSearchSource[]): SpaceSpiderAnswer {
  const best = pages[0];
  const bullets = bestSentences(query, pages, 5);
  const title = best?.title ? compactOneLine(best.title, 80) : compactOneLine(query, 80);
  const intro = bullets[0] || best?.snippet || sources[0]?.snippet || 'Собрал первые открытые источники и готов развернуть ответ глубже.';
  return {
    query,
    title,
    answer: compactOneLine(intro, 260),
    bullets: bullets.slice(1),
    sources: sources.slice(0, 8),
    confidence: pages.length ? Math.min(0.9, 0.45 + pages.length * 0.08) : 0.25,
    createdAt: new Date().toISOString(),
    widgetHint: 'sources',
  };
}
