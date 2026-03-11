// src/lib/margelet/renderPreview.js
// Builds truthful preview payloads from render jobs.
// Keeps full renderable tracks for browser preview runtime.

import { createRenderJobs } from "./providers/renderProvider";

export async function buildPreviewRenders(input = {}) {
  const {
    request = null,
    scenePlanResult = null,
    voicePlanResult = null,
    voiceSynthesisResult = null,
    captionPlanResult = null,
  } = input;

  const providerResult = await createRenderJobs({
    request,
    scenePlanResult,
    voicePlanResult,
    voiceSynthesisResult,
    captionPlanResult,
  });

  if (!providerResult?.ok) {
    return {
      ok: false,
      error: providerResult?.error || {
        code: "RENDER_PROVIDER_FAILED",
        message: "Render provider failed.",
      },
    };
  }

  const jobs = Array.isArray(providerResult.jobs) ? providerResult.jobs : [];
  const previews = jobs.map((job, index) =>
    buildSinglePreview({
      job,
      index,
      request,
    })
  );

  const readyCount = previews.filter((item) => item.readyForPreviewRender).length;

  return {
    ok: true,
    provider: providerResult.provider,
    mode: "preview-descriptor",
    input: {
      requestId: request?.meta?.requestId || null,
      variantCount: previews.length,
    },
    summary: {
      total: previews.length,
      ready: readyCount,
      notReady: Math.max(0, previews.length - readyCount),
    },
    previews,
  };
}

function buildSinglePreview({ job, index, request }) {
  const readiness = job?.readiness || {};
  const posterUrl = pickPosterFromTracks(job?.tracks?.visuals || []) || job?.preview?.posterUrl || "";
  const requestId = request?.meta?.requestId || job?.requestId || null;
  const variantId = job?.id || `variant_${index + 1}`;

  return {
    id: variantId,
    order: job?.order || index + 1,
    requestId,
    label: job?.label || {
      ru: `Вариант ${index + 1}`,
      en: `Variant ${index + 1}`,
    },
    kind: job?.kind || "default",
    score: job?.score || null,

    readyForPreviewRender: Boolean(readiness?.readyForPreviewRender),
    status: buildPreviewStatus(readiness),

    poster: {
      url: posterUrl,
      available: Boolean(posterUrl),
    },

    playback: {
      playable: false,
      previewUrl: null,
      reason: "preview_video_not_rendered_yet",
    },

    renderJob: {
      renderer: job?.job?.renderer || "browser-runtime",
      type: job?.job?.type || "preview",
      format: job?.job?.format || "webm",
      aspectRatio: job?.job?.aspectRatio || "9:16",
      fps: Number(job?.job?.fps) || 30,
      resolution: job?.job?.resolution || {
        width: 1080,
        height: 1920,
      },
      durationSec:
        Number(job?.job?.durationSec) ||
        inferDurationSecFromTracks(job?.tracks) ||
        30,
    },

    // IMPORTANT:
    // keep full renderable tracks, not only summary
    tracks: {
      visuals: normalizeVisualTracks(job?.tracks?.visuals || []),
      narration: normalizeNarrationTracks(job?.tracks?.narration || []),
      captions: normalizeCaptionTracks(job?.tracks?.captions || []),
      soundtrack: normalizeSoundtrackTrack(job?.tracks?.soundtrack || null),
    },

    // optional UI/debug summary
    summary: {
      visuals: summarizeVisualTracks(job?.tracks?.visuals || []),
      narration: summarizeNarrationTracks(job?.tracks?.narration || []),
      captions: summarizeCaptionTracks(job?.tracks?.captions || []),
      soundtrack: summarizeSoundtrackTrack(job?.tracks?.soundtrack || null),
    },

    readiness: {
      readyForPreviewRender: Boolean(readiness?.readyForPreviewRender),
      counts: readiness?.counts || {
        visuals: { total: 0, ready: 0 },
        narration: { total: 0, ready: 0 },
        captions: { total: 0, ready: 0 },
      },
      warnings: Array.isArray(readiness?.warnings) ? readiness.warnings : [],
      soundtrack: readiness?.soundtrack || {
        enabled: false,
        renderable: false,
      },
    },

    endpoint: {
      previewStatusUrl: buildPreviewStatusUrl(requestId, variantId),
      previewRenderUrl: buildPreviewRenderUrl(requestId, variantId),
    },

    cleanup: job?.cleanup || {
      persistentStorage: false,
      deleteAfterRender: true,
      ttlMinutes: 30,
    },
  };
}

