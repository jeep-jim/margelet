import { runDeepSearchSpider } from '../deepSearch/deepSearchSpider';
import type { SpaceSpiderAnswer } from '../deepSearch/spiderTypes';

export type WebSearchToolResult = {
  kind: 'webSearch';
  answer: SpaceSpiderAnswer;
};

export async function runWebSearchTool(query: string, locale = 'ru'): Promise<WebSearchToolResult> {
  const answer = await runDeepSearchSpider({ query, locale, limit: 12 });
  return { kind: 'webSearch', answer };
}
