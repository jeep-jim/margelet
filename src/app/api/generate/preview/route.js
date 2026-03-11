// src/app/api/generate/preview/route.js

import { NextResponse } from "next/server";
import { getPreviewDescriptor, cleanupExpiredPreviews } from "@/lib/margelet/previewStore";

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
            code: "INVALID_PREVIEW_REQUEST",
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
            code: "PREVIEW_NOT_FOUND",
            message: "Preview descriptor not found or expired.",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      preview: {
        requestId: stored.requestId,
        variantId: stored.variantId,
        createdAt: stored.createdAt,
        expiresAt: stored.expiresAt,
        ...stored.data,
      },
    });
  } catch (error) {
    console.error("Preview route error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "PREVIEW_ROUTE_ERROR",
          message: error?.message || "Unexpected preview route error.",
        },
      },
      { status: 500 }
    );
  }
}