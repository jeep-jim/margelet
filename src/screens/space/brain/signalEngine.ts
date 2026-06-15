import type { RankedPost } from './types';

export function describeSignal(lang: string, ranked: RankedPost[]) {
  const best = ranked[0];
  if (!best) return '';
  const sources = new Set(ranked.map((item) => item.post.source.handle).filter(Boolean)).size;
  if (lang === 'ru') {
    if (sources > 1) return `вижу несколько близких источников`;
    return `ближе всего один источник`;
  }
  return sources > 1 ? 'I see several close sources' : 'one source is closest';
}
