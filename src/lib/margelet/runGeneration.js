// runGeneration.js
// Главный orchestration layer для Margelet.
// Собирает весь pipeline генерации в один вызов.

import { normalizeGenerationRequest } from "./generationSchema";
import { prepareGenerationInput } from "./prepareGenerationInput";
import { buildScripts } from "./scriptEngine";
import { buildScenePlans } from "./sceneEngine";
import { buildVoicePlans } from "./voiceEngine";
import { buildCaptionPlans } from "./captionEngine";
import { buildRenderPlans } from "./renderEngine";

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
    const captionPlanResult = await buildCaptionPlans(
      preparedRequest,
      voicePlanResult,
      scenePlanResult
    );
    const renderPlanResult = await buildRenderPlans(
      preparedRequest,
      scenePlanResult,
      voicePlanResult,
      captionPlanResult
    );

    const preview = buildPreviewResponse({
      request: preparedRequest,
      scriptResult,
      scenePlanResult,
      voicePlanResult,
      captionPlanResult,
      renderPlanResult,
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
        captions: captionPlanResult,
        render: renderPlanResult,
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
  scriptResult,
  scenePlanResult,
  voicePlanResult,
  captionPlanResult,
  renderPlanResult,
}) {
  const scriptMap = mapById(scriptResult?.variants || []);
  const sceneMap = mapById(scenePlanResult?.variants || []);
  const voiceMap = mapById(voicePlanResult?.variants || []);
  const captionMap = mapById(captionPlanResult?.variants || []);
  const renderMap = mapById(renderPlanResult?.variants || []);

  const variantIds = Array.from(renderMap.keys());

  const variants = variantIds.map((id, index) => {
    const script = scriptMap.get(id) || null;
    const scene = sceneMap.get(id) || null;
    const voice = voiceMap.get(id) || null;
    const captions = captionMap.get(id) || null;
    const render = renderMap.get(id) || null;

    return buildPreviewVariant({
      id,
      index,
      request,
      script,
      scene,
      voice,
      captions,
      render,
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
  script,
  scene,
  voice,
  captions,
  render,
}) {
  const sceneList = scene?.scenes || [];
  const firstScene = sceneList[0] || null;
  const previewFrame =
    render?.preview?.previewFrame ||
    firstScene?.source?.posterUrl ||
    firstScene?.source?.previewUrl ||
    "";

  const totalDurationSec =
    render?.export?.durationSec ||
    scene?.structure?.totalDurationSec ||
    request?.config?.duration ||
    30;

  const previewUrl = buildEphemeralPreviewUrl({
    requestId: request?.meta?.requestId,
    variantId: id,
    index,
  });

  return {
    id,
    label: script?.label || scene?.label || { ru: `Вариант ${index + 1}`, en: `Variant ${index + 1}` },
    kind: script?.kind || scene?.kind || "default",
    score: script?.score || scene?.score || 80,

    poster: previewFrame,
    previewUrl,

    info: {
      format: request?.config?.format || null,
      durationSec: totalDurationSec,
      tone: request?.config?.tone || "dynamic",
      voice: request?.config?.voice || "auto",
      sceneCount: scene?.structure?.sceneCount || sceneList.length || 0,
      captionStyle: captions?.style || null,
    },

    creative: {
      hook: script?.creative?.hook || "",
      angle: script?.creative?.angle || "",
      cta: script?.creative?.cta || null,
    },

    script: {
      fullText: voice?.text?.fullText || script?.narration?.fullText || "",
      lines: voice?.segments?.map((segment) => ({
        sceneId: segment.sceneId,
        text: segment.text,
        role: segment.role,
      })) || [],
    },

    scenes: sceneList.map((item) => ({
      id: item.id,
      role: item.role,
      durationSec: item?.timing?.durationSec || 0,
      sourceType: item?.source?.type || "generated",
      sourceMode: item?.source?.mode || "generated-or-typography",
      caption: item?.narrative?.caption || "",
      narration: item?.narrative?.narration || "",
    })),

    captions: captions?.captions || [],
    renderPlan: render || null,

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

function buildEphemeralPreviewUrl({ requestId, variantId, index }) {
  const safeRequestId = requestId || "unknown";
  const safeVariantId = variantId || `variant_${index + 1}`;

  return `/api/generate/preview?requestId=${encodeURIComponent(
    safeRequestId
  )}&variantId=${encodeURIComponent(safeVariantId)}`;
}

function mapById(list) {
  const map = new Map();

  for (const item of list || []) {
    if (item?.id) map.set(item.id, item);
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