// sceneEngine.js
// Превращает script variants в конкретный scene plan для сборки ролика.
// На выходе — 3 готовых монтажных плана, которые можно уже кормить voice/caption/render слоям.

export async function buildScenePlans(request, scriptResult) {
  const prepared = request?.prepared || {};
  const summary = prepared?.summary || {};
  const images = prepared?.images || [];
  const videos = prepared?.videos || [];
  const audio = prepared?.audio || [];

  const variants = scriptResult?.variants || [];

  const plans = variants.map((variant, variantIndex) =>
    buildSingleScenePlan({
      request,
      variant,
      variantIndex,
      summary,
      images,
      videos,
      audio,
    })
  );

  return {
    input: {
      requestId: request?.meta?.requestId || null,
      variantCount: plans.length,
    },
    variants: plans,
  };
}

function buildSingleScenePlan({
  request,
  variant,
  variantIndex,
  summary,
  images,
  videos,
  audio,
}) {
  const scenes = variant?.structure?.scenes || [];
  const soundtrack = pickSoundtrack(audio, variantIndex);
  const visualPool = buildVisualPool({ images, videos });

  const plannedScenes = scenes.map((scene, sceneIndex) =>
    buildScene({
      request,
      variant,
      scene,
      sceneIndex,
      variantIndex,
      summary,
      visualPool,
      soundtrack,
    })
  );

  const totalDurationSec = plannedScenes.reduce(
    (sum, scene) => sum + (scene.timing?.durationSec || 0),
    0
  );

  const timeline = buildTimeline(plannedScenes);
  const visualStrategy = buildVisualStrategy(plannedScenes, summary);
  const musicPlan = buildMusicPlan(soundtrack, totalDurationSec, variant);
  const exportPlan = buildExportPlan(totalDurationSec);

  return {
    id: variant.id,
    kind: variant.kind,
    label: variant.label,
    score: variant.score,
    structure: {
      totalDurationSec,
      sceneCount: plannedScenes.length,
      aspectRatio: "9:16",
      exportFormat: "mp4",
    },
    direction: {
      ...variant.direction,
      textOverlayMode: normalizeTextOverlayMode(
        variant?.direction?.textOverlayMode || request?.config?.textOverlayMode
      ),
      visualStrategy,
      musicPlan,
    },
    scenes: plannedScenes,
    timeline,
    exportPlan,
  };
}

function buildScene({
  request,
  variant,
  scene,
  sceneIndex,
  variantIndex,
  summary,
  visualPool,
  soundtrack,
}) {
  const selectedVisual = chooseSceneVisual({
    scene,
    sceneIndex,
    variantIndex,
    summary,
    visualPool,
  });

  const transitionIn = pickTransitionIn(scene.role, variant.direction?.tone);
  const transitionOut = pickTransitionOut(scene.role, variant.direction?.tone);
  const textOverlay = buildTextOverlay(scene, variant);
  const cameraMotion = buildCameraMotion(scene, selectedVisual, variant);
  const timing = buildSceneTiming(scene, selectedVisual, sceneIndex);
  const captionMode = buildCaptionMode(scene, variant, request);
  const audioMode = buildAudioMode(scene, soundtrack, selectedVisual, variant);
  const composition = buildComposition(scene, selectedVisual, variant);

  return {
    id: scene.id,
    order: scene.order,
    role: scene.role,
    timing,
    narrative: {
      narration: scene.narration,
      caption: scene.caption,
      emphasis: scene.emphasis,
    },
    source: selectedVisual,
    composition,
    overlays: {
      text: textOverlay,
      captionMode,
      progressTag: buildProgressTag(scene, variant, sceneIndex),
    },
    motion: {
      cameraMotion,
      transitionIn,
      transitionOut,
      motionIntent: scene.motionIntent || "steady",
    },
    audio: audioMode,
    renderHints: buildRenderHints(scene, selectedVisual, variant),
  };
}

