import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { IngestedPost } from './contracts.js';

const TRENDS_DIR = 'data/trends';
const STOP_WORDS = new Set([
  'это', 'что', 'как', 'и', 'в', 'на', 'с', 'к', 'у', 'о', 'за', 'по', 'из', 'от', 'до',
  'a', 'the', 'to', 'of', 'for', 'with', 'on', 'at', 'by', 'is', 'are', 'was', 'were',
  'не', 'но', 'а', 'да', 'же', 'бы', 'ли', 'уже', 'ещё', 'вот', 'там', 'тут',
]);

function extractWords(text: string): string[] {
  const words = text.toLowerCase().match(/[а-яa-zё][а-яa-zё]{2,}/gi) || [];
  return words.filter(w => !STOP_WORDS.has(w) && w.length > 2);
}

export async function updateTrends(posts: IngestedPost[], countryCode: string) {
  const wordCount: Record<string, number> = {};
  
  for (const post of posts) {
    if (!post.text) continue;
    const words = extractWords(post.text);
    for (const word of words) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  }
  
  const trends = Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, mentions]) => ({ word, mentions, change: '+0%', history: [] }));
  
  const countryDir = path.join(process.cwd(), TRENDS_DIR, countryCode);
  await mkdir(countryDir, { recursive: true });
  await writeFile(path.join(countryDir, 'trends.json'), JSON.stringify(trends, null, 2));
  
  console.log(`📊 Trends updated for ${countryCode}: ${trends.length} topics`);
}