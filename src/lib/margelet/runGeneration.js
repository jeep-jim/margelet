// src/lib/margelet/runGeneration.js
// Main orchestration layer for Margelet.
// Full generation pipeline with:
// - request normalization
// - input preparation
// - scripts
// - scenes
// - voice planning
// - real browser TTS execution
// - captions
// - preview render descriptors
// - ephemeral preview store

import { normalizeGenerationRequest } from "./generationSchema";
import { prepareGenerationInput } from "./prepareGenerationInput";
import { buildScripts } from "./scriptEngine";
import { buildScenePlans } from "./sceneEngine";
import { buildVoicePlans } from "./voiceEngine";
import { runVoiceSynthesis } from "./voiceSynthesis";
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

    const voiceSynthesisResult = await runVoiceSynthesis(
      preparedRequest,
      voicePlanResult
    );

    if (!voiceSynthesisResult?.ok) {
      return {
        ok: false,
        error: voiceSynthesisResult?.error || {
          code: "VOICE_SYNTHESIS_FAILED",
          message: "Voice synthesis failed.",
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
        },
      };
    }

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
        requestId: preparedRequest.meta.requestId,
        createdAt: preparedRequest.meta.createdAt,
        mode: preparedRequest.config.mode,
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