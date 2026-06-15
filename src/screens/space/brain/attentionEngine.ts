import type { IngestedPost } from '../../../types/app';
import type { AttentionSignal, SpaceMemory } from './types';
import { normalize, tokenize } from './text';

function add(map: Map<string, AttentionSignal>, token: string, weight: number, source: AttentionSignal['source']) {
  if (!token || token.length < 3) return;
  const old = map.get(token);
  map.set(token, { token, weight: (old?.weight || 0) + weight, source: old?.source || source });
}

export function buildAttention(query: string, subject: string, memory: SpaceMemory, posts: IngestedPost[]): AttentionSignal[] {
  const map = new Map<string, AttentionSignal>();
  tokenize(query, 16).forEach((token, index) => add(map, token, 8 - Math.min(index, 5), 'query'));
  tokenize(subject, 8).forEach((token) => add(map, token, 5, 'subject'));
  memory.lastUserWords.forEach((token) => add(map, token, 1.8, 'memory'));

  const queryTokens = tokenize(query, 10);
  if (queryTokens.length) {
    posts.slice(0, 260).forEach((post) => {
      const hay = normalize([post.text, post.source.title, post.source.handle, post.tag, ...(post.tags || [])].join(' '));
      queryTokens.forEach((token) => {
        if (hay.includes(token)) add(map, token, 0.4, 'post');
      });
    });
  }

  return Array.from(map.values()).sort((a, b) => b.weight - a.weight).slice(0, 16);
}

export function attentionText(signals: AttentionSignal[]) {
  return signals.slice(0, 5).map((item) => item.token).join(' ');
}
