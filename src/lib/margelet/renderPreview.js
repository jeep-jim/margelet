// src/lib/margelet/renderPreview.js
// Builds truthful preview payloads from render jobs.
// Does not fake mp4 files. Returns renderable preview descriptors only.

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

  const jobs = providerResult.jobs || [];
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
  const posterUrl = job?.preview?.posterUrl || "";
  const requestId = request?.meta?.requestId || job?.requestId || null;
  const variantId = job?.id || `variant_${index + 1}`;

  const previewDescriptor = {
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
      renderer: job?.job?.renderer || "pending-runtime",
      type: job?.job?.type || "preview",
      format: job?.job?.format || "mp4",
      aspectRatio: job?.job?.aspectRatio || "9:16",
      fps: job?.job?.fps || 30,
      resolution: job?.job?.resolution || { width: 1080, height: 1920 },
      durationSec: job?.job?.durationSec || 30,
    },

    tracks: {
      visuals: summarizeVisualTracks(job?.tracks?.visuals || []),
      narration: summarizeNarrationTracks(job?.tracks?.narration || []),
      captions: summarizeCaptionTracks(job?.tracks?.captions || []),
      soundtrack: summarizeSoundtrackTrack(job?.tracks?.soundtrack || null),
    },

    readiness: {
      counts: readiness?.counts || {
        visuals: { total: 0, ready: 0 },
        narration: { total: 0, ready: 0 },
        captions: { total: 0, ready: 0 },
      },
      warnings: readiness?.warnings || [],
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

  return previewDescriptor;
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