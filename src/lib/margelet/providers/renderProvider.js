// src/lib/margelet/providers/renderProvider.js
// Real render provider contract for Margelet preview rendering.
// Prepares truthful render jobs for browser preview / client export.

export async function createRenderJobs(input = {}) {
  const {
    request = null,
    scenePlanResult = null,
    voicePlanResult = null,
    voiceSynthesisResult = null,
    captionPlanResult = null,
  } = input;

  const sceneVariants = mapById(scenePlanResult?.variants || []);
  const voiceVariants = mapById(voicePlanResult?.variants || []);
  const synthesisVariants = mapById(voiceSynthesisResult?.variants || []);
  const captionVariants = mapById(captionPlanResult?.variants || []);

  const variantIds = Array.from(sceneVariants.keys());

  if (variantIds.length === 0) {
    return {
      ok: false,
      error: {
        code: "NO_RENDER_VARIANTS",
        message: "No scene variants were provided to the render provider.",
      },
    };
  }

  const jobs = variantIds.map((variantId, index) =>
    buildSingleRenderJob({
      variantId,
      index,
      request,
      sceneVariant: sceneVariants.get(variantId) || null,
      voiceVariant: voiceVariants.get(variantId) || null,
      synthesisVariant: synthesisVariants.get(variantId) || null,
      captionVariant: captionVariants.get(variantId) || null,
    })
  );

  return {
    ok: true,
    provider: "margelet-render-provider",
    mode: "render-job-preparation",
    input: {
      requestId: request?.meta?.requestId || null,
      variantCount: jobs.length,
      format: request?.config?.format || null,
      topic: request?.config?.topic || "",
      duration: request?.config?.duration || 30,
    },
    jobs,
  };
}

function buildSingleRenderJob({
  variantId,
  index,
  request,
  sceneVariant,
  voiceVariant,
  synthesisVariant,
  captionVariant,
}) {
  const scenes = Array.isArray(sceneVariant?.scenes) ? sceneVariant.scenes : [];
  const captions = Array.isArray(captionVariant?.captions) ? captionVariant.captions : [];
  const synthesisSegments = Array.isArray(synthesisVariant?.spokenSegments)
    ? synthesisVariant.spokenSegments
    : [];
  const exportSettings = sceneVariant?.exportPlan || buildFallbackExportPlan();

  const sceneTimeline = buildSceneTimeline(scenes);

  const visualTracks = scenes.map((scene, sceneIndex) =>
    buildVisualTrack({
      scene,
      sceneIndex,
      absoluteStartMs: sceneTimeline[sceneIndex]?.startMs || 0,
    })
  );

  const narrationTracks = synthesisSegments.map((segment, segmentIndex) =>
    buildNarrationTrack({
      segment,
      segmentIndex,
      synthesisVariant,
    })
  );

  const captionTracks = captions.map((caption, captionIndex) =>
    buildCaptionTrack({
      caption,
      captionIndex,
    })
  );

  const soundtrackTrack = buildSoundtrackTrack(sceneVariant);
  const timeline = {
    scenes: sceneTimeline,
    narration: buildNarrationTimeline(synthesisSegments),
    captions: buildCaptionTimeline(captions),
  };

  const readiness = buildReadinessReport({
    visualTracks,
    narrationTracks,
    captionTracks,
    soundtrackTrack,
  });

  return {
    id: variantId,
    order: index + 1,
    requestId: request?.meta?.requestId || null,
    label: sceneVariant?.label || {
      ru: `Вариант ${index + 1}`,
      en: `Variant ${index + 1}`,
    },
    kind: sceneVariant?.kind || "default",
    score: sceneVariant?.score || null,

    job: {
      renderer: "browser-runtime",
      type: "preview",
      format: "mp4",
      aspectRatio: "9:16",
      fps: exportSettings?.fps || 30,
      resolution: exportSettings?.resolution || {
        width: 1080,
        height: 1920,
      },
      durationSec:
        Number(sceneVariant?.structure?.totalDurationSec) ||
        Number(request?.config?.duration) ||
        inferDurationSecFromSceneTimeline(sceneTimeline) ||
        30,
    },

    tracks: {
      visuals: visualTracks,
      narration: narrationTracks,
      soundtrack: soundtrackTrack,
      captions: captionTracks,
    },

    timeline,
    readiness,

    preview: {
      posterUrl: pickPosterFromTracks(visualTracks),
      playablePreviewUrl: null,
      status: readiness.readyForPreviewRender ? "renderable" : "incomplete",
    },

    cleanup: {
      persistentStorage: false,
      deleteAfterRender: true,
      ttlMinutes: 30,
    },
  };
}

