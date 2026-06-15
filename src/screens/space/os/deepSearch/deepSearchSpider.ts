import { extractPage } from './extract';
import { rankPages, rankSources } from './ranker';
import { dedupeSources, searchDuckDuckGo, searchWikipedia } from './searchProviders';
import { summarizeSpiderAnswer } from './summarize';
import type { SpaceSpiderAnswer, SpaceSpiderRequest } from './spiderTypes';

export async function runDeepSearchSpider(request: SpaceSpiderRequest): Promise<SpaceSpiderAnswer> {
  const query = request.query.trim();
  const limit = request.limit || 10;
  const [ddg, wiki] = await Promise.all([
    searchDuckDuckGo(query, limit),
    searchWikipedia(query, request.locale || 'ru', 5),
  ]);
  const sources = rankSources(query, dedupeSources([...wiki, ...ddg])).slice(0, limit);
  const extracted = await Promise.all(sources.slice(0, 6).map((source) => extractPage(source)));
  const pages = rankPages(query, extracted.filter(Boolean) as any);
  return summarizeSpiderAnswer(query, pages, sources);
}
