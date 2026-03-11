// src/lib/margelet/runGeneration.js
// Main orchestration layer for Margelet.
// Server-safe generation pipeline with:
// - request normalization
// - input preparation
// - scripts
// - scenes
// - voice planning
// - deferred browser TTS metadata (no browser TTS on server)
// - captions
// - preview render descriptors
// - ephemeral preview store

import { normalizeGenerationRequest } from "./generationSchema";
import { prepareGenerationInput } from "./prepareGenerationInput";
import { buildScripts } from "./scriptEngine";
import { buildScenePlans } from "./sceneEngine";
import { buildVoicePlans } from "./voiceEngine";
import { buildCaptionPlans } from "./captionEngine";
import { buildPreviewRenders } from "./renderPreview";
import { savePreviewDescriptors } from "./previewStore";

export async function runGeneration(input = {}) {
  const startedAt = Date.now();

  try {
    const request = normalizeGenerationRequest(input);
    validateGenerationRequest(request);

    const preparedRequest = await prepareGenerationInput(request);
    const scriptResult = await buildScripts(preparedRequest);
    const scenePlanResult = await buildScenePlans(preparedRequest, scriptResult);
    const voicePlanResult = await buildVoicePlans(
      preparedRequest,
      scriptResult,
      scenePlanResult
    );

    // IMPORTANT:
    // Browser TTS must not run inside Next.js API routes / Node runtime.
    // We prepare a deferred client-side synthesis payload instead.
    const voiceSynthesisResult = createDeferredVoiceSynthesisResult(
      preparedRequest,
      voicePlanResult
    );

    const captionPlanResult = await buildCaptionPlans(
      preparedRequest,
      voicePlanResult,
      scenePlanResult
    );

    const previewRenderResult = await buildPreviewRenders({
      request: preparedRequest,
      scenePlanResult,
      voicePlanResult,
      voiceSynthesisResult,
      captionPlanResult,
    });

    if (!previewRenderResult?.ok) {
      return {
        ok: false,
        error: previewRenderResult?.error || {
          code: "PREVIEW_RENDER_FAILED",
          message: "Preview render preparation failed.",
        },
        meta: {
          startedAt,
          finishedAt: Date.now(),
          durationMs: Date.now() - startedAt,
        },
        pipeline: {
          request: preparedRequest,
          scripts: scriptResult,
          scenes: scenePlanResult,
          voice: voicePlanResult,
          voiceSynthesis: voiceSynthesisResult,
          captions: captionPlanResult,
          previewRenders: previewRenderResult,
        },
      };
    }

    const previewStoreResult = savePreviewDescriptors(previewRenderResult, {
      ttlMinutes: 30,
    });

    if (!previewStoreResult?.ok) {
      return {
        ok: false,
        error: previewStoreResult?.error || {
          code: "PREVIEW_STORE_FAILED",
          message: "Failed to store preview descriptors.",
        },
        meta: {
          startedAt,
          finishedAt: Date.now(),
          durationMs: Date.now() - startedAt,
        },
        pipeline: {
          request: preparedRequest,
          scripts: scriptResult,
          scenes: scenePlanResult,
          voice: voicePlanResult,
          voiceSynthesis: voiceSynthesisResult,
          captions: captionPlanResult,
          previewRenders: previewRenderResult,
          previewStore: previewStoreResult,
        },
      };
    }

    const preview = buildPreviewResponse({
      request: preparedRequest,
      previewRenderResult,
      previewStoreResult,
      scriptResult,
      scenePlanResult,
      voicePlanResult,
      voiceSynthesisResult,
      captionPlanResult,
    });

    return {
      ok: true,
      request: {
        requestId: preparedRequest?.meta?.requestId || null,
        createdAt: preparedRequest?.meta?.createdAt || null,
        mode: preparedRequest?.config?.mode || "preview",
      },
      meta: {
        startedAt,
        finishedAt: Date.now(),
        durationMs: Date.now() - startedAt,
      },
      preview,
      pipeline: {
        request: preparedRequest,
        scripts: scriptResult,
        scenes: scenePlanResult,
        voice: voicePlanResult,
        voiceSynthesis: voiceSynthesisResult,
        captions: captionPlanResult,
        previewRenders: previewRenderResult,
        previewStore: previewStoreResult,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: serializeGenerationError(error),
      meta: {
        startedAt,
        finishedAt: Date.now(),
        durationMs: Date.now() - startedAt,
      },
    };
  }
}

function createDeferredVoiceSynthesisResult(request, voicePlanResult) {
  const startedAt = Date.now();
  const variants = (voicePlanResult?.variants || []).map((variant) =>
    createDeferredVoiceVariant(variant)
  );

  return {
    ok: true,
    provider: "browser-speech-synthesis",
    mode: "deferred-client-runtime",
    runtime: {
      clientOnly: true,
      deferred: true,
      downloadableAudioFile: false,
      deterministicAcrossDevices: false,
      requiresBrowserRuntime: true,
    },
    input: {
      requestId: request?.meta?.requestId || null,
      variantCount: variants.length,
      voice: request?.config?.voice || "auto",
      tone: request?.config?.tone || "dynamic",
    },
    voices: [],
    variants,
    meta: {
      startedAt,
      finishedAt: Date.now(),
      durationMs: Date.now() - startedAt,
    },
  };
}

function createDeferredVoiceVariant(variant) {
  const plannedSegments = Array.isArray(variant?.segments) ? variant.segments : [];

  return {
    ok: true,
    id: variant?.id || null,
    kind: variant?.kind || null,
    label: variant?.label || null,
    deferred: true,
    voiceProfile: variant?.voiceProfile || null,
    synthesis: {
      ...(variant?.synthesis || {}),
      provider: "browser-speech-synthesis",
      mode: "deferred-client-runtime",
      limitations: {
        downloadableAudioFile: false,
        deterministicAcrossDevices: false,
        requiresBrowserRuntime: true,
      },
      selectedVoice: null,
      executedLanguage:
        variant?.synthesis?.language ||
        inferLanguageFromSegments(plannedSegments) ||
        "ru",
    },
    text: variant?.text || {
      fullText: plannedSegments
        .map((segment) => safeText(segment?.normalizedText || segment?.text))
        .filter(Boolean)
        .join(" "),
    },
    sourceSegments: plannedSegments,
    spokenSegments: plannedSegments.map((segment) => ({
      id: segment?.id || null,
      sceneId: segment?.sceneId || null,
      role: segment?.role || "body",
      planned: {
        text: safeText(segment?.text),
        normalizedText: safeText(segment?.normalizedText || segment?.text),
        durationMs: Number(segment?.durationMs) || 0,
        pauseAfterMs: Number(segment?.pauseAfterMs) || 0,
        delivery: segment?.delivery || null,
        emphasis: segment?.emphasis || null,
        timingHints: segment?.timingHints || null,
      },
      executed: null,
    })),
    timing: buildPlannedTiming(plannedSegments),
    qualityHints: variant?.qualityHints || null,
    meta: {
      deferred: true,
      message: "Voice synthesis will run in the browser preview runtime.",
    },
  };
}

function buildPlannedTiming(segments) {
  let cursorMs = 0;

  const timeline = (segments || []).map((segment) => {
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
      status: "planned",
    };
  });

  return {
    totalSpeechMs: timeline.reduce((sum, item) => sum + item.durationMs, 0),
    totalTimelineMs: timeline.length ? timeline[timeline.length - 1].endMs : 0,
    segments: timeline,
  };
}

