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

    if (!preview.readyForPreviewRender) {
      return NextResponse.json(
        {
          ok: false,
          status: preview.status || "incomplete",
          error: {
            code: "PREVIEW_NOT_READY",
            message: "Preview is not ready for render yet.",
          },
          preview: {
            requestId: stored.requestId,
            variantId: stored.variantId,
            createdAt: stored.createdAt,
            expiresAt: stored.expiresAt,
            id: preview.id,
            status: preview.status || "incomplete",
            readyForPreviewRender: false,
            readiness: preview.readiness || null,
            playback: preview.playback || {
              playable: false,
              previewUrl: null,
              reason: "preview_video_not_rendered_yet",
            },
            poster: preview.poster || {
              url: "",
              available: false,
            },
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: "renderable",
      render: {
        requestId: stored.requestId,
        variantId: stored.variantId,
        createdAt: stored.createdAt,
        expiresAt: stored.expiresAt,

        descriptor: {
          id: preview.id,
          order: preview.order || 1,
          label: preview.label || null,
          kind: preview.kind || "default",
          score: preview.score || null,
        },

        poster: preview.poster || {
          url: "",
          available: false,
        },

        playback: preview.playback || {
          playable: false,
          previewUrl: null,
          reason: "preview_video_not_rendered_yet",
        },

        renderJob: preview.renderJob || {
          renderer: "pending-runtime",
          type: "preview",
          format: "mp4",
          aspectRatio: "9:16",
          fps: 30,
          resolution: {
            width: 1080,
            height: 1920,
          },
          durationSec: 30,
        },

        tracks: preview.tracks || {
          visuals: [],
          narration: [],
          captions: [],
          soundtrack: {
            enabled: false,
            renderable: false,
            sourceId: null,
          },
        },

        readiness: preview.readiness || {
          counts: {
            visuals: { total: 0, ready: 0 },
            narration: { total: 0, ready: 0 },
            captions: { total: 0, ready: 0 },
          },
          warnings: [],
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
      },
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