function buildVisualPool({ images, videos }) {
  return {
    images: images.map((item, index) => ({
      ...item,
      __poolType: "image",
      __poolIndex: index,
    })),
    videos: videos.map((item, index) => ({
      ...item,
      __poolType: "video",
      __poolIndex: index,
    })),
  };
}

function chooseSceneVisual({
  scene,
  sceneIndex,
  variantIndex,
  summary,
  visualPool,
}) {
  const pref = scene.sourcePreference || "generated-or-typography";
  const videos = visualPool.videos || [];
  const images = visualPool.images || [];

  if (pref === "uploaded-video" && videos.length > 0) {
    const picked = videos[(sceneIndex + variantIndex) % videos.length];
    return buildResolvedSource(picked, "video", scene.role);
  }

  if (pref === "uploaded-image" && images.length > 0) {
    const picked = images[(sceneIndex + variantIndex) % images.length];
    return buildResolvedSource(picked, "image", scene.role);
  }

  if (pref === "typography-logo") {
    return {
      type: "typography",
      mode: "logo-cta",
      sourceId: null,
      previewUrl: "",
      posterUrl: "",
      fit: "cover",
      crop: "center",
      purpose: "ending-brand-frame",
      confidence: "high",
    };
  }

  if (videos.length > 0 && shouldPreferVideoForRole(scene.role)) {
    const picked = videos[(sceneIndex + variantIndex) % videos.length];
    return buildResolvedSource(picked, "video", scene.role);
  }

  if (images.length > 0) {
    const picked = images[(sceneIndex + variantIndex) % images.length];
    return buildResolvedSource(picked, "image", scene.role);
  }

  return buildFallbackGeneratedSource(scene, summary);
}

function buildResolvedSource(asset, type, role) {
  return {
    type,
    mode: type === "video" ? "uploaded-video" : "uploaded-image",
    sourceId: asset.id,
    previewUrl: asset.previewUrl || asset.src || "",
    posterUrl: asset.posterUrl || asset.previewUrl || asset.src || "",
    fit: chooseFit(type, asset),
    crop: chooseCrop(role, asset),
    purpose: role,
    confidence: "high",
    meta: {
      width: asset.width || null,
      height: asset.height || null,
      orientation: asset.orientation || "unknown",
      durationMs: asset.durationMs || null,
      aspectRatio: asset.aspectRatio || null,
      originalType: asset.originalType || type,
      name: asset.name || "",
    },
  };
}

function buildFallbackGeneratedSource(scene, summary) {
  const base =
    scene.role === "hook"
      ? "bold kinetic typography with high contrast background"
      : scene.role === "proof"
      ? "clean evidence board with animated highlights"
      : scene.role === "cta"
      ? "minimal branded ending card"
      : "editorial motion background with text hierarchy";

  return {
    type: "generated",
    mode: "generated-or-typography",
    sourceId: null,
    previewUrl: "",
    posterUrl: "",
    fit: "cover",
    crop: "center",
    purpose: scene.role,
    confidence: summary?.flags?.hasUserMedia ? "medium" : "high",
    generatorPrompt: `${base}, vertical 9:16, optimized for short-form video about ${summary?.topic || "content"}`,
  };
}

function buildSceneTiming(scene, selectedVisual, sceneIndex) {
  const baseDuration = Math.max(2, Number(scene.durationSec) || 3);
  const leadInMs = sceneIndex === 0 ? 0 : 120;
  const leadOutMs = scene.role === "cta" ? 0 : 120;

  let clipStartMs = 0;
  let clipDurationMs = baseDuration * 1000;

  if (selectedVisual?.type === "video" && selectedVisual?.meta?.durationMs) {
    const videoDuration = selectedVisual.meta.durationMs;
    const available = Math.max(0, videoDuration - clipDurationMs);
    clipStartMs = available > 0 ? Math.min(sceneIndex * 900, available) : 0;
    clipDurationMs = Math.min(clipDurationMs, videoDuration);
  }

  return {
    durationSec: baseDuration,
    durationMs: baseDuration * 1000,
    leadInMs,
    leadOutMs,
    clipStartMs,
    clipDurationMs,
  };
}

