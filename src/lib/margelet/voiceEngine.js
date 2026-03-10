// voiceEngine.js
// Строит voice plan для Margelet:
// - разбивает narration на сегменты
// - распределяет тайминги по сценам
// - задаёт delivery / pauses / emphasis
// - готовит структуру под будущий TTS provider

export async function buildVoicePlans(request, scriptResult, scenePlanResult) {
  const config = request?.config || {};
  const variants = scenePlanResult?.variants || [];
  const scriptVariants = mapScriptVariants(scriptResult?.variants || []);

  const plans = variants.map((variantPlan) => {
    const scriptVariant = scriptVariants.get(variantPlan.id) || null;

    return buildSingleVoicePlan({
      config,
      variantPlan,
      scriptVariant,
    });
  });

  return {
    input: {
      requestId: request?.meta?.requestId || null,
      variantCount: plans.length,
      voice: config.voice || "auto",
      tone: config.tone || "dynamic",
    },
    variants: plans,
  };
}

function buildSingleVoicePlan({ config, variantPlan, scriptVariant }) {
  const scenes = variantPlan?.scenes || [];
  const baseVoice = config.voice || "auto";
  const baseTone = config.tone || "dynamic";

  const segments = scenes.map((scene, index) =>
    buildVoiceSegment({
      scene,
      index,
      baseVoice,
      baseTone,
      variantPlan,
    })
  );

  const timing = buildVoiceTiming(segments);
  const providerHints = buildProviderHints({
    baseVoice,
    baseTone,
    variantPlan,
    segments,
  });

  const assembledText = segments.map((item) => item.text).join(" ").trim();

  return {
    id: variantPlan.id,
    kind: variantPlan.kind,
    label: variantPlan.label,
    voiceProfile: {
      voice: baseVoice,
      tone: baseTone,
      delivery: variantPlan?.direction?.narrationDelivery || "balanced",
      pacing: variantPlan?.direction?.pacing || "medium",
      energy: variantPlan?.direction?.energy || "balanced",
    },
    synthesis: {
      provider: "pending-provider",
      language: detectLanguage(assembledText),
      providerHints,
    },
    text: {
      fullText: assembledText,
      fullTextNormalized: normalizeSpeechText(assembledText),
      lineCount: segments.length,
    },
    segments,
    timing,
    qualityHints: buildQualityHints(segments, scriptVariant, variantPlan),
  };
}

function buildVoiceSegment({
  scene,
  index,
  baseVoice,
  baseTone,
  variantPlan,
}) {
  const sourceText =
    safeText(scene?.narrative?.narration) ||
    safeText(scene?.narrative?.caption) ||
    "";

  const normalizedText = normalizeSpeechText(sourceText);
  const durationMs = scene?.timing?.durationMs || estimateDurationMs(normalizedText, baseTone);
  const role = scene?.role || "body";
  const emphasis = scene?.narrative?.emphasis || "medium";

  const delivery = pickSegmentDelivery({
    role,
    baseVoice,
    baseTone,
    emphasis,
    variantPlan,
  });

  const pauseAfterMs = pickPauseAfter(role, baseTone);
  const speechRate = pickSpeechRate(role, baseVoice, baseTone);
  const pitch = pickPitch(role, baseVoice, baseTone);
  const volume = pickVolume(role, emphasis, baseTone);

  return {
    id: `voice_${scene?.id || index + 1}`,
    sceneId: scene?.id || `scene_${index + 1}`,
    order: index + 1,
    role,
    text: sourceText,
    normalizedText,
    durationMs,
    targetWindowMs: durationMs,
    pauseAfterMs,
    delivery: {
      style: delivery.style,
      intensity: delivery.intensity,
      warmth: delivery.warmth,
      clarity: delivery.clarity,
      speechRate,
      pitch,
      volume,
    },
    emphasis: {
      level: emphasis,
      accentWords: extractAccentWords(sourceText),
    },
    timingHints: {
      startPaddingMs: role === "hook" ? 60 : 120,
      endPaddingMs: role === "cta" ? 40 : 80,
      fitMode: role === "hook" ? "tight" : "balanced",
    },
  };
}

function buildVoiceTiming(segments) {
  let cursorMs = 0;

  const timeline = segments.map((segment) => {
    const startMs = cursorMs;
    const speechDurationMs = segment.durationMs;
    const endSpeechMs = startMs + speechDurationMs;
    const endMs = endSpeechMs + (segment.pauseAfterMs || 0);

    cursorMs = endMs;

    return {
      segmentId: segment.id,
      sceneId: segment.sceneId,
      role: segment.role,
      startMs,
      speechStartMs: startMs,
      speechEndMs: endSpeechMs,
      endMs,
      durationMs: speechDurationMs,
      pauseAfterMs: segment.pauseAfterMs || 0,
    };
  });

  return {
    totalSpeechMs: timeline.reduce((sum, item) => sum + item.durationMs, 0),
    totalTimelineMs: timeline.length ? timeline[timeline.length - 1].endMs : 0,
    segments: timeline,
  };
}

function buildProviderHints({ baseVoice, baseTone, variantPlan, segments }) {
  return {
    providerVoiceKey: buildProviderVoiceKey(baseVoice, baseTone),
    outputFormat: "wav",
    sampleRate: 44100,
    channelMode: "mono",
    trimSilence: true,
    normalizeLoudness: true,
    stitchSegments: true,
    hookPriorityBoost: true,
    targetDelivery:
      variantPlan?.direction?.narrationDelivery || voiceToDelivery(baseVoice),
    segmentCount: segments.length,
  };
}

