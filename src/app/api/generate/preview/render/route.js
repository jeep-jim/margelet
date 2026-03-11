// src/app/api/generate/preview/render/route.js

import { NextResponse } from "next/server";
import {
  getPreviewDescriptor,
  cleanupExpiredPreviews,
} from "@/lib/margelet/previewStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    cleanupExpiredPreviews();

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");
    const variantId = searchParams.get("variantId");

    if (!requestId || !variantId) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_PREVIEW_RENDER_REQUEST",
            message: "requestId and variantId are required.",
          },
        },
        { status: 400 }
      );
    }

    const stored = getPreviewDescriptor(requestId, variantId);

    if (!stored) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PREVIEW_RENDER_NOT_FOUND",
            message: "Preview descriptor not found or expired.",
          },
        },
        { status: 404 }
      );
    }

    const preview = stored.data || null;

    if (!preview) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PREVIEW_DESCRIPTOR_EMPTY",
            message: "Preview descriptor is empty.",
          },
        },
        { status: 404 }
      );
    }

    const render = buildSafeRenderPayload({
      stored,
      preview,
    });

    // IMPORTANT:
    // Do not return 409 here.
    // AgentWorkspace expects { ok: true, render } and immediately tries to
    // boot browser preview runtime from this payload.
    // Even if preview is not fully ready, we still return a safe render payload
    // so the browser can mount poster / captions / whatever is available.
    return NextResponse.json({
      ok: true,
      status: preview.readyForPreviewRender ? "renderable" : "pending",
      pending: !preview.readyForPreviewRender,
      render,
    });
  } catch (error) {
    console.error("Preview render route error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PREVIEW_RENDER_ROUTE_ERROR",
          message: error?.message || "Unexpected preview render route error.",
        },
      },
      { status: 500 }
    );
  }
}

function buildSafeRenderPayload({ stored, preview }) {
  const visuals = Array.isArray(preview?.tracks?.visuals)
    ? preview.tracks.visuals
    : [];

  const narration = Array.isArray(preview?.tracks?.narration)
    ? preview.tracks.narration
    : [];

  const captions = Array.isArray(preview?.tracks?.captions)
    ? preview.tracks.captions
    : [];

  const durationSec =
    preview?.renderJob?.durationSec ||
    preview?.durationSec ||
    inferDurationFromTracks({ narration, captions }) ||
    30;

  return {
    requestId: stored.requestId,
    variantId: stored.variantId,
    createdAt: stored.createdAt,
    expiresAt: stored.expiresAt,

    descriptor: {
      id: preview.id || stored.variantId,
      order: preview.order || 1,
      label: preview.label || null,
      kind: preview.kind || "default",
      score: preview.score || null,
      status: preview.status || "incomplete",
      readyForPreviewRender: Boolean(preview.readyForPreviewRender),
    },

    poster: {
      url: preview?.poster?.url || "",
      available: Boolean(preview?.poster?.available || preview?.poster?.url),
    },

    playback: preview.playback || {
      playable: false,
      previewUrl: null,
      reason: "preview_video_not_rendered_yet",
    },

    renderJob: {
      renderer: preview?.renderJob?.renderer || "browser-runtime",
      type: preview?.renderJob?.type || "preview",
      format: preview?.renderJob?.format || "mp4",
      aspectRatio: preview?.renderJob?.aspectRatio || "9:16",
      fps: preview?.renderJob?.fps || 30,
      resolution: preview?.renderJob?.resolution || {
        width: 1080,
        height: 1920,
      },
      durationSec,
    },

    tracks: {
      visuals,
      narration,
      captions,
      soundtrack: preview?.tracks?.soundtrack || {
        enabled: false,
        renderable: false,
        sourceId: null,
      },
    },

    readiness: preview.readiness || {
      counts: {
        visuals: { total: visuals.length, ready: visuals.length },
        narration: { total: narration.length, ready: narration.length },
        captions: { total: captions.length, ready: captions.length },
      },
      warnings: !preview.readyForPreviewRender
        ? ["Preview is still warming up. Returning safe browser render payload."]
        : [],
      soundtrack: {
        enabled: false,
        renderable: false,
      },
    },

    cleanup: preview.cleanup || {
      persistentStorage: false,
      deleteAfterRender: true,
      ttlMinutes: 30,
    },
  };
}

function inferDurationFromTracks({ narration, captions }) {
  const narrationEndMs = narration.reduce((max, item) => {
    const startMs =
      item?.timing?.startMs ??
      item?.timing?.speechStartMs ??
      0;

    const durationMs =
      item?.timing?.durationMs ??
      Math.max(
        0,
        (item?.timing?.speechEndMs ?? 0) - (item?.timing?.speechStartMs ?? 0)
      );

    return Math.max(max, startMs + durationMs);
  }, 0);

  const captionsEndMs = captions.reduce((max, item) => {
    const endMs =
      item?.timing?.endMs ??
      item?.timing?.toMs ??
      item?.timing?.finishMs ??
      0;

    return Math.max(max, endMs);
  }, 0);

  const endMs = Math.max(narrationEndMs, captionsEndMs);

  if (!endMs) return 0;

  return Math.max(1, Math.ceil(endMs / 1000));
}