function getBrain(agent) {
  const brain = agent?.brain || {};

  return {
    style: brain.style || "sharp",
    persona: brain.persona || "expert-friend",
    energy: Number(brain.energy || 70),
  };
}

function normalizeScenes(scenes) {
  if (!Array.isArray(scenes)) return [];

  return scenes.map((scene, index) => ({
    id: scene.id || index + 1,
    order: scene.order || index + 1,
    text: scene.text || "",
    overlay: scene.overlay || "",
    role: scene.role || "body",
    visualPrompt: scene.visualPrompt || "",
    visualType: scene.visualType || "template",
    duration: Math.max(1, Number(scene.duration) || 4),
    transition: scene.transition || "cut",
  }));
}

function normalizeCaptions(captions) {
  if (!Array.isArray(captions)) return [];

  return captions.map((c, i) => ({
    id: c.id || `caption-${i}`,
    start: Number(c.start || 0),
    end: Number(c.end || 2),
    text: c.text || "",
    style: c.style || "body",
  }));
}

function computeDuration(scenes) {
  return scenes.reduce((sum, s) => sum + s.duration, 0);
}

function buildTimeline(scenes) {
  let cursor = 0;

  return scenes.map((scene) => {
    const start = cursor;
    const end = cursor + scene.duration;

    cursor = end;

    return {
      sceneId: scene.id,
      start,
      end,
      duration: scene.duration,
      transition: scene.transition || "cut",
    };
  });
}

function getVisualType(scene, visualSourceType) {
  if (scene.visualType) return scene.visualType;

  if (visualSourceType === "stock") return "stock-search";
  if (visualSourceType === "author-upload") return "author-media";

  return "template";
}

function buildRenderMetadata(agent, scenes, brain) {
  return {
    engine: "planned-render",
    style: brain.style,
    persona: brain.persona,
    energy: brain.energy,
    format: agent?.format || "9:16",
    voice: agent?.voice || "ai",
    briefStyle: agent?.briefStyle || agent?.style || "",
    sceneCount: scenes.length,
  };
}

export async function renderVideoPlan(agent, scriptResult, scenes, captions) {

  const outputType = agent?.outputType || "slideshow-video";
  const visualSourceType = agent?.visualSourceType || "template";
  const renderMode = agent?.renderMode || "full-video";

  const brain = getBrain(agent);

  const safeScenes = normalizeScenes(scenes);
  const safeCaptions = normalizeCaptions(captions);

  const totalDuration = computeDuration(safeScenes);

  // ---------- CONTENT PACK ----------
  if (outputType === "content-pack") {

    return {
      type: "content-pack",
      topic: agent?.topic || "",
      title: scriptResult?.title || "",
      hook: scriptResult?.hook || "",
      ideas: safeScenes.map((s) => s.text),
      captions: safeCaptions,
      status: "ideas-only",
    };

  }

  // ---------- SCRIPT + VOICE ----------
  if (outputType === "script-voice") {

    return {
      type: "script-voice",
      topic: agent?.topic || "",
      title: scriptResult?.title || "",
      hook: scriptResult?.hook || "",
      voice: agent?.voice || "ai",
      scenes: safeScenes,
      captions: safeCaptions,
      totalDuration,
      status: "assets-ready",
    };

  }

  // ---------- VIDEO ----------
  const videoScenes = safeScenes.map((scene) => ({

    id: scene.id,
    order: scene.order,
    role: scene.role,

    text: scene.text,
    overlay: scene.overlay,

    visualPrompt: scene.visualPrompt,

    visualType: getVisualType(scene, visualSourceType),

    duration: scene.duration,
    transition: scene.transition,

  }));

  const timeline = buildTimeline(videoScenes);

  const metadata = buildRenderMetadata(agent, videoScenes, brain);

  return {

    type: outputType,

    topic: agent?.topic || "",

    title: scriptResult?.title || "",
    hook: scriptResult?.hook || "",

    style: agent?.format || "faceless",

    voice: agent?.voice || "ai",

    format: agent?.format || "9:16",

    renderMode,
    visualSourceType,

    totalDuration,

    scenes: videoScenes,
    captions: safeCaptions,

    timeline,
    metadata,

    status: renderMode === "full-video"
      ? "planned"
      : "assets-ready",

  };

}