function buildTextOverlay(scene, variant) {
  const textOverlayMode = normalizeTextOverlayMode(
    variant?.direction?.textOverlayMode
  );

  if (textOverlayMode === "off") {
    return {
      enabled: false,
      layout: null,
      title: "",
      kicker: "",
      accentWords: [],
      style: null,
    };
  }

  const title = buildSceneTitle(scene, variant, textOverlayMode);
  const kicker = scene.role === "hook"
    ? variant?.creative?.hook || ""
    : scene.role === "cta"
    ? variant?.creative?.cta?.ru || ""
    : "";

  return {
    enabled: true,
    layout: pickOverlayLayout(scene.role),
    title,
    kicker: textOverlayMode === "highlights" ? trimHighlightText(kicker, scene.role) : kicker,
    accentWords: pickAccentWords(scene.caption || scene.narration),
    style: pickTextStyle(variant?.direction?.tone, scene.role, textOverlayMode),
    mode: textOverlayMode,
  };
}

function buildSceneTitle(scene, variant, textOverlayMode = "subtitles") {
  const baseTitle =
    scene.role === "hook"
      ? scene.caption || variant?.creative?.hook || ""
      : scene.role === "cta"
      ? variant?.creative?.cta?.ru || scene.caption || ""
      : scene.caption || "";

  if (textOverlayMode === "highlights") {
    return trimHighlightText(baseTitle, scene.role);
  }

  return baseTitle;
}

function buildCameraMotion(scene, selectedVisual, variant) {
  if (selectedVisual.type === "video") {
    return {
      type: "native-footage",
      speed: scene.role === "hook" ? 1.06 : 1,
      stabilization: "soft",
      zoom: scene.role === "proof" ? "micro-push" : "none",
    };
  }

  if (selectedVisual.type === "image") {
    return {
      type: "ken-burns",
      speed: variant?.direction?.tone === "dynamic" ? 1.12 : 1.05,
      stabilization: "locked",
      zoom: scene.role === "hook" ? "push-in" : scene.role === "cta" ? "hold" : "drift",
    };
  }

  return {
    type: "kinetic-layout",
    speed: variant?.direction?.tone === "dynamic" ? 1.15 : 1,
    stabilization: "graphic",
    zoom: scene.role === "hook" ? "impact-reveal" : "none",
  };
}

function buildCaptionMode(scene, variant, request) {
  const tone = variant?.direction?.tone || "dynamic";
  const textOverlayMode = normalizeTextOverlayMode(
    variant?.direction?.textOverlayMode || request?.config?.textOverlayMode
  );

  if (textOverlayMode === "off") {
    return {
      enabled: false,
      style: null,
      position: null,
      emphasis: null,
      mode: "off",
    };
  }

  if (textOverlayMode === "highlights") {
    if (scene.role === "hook") {
      return {
        enabled: true,
        style: "highlight-punch",
        position: "center-lower",
        emphasis: "high",
        mode: "highlights",
      };
    }

    if (scene.role === "cta") {
      return {
        enabled: true,
        style: "highlight-footer",
        position: "lower-third",
        emphasis: "medium",
        mode: "highlights",
      };
    }

    return {
      enabled: true,
      style: "highlight-line",
      position: "lower-third",
      emphasis: "high",
      mode: "highlights",
    };
  }

  if (scene.role === "hook") {
    return {
      enabled: true,
      style: tone === "premium" ? "minimal-bold" : "highlight-punch",
      position: "center-lower",
      emphasis: "high",
      mode: "subtitles",
    };
  }

  if (scene.role === "cta") {
    return {
      enabled: true,
      style: "clean-footer",
      position: "lower-third",
      emphasis: "medium",
      mode: "subtitles",
    };
  }

  return {
    enabled: true,
    style: tone === "calm" ? "clean-line" : "dynamic-line",
    position: "lower-third",
    emphasis: scene.emphasis || "medium",
    mode: "subtitles",
  };
}

