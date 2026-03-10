// captionEngine.js
// Генерация caption timeline на основе voiceEngine.
// Делает short-form captions для TikTok / Reels / Shorts.

export async function buildCaptionPlans(request, voicePlanResult, scenePlanResult) {
  const variants = voicePlanResult?.variants || [];
  const sceneVariants = mapSceneVariants(scenePlanResult?.variants || []);
  const tone = request?.config?.tone || "dynamic";

  const plans = variants.map((voiceVariant) => {
    const sceneVariant = sceneVariants.get(voiceVariant.id);

    return buildSingleCaptionPlan({
      voiceVariant,
      sceneVariant,
      tone,
    });
  });

  return {
    input: {
      requestId: request?.meta?.requestId || null,
      variantCount: plans.length,
      tone,
    },
    variants: plans,
  };
}

function buildSingleCaptionPlan({ voiceVariant, sceneVariant, tone }) {
  const segments = voiceVariant?.segments || [];
  const timeline = voiceVariant?.timing?.segments || [];

  const captions = segments.map((segment, index) =>
    buildCaptionSegment({
      segment,
      timing: timeline[index],
      tone,
    })
  );

  const captionTimeline = buildCaptionTimeline(captions);

  return {
    id: voiceVariant.id,
    kind: voiceVariant.kind,
    label: voiceVariant.label,
    style: buildCaptionStyle(tone),
    captions,
    timeline: captionTimeline,
    readabilityScore: computeReadabilityScore(captions),
  };
}

function buildCaptionSegment({ segment, timing, tone }) {
  const baseText = segment.normalizedText || segment.text || "";

  const words = splitCaptionWords(baseText);
  const chunks = buildCaptionChunks(words, tone);

  const startMs = timing?.speechStartMs || timing?.startMs || 0;
  const endMs = timing?.speechEndMs || timing?.endMs || 0;

  return {
    id: `caption_${segment.id}`,
    sceneId: segment.sceneId,
    role: segment.role,
    startMs,
    endMs,
    chunks,
    accentWords: segment?.emphasis?.accentWords || [],
    style: chooseCaptionStyle(segment.role, tone),
  };
}

function buildCaptionChunks(words, tone) {
  const maxWords =
    tone === "dynamic"
      ? 4
      : tone === "premium"
      ? 5
      : tone === "calm"
      ? 6
      : 5;

  const chunks = [];
  let buffer = [];

  for (const word of words) {
    buffer.push(word);

    if (buffer.length >= maxWords) {
      chunks.push(buffer.join(" "));
      buffer = [];
    }
  }

  if (buffer.length) {
    chunks.push(buffer.join(" "));
  }

  return chunks.map((text, index) => ({
    order: index + 1,
    text,
  }));
}

function buildCaptionTimeline(captions) {
  return captions.map((caption) => ({
    id: caption.id,
    startMs: caption.startMs,
    endMs: caption.endMs,
    role: caption.role,
  }));
}

function buildCaptionStyle(tone) {
  if (tone === "dynamic") {
    return {
      font: "bold-shortform",
      case: "upper",
      highlight: "accent-word",
      animation: "pop-in",
      placement: "lower-third",
    };
  }

  if (tone === "premium") {
    return {
      font: "clean-modern",
      case: "sentence",
      highlight: "minimal",
      animation: "fade-up",
      placement: "center-lower",
    };
  }

  if (tone === "calm") {
    return {
      font: "clean-readable",
      case: "sentence",
      highlight: "none",
      animation: "soft-fade",
      placement: "lower-third",
    };
  }

  return {
    font: "shortform-default",
    case: "sentence",
    highlight: "accent-word",
    animation: "fade-up",
    placement: "lower-third",
  };
}

function chooseCaptionStyle(role, tone) {
  if (role === "hook") {
    return {
      emphasis: "strong",
      scale: 1.2,
      animation: tone === "dynamic" ? "impact-pop" : "fade-up",
    };
  }

  if (role === "cta") {
    return {
      emphasis: "medium",
      scale: 1.05,
      animation: "fade-up",
    };
  }

  return {
    emphasis: "normal",
    scale: 1,
    animation: "fade",
  };
}

function splitCaptionWords(text) {
  return safeText(text)
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .split(/\s+/)
    .filter(Boolean);
}

function computeReadabilityScore(captions) {
  if (!captions.length) return 0;

  let totalWords = 0;
  let totalChunks = 0;

  for (const caption of captions) {
    for (const chunk of caption.chunks) {
      totalChunks += 1;
      totalWords += splitCaptionWords(chunk.text).length;
    }
  }

  const avgWords = totalWords / Math.max(totalChunks, 1);

  if (avgWords <= 3) return 95;
  if (avgWords <= 5) return 90;
  if (avgWords <= 7) return 80;

  return 70;
}

function mapSceneVariants(list) {
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