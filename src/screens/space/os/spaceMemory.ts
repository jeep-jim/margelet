import type { SpaceOSDecision, SpaceOSMemory } from './types';

const KEY = 'margelet_space_os_memory_v2';
const OLD_KEY = 'margelet_space_os_memory_v1';

type RichMemory = SpaceOSMemory & {
  recentTurns?: Array<{ role: 'user' | 'space'; text: string; at: number }>;
  lastTrack?: string;
  lastArtist?: string;
  lastCity?: string;
  interests?: string[];
  nickName?: string;
};

function base(): RichMemory {
  const now = Date.now();
  return {
    turns: 0,
    userName: '',
    lastTopic: '',
    lastTool: null,
    userTone: 'warm',
    createdAt: now,
    updatedAt: now,
    recentTurns: [],
    lastTrack: '',
    lastArtist: '',
    lastCity: '',
    interests: [],
    nickName: '',
  };
}

function asMemory(parsed: Partial<RichMemory> | null): RichMemory | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const now = Date.now();
  const memory = base();
  return {
    ...memory,
    ...parsed,
    turns: Number(parsed.turns || 0),
    userName: String(parsed.userName || ''),
    nickName: String(parsed.nickName || ''),
    lastTopic: String(parsed.lastTopic || ''),
    lastTrack: String(parsed.lastTrack || ''),
    lastArtist: String(parsed.lastArtist || ''),
    lastCity: String(parsed.lastCity || ''),
    lastTool: parsed.lastTool || null,
    userTone: parsed.userTone || 'warm',
    createdAt: Number(parsed.createdAt || now),
    updatedAt: Number(parsed.updatedAt || now),
    recentTurns: Array.isArray(parsed.recentTurns) ? parsed.recentTurns.slice(-50) : [],
    interests: Array.isArray(parsed.interests) ? parsed.interests.slice(-30) : [],
  };
}

export function readSpaceOSMemory(): RichMemory {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY);
    const parsed = raw ? JSON.parse(raw) as Partial<RichMemory> : null;
    return asMemory(parsed) || base();
  } catch {
    return base();
  }
}

export function writeSpaceOSMemory(memory: RichMemory) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...memory, updatedAt: Date.now() }));
  } catch {
    // local only
  }
}

function clean(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim().replace(/[,.!?]+$/g, '');
}

function extractName(query: string) {
  const explicit = query.match(/(?:меня\s+зовут|зови\s+меня|мо[её]\s+имя|my\s+name\s+is|call\s+me)\s+([^.!?\n]{2,42})/i);
  if (explicit?.[1]) return clean(explicit[1]);
  const nick = query.match(/(?:буду\s+называть\s+тебя|называй\s+меня|зови\s+меня)\s+([^.!?\n]{2,42})/i);
  return nick?.[1] ? clean(nick[1]) : '';
}

function extractCity(query: string, tool: SpaceOSDecision['tool']) {
  if (tool !== 'weather') return '';
  const match = query.match(/(?:в|во|для|по)\s+([а-яёa-z\-\s]{3,48})/i);
  return clean(match?.[1] || '');
}

function extractTrack(query: string, decision: SpaceOSDecision) {
  if (decision.tool !== 'music') return { track: '', artist: '' };
  const raw = clean(decision.subject || query)
    .replace(/^(группа|трек|песня|музыка)\s+/i, '')
    .replace(/\s+/g, ' ');
  const parts = raw.split(/\s+-\s+|\s+—\s+/).map(clean).filter(Boolean);
  if (parts.length >= 2) return { artist: parts[0], track: parts.slice(1).join(' - ') };
  return { artist: '', track: raw };
}

function collectInterests(query: string) {
  const words = query.toLowerCase().replace(/ё/g, 'е').match(/[а-яa-z0-9]{4,}/g) || [];
  const banned = new Set('можешь можно нужно надо хочу покажи включи поставь расскажи объясни привет спасибо пожалуйста сегодня сейчас просто какая какой такое будет давай бро мне тебя'.split(' '));
  return words.filter((word) => !banned.has(word)).slice(0, 6);
}

export function rememberAssistantTurn(text: string) {
  const memory = readSpaceOSMemory();
  const next: RichMemory = {
    ...memory,
    recentTurns: [...(memory.recentTurns || []), { role: 'space' as const, text: clean(text).slice(0, 500), at: Date.now() }].slice(-50),
    updatedAt: Date.now(),
  };
  writeSpaceOSMemory(next);
  return next;
}

export function rememberSpaceOSTurn(memory: RichMemory, query: string, decision: SpaceOSDecision) {
  const name = extractName(query);
  const city = extractCity(query, decision.tool);
  const track = extractTrack(query, decision);
  const interests = Array.from(new Set([...(memory.interests || []), ...collectInterests(query)])).slice(-30);
  const next: RichMemory = {
    ...memory,
    turns: memory.turns + 1,
    userName: name || memory.userName,
    nickName: /называть\s+тебя/i.test(query) && name ? name : memory.nickName,
    lastTopic: decision.subject || memory.lastTopic,
    lastTool: decision.tool,
    lastTrack: track.track || memory.lastTrack,
    lastArtist: track.artist || memory.lastArtist,
    lastCity: city || memory.lastCity,
    interests,
    recentTurns: [...(memory.recentTurns || []), { role: 'user' as const, text: clean(query).slice(0, 500), at: Date.now() }].slice(-50),
    userTone: /бро|ахах|😂|=\)|лол|круто|сука|нихуя/i.test(query) ? 'playful' : memory.userTone,
    updatedAt: Date.now(),
  };
  writeSpaceOSMemory(next);
  return next;
}