function buildAudioMode(scene, soundtrack, selectedVisual, variant) {
  const hasVoice = Boolean(scene.narration);
  const shouldDuckMusic = hasVoice;
  const useNaturalAudio = selectedVisual.type === "video";

  return {
    voice: {
      enabled: hasVoice,
      delivery: variant?.direction?.voice || "auto",
      priority: "primary",
    },
    music: {
      enabled: Boolean(soundtrack),
      sourceId: soundtrack?.id || null,
      ducking: shouldDuckMusic ? "auto-duck" : "none",
      level:
        scene.role === "hook"
          ? 0.42
          : scene.role === "cta"
          ? 0.34
          : 0.38,
    },
    naturalAudio: {
      enabled: useNaturalAudio,
      keepTransientTexture: useNaturalAudio,
      level: useNaturalAudio ? 0.18 : 0,
    },
  };
}

function buildComposition(scene, selectedVisual, variant) {
  const tone = variant?.direction?.tone || "dynamic";
  const textOverlayMode = normalizeTextOverlayMode(variant?.direction?.textOverlayMode);

  return {
    frame: {
      aspectRatio: "9:16",
      safeArea: "shorts-safe",
      fit: selectedVisual.fit || "cover",
      crop: selectedVisual.crop || "center",
    },
    layerOrder: buildLayerOrder(selectedVisual, textOverlayMode),
    backgroundTreatment:
      selectedVisual.type === "video" || selectedVisual.type === "image"
        ? tone === "premium"
          ? "soft-depth"
          : "contrast-boost"
        : "graphic-background",
    colorTreatment:
      tone === "premium"
        ? "cinematic-clean"
        : tone === "calm"
        ? "natural-soft"
        : "vivid-shortform",
  };
}

function buildProgressTag(scene, variant, sceneIndex) {
  return {
    enabled: scene.role !== "cta",
    text:
      scene.role === "hook"
        ? variant?.label?.ru || variant?.label?.en || ""
        : `Сцена ${sceneIndex + 1}`,
    position: "top-left",
    style: "micro-chip",
  };
}

function buildRenderHints(scene, selectedVisual, variant) {
  const textOverlayMode = normalizeTextOverlayMode(variant?.direction?.textOverlayMode);

  return {
    prioritizeReadability: true,
    avoidOvercrowding: true,
    useImpactCuts: variant?.direction?.tone === "dynamic",
    useElegantSpacing: variant?.direction?.tone === "premium",
    shouldBurnCaptions: textOverlayMode !== "off",
    textOverlayMode,
    shouldPreRenderPoster: scene.role === "hook",
    visualMode:
      selectedVisual.type === "video"
        ? "footage-led"
        : selectedVisual.type === "image"
        ? "image-led"
        : "typography-led",
  };
}

function buildTimeline(plannedScenes) {
  let cursorMs = 0;

  return plannedScenes.map((scene) => {
    const startMs = cursorMs;
    const endMs = startMs + (scene.timing?.durationMs || 0);

    cursorMs = endMs;

    return {
      sceneId: scene.id,
      order: scene.order,
      startMs,
      endMs,
      durationMs: scene.timing?.durationMs || 0,
      role: scene.role,
    };
  });
}

function buildVisualStrategy(plannedScenes, summary) {
  const counts = {
    videoScenes: 0,
    imageScenes: 0,
    generatedScenes: 0,
    typographyScenes: 0,
  };

  for (const scene of plannedScenes) {
    const type = scene?.source?.type;
    if (type === "video") counts.videoScenes += 1;
    else if (type === "image") counts.imageScenes += 1;
    else if (type === "generated") counts.generatedScenes += 1;
    else if (type === "typography") counts.typographyScenes += 1;
  }

  return {
    primary:
      counts.videoScenes > 0
        ? "video-led"
        : counts.imageScenes > 0
        ? "image-led"
        : "generated-led",
    counts,
    preferUserAssets: Boolean(summary?.flags?.shouldPreferUserAssets),
  };
}

