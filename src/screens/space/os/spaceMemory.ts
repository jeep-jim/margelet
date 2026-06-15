import type { SpaceOSDecision, SpaceOSMemory } from './types';

const KEY = 'margelet_space_os_memory_v1';

export function readSpaceOSMemory(): SpaceOSMemory {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) as Partial<SpaceOSMemory> : null;
    if (parsed && typeof parsed === 'object') {
      return {
        turns: Number(parsed.turns || 0),
        userName: String(parsed.userName || ''),
        lastTopic: String(parsed.lastTopic || ''),
        lastTool: parsed.lastTool || null,
        userTone: parsed.userTone || 'warm',
        createdAt: Number(parsed.createdAt || Date.now()),
        updatedAt: Number(parsed.updatedAt || Date.now()),
      };
    }
  } catch {
    // local memory is optional
  }
  const now = Date.now();
  return { turns: 0, userName: '', lastTopic: '', lastTool: null, userTone: 'warm', createdAt: now, updatedAt: now };
}

export function writeSpaceOSMemory(memory: SpaceOSMemory) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...memory, updatedAt: Date.now() }));
  } catch {
    // local only
  }
}

export function rememberSpaceOSTurn(memory: SpaceOSMemory, query: string, decision: SpaceOSDecision) {
  const nameMatch = query.match(/(?:меня\s+зовут|зови\s+меня|мо[её]\s+имя|my\s+name\s+is|call\s+me)\s+([^.!?\n]{2,42})/i);
  const name = nameMatch?.[1]?.trim().replace(/[,.!?]+$/g, '');
  const next: SpaceOSMemory = {
    ...memory,
    turns: memory.turns + 1,
    userName: name || memory.userName,
    lastTopic: decision.subject || memory.lastTopic,
    lastTool: decision.tool,
    userTone: /бро|ахах|😂|=\)|лол|круто/i.test(query) ? 'playful' : memory.userTone,
    updatedAt: Date.now(),
  };
  writeSpaceOSMemory(next);
  return next;
}