function normalizeVisualTracks(tracks) {
  return (tracks || []).map((track, index) => ({
    id: track?.id || `visual_${index + 1}`,
    sceneId: track?.sceneId || null,
    role: track?.role || "body",
    source: {
      type: track?.source?.type || "generated",
      mode: track?.source?.mode || "generated-or-typography",
      sourceId: track?.source?.sourceId || null,
      url:
        track?.source?.url ||
        track?.source?.previewUrl ||
        track?.source?.posterUrl ||
        "",
      previewUrl:
        track?.source?.previewUrl ||
        track?.source?.url ||
        track?.source?.posterUrl ||
        "",
      posterUrl:
        track?.source?.posterUrl ||
        track?.source?.url ||
        track?.source?.previewUrl ||
        "",
      thumbnailUrl:
        track?.source?.thumbnailUrl ||
        track?.source?.posterUrl ||
        track?.source?.url ||
        "",
      text:
        track?.source?.text ||
        track?.text ||
        track?.caption ||
        "",
    },
    timing: {
      startMs:
        Number(track?.timing?.startMs) ||
        Number(track?.timing?.fromMs) ||
        0,
      endMs:
        Number(track?.timing?.endMs) ||
        Number(track?.timing?.toMs) ||
        0,
      durationMs:
        Number(track?.timing?.durationMs) ||
        deriveDurationMs(track?.timing?.startMs, track?.timing?.endMs),
    },
    readiness: {
      hasConcreteSource: Boolean(track?.readiness?.hasConcreteSource),
      renderableAsTypography: Boolean(track?.readiness?.renderableAsTypography),
      requiresGeneratedVisual: Boolean(track?.readiness?.requiresGeneratedVisual),
      renderable:
        Boolean(track?.readiness?.hasConcreteSource) ||
        Boolean(track?.readiness?.renderableAsTypography),
    },
  }));
}

function normalizeNarrationTracks(tracks) {
  return (tracks || []).map((track, index) => ({
    id: track?.id || `narration_${index + 1}`,
    sceneId: track?.sceneId || null,
    role: track?.role || "body",
    execution: {
      spoken: Boolean(track?.execution?.spoken),
      status: track?.execution?.status || "not-spoken",
      lang: track?.execution?.lang || null,
      audioUrl:
        track?.execution?.audioUrl ||
        track?.execution?.url ||
        "",
    },
    timing: {
      startMs:
        Number(track?.timing?.startMs) ||
        Number(track?.timing?.speechStartMs) ||
        0,
      speechStartMs:
        Number(track?.timing?.speechStartMs) ||
        Number(track?.timing?.startMs) ||
        0,
      speechEndMs:
        Number(track?.timing?.speechEndMs) ||
        Number(track?.timing?.endMs) ||
        0,
      endMs:
        Number(track?.timing?.endMs) ||
        Number(track?.timing?.speechEndMs) ||
        0,
      durationMs:
        Number(track?.timing?.durationMs) ||
        deriveDurationMs(
          track?.timing?.speechStartMs || track?.timing?.startMs,
          track?.timing?.speechEndMs || track?.timing?.endMs
        ),
    },
    readiness: {
      renderable: Boolean(track?.readiness?.renderable),
      reason: track?.readiness?.reason || null,
    },
    text:
      track?.text ||
      track?.normalizedText ||
      track?.execution?.text ||
      "",
  }));
}

function normalizeCaptionTracks(tracks) {
  return (tracks || []).map((track, index) => ({
    id: track?.id || `caption_${index + 1}`,
    sceneId: track?.sceneId || null,
    role: track?.role || "body",
    chunks: Array.isArray(track?.chunks)
      ? track.chunks.map((chunk, chunkIndex) => ({
          id: chunk?.id || `${track?.id || `caption_${index + 1}`}_chunk_${chunkIndex + 1}`,
          text: chunk?.text || "",
        }))
      : [],
    timing: {
      startMs:
        Number(track?.timing?.startMs) ||
        Number(track?.timing?.fromMs) ||
        0,
      endMs:
        Number(track?.timing?.endMs) ||
        Number(track?.timing?.toMs) ||
        0,
      durationMs:
        Number(track?.timing?.durationMs) ||
        deriveDurationMs(track?.timing?.startMs, track?.timing?.endMs),
    },
    readiness: {
      renderable: Boolean(track?.readiness?.renderable),
    },
  }));
}

