import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import type { IngestedPost } from './contracts.js';

const TRENDS_DIR = 'data/trends';
const STOP_WORDS = new Set([
  'это', 'что', 'как', 'и', 'в', 'на', 'с', 'к', 'у', 'о', 'за', 'по', 'из', 'от', 'до',
  'a', 'the', 'to', 'of', 'for', 'with', 'on', 'at', 'by', 'is', 'are', 'was', 'were',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'be', 'been', 'has', 'have', 'had',
  'this', 'that', 'these', 'those', 'an', 'and', 'or', 'but', 'so', 'for', 'nor',
  'не', 'но', 'а', 'да', 'же', 'бы', 'ли', 'уже', 'ещё', 'вот', 'там', 'тут',
]);

function extractWords(text: string): string[] {
  const words = text.toLowerCase().match(/[а-яa-zё][а-яa-zё]{2,}/gi) || [];
  return words.filter(w => !STOP_WORDS.has(w) && w.length > 2);
}

function getHourlyKey(date: Date): string {
  return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}-${date.getUTCHours()}`;
}

export async function updateTrends(posts: IngestedPost[], countryCode: string) {
  const hourlyStats = new Map<string, Map<string, number>>();
  const countryDir = path.join(process.cwd(), TRENDS_DIR, countryCode);
  
  for (const post of posts) {
    if (!post.text) continue;
    
    const createdAt = new Date(post.createdAt);
    const hourKey = getHourlyKey(createdAt);
    const words = extractWords(post.text);
    
    if (!hourlyStats.has(hourKey)) {
      hourlyStats.set(hourKey, new Map());
    }
    
    const wordMap = hourlyStats.get(hourKey)!;
    for (const word of words) {
      wordMap.set(word, (wordMap.get(word) || 0) + 1);
    }
  }
  
  await mkdir(countryDir, { recursive: true });
  
  const allTrends: Record<string, number> = {};
  const hourlyHistory: Record<string, number[]> = {};
  
  for (const [hour, wordMap] of hourlyStats) {
    for (const [word, count] of wordMap) {
      allTrends[word] = (allTrends[word] || 0) + count;
      
      // Диагностика
      console.log(`DEBUG: word="${word}", hour="${hour}", count=${count}`);
      console.log(`DEBUG: hourlyHistory[word] before =`, hourlyHistory[word]);
      
      if (!hourlyHistory[word]) {
        hourlyHistory[word] = [];
      }
      
      console.log(`DEBUG: hourlyHistory[word] after init =`, hourlyHistory[word]);
      console.log(`DEBUG: type of hourlyHistory[word] = ${typeof hourlyHistory[word]}, isArray = ${Array.isArray(hourlyHistory[word])}`);
      
      hourlyHistory[word].push(count);
      
      console.log(`DEBUG: after push, length = ${hourlyHistory[word].length}`);
    }
  }
  
  const trends = Object.entries(allTrends)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([word, mentions]) => ({
      word,
      mentions,
      change: '+0%',
      history: hourlyHistory[word]?.slice(-24) || []
    }));
  
  const trendsPath = path.join(countryDir, 'trends.json');
  await writeFile(trendsPath, JSON.stringify(trends, null, 2));
  console.log(`📊 Trends updated for ${countryCode}: ${trends.length} topics`);
}