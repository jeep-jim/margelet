import type { SpaceSearchSource } from './spiderTypes';
import { compactOneLine, normalizeSpaceText } from './textTools';

const DDG_ENDPOINT = 'https://api.duckduckgo.com/';

function asUrl(value: string) {
  try {
    return new URL(value).toString();
  } catch {
    return '';
  }
}

function displayUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export async function searchDuckDuckGo(query: string, limit = 8): Promise<SpaceSearchSource[]> {
  const url = `${DDG_ENDPOINT}?${new URLSearchParams({ q: query, format: 'json', no_redirect: '1', no_html: '1', skip_disambig: '1' })}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const items: SpaceSearchSource[] = [];

    if (data.AbstractText && data.AbstractURL) {
      items.push({
        title: data.Heading || query,
        url: data.AbstractURL,
        displayUrl: displayUrl(data.AbstractURL),
        snippet: compactOneLine(data.AbstractText),
        source: 'duckduckgo',
      });
    }

    const related = Array.isArray(data.RelatedTopics) ? data.RelatedTopics : [];
    for (const item of related) {
      const flat = item.Topics || [item];
      for (const topic of flat) {
        const urlValue = asUrl(topic.FirstURL || '');
        if (!urlValue) continue;
        items.push({
          title: normalizeSpaceText(topic.Text || topic.Result || query).slice(0, 90) || query,
          url: urlValue,
          displayUrl: displayUrl(urlValue),
          snippet: compactOneLine(topic.Text || ''),
          source: 'duckduckgo',
        });
      }
    }

    return dedupeSources(items).slice(0, limit);
  } catch {
    return [];
  }
}

export async function searchWikipedia(query: string, locale = 'ru', limit = 5): Promise<SpaceSearchSource[]> {
  const lang = locale?.startsWith('ru') ? 'ru' : 'en';
  const endpoint = `https://${lang}.wikipedia.org/w/api.php`;
  const url = `${endpoint}?${new URLSearchParams({
    origin: '*',
    action: 'query',
    list: 'search',
    srsearch: query,
    format: 'json',
    srlimit: String(limit),
  })}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const results = data?.query?.search || [];
    return results.map((item: any) => ({
      title: item.title,
      url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
      displayUrl: `${lang}.wikipedia.org`,
      snippet: compactOneLine(item.snippet || ''),
      source: 'wikipedia' as const,
    }));
  } catch {
    return [];
  }
}

export function dedupeSources(items: SpaceSearchSource[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.url.replace(/#.*$/, '').replace(/\/$/, '');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