function buildMusicPlan(soundtrack, totalDurationSec, variant) {
  return {
    useUploadedTrack: Boolean(soundtrack),
    soundtrackId: soundtrack?.id || null,
    totalDurationSec,
    duckingProfile:
      variant?.direction?.tone === "dynamic"
        ? "strong"
        : variant?.direction?.tone === "premium"
        ? "smooth"
        : "balanced",
  };
}

function buildExportPlan(totalDurationSec) {
  return {
    format: "mp4",
    aspectRatio: "9:16",
    fps: 30,
    resolution: {
      width: 1080,
      height: 1920,
    },
    totalDurationSec,
    posterFrameStrategy: "first-hook-frame",
  };
}

function pickSoundtrack(audio, variantIndex) {
  if (!Array.isArray(audio) || audio.length === 0) return null;
  return audio[variantIndex % audio.length];
}

function pickTransitionIn(role, tone) {
  if (role === "hook") return "cold-open";
  if (role === "cta") return tone === "premium" ? "soft-dissolve" : "quick-fade";
  return tone === "dynamic" ? "impact-cut" : "smooth-cut";
}

function pickTransitionOut(role, tone) {
  if (role === "cta") return "fade-out";
  return tone === "dynamic" ? "snap-cut" : "soft-cut";
}

function pickOverlayLayout(role) {
  if (role === "hook") return "hero-center";
  if (role === "cta") return "center-stack";
  if (role === "proof") return "bottom-proof";
  return "lower-third";
}

function pickTextStyle(tone, role, textOverlayMode = "subtitles") {
  if (textOverlayMode === "highlights") {
    if (role === "hook") return "impact-highlight";
    if (role === "cta") return "brand-highlight";
    return tone === "calm" ? "clean-highlight" : "shortform-highlight";
  }

  if (role === "hook") {
    return tone === "premium" ? "bold-clean" : "impact-highlight";
  }
  if (role === "cta") {
    return "brand-clean";
  }
  return tone === "calm" ? "clean-readable" : "shortform-readable";
}

function pickAccentWords(text) {
  const words = safeText(text)
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .split(/\s+/)
    .filter(Boolean);

  const unique = [];
  for (const word of words) {
    const clean = word.toLowerCase();
    if (clean.length < 5) continue;
    if (!unique.includes(clean)) unique.push(clean);
    if (unique.length === 3) break;
  }

  return unique;
}

function chooseFit(type, asset) {
  if (type === "video") return "cover";
  if (asset?.orientation === "landscape") return "cover";
  return "contain-safe";
}

function chooseCrop(role, asset) {
  if (role === "hook") return "focus-center";
  if (asset?.orientation === "portrait") return "subject-center";
  return "smart-center";
}

function shouldPreferVideoForRole(role) {
  return role === "hook" || role === "proof" || role === "story";
}

function buildLayerOrder(selectedVisual, textOverlayMode = "subtitles") {
  if (selectedVisual.type === "video" || selectedVisual.type === "image") {
    return textOverlayMode === "off"
      ? ["background-media", "shade", "micro-ui"]
      : ["background-media", "shade", "text", "captions", "micro-ui"];
  }

  return textOverlayMode === "off"
    ? ["graphic-bg", "shapes", "micro-ui"]
    : ["graphic-bg", "shapes", "text", "captions", "micro-ui"];
}

function trimHighlightText(text, role) {
  const words = safeText(text).split(/\s+/).filter(Boolean);

  if (role === "hook") return words.slice(0, 5).join(" ");
  if (role === "cta") return words.slice(0, 4).join(" ");
  return words.slice(0, 3).join(" ");
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