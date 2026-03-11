// src/app/api/generate/route.js

import { NextResponse } from "next/server";
import { runGeneration } from "@/lib/margelet/runGeneration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const startedAt = Date.now();

  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "EMPTY_REQUEST",
            message: "Generation request body is empty",
          },
          meta: {
            startedAt,
            finishedAt: Date.now(),
            durationMs: Date.now() - startedAt,
          },
        },
        { status: 400 }
      );
    }

    const result = await runGeneration(body);

    if (!result?.ok) {
      const code = result?.error?.code || "GENERATION_FAILED";
      const status =
        code === "FORMAT_REQUIRED" ||
        code === "CONTENT_REQUIRED" ||
        code === "EMPTY_REQUEST"
          ? 400
          : 500;

      return NextResponse.json(
        {
          ok: false,
          error: result.error || {
            code: "GENERATION_FAILED",
            message: "Generation pipeline failed",
          },
          meta: result.meta || {
            startedAt,
            finishedAt: Date.now(),
            durationMs: Date.now() - startedAt,
          },
        },
        { status }
      );
    }

    return NextResponse.json({
      ok: true,
      request: result.request,
      preview: result.preview,
      meta: {
        startedAt,
        finishedAt: Date.now(),
        durationMs: Date.now() - startedAt,
      },
    });
  } catch (error) {
    console.error("Generation route error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "GENERATION_ROUTE_ERROR",
          message: error?.message || "Unexpected generation route error",
        },
        meta: {
          startedAt,
          finishedAt: Date.now(),
          durationMs: Date.now() - startedAt,
        },
      },
      { status: 500 }
    );
  }
}