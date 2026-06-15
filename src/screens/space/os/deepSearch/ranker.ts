import type { SpaceExtractedPage, SpaceSearchSource } from './spiderTypes';
import { tokenizeForSearch } from './textTools';

const TRUSTED_HINTS = ['wikipedia.org', 'github.com', 'who.int', 'nasa.gov', 'gov', 'edu', 'reuters.com', 'apnews.com', 'bbc.', 'open-meteo.com'];

export function rankSources(query: string, sources: SpaceSearchSource[]) {
  const tokens = new Set(tokenizeForSearch(query));
  return [...sources]
    .map((item) => {
      const haystack = tokenizeForSearch(`${item.title} ${item.snippet || ''}`);
      const tokenScore = haystack.reduce((sum, token) => sum + (tokens.has(token) ? 1 : 0), 0);
      const trusted = TRUSTED_HINTS.some((hint) => (item.displayUrl || item.url).includes(hint)) ? 2 : 0;
      return { ...item, score: tokenScore + trusted + (item.source === 'wikipedia' ? 2 : 0) };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}

export function rankPages(query: string, pages: SpaceExtractedPage[]) {
  const tokens = new Set(tokenizeForSearch(query));
  return [...pages]
    .map((page) => {
      const haystack = tokenizeForSearch(`${page.title} ${page.snippet || ''} ${page.text}`);
      const tokenScore = haystack.reduce((sum, token) => sum + (tokens.has(token) ? 1 : 0), 0);
      const trusted = TRUSTED_HINTS.some((hint) => (page.displayUrl || page.url).includes(hint)) ? 4 : 0;
      return { ...page, score: tokenScore + trusted + (page.image ? 1 : 0) };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0));
}
