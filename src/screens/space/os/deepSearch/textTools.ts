export function normalizeSpaceText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitSentences(text: string) {
  return normalizeSpaceText(text)
    .split(/(?<=[.!?…])\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 32 && item.length < 360);
}

export function tokenizeForSearch(text: string) {
  return normalizeSpaceText(text)
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

export function compactOneLine(text: string, max = 220) {
  const clean = normalizeSpaceText(text);
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}