function buildQualityHints(segments, scriptVariant, variantPlan) {
  const hookSegment = segments.find((item) => item.role === "hook") || null;
  const ctaSegment = segments.find((item) => item.role === "cta") || null;

  return {
    needsHookPrecision: Boolean(hookSegment),
    needsCtaSeparation: Boolean(ctaSegment),
    shouldRebalanceIfTooFast: segments.some((item) => item.delivery.speechRate > 1.08),
    shouldRebalanceIfTooSlow: segments.some((item) => item.delivery.speechRate < 0.92),
    containsAccentWords: segments.some(
      (item) => (item?.emphasis?.accentWords || []).length > 0
    ),
    targetStyle:
      variantPlan?.direction?.variantStyle ||
      scriptVariant?.direction?.editDirection?.variantStyle ||
      "balanced short-form narration",
  };
}

function pickSegmentDelivery({
  role,
  baseVoice,
  baseTone,
  emphasis,
  variantPlan,
}) {
  const voiceMode = voiceToDelivery(baseVoice);
  const toneMode = toneToDelivery(baseTone);

  if (role === "hook") {
    return {
      style:
        toneMode === "premium"
          ? "controlled-impact"
          : toneMode === "calm"
          ? "clear-invite"
          : "high-contrast-hook",
      intensity: emphasis === "high" ? "high" : "medium-high",
      warmth: voiceMode === "narrative" ? "medium" : "medium-low",
      clarity: "high",
    };
  }

  if (role === "proof" || role === "solution") {
    return {
      style: "confident-explainer",
      intensity: "medium",
      warmth: toneMode === "friendly" ? "high" : "medium",
      clarity: "high",
    };
  }

  if (role === "cta") {
    return {
      style:
        variantPlan?.direction?.tone === "premium"
          ? "clean-closing"
          : "direct-closing",
      intensity: "medium",
      warmth: "medium-high",
      clarity: "high",
    };
  }

  return {
    style:
      toneMode === "calm"
        ? "balanced-explainer"
        : toneMode === "premium"
        ? "refined-explainer"
        : "shortform-explainer",
    intensity: emphasis === "high" ? "medium-high" : "medium",
    warmth: toneMode === "friendly" ? "high" : "medium",
    clarity: "high",
  };
}

function pickPauseAfter(role, tone) {
  if (role === "hook") return tone === "dynamic" ? 140 : 180;
  if (role === "cta") return 60;
  if (role === "proof") return 120;
  return tone === "calm" ? 180 : 120;
}

function pickSpeechRate(role, voice, tone) {
  let rate = 1.0;

  if (tone === "dynamic") rate += 0.06;
  if (tone === "premium") rate -= 0.04;
  if (tone === "calm") rate -= 0.05;
  if (voice === "energetic") rate += 0.05;
  if (voice === "narrator") rate -= 0.02;

  if (role === "hook") rate += 0.03;
  if (role === "cta") rate -= 0.01;

  return clamp(Number(rate.toFixed(2)), 0.85, 1.15);
}

function pickPitch(role, voice, tone) {
  let pitch = 0;

  if (voice === "energetic") pitch += 1;
  if (voice === "calm") pitch -= 1;
  if (tone === "premium") pitch -= 0.5;
  if (role === "hook") pitch += 0.5;

  return clamp(Number(pitch.toFixed(1)), -3, 3);
}

function pickVolume(role, emphasis, tone) {
  let volume = 1.0;

  if (role === "hook") volume += 0.08;
  if (role === "cta") volume += 0.03;
  if (emphasis === "high") volume += 0.04;
  if (tone === "premium") volume -= 0.02;

  return clamp(Number(volume.toFixed(2)), 0.85, 1.15);
}

function buildProviderVoiceKey(voice, tone) {
  const v = voice || "auto";
  const t = tone || "dynamic";
  return `${v}-${t}`;
}

function voiceToDelivery(voice) {
  if (voice === "energetic") return "energetic";
  if (voice === "calm") return "calm";
  if (voice === "narrator") return "narrative";
  return "balanced";
}

function toneToDelivery(tone) {
  if (tone === "premium") return "premium";
  if (tone === "friendly") return "friendly";
  if (tone === "calm") return "calm";
  return "dynamic";
}

function estimateDurationMs(text, tone) {
  const words = countWords(text);
  const wpm =
    tone === "dynamic"
      ? 165
      : tone === "calm"
      ? 130
      : tone === "premium"
      ? 140
      : 150;

  const minutes = words / Math.max(wpm, 1);
  const ms = minutes * 60 * 1000;

  return Math.max(1200, Math.round(ms));
}

function extractAccentWords(text) {
  const words = safeText(text)
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .split(/\s+/)
    .filter(Boolean);

  const result = [];

  for (const word of words) {
    const clean = word.toLowerCase();
    if (clean.length < 5) continue;
    if (!result.includes(clean)) result.push(clean);
    if (result.length >= 4) break;
  }

  return result;
}

function normalizeSpeechText(text) {
  return safeText(text)
    .replace(/\s+/g, " ")
    .replace(/\s([,.!?;:])/g, "$1")
    .replace(/[–—]/g, "-")
    .trim();
}

function detectLanguage(text) {
  const value = safeText(text);
  if (!value) return "ru";

  const cyrillic = (value.match(/[а-яё]/gi) || []).length;
  const latin = (value.match(/[a-z]/gi) || []).length;

  return cyrillic >= latin ? "ru" : "en";
}

function countWords(text) {
  return safeText(text)
    .split(/\s+/)
    .filter(Boolean).length;
}

function mapScriptVariants(list) {
  const map = new Map();

  for (const item of list || []) {
    if (item?.id) map.set(item.id, item);
  }

  return map;
}

function safeText(value) {
  if (value == null) return "";
  return String(value).trim();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}