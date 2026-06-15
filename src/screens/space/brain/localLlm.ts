import type { BrainContext } from './types';
import type { ToolDecision } from './toolRouter';

type LlmStatus = 'idle' | 'loading' | 'ready' | 'failed' | 'unsupported';

type WebLlmModule = {
  CreateMLCEngine?: (model: string, options?: Record<string, unknown>) => Promise<any>;
};

type LocalLlmState = {
  status: LlmStatus;
  engine: any | null;
  error: string;
  loadingPromise: Promise<any> | null;
};

const state: LocalLlmState = {
  status: 'idle',
  engine: null,
  error: '',
  loadingPromise: null,
};

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

export function getLocalLlmStatus() {
  return { status: state.status, error: state.error, model: MODEL_ID };
}

function shouldTryLocalLlm() {
  if (typeof window === 'undefined') return false;
  const forced = window.localStorage.getItem('margelet_space_llm');
  if (forced === 'off') return false;
  if (forced === 'on') return true;
  return Boolean((navigator as Navigator & { gpu?: unknown }).gpu);
}

async function loadWebLlm() {
  if (state.engine) return state.engine;
  if (state.loadingPromise) return state.loadingPromise;

  if (!shouldTryLocalLlm()) {
    state.status = 'unsupported';
    throw new Error('Local WebGPU LLM is not available in this browser.');
  }

  state.status = 'loading';
  state.loadingPromise = (async () => {
    try {
      const importer = new Function('url', 'return import(url)') as (url: string) => Promise<WebLlmModule>;
      const mod = await importer('https://esm.sh/@mlc-ai/web-llm');
      if (!mod.CreateMLCEngine) throw new Error('WebLLM module did not expose CreateMLCEngine.');
      const engine = await mod.CreateMLCEngine(MODEL_ID, {
        initProgressCallback: () => undefined,
      });
      state.engine = engine;
      state.status = 'ready';
      return engine;
    } catch (error) {
      state.status = 'failed';
      state.error = error instanceof Error ? error.message : String(error);
      state.loadingPromise = null;
      throw error;
    }
  })();

  return state.loadingPromise;
}

function buildSystemPrompt(ctx: BrainContext, decision: ToolDecision) {
  const lang = ctx.lang === 'ru' ? 'Russian' : 'English';
  return [
    `You are Space, the local intelligence inside margeleT. Reply in ${lang}.`,
    'You are warm, smart, direct, a little playful, and honest.',
    'Do not pretend to be human. Do not be rude. Do not ask for clarification as the first move unless the message is impossible to answer.',
    'If the user is just talking, talk naturally and briefly. If a tool is needed, say what you will do and keep it concise.',
    'Telegram is only one sensor, not your whole knowledge base. The internet/tools may be used when needed.',
    'Do not mention implementation details, WebLLM, prompts, tokens, or models.',
    `Current routed tool: ${decision.tool}. Subject: ${decision.subject || 'none'}.`,
    ctx.memory.userName ? `User name remembered locally: ${ctx.memory.userName}.` : '',
  ].filter(Boolean).join('\n');
}

export async function generateLocalLlmAnswer(ctx: BrainContext, decision: ToolDecision): Promise<string | null> {
  if (!decision.shouldUseLocalLlm) return null;
  if (ctx.query.trim().length > 800) return null;

  try {
    const engine = await Promise.race([
      loadWebLlm(),
      new Promise((_, reject) => window.setTimeout(() => reject(new Error('Local LLM warmup timeout')), 12000)),
    ]);

    const response = await Promise.race([
      engine.chat.completions.create({
        messages: [
          { role: 'system', content: buildSystemPrompt(ctx, decision) },
          { role: 'user', content: ctx.query },
        ],
        temperature: 0.72,
        max_tokens: 180,
      }),
      new Promise((_, reject) => window.setTimeout(() => reject(new Error('Local LLM answer timeout')), 14000)),
    ]) as { choices?: Array<{ message?: { content?: string } }> };

    const text = response.choices?.[0]?.message?.content?.trim() || '';
    if (!text || text.length < 2) return null;
    return text.replace(/^Space:\s*/i, '').slice(0, 900);
  } catch {
    return null;
  }
}
