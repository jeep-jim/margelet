import type { Locale } from '../../../types/app';
import type { SpaceOSDecision, SpaceOSMemory } from './types';

type LlmStatus = 'idle' | 'loading' | 'ready' | 'unsupported' | 'failed';

type BrowserAiSession = {
  prompt: (input: string) => Promise<string>;
};

type BrowserAiFactory = {
  create?: (options?: unknown) => Promise<BrowserAiSession>;
};

declare global {
  interface Window {
    ai?: { languageModel?: BrowserAiFactory };
    LanguageModel?: BrowserAiFactory;
  }
}

const SERVER_MODEL = 'server-space-ai';

const state: {
  status: LlmStatus;
  error: string;
  browserSession: BrowserAiSession | null;
  loadingPromise: Promise<BrowserAiSession | null> | null;
} = {
  status: 'idle',
  error: '',
  browserSession: null,
  loadingPromise: null,
};

function isRussian(locale: Locale, query?: string) {
  return locale === 'ru' || /[а-яё]/i.test(query || '');
}

function hasWebGpu() {
  return typeof navigator !== 'undefined' && Boolean((navigator as Navigator & { gpu?: unknown }).gpu);
}

function browserAiFactory() {
  if (typeof window === 'undefined') return null;
  return window.ai?.languageModel?.create || window.LanguageModel?.create || null;
}

function systemPrompt(locale: Locale) {
  if (locale === 'ru') {
    return [
      'Ты Space — живой поисковый интеллект внутри margeleT.',
      'Отвечай по-русски, как нормальный собеседник: тепло, понятно, без канцелярита и без шаблонов.',
      'Сначала отвечай человеку по смыслу. Для фактов используй данные инструментов, если они переданы.',
      'Не выдумывай цены, погоду, новости и источники. Если фактов нет — честно скажи, что нужен поиск.',
      'Не повторяй одну и ту же фразу. Не говори “уточни”, “не понял”, “я только Telegram”.',
      'Можно мягко спорить, шутить умеренно и помнить стиль пользователя.',
      'Длина ответа: 1–5 предложений, если пользователь не просит подробно.',
    ].join('\n');
  }

  return [
    'You are Space, a live search intelligence inside margeleT.',
    'Answer naturally, warmly, and briefly. Do not sound like a template.',
    'Use tool facts when provided. Do not invent facts, weather, prices, news, or sources.',
  ].join('\n');
}

function buildUserPrompt(input: {
  query: string;
  locale: Locale;
  decision?: SpaceOSDecision;
  memory?: SpaceOSMemory;
  facts?: string[];
}) {
  const ru = isRussian(input.locale, input.query);
  const memory = input.memory as SpaceOSMemory & { recentTurns?: Array<{ role: string; text: string }>; lastTrack?: string; lastArtist?: string; lastCity?: string; interests?: string[] };
  const name = memory?.userName ? (ru ? `Имя пользователя: ${memory.userName}.` : `User name: ${memory.userName}.`) : '';
  const profile = [
    memory?.lastCity ? (ru ? `Последний город: ${memory.lastCity}.` : `Last city: ${memory.lastCity}.`) : '',
    memory?.lastTrack ? (ru ? `Последний музыкальный запрос: ${[memory.lastArtist, memory.lastTrack].filter(Boolean).join(' — ')}.` : `Last music request: ${[memory.lastArtist, memory.lastTrack].filter(Boolean).join(' — ')}.`) : '',
    memory?.interests?.length ? (ru ? `Интересы из диалога: ${memory.interests.slice(-8).join(', ')}.` : `Interests from dialog: ${memory.interests.slice(-8).join(', ')}.`) : '',
  ].filter(Boolean).join('\n');
  const history = memory?.recentTurns?.length
    ? (ru ? `Последний контекст диалога:\n${memory.recentTurns.slice(-10).map((t) => `${t.role === 'user' ? 'Пользователь' : 'Space'}: ${t.text}`).join('\n')}` : `Recent conversation:\n${memory.recentTurns.slice(-10).map((t) => `${t.role}: ${t.text}`).join('\n')}`)
    : '';
  const route = input.decision
    ? (ru
      ? `Режим: ${input.decision.tool}. Тема: ${input.decision.subject || input.query}.`
      : `Mode: ${input.decision.tool}. Subject: ${input.decision.subject || input.query}.`)
    : '';
  const facts = input.facts?.length
    ? (ru ? `Факты от инструментов:\n- ${input.facts.join('\n- ')}` : `Tool facts:\n- ${input.facts.join('\n- ')}`)
    : '';

  return [
    name,
    profile,
    history,
    route,
    facts,
    ru
      ? `Сообщение пользователя: “${input.query}”\nОтветь живо и по делу. Не пиши служебные фразы и не изображай поиск, если фактов нет.`
      : `User message: “${input.query}”\nAnswer naturally and usefully. Do not write service phrases or pretend to search if there are no facts.`,
  ].filter(Boolean).join('\n\n');
}

