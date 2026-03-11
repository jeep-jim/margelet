// captionEngine.js
// Генерация caption timeline на основе voiceEngine.
// Делает short-form captions для TikTok / Reels / Shorts.

export async function buildCaptionPlans(request, voicePlanResult, scenePlanResult) {
  const variants = voicePlanResult?.variants || [];
  const sceneVariants = mapSceneVariants(scenePlanResult?.variants || []);
  const tone = request?.config?.tone || "dynamic";
  const textOverlayMode = normalizeTextOverlayMode(request?.config?.textOverlayMode);

  const plans = variants.map((voiceVariant) => {
    const sceneVariant = sceneVariants.get(voiceVariant.id);

    return buildSingleCaptionPlan({
      voiceVariant,
      sceneVariant,
      tone,
      textOverlayMode,
    });
  });

  return {
    input: {
      requestId: request?.meta?.requestId || null,
      variantCount: plans.length,
      tone,
      textOverlayMode,
    },
    variants: plans,
  };
}

function buildSingleCaptionPlan({ voiceVariant, sceneVariant, tone, textOverlayMode }) {
  if (textOverlayMode === "off") {
    return {
      id: voiceVariant.id,
      kind: voiceVariant.kind,
      label: voiceVariant.label,
      style: null,
      mode: "off",
      captions: [],
      timeline: [],
      readabilityScore: 0,
    };
  }

  const segments = voiceVariant?.segments || [];
  const timeline = voiceVariant?.timing?.segments || [];

  const captions = segments
    .map((segment, index) =>
      buildCaptionSegment({
        segment,
        timing: timeline[index],
        tone,
        textOverlayMode,
      })
    )
    .filter(Boolean);

  const captionTimeline = buildCaptionTimeline(captions);

  return {
    id: voiceVariant.id,
    kind: voiceVariant.kind,
    label: voiceVariant.label,
    style: buildCaptionStyle(tone, textOverlayMode),
    mode: textOverlayMode,
    captions,
    timeline: captionTimeline,
    readabilityScore: computeReadabilityScore(captions),
  };
}

function buildCaptionSegment({ segment, timing, tone, textOverlayMode }) {
  const baseText = segment.normalizedText || segment.text || "";
  const startMs = timing?.speechStartMs || timing?.startMs || 0;
  const endMs = timing?.speechEndMs || timing?.endMs || 0;
  const accentWords = segment?.emphasis?.accentWords || [];

  const chunks =
    textOverlayMode === "highlights"
      ? buildHighlightChunks({
          text: baseText,
          accentWords,
          role: segment.role,
        })
      : buildCaptionChunks(splitCaptionWords(baseText), tone);

  if (!chunks.length) return null;

  return {
    id: `caption_${segment.id}`,
    sceneId: segment.sceneId,
    role: segment.role,
    startMs,
    endMs,
    chunks,
    accentWords,
    style: chooseCaptionStyle(segment.role, tone, textOverlayMode),
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

function buildHighlightChunks({ text, accentWords, role }) {
  const clean = safeText(text);
  if (!clean && (!accentWords || !accentWords.length)) return [];

  if (role === "hook") {
    return [
      {
        order: 1,
        text: shortenText(clean, 5).toUpperCase(),
      },
    ].filter((item) => item.text);
  }

  if (accentWords.length > 0) {
    return accentWords.slice(0, 3).map((word, index) => ({
      order: index + 1,
      text: String(word).toUpperCase(),
    }));
  }

  return [
    {
      order: 1,
      text: shortenText(clean, role === "cta" ? 4 : 3).toUpperCase(),
    },
  ].filter((item) => item.text);
}

function buildCaptionTimeline(captions) {
  return captions.map((caption) => ({
    id: caption.id,
    startMs: caption.startMs,
    endMs: caption.endMs,
    role: caption.role,
  }));
}

function buildCaptionStyle(tone, textOverlayMode = "subtitles") {
  if (textOverlayMode === "highlights") {
    return {
      font: "bold-shortform",
      case: "upper",
      highlight: "full-line",
      animation: tone === "dynamic" ? "impact-pop" : "fade-up",
      placement: "lower-third",
    };
  }

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

function chooseCaptionStyle(role, tone, textOverlayMode = "subtitles") {
  if (textOverlayMode === "highlights") {
    if (role === "hook") {
      return {
        emphasis: "strong",
        scale: 1.24,
        animation: tone === "dynamic" ? "impact-pop" : "fade-up",
      };
    }

    if (role === "cta") {
      return {
        emphasis: "medium",
        scale: 1.08,
        animation: "fade-up",
      };
    }

    return {
      emphasis: "strong",
      scale: 1.08,
      animation: tone === "dynamic" ? "pop-in" : "fade",
    };
  }

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

function shortenText(text, maxWords) {
  return splitCaptionWords(text).slice(0, maxWords).join(" ");
}

function normalizeTextOverlayMode(value) {
  if (!value) return "subtitles";

  const mode = String(value).trim().toLowerCase();

  if (mode === "off") return "off";
  if (mode === "highlights") return "highlights";

  return "subtitles";
}

function safeText(value) {
  if (value == null) return "";
  return String(value).trim();
}