function buildPreviewResponse({
  request,
  previewRenderResult,
  previewStoreResult,
  scriptResult,
  scenePlanResult,
  voicePlanResult,
  voiceSynthesisResult,
  captionPlanResult,
}) {
  const renderMap = mapById(previewRenderResult?.previews || []);
  const scriptMap = mapById(scriptResult?.variants || []);
  const sceneMap = mapById(scenePlanResult?.variants || []);
  const voiceMap = mapById(voicePlanResult?.variants || []);
  const voiceSynthMap = mapById(voiceSynthesisResult?.variants || []);
  const captionMap = mapById(captionPlanResult?.variants || []);

  const variantIds = Array.from(renderMap.keys());

  const variants = variantIds.map((id, index) => {
    const renderPreview = renderMap.get(id) || null;
    const script = scriptMap.get(id) || null;
    const scene = sceneMap.get(id) || null;
    const voice = voiceMap.get(id) || null;
    const voiceSynth = voiceSynthMap.get(id) || null;
    const captions = captionMap.get(id) || null;

    return buildPreviewVariant({
      id,
      index,
      request,
      renderPreview,
      script,
      scene,
      voice,
      voiceSynth,
      captions,
    });
  });

  return {
    requestId: request?.meta?.requestId || null,
    mode: request?.config?.mode || "preview",
    summary: {
      format: request?.config?.format || null,
      topic: request?.config?.topic || "",
      duration: request?.config?.duration || 30,
      tone: request?.config?.tone || "dynamic",
      voice: request?.config?.voice || "auto",
      variantCount: variants.length,
      previewStored: Boolean(previewStoreResult?.ok),
      previewExpiresAt: previewStoreResult?.expiresAt || null,
    },
    access: {
      previewAllowed: true,
      downloadRequiresPlan: true,
      authRequiredForDownload: true,
    },
    variants,
  };
}

