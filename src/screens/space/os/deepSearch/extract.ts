import type { SpaceExtractedPage, SpaceSearchSource } from './spiderTypes';
import { compactOneLine, normalizeSpaceText } from './textTools';

function meta(html: string, name: string) {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["'][^>]*>`, 'i'),
  ];
  for (const pattern of patterns) {
    const found = html.match(pattern)?.[1];
    if (found) return normalizeSpaceText(found);
  }
  return '';
}

function titleOf(html: string) {
  return normalizeSpaceText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
}

export async function extractPage(source: SpaceSearchSource): Promise<SpaceExtractedPage | null> {
  try {
    const res = await fetch(source.url, { mode: 'cors' });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) return null;
    const html = await res.text();
    const description = meta(html, 'description') || meta(html, 'og:description') || source.snippet || '';
    const image = meta(html, 'og:image') || meta(html, 'twitter:image') || '';
    const text = normalizeSpaceText(`${titleOf(html)}. ${description}. ${html}`);
    return {
      ...source,
      title: source.title || titleOf(html),
      snippet: compactOneLine(description || source.snippet || text),
      image,
      text: text.slice(0, 12000),
    };
  } catch {
    return null;
  }
}
