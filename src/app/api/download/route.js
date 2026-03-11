// src/app/api/download/route.js

import { NextResponse } from "next/server";
import { getPreviewDescriptor } from "@/lib/margelet/previewStore";
import { resolveAccess } from "@/lib/margelet/accessEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const startedAt = Date.now();

  try {
    const { searchParams } = new URL(req.url);

    const requestId = searchParams.get("requestId");
    const variantId = searchParams.get("variantId");

    const telegramId = searchParams.get("telegramId");
    const username = searchParams.get("username");

    if (!requestId || !variantId) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_DOWNLOAD_REQUEST",
            message: "requestId and variantId are required",
          },
        },
        { status: 400 }
      );
    }

    const preview = getPreviewDescriptor(requestId, variantId);

    if (!preview) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PREVIEW_NOT_FOUND",
            message: "Preview descriptor not found or expired",
          },
        },
        { status: 404 }
      );
    }

    const user = telegramId || username
      ? {
          telegramId,
          username,
        }
      : null;

    const access = resolveAccess({
      user,
      action: "download",
      plan: null,
    });

    if (!access.access.allowed) {
      return NextResponse.json(
        {
          ok: false,
          access,
        },
        { status: 403 }
      );
    }

    const descriptor = preview.data;

    const renderJob = descriptor?.renderJob || null;

    return NextResponse.json({
      ok: true,

      request: {
        requestId,
        variantId,
      },

      download: {
        mode: "client_render",

        format: renderJob?.format || "mp4",
        aspectRatio: renderJob?.aspectRatio || "9:16",

        resolution: renderJob?.resolution || {
          width: 1080,
          height: 1920,
        },

        fps: renderJob?.fps || 30,

        durationSec: renderJob?.durationSec || 30,

        descriptor,
      },

      meta: {
        startedAt,
        finishedAt: Date.now(),
        durationMs: Date.now() - startedAt,
      },
    });
  } catch (error) {
    console.error("Download route error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "DOWNLOAD_ROUTE_ERROR",
          message: error?.message || "Unexpected download route error",
        },
      },
      { status: 500 }
    );
  }
}