// src/app/api/generate/route.js
// API endpoint для запуска генерации Margelet

import { NextResponse } from "next/server";
import { runGeneration } from "@/lib/margelet/runGeneration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const startedAt = Date.now();

  try {
    const body = await req.json();

    const result = await runGeneration(body);

    if (!result?.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error || {
            code: "GENERATION_FAILED",
            message: "Generation failed",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      request: result.request,
      meta: result.meta,
      preview: result.preview,
    });
  } catch (error) {
    console.error("Generation API error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: error?.message || "Unexpected server error",
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const requestId = searchParams.get("requestId");
  const variantId = searchParams.get("variantId");

  if (!requestId || !variantId) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "INVALID_PREVIEW_REQUEST",
          message: "requestId and variantId are required",
        },
      },
      { status: 400 }
    );
  }

  // Сейчас preview заглушка.
  // Позже сюда подключим render worker.

  return NextResponse.json({
    ok: true,
    preview: {
      requestId,
      variantId,
      status: "preview_not_rendered_yet",
      message: "Preview renderer not connected yet",
    },
  });
}