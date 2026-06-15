import type { IngestedPost } from '../../../types/app';
import { normalize, tokenize } from './text';

export type TopicNode = {
  key: string;
  weight: number;
  posts: IngestedPost[];
  sources: Set<string>;
};

export function buildMiniTopicGraph(posts: IngestedPost[], tokens: string[]) {
  const graph = new Map<string, TopicNode>();
  const focus = new Set(tokens);

  posts.slice(0, 900).forEach((post) => {
    const text = normalize([post.text, post.source.title, post.source.handle, post.tag, ...(post.tags || [])].join(' '));
    const postTokens = tokenize(text, 28);
    postTokens.forEach((token) => {
      const related = focus.size === 0 || focus.has(token) || Array.from(focus).some((focusToken) => text.includes(focusToken));
      if (!related) return;
      const old = graph.get(token) || { key: token, weight: 0, posts: [], sources: new Set<string>() };
      old.weight += focus.has(token) ? 4 : 1;
      if (old.posts.length < 8) old.posts.push(post);
      if (post.source.handle) old.sources.add(post.source.handle);
      graph.set(token, old);
    });
  });

  return Array.from(graph.values()).sort((a, b) => b.weight + b.sources.size - (a.weight + a.sources.size)).slice(0, 24);
}
