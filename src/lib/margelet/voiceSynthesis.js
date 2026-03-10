// src/lib/margelet/voiceSynthesis.js
// Runtime synthesis layer for Margelet.
// Connects voiceEngine output to the real browser TTS provider.

import {
  isBrowserTtsAvailable,
  getAvailableTtsVoices,
  synthesizeSpeechSegments,
  stopSpeaking,
} from "./providers/ttsProvider";

export async function runVoiceSynthesis(request, voicePlanResult) {
  const variants = voicePlanResult?.variants || [];
  const config = request?.config || {};

  if (!Array.isArray(variants) || variants.length === 0) {
    return {
      ok: false,
      error: {
        code: "NO_VOICE_VARIANTS",
        message: "No voice variants provided for synthesis.",
      },
    };
  }

  if (!isBrowserTtsAvailable()) {
    return {
      ok: false,
      error: {
        code: "BROWSER_TTS_UNAVAILABLE",
        message: "Browser TTS is not available in this environment.",
      },
      runtime: {
        clientOnly: true,
      },
    };
  }

  const startedAt = Date.now();
  const availableVoices = await safeLoadVoices();

  const results = [];

  for (const variant of variants) {
    const synthesized = await synthesizeVariant({
      variant,
      config,
    });

    results.push(synthesized);
  }

  return {
    ok: true,
    provider: "browser-speech-synthesis",
    runtime: {
      clientOnly: true,
      downloadableAudioFile: false,
      deterministicAcrossDevices: false,
    },
    input: {
      requestId: request?.meta?.requestId || null,
      variantCount: results.length,
      voice: config.voice || "auto",
      tone: config.tone || "dynamic",
    },
    voices: availableVoices,
    variants: results,
    meta: {
      startedAt,
      finishedAt: Date.now(),
      durationMs: Date.now() - startedAt,
    },
  };
}

export function cancelVoiceSynthesis() {
  stopSpeaking();
}

async function synthesizeVariant({ variant, config }) {
  const language =
    variant?.synthesis?.language ||
    inferLanguageFromSegments(variant?.segments || []) ||
    "ru";

  const segments = (variant?.segments || []).map((segment) => ({
    id: segment.id,
    sceneId: segment.sceneId,
    role: segment.role,
    text: segment.text,
    normalizedText: segment.normalizedText,
    durationMs: segment.durationMs,
    pauseAfterMs: segment.pauseAfterMs,
    delivery: segment.delivery,
    emphasis: segment.emphasis,
    timingHints: segment.timingHints,
  }));

  const execution = await synthesizeSpeechSegments({
    segments,
    voice: config.voice || variant?.voiceProfile?.voice || "auto",
    tone: config.tone || variant?.voiceProfile?.tone || "dynamic",
    language,
    interrupt: false,
  });

  if (!execution?.ok) {
    return {
      ok: false,
      id: variant?.id || null,
      kind: variant?.kind || null,
      label: variant?.label || null,
      error: execution?.error || {
        code: "VOICE_SYNTHESIS_FAILED",
        message: "Voice synthesis failed.",
      },
    };
  }

  return {
    ok: true,
    id: variant?.id || null,
    kind: variant?.kind || null,
    label: variant?.label || null,
    voiceProfile: variant?.voiceProfile || null,
    synthesis: {
      ...variant?.synthesis,
      provider: execution.provider,
      mode: execution.mode,
      limitations: execution.limitations,
      executedLanguage: language,
      selectedVoice: execution?.meta?.voice || null,
    },
    text: variant?.text || null,
    sourceSegments: variant?.segments || [],
    spokenSegments: mergeSegmentExecution({
      plannedSegments: variant?.segments || [],
      spokenSegments: execution?.segments || [],
    }),
    timing: buildExecutedTiming(execution?.segments || []),
    qualityHints: variant?.qualityHints || null,
    meta: execution?.meta || null,
  };
}

function mergeSegmentExecution({ plannedSegments, spokenSegments }) {
  const spokenMap = new Map();

  for (const item of spokenSegments || []) {
    if (item?.id) spokenMap.set(item.id, item);
  }

  return (plannedSegments || []).map((planned) => {
    const executed = spokenMap.get(planned.id);

    return {
      id: planned.id,
      sceneId: planned.sceneId,
      role: planned.role,
      planned: {
        text: planned.text,
        normalizedText: planned.normalizedText,
        durationMs: planned.durationMs,
        pauseAfterMs: planned.pauseAfterMs,
        delivery: planned.delivery,
        emphasis: planned.emphasis,
        timingHints: planned.timingHints,
      },
      executed: executed
        ? {
            status: executed.status || "spoken",
            text: executed.text,
            lang: executed.lang,
            rate: executed.rate,
            pitch: executed.pitch,
            volume: executed.volume,
            durationMs: executed.durationMs,
            pauseAfterMs: executed.pauseAfterMs,
            startedAt: executed.startedAt,
            finishedAt: executed.finishedAt,
          }
        : null,
    };
  });
}

function buildExecutedTiming(spokenSegments) {
  let cursorMs = 0;

  const timeline = (spokenSegments || []).map((segment) => {
    const durationMs = Number(segment?.durationMs) || 0;
    const pauseAfterMs = Number(segment?.pauseAfterMs) || 0;

    const startMs = cursorMs;
    const speechStartMs = startMs;
    const speechEndMs = speechStartMs + durationMs;
    const endMs = speechEndMs + pauseAfterMs;

    cursorMs = endMs;

    return {
      segmentId: segment?.id || null,
      sceneId: segment?.sceneId || null,
      role: segment?.role || "body",
      startMs,
      speechStartMs,
      speechEndMs,
      endMs,
      durationMs,
      pauseAfterMs,
      status: segment?.status || "spoken",
    };
  });

  return {
    totalSpeechMs: timeline.reduce((sum, item) => sum + item.durationMs, 0),
    totalTimelineMs: timeline.length ? timeline[timeline.length - 1].endMs : 0,
    segments: timeline,
  };
}

async function safeLoadVoices() {
  try {
    return await getAvailableTtsVoices();
  } catch (_error) {
    return [];
  }
}

function inferLanguageFromSegments(segments) {
  const text = (segments || [])
    .map((item) => item?.normalizedText || item?.text || "")
    .join(" ")
    .trim();

  if (!text) return "ru";

  const cyrillic = (text.match(/[а-яё]/gi) || []).length;
  const latin = (text.match(/[a-z]/gi) || []).length;

  return cyrillic >= latin ? "ru" : "en";
}