function buildVisualTrack({ scene, sceneIndex, absoluteStartMs }) {
  const source = scene?.source || {};
  const timing = scene?.timing || {};
  const overlays = scene?.overlays || {};
  const motion = scene?.motion || {};
  const composition = scene?.composition || {};

  const sourceType = source?.type || "generated";

  const concreteUrl =
    source?.url ||
    source?.previewUrl ||
    source?.posterUrl ||
    source?.thumbnailUrl ||
    "";

  const hasConcreteSource = Boolean(concreteUrl);

  const durationMs = Number(timing?.durationMs) || 0;

  return {
    id: `visual_${scene?.id || sceneIndex + 1}`,
    sceneId: scene?.id || `scene_${sceneIndex + 1}`,
    role: scene?.role || "body",
    source: {
      type: sourceType,
      mode: source?.mode || "generated-or-typography",
      url: hasConcreteSource ? concreteUrl : "",
      previewUrl:
        source?.previewUrl ||
        source?.url ||
        source?.posterUrl ||
        source?.thumbnailUrl ||
        "",
      posterUrl:
        source?.posterUrl ||
        source?.previewUrl ||
        source?.url ||
        source?.thumbnailUrl ||
        "",
      thumbnailUrl:
        source?.thumbnailUrl ||
        source?.posterUrl ||
        source?.previewUrl ||
        source?.url ||
        "",
      sourceId: source?.sourceId || null,
      generatorPrompt: source?.generatorPrompt || null,
      confidence: source?.confidence || "medium",
      text:
        source?.text ||
        overlays?.text ||
        scene?.narrative?.caption ||
        scene?.narrative?.narration ||
        "",
    },
    timing: {
      startMs: absoluteStartMs,
      endMs: absoluteStartMs + durationMs,
      durationMs,
      clipStartMs: Number(timing?.clipStartMs) || 0,
      clipDurationMs: Number(timing?.clipDurationMs) || durationMs,
    },
    layout: {
      fit: composition?.frame?.fit || source?.fit || "cover",
      crop: composition?.frame?.crop || source?.crop || "center",
      safeArea: composition?.frame?.safeArea || "shorts-safe",
      backgroundTreatment: composition?.backgroundTreatment || "contrast-boost",
      colorTreatment: composition?.colorTreatment || "vivid-shortform",
    },
    motion: {
      cameraMotion: motion?.cameraMotion || null,
      transitionIn: motion?.transitionIn || "cut",
      transitionOut: motion?.transitionOut || "cut",
      motionIntent: motion?.motionIntent || "steady",
    },
    overlays: {
      text: overlays?.text || null,
      captionMode: overlays?.captionMode || null,
      progressTag: overlays?.progressTag || null,
    },
    readiness: {
      hasConcreteSource,
      requiresGeneratedVisual: !hasConcreteSource && sourceType === "generated",
      renderableAsTypography:
        sourceType === "typography" ||
        (!hasConcreteSource && sourceType === "generated"),
    },
  };
}

