export function normalizeHumanText(text: string) {
  return String(text || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[“”«»]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

export function pickBySeed<T>(seed: string, items: T[]): T {
  const safeItems = items.length ? items : ([] as T[]);
  if (!safeItems.length) throw new Error('pickBySeed requires items');
  const code = Array.from(seed || 'space').reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 3), 17);
  return safeItems[Math.abs(code) % safeItems.length];
}

export function sentenceCase(text: string) {
  const clean = text.trim();
  if (!clean) return clean;
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function compactLines(lines: Array<string | false | null | undefined>) {
  return lines.filter(Boolean).join('\n\n');
}
