import type { Locale } from '../../../types/app';
import type { SpaceOSDecision, SpaceOSMemory } from './types';

type LlmStatus = 'idle' | 'loading' | 'ready' | 'unsupported' | 'failed';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type WebLlmEngine = {
  chat?: {
    completions?: {
      create?: (input: {
        messages: ChatMessage[];
        temperature?: number;
        max_tokens?: number;
      }) => Promise<{ choices?: Array<{ message?: { content?: string } }> }>;
    };
  };
};

type WebLlmModule = {
  CreateMLCEngine?: (
    model: string,
    options?: { initProgressCallback?: (progress: unknown) => void },
  ) => Promise<WebLlmEngine>;
};

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

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';
const WEBLLM_URL = 'https://esm.sh/@mlc-ai/web-llm@0.2.79';

const state: {
  status: LlmStatus;
  error: string;
  engine: WebLlmEngine | null;
  browserSession: BrowserAiSession | null;
  loadingPromise: Promise<WebLlmEngine | BrowserAiSession | null> | null;
} = {
  status: 'idle',
  error: '',
  engine: null,
  browserSession: null,
  loadingPromise: null,
};

function isRussian(locale: Locale, query?: string) {
  return locale === 'ru' || /[а-яё]/i.test(query || '');
}

function hasWebGpu() {
  return typeof navigator !== 'undefined' && Boolean((navigator as Navigator & { gpu?: unknown }).gpu);
}

function canTryModel() {
  if (typeof window === 'undefined') return false;
  const flag = window.localStorage.getItem('margelet_space_llm');
  if (flag === 'off') return false;
  if (flag === 'on') return true;
  return hasWebGpu() || Boolean(window.ai?.languageModel?.create || window.LanguageModel?.create);
}

function systemPrompt(locale: Locale) {
  if (locale === 'ru') {
    return [
      'Ты Space — живой поисковый интеллект внутри margeleT.',
      'Отвечай по-русски, как нормальный собеседник: тепло, понятно, без канцелярита и без шаблонов.',
      'Сначала отвечай человеку по смыслу. Если нужны факты, скажи, что проверишь сеть. Telegram — только дополнительный свежий сенсор, не главный источник.',
      'Не выдумывай факты, цены, погоду, музыку или новости. Для фактов дождись данных инструментов.',
      'Не повторяй одну и ту же фразу. Не говори “уточни”, “не понял”, “я только Telegram”.',
      'Можно мягко спорить, задавать один живой вопрос, шутить умеренно, но не льстить в каждом сообщении.',
      'Длина ответа: 1–5 предложений, если пользователь не просит подробно.',
    ].join('\n');
  }

  return [
    'You are Space, a live search intelligence inside margeleT.',
    'Answer naturally, warmly, and briefly. Do not sound like a template.',
    'Talk to the person first. Use tools for facts. Telegram is only an extra freshness sensor, not your whole knowledge base.',
    'Do not invent facts, prices, weather, music, or news. Do not repeat yourself.',
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
  const name = input.memory?.userName ? (ru ? `Имя пользователя: ${input.memory.userName}.` : `User name: ${input.memory.userName}.`) : '';
  const route = input.decision
    ? (ru
      ? `Распознанный режим: ${input.decision.tool}. Тема: ${input.decision.subject || input.query}.`
      : `Detected mode: ${input.decision.tool}. Subject: ${input.decision.subject || input.query}.`)
    : '';
  const facts = input.facts?.length
    ? (ru ? `Факты от инструментов:\n- ${input.facts.join('\n- ')}` : `Tool facts:\n- ${input.facts.join('\n- ')}`)
    : '';

  return [
    name,
    route,
    facts,
    ru
      ? `Сообщение пользователя: “${input.query}”\nОтветь живо и по делу. Если фактов нет — не притворяйся, что проверил.`
      : `User message: “${input.query}”\nAnswer naturally and usefully. If there are no facts, do not pretend you checked them.`,
  ].filter(Boolean).join('\n\n');
}

async function loadBrowserAi(locale: Locale) {
  const factory = window.ai?.languageModel?.create || window.LanguageModel?.create;
  if (!factory) return null;
  const session = await factory({ systemPrompt: systemPrompt(locale), temperature: 0.75, topK: 40 });
  state.browserSession = session;
  return session;
}

async function loadWebLlm(locale: Locale) {
  if (!hasWebGpu()) return null;
  const importer = new Function('url', 'return import(url)') as (url: string) => Promise<WebLlmModule>;
  const mod = await importer(WEBLLM_URL);
  if (!mod.CreateMLCEngine) throw new Error('WebLLM module is unavailable');
  const engine = await mod.CreateMLCEngine(MODEL_ID, { initProgressCallback: () => undefined });
  state.engine = engine;
  return engine;
}

async function loadAnyModel(locale: Locale) {
  if (state.engine) return state.engine;
  if (state.browserSession) return state.browserSession;
  if (state.loadingPromise) return state.loadingPromise;

  if (!canTryModel()) {
    state.status = 'unsupported';
    state.error = 'No browser AI/WebGPU runtime';
    return null;
  }

  state.status = 'loading';
  state.error = '';
  state.loadingPromise = (async () => {
    try {
      const browserAi = await loadBrowserAi(locale);
      if (browserAi) {
        state.status = 'ready';
        return browserAi;
      }
      const webLlm = await loadWebLlm(locale);
      if (webLlm) {
        state.status = 'ready';
        return webLlm;
      }
      state.status = 'unsupported';
      state.error = 'No supported local model runtime';
      return null;
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
  if (typeof window === 'undefined') return;
  void loadAnyModel(locale);
}

export function getLocalLlmStatus() {
  return { status: state.status, error: state.error, model: MODEL_ID, webgpu: hasWebGpu() };
}

function cleanAnswer(value: string) {
  return String(value || '')
    .replace(/^space\s*[:—-]\s*/i, '')
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

  try {
    const model = await Promise.race([
      loadAnyModel(input.locale),
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), timeoutMs)),
    ]);
    if (!model) return null;

    const prompt = buildUserPrompt(input);

    if ('prompt' in model && typeof model.prompt === 'function') {
      const text = await Promise.race([
        model.prompt(prompt),
        new Promise<string>((resolve) => window.setTimeout(() => resolve(''), timeoutMs)),
      ]);
      const clean = cleanAnswer(text);
      return clean.length >= 8 ? clean : null;
    }

    const create = (model as WebLlmEngine).chat?.completions?.create;
    if (!create) return null;

    const response = await Promise.race([
      create({
        messages: [
          { role: 'system', content: systemPrompt(input.locale) },
          { role: 'user', content: prompt },
        ],
        temperature: 0.78,
        max_tokens: 220,
      }),
      new Promise<null>((resolve) => window.setTimeout(() => resolve(null), timeoutMs)),
    ]);

    const text = response?.choices?.[0]?.message?.content || '';
    const clean = cleanAnswer(text);
    return clean.length >= 8 ? clean : null;
  } catch (error) {
    state.status = 'failed';
    state.error = error instanceof Error ? error.message : String(error);
    return null;
  }
}