async function serverLlmReply(input: {
  query: string;
  locale: Locale;
  decision?: SpaceOSDecision;
  memory?: SpaceOSMemory;
  facts?: string[];
  timeoutMs: number;
}) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), input.timeoutMs);
  try {
    const response = await fetch('/api/space-crawl?tool=ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        query: input.query,
        locale: input.locale,
        decision: input.decision,
        memory: input.memory,
        facts: input.facts || [],
        system: systemPrompt(input.locale),
        prompt: buildUserPrompt(input),
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json() as { ok?: boolean; text?: string; error?: string };
    if (data?.ok && data.text) return cleanAnswer(data.text);
    return null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

async function loadBrowserAi(locale: Locale) {
  if (state.browserSession) return state.browserSession;
  if (state.loadingPromise) return state.loadingPromise;
  const factory = browserAiFactory();
  if (!factory) {
    state.status = 'unsupported';
    state.error = 'Browser AI is unavailable';
    return null;
  }
  state.status = 'loading';
  state.error = '';
  state.loadingPromise = (async () => {
    try {
      const session = await factory({ systemPrompt: systemPrompt(locale), temperature: 0.75, topK: 40 });
      state.browserSession = session;
      state.status = 'ready';
      return session;
    } catch (error) {
      state.status = 'failed';
      state.error = error instanceof Error ? error.message : String(error);
      return null;
    } finally {
      state.loadingPromise = null;
    }
  })();
  return state.loadingPromise;
}

export function warmLocalLlm(locale: Locale = 'ru' as Locale) {
  // Не грузим WebLLM автоматически: он подвешивает Space на слабых телефонах.
  // Прогреваем только встроенный Browser AI, если браузер сам его предоставляет.
  if (typeof window === 'undefined') return;
  if (!browserAiFactory()) return;
  void loadBrowserAi(locale);
}

export function getLocalLlmStatus() {
  const browserAi = Boolean(browserAiFactory());
  return { status: state.status, error: state.error, model: SERVER_MODEL, webgpu: hasWebGpu(), browserAi };
}

function cleanAnswer(value: string) {
  return String(value || '')
    .replace(/^space\s*[:—-]\s*/i, '')
    .replace(/^спейс\s*[:—-]\s*/i, '')
    .replace(/\s+$/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 1200);
}

export async function tryLocalLlmReply(input: {
  query: string;
  locale: Locale;
  decision?: SpaceOSDecision;
  memory?: SpaceOSMemory;
  facts?: string[];
  timeoutMs?: number;
}): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (input.query.trim().length > 1200) return null;

  const timeoutMs = input.timeoutMs ?? 9000;

  const serverText = await serverLlmReply({ ...input, timeoutMs });
  if (serverText && serverText.length >= 8) return serverText;

  try {
    const model = await Promise.race([
      loadBrowserAi(input.locale),
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), Math.min(timeoutMs, 5000))),
    ]);
    if (!model) return null;

    const prompt = buildUserPrompt(input);
    const text = await Promise.race([
      model.prompt(prompt),
      new Promise<string>((resolve) => window.setTimeout(() => resolve(''), Math.min(timeoutMs, 7000))),
    ]);
    const clean = cleanAnswer(text);
    return clean.length >= 8 ? clean : null;
  } catch (error) {
    state.status = 'failed';
    state.error = error instanceof Error ? error.message : String(error);
    return null;
  }
}