function normalizeSoundtrackTrack(track) {
  if (!track) {
    return {
      enabled: false,
      renderable: false,
      sourceId: null,
      sourceUrl: "",
      duckingProfile: "balanced",
    };
  }

  return {
    enabled: Boolean(track.enabled),
    renderable: Boolean(track?.readiness?.renderable),
    sourceId: track?.sourceId || null,
    sourceUrl: track?.sourceUrl || "",
    duckingProfile: track?.duckingProfile || "balanced",
  };
}

function summarizeVisualTracks(tracks) {
  return tracks.map((track) => ({
    id: track?.id || null,
    sceneId: track?.sceneId || null,
    role: track?.role || "body",
    type: track?.source?.type || "generated",
    mode: track?.source?.mode || "generated-or-typography",
    hasConcreteSource: Boolean(track?.readiness?.hasConcreteSource),
    renderableAsTypography: Boolean(track?.readiness?.renderableAsTypography),
    requiresGeneratedVisual: Boolean(track?.readiness?.requiresGeneratedVisual),
    sourceId: track?.source?.sourceId || null,
    posterUrl: track?.source?.posterUrl || track?.source?.url || "",
  }));
}

function summarizeNarrationTracks(tracks) {
  return tracks.map((track) => ({
    id: track?.id || null,
    sceneId: track?.sceneId || null,
    role: track?.role || "body",
    spoken: Boolean(track?.execution?.spoken),
    status: track?.execution?.status || "not-spoken",
    lang: track?.execution?.lang || null,
    durationMs: track?.timing?.durationMs || 0,
    renderable: Boolean(track?.readiness?.renderable),
    reason: track?.readiness?.reason || null,
  }));
}

function summarizeCaptionTracks(tracks) {
  return tracks.map((track) => ({
    id: track?.id || null,
    sceneId: track?.sceneId || null,
    role: track?.role || "body",
    chunkCount: Array.isArray(track?.chunks) ? track.chunks.length : 0,
    renderable: Boolean(track?.readiness?.renderable),
  }));
}

function summarizeSoundtrackTrack(track) {
  if (!track) {
    return {
      enabled: false,
      renderable: false,
      sourceId: null,
    };
  }

  return {
    enabled: Boolean(track.enabled),
    renderable: Boolean(track?.readiness?.renderable),
    sourceId: track?.sourceId || null,
    duckingProfile: track?.duckingProfile || "balanced",
  };
}

function buildPreviewStatus(readiness) {
  if (readiness?.readyForPreviewRender) return "renderable";
  if ((readiness?.warnings || []).includes("narration_not_synthesized")) {
    return "waiting-for-narration";
  }
  if ((readiness?.warnings || []).includes("generated_visual_fallback_needed")) {
    return "needs-visual-fallback";
  }
  return "incomplete";
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

function pickPosterFromTracks(visualTracks) {
  const firstConcrete = (visualTracks || []).find(
    (track) => track?.source?.posterUrl || track?.source?.url || track?.source?.previewUrl
  );

  return (
    firstConcrete?.source?.posterUrl ||
    firstConcrete?.source?.url ||
    firstConcrete?.source?.previewUrl ||
    ""
  );
}

function deriveDurationMs(startMs, endMs) {
  const start = Number(startMs) || 0;
  const end = Number(endMs) || 0;
  return end > start ? end - start : 0;
}

function inferDurationSecFromTracks(tracks) {
  const visuals = Array.isArray(tracks?.visuals) ? tracks.visuals : [];
  const narration = Array.isArray(tracks?.narration) ? tracks.narration : [];
  const captions = Array.isArray(tracks?.captions) ? tracks.captions : [];

  const visualEnd = visuals.reduce((max, item) => {
    const endMs =
      Number(item?.timing?.endMs) ||
      Number(item?.timing?.toMs) ||
      0;
    return Math.max(max, endMs);
  }, 0);

  const narrationEnd = narration.reduce((max, item) => {
    const endMs =
      Number(item?.timing?.speechEndMs) ||
      Number(item?.timing?.endMs) ||
      0;
    return Math.max(max, endMs);
  }, 0);

  const captionsEnd = captions.reduce((max, item) => {
    const endMs =
      Number(item?.timing?.endMs) ||
      Number(item?.timing?.toMs) ||
      0;
    return Math.max(max, endMs);
  }, 0);

  const maxMs = Math.max(visualEnd, narrationEnd, captionsEnd);
  if (!maxMs) return 0;

  return Math.max(1, Math.ceil(maxMs / 1000));
}