function buildNarrationTrack({ segment, segmentIndex, synthesisVariant }) {
  const planned = segment?.planned || {};
  const executed = segment?.executed || null;

  const durationMs =
    Number(executed?.durationMs) ||
    Number(planned?.durationMs) ||
    0;

  const startMs =
    Number(segment?.timing?.startMs) ||
    Number(segment?.timing?.speechStartMs) ||
    0;

  const speechStartMs =
    Number(segment?.timing?.speechStartMs) ||
    startMs;

  const speechEndMs =
    Number(segment?.timing?.speechEndMs) ||
    (speechStartMs + durationMs);

  const endMs =
    Number(segment?.timing?.endMs) ||
    speechEndMs + (Number(executed?.pauseAfterMs) || Number(planned?.pauseAfterMs) || 0);

  return {
    id: `narration_${segment?.id || segmentIndex + 1}`,
    sceneId: segment?.sceneId || null,
    role: segment?.role || "body",
    text: planned?.normalizedText || planned?.text || "",
    execution: {
      spoken: Boolean(executed),
      status: executed?.status || "not-spoken",
      lang: executed?.lang || synthesisVariant?.synthesis?.executedLanguage || null,
      rate: executed?.rate ?? planned?.delivery?.speechRate ?? 1,
      pitch: executed?.pitch ?? planned?.delivery?.pitch ?? 1,
      volume: executed?.volume ?? planned?.delivery?.volume ?? 1,
      audioUrl:
        executed?.audioUrl ||
        executed?.url ||
        "",
    },
    timing: {
      startMs,
      speechStartMs,
      speechEndMs,
      endMs,
      durationMs,
      pauseAfterMs:
        Number(executed?.pauseAfterMs) ||
        Number(planned?.pauseAfterMs) ||
        0,
    },
    delivery: planned?.delivery || null,
    readiness: {
      renderable: Boolean(executed?.audioUrl || executed?.url),
      downloadableAudio: false,
      reason:
        executed?.audioUrl || executed?.url
          ? null
          : "browser_tts_not_executed_for_segment",
    },
  };
}

function buildCaptionTrack({ caption, captionIndex }) {
  return {
    id: `caption_track_${caption?.id || captionIndex + 1}`,
    captionId: caption?.id || null,
    sceneId: caption?.sceneId || null,
    role: caption?.role || "body",
    timing: {
      startMs: Number(caption?.startMs) || 0,
      endMs: Number(caption?.endMs) || 0,
      durationMs: Math.max(
        0,
        (Number(caption?.endMs) || 0) - (Number(caption?.startMs) || 0)
      ),
    },
    style: caption?.style || null,
    chunks: (caption?.chunks || []).map((chunk, chunkIndex) => ({
      id: `${caption?.id || captionIndex + 1}_chunk_${chunkIndex + 1}`,
      order: chunk?.order || chunkIndex + 1,
      text: chunk?.text || "",
    })),
    accentWords: caption?.accentWords || [],
    readiness: {
      renderable: true,
    },
  };
}

function buildSoundtrackTrack(sceneVariant) {
  const musicPlan = sceneVariant?.direction?.musicPlan || {};
  const soundtrackId = musicPlan?.soundtrackId || null;
  const soundtrackUrl = musicPlan?.soundtrackUrl || "";
  const useUploadedTrack = Boolean(
    musicPlan?.useUploadedTrack && (soundtrackId || soundtrackUrl)
  );

  return {
    id: "soundtrack_main",
    enabled: useUploadedTrack,
    sourceId: soundtrackId,
    sourceUrl: soundtrackUrl,
    duckingProfile: musicPlan?.duckingProfile || "balanced",
    readiness: {
      renderable: useUploadedTrack,
      reason: useUploadedTrack ? null : "no_uploaded_soundtrack",
    },
  };
}

function buildSceneTimeline(scenes) {
  let cursorMs = 0;

  return (scenes || []).map((scene) => {
    const durationMs = Number(scene?.timing?.durationMs) || 0;
    const startMs = cursorMs;
    const endMs = startMs + durationMs;
    cursorMs = endMs;

    return {
      sceneId: scene?.id || null,
      role: scene?.role || "body",
      startMs,
      endMs,
      durationMs,
    };
  });
}

function buildNarrationTimeline(synthesisSegments) {
  let cursorMs = 0;

  return (synthesisSegments || []).map((segment) => {
    const durationMs =
      Number(segment?.executed?.durationMs) ||
      Number(segment?.planned?.durationMs) ||
      0;
    const pauseAfterMs =
      Number(segment?.executed?.pauseAfterMs) ||
      Number(segment?.planned?.pauseAfterMs) ||
      0;

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
      spoken: Boolean(segment?.executed?.audioUrl || segment?.executed?.url),
    };
  });
}

function buildCaptionTimeline(captions) {
  return (captions || []).map((caption) => ({
    captionId: caption?.id || null,
    sceneId: caption?.sceneId || null,
    role: caption?.role || "body",
    startMs: Number(caption?.startMs) || 0,
    endMs: Number(caption?.endMs) || 0,
  }));
}

function buildReadinessReport({
  visualTracks,
  narrationTracks,
  captionTracks,
  soundtrackTrack,
}) {
  const visualReadyCount = visualTracks.filter(
    (track) =>
      track?.readiness?.hasConcreteSource ||
      track?.readiness?.renderableAsTypography
  ).length;

  const narrationReadyCount = narrationTracks.filter(
    (track) => track?.readiness?.renderable
  ).length;

  const captionReadyCount = captionTracks.filter(
    (track) => track?.readiness?.renderable
  ).length;

  const hasAnyVisuals = visualTracks.length > 0;
  const hasAnyNarration = narrationTracks.length > 0;
  const hasAnyCaptions = captionTracks.length > 0;

  const readyForPreviewRender =
    hasAnyVisuals &&
    visualReadyCount > 0 &&
    (!hasAnyCaptions || captionReadyCount === captionTracks.length);

  return {
    readyForPreviewRender,
    counts: {
      visuals: {
        total: visualTracks.length,
        ready: visualReadyCount,
      },
      narration: {
        total: narrationTracks.length,
        ready: narrationReadyCount,
      },
      captions: {
        total: captionTracks.length,
        ready: captionReadyCount,
      },
    },
    soundtrack: {
      enabled: Boolean(soundtrackTrack?.enabled),
      renderable: Boolean(soundtrackTrack?.readiness?.renderable),
    },
    warnings: buildWarnings({
      visualTracks,
      narrationTracks,
      soundtrackTrack,
      readyForPreviewRender,
    }),
  };
}

function buildWarnings({
  visualTracks,
  narrationTracks,
  soundtrackTrack,
  readyForPreviewRender,
}) {
  const warnings = [];

  if (!readyForPreviewRender) {
    warnings.push("preview_render_not_fully_ready");
  }

  if (visualTracks.some((track) => track?.readiness?.requiresGeneratedVisual)) {
    warnings.push("generated_visual_fallback_needed");
  }

  if (narrationTracks.some((track) => !track?.readiness?.renderable)) {
    warnings.push("narration_not_synthesized");
  }

  if (soundtrackTrack && !soundtrackTrack.readiness?.renderable) {
    warnings.push("soundtrack_missing_or_disabled");
  }

  return warnings;
}

function pickPosterFromTracks(visualTracks) {
  const firstConcrete = (visualTracks || []).find(
    (track) =>
      track?.source?.posterUrl ||
      track?.source?.previewUrl ||
      track?.source?.url
  );

  return (
    firstConcrete?.source?.posterUrl ||
    firstConcrete?.source?.previewUrl ||
    firstConcrete?.source?.url ||
    ""
  );
}

function inferDurationSecFromSceneTimeline(timeline) {
  const last = Array.isArray(timeline) && timeline.length
    ? timeline[timeline.length - 1]
    : null;

  if (!last?.endMs) return 0;
  return Math.max(1, Math.ceil(last.endMs / 1000));
}

function buildFallbackExportPlan() {
  return {
    fps: 30,
    resolution: {
      width: 1080,
      height: 1920,
    },
  };
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