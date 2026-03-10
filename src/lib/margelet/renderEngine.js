// renderEngine.js
// Финальный сборщик ролика Margelet.
// Объединяет sceneEngine + voiceEngine + captionEngine
// и формирует render plan для генерации mp4.

export async function buildRenderPlans(
  request,
  scenePlanResult,
  voicePlanResult,
  captionPlanResult
) {
  const sceneVariants = mapVariants(scenePlanResult?.variants || []);
  const voiceVariants = mapVariants(voicePlanResult?.variants || []);
  const captionVariants = mapVariants(captionPlanResult?.variants || []);

  const variantIds = Array.from(sceneVariants.keys());

  const renders = variantIds.map((variantId) =>
    buildSingleRenderPlan({
      request,
      scenePlan: sceneVariants.get(variantId),
      voicePlan: voiceVariants.get(variantId),
      captionPlan: captionVariants.get(variantId),
    })
  );

  return {
    input: {
      requestId: request?.meta?.requestId || null,
      variants: renders.length,
      renderFormat: "mp4",
    },
    variants: renders,
  };
}

function buildSingleRenderPlan({ request, scenePlan, voicePlan, captionPlan }) {
  const scenes = scenePlan?.scenes || [];
  const captions = captionPlan?.captions || [];
  const voiceSegments = voicePlan?.segments || [];

  const videoLayers = scenes.map((scene) =>
    buildSceneLayer(scene)
  );

  const audioLayers = buildAudioLayers(voiceSegments, scenePlan);

  const captionLayers = captions.map((caption) =>
    buildCaptionLayer(caption)
  );

  const timeline = buildRenderTimeline({
    scenes,
    voiceSegments,
    captions,
  });

  const totalDuration = scenePlan?.structure?.totalDurationSec || 30;

  return {
    id: scenePlan.id,
    kind: scenePlan.kind,
    label: scenePlan.label,
    export: {
      format: "mp4",
      aspectRatio: "9:16",
      resolution: {
        width: 1080,
        height: 1920,
      },
      fps: 30,
      durationSec: totalDuration,
    },
    layers: {
      video: videoLayers,
      audio: audioLayers,
      captions: captionLayers,
    },
    timeline,
    preview: buildPreviewMeta(scenePlan),
    cleanup: {
      deleteAfterDownload: true,
      ttlMinutes: 30,
    },
  };
}

function buildSceneLayer(scene) {
  const source = scene?.source || {};

  return {
    id: scene.id,
    role: scene.role,
    type: source.type || "generated",
    src: source.previewUrl || null,
    fit: source.fit || "cover",
    crop: source.crop || "center",
    timing: {
      startMs: scene?.timing?.clipStartMs || 0,
      durationMs: scene?.timing?.clipDurationMs || scene?.timing?.durationMs,
    },
    motion: scene?.motion || {},
    overlays: scene?.overlays || {},
  };
}

function buildAudioLayers(voiceSegments, scenePlan) {
  const voiceTracks = voiceSegments.map((segment) => ({
    id: segment.id,
    type: "voice",
    text: segment.normalizedText,
    startMs: segment?.timingHints?.startPaddingMs || 0,
    durationMs: segment.durationMs,
    delivery: segment.delivery,
  }));

  const music = scenePlan?.direction?.musicPlan?.soundtrackId
    ? [
        {
          id: "music_track",
          type: "music",
          sourceId: scenePlan.direction.musicPlan.soundtrackId,
          ducking: scenePlan.direction.musicPlan.duckingProfile,
        },
      ]
    : [];

  return [...voiceTracks, ...music];
}

function buildCaptionLayer(caption) {
  return {
    id: caption.id,
    role: caption.role,
    startMs: caption.startMs,
    endMs: caption.endMs,
    chunks: caption.chunks,
    accentWords: caption.accentWords,
    style: caption.style,
  };
}

function buildRenderTimeline({ scenes, voiceSegments, captions }) {
  return {
    scenes: scenes.map((scene) => ({
      id: scene.id,
      role: scene.role,
      startMs: scene?.timing?.clipStartMs || 0,
      durationMs: scene?.timing?.durationMs,
    })),
    voice: voiceSegments.map((segment) => ({
      id: segment.id,
      sceneId: segment.sceneId,
      durationMs: segment.durationMs,
    })),
    captions: captions.map((caption) => ({
      id: caption.id,
      startMs: caption.startMs,
      endMs: caption.endMs,
    })),
  };
}

function buildPreviewMeta(scenePlan) {
  return {
    posterStrategy: "first-scene",
    previewClipSec: 4,
    previewFrame: scenePlan?.scenes?.[0]?.source?.posterUrl || null,
  };
}

function mapVariants(list) {
  const map = new Map();

  for (const item of list) {
    if (item?.id) {
      map.set(item.id, item);
    }
  }

  return map;
}