function buildPreviewVariant({
  id,
  index,
  request,
  renderPreview,
  script,
  scene,
  voice,
  voiceSynth,
  captions,
}) {
  const requestId = request?.meta?.requestId || null;
  const totalDurationSec =
    renderPreview?.renderJob?.durationSec ||
    scene?.structure?.totalDurationSec ||
    request?.config?.duration ||
    30;

  return {
    id,
    label: script?.label || renderPreview?.label || {
      ru: `Вариант ${index + 1}`,
      en: `Variant ${index + 1}`,
    },
    kind: script?.kind || renderPreview?.kind || "default",
    score: script?.score || renderPreview?.score || 80,

    poster: renderPreview?.poster?.url || "",
    previewUrl:
      renderPreview?.endpoint?.previewStatusUrl ||
      buildPreviewStatusUrl(requestId, id),

    playback: renderPreview?.playback || {
      playable: false,
      previewUrl: null,
      reason: "preview_video_not_rendered_yet",
    },

    info: {
      format: request?.config?.format || null,
      durationSec: totalDurationSec,
      tone: request?.config?.tone || "dynamic",
      voice: request?.config?.voice || "auto",
      sceneCount: scene?.structure?.sceneCount || 0,
      captionStyle: captions?.style || null,
      previewStatus: renderPreview?.status || "incomplete",
      readyForPreviewRender: Boolean(renderPreview?.readyForPreviewRender),
    },

    creative: {
      hook: script?.creative?.hook || "",
      angle: script?.creative?.angle || "",
      cta: script?.creative?.cta || null,
    },

    script: {
      fullText:
        voiceSynth?.text?.fullText ||
        voice?.text?.fullText ||
        script?.narration?.fullText ||
        "",
      lines:
        voiceSynth?.spokenSegments?.map((segment) => ({
          sceneId: segment.sceneId,
          text:
            segment?.planned?.text ||
            segment?.planned?.normalizedText ||
            "",
          role: segment.role,
          spoken: Boolean(segment?.executed),
        })) ||
        voice?.segments?.map((segment) => ({
          sceneId: segment.sceneId,
          text: segment.text,
          role: segment.role,
          spoken: false,
        })) ||
        [],
    },

    scenes:
      scene?.scenes?.map((item) => ({
        id: item.id,
        role: item.role,
        durationSec: item?.timing?.durationSec || 0,
        sourceType: item?.source?.type || "generated",
        sourceMode: item?.source?.mode || "generated-or-typography",
        caption: item?.narrative?.caption || "",
        narration: item?.narrative?.narration || "",
      })) || [],

    captions: captions?.captions || [],

    preview: {
      status: renderPreview?.status || "incomplete",
      readyForPreviewRender: Boolean(renderPreview?.readyForPreviewRender),
      posterAvailable: Boolean(renderPreview?.poster?.available),
      warnings: renderPreview?.readiness?.warnings || [],
      endpoint: renderPreview?.endpoint || {
        previewStatusUrl: buildPreviewStatusUrl(requestId, id),
        previewRenderUrl: buildPreviewRenderUrl(requestId, id),
      },
    },

    renderReadiness: renderPreview?.readiness || null,

    access: {
      canPreview: true,
      canDownload: false,
      lockedReason: "plan_required",
    },
  };
}

function validateGenerationRequest(request) {
  const topic = request?.config?.topic || "";
  const format = request?.config?.format || null;
  const assets = request?.sources?.assets || {};
  const hasTopic = topic.trim().length > 0;
  const hasAssets =
    (assets.images?.length || 0) > 0 ||
    (assets.videos?.length || 0) > 0 ||
    (assets.audio?.length || 0) > 0 ||
    (assets.files?.length || 0) > 0;
  const hasLinks = (request?.sources?.links || []).length > 0;
  const hasNotes = (request?.sources?.notes || "").trim().length > 0;

  if (!format) {
    throw createGenerationError(
      "FORMAT_REQUIRED",
      "Format is required to run generation."
    );
  }

  if (!hasTopic && !hasAssets && !hasLinks && !hasNotes) {
    throw createGenerationError(
      "CONTENT_REQUIRED",
      "Provide a topic, media, links, or notes before generation."
    );
  }
}

function buildPreviewStatusUrl(requestId, variantId) {
  return `/api/generate/preview?requestId=${encodeURIComponent(
    requestId || "unknown"
  )}&variantId=${encodeURIComponent(variantId || "unknown")}`;
}

function buildPreviewRenderUrl(requestId, variantId) {
  return `/api/generate/preview/render?requestId=${encodeURIComponent(
    requestId || "unknown"
  )}&variantId=${encodeURIComponent(variantId || "unknown")}`;
}

function mapById(list) {
  const map = new Map();

  for (const item of list || []) {
    if (item?.id) {
      map.set(item.id, item);
    }
  }

  return map;
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

function safeText(value) {
  if (value == null) return "";
  return String(value).trim();
}

function createGenerationError(code, message, details = null) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function serializeGenerationError(error) {
  return {
    code: error?.code || "GENERATION_FAILED",
    message: error?.message || "Generation failed.",
    details: error?.details || null,
  };
}