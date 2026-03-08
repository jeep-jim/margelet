export async function renderVideoPlan(agent, scriptResult, scenes, captions) {
  const safeScenes = Array.isArray(scenes) ? scenes : [];
  const safeCaptions = Array.isArray(captions) ? captions : [];

  const outputType = agent?.outputType || "slideshow-video";
  const visualSourceType = agent?.visualSourceType || "template";
  const renderMode = agent?.renderMode || "full-video";

  const totalDuration = safeScenes.reduce(
    (sum, scene) => sum + Math.max(1, Number(scene.duration) || 0),
    0
  );

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

  // ---------- VIDEO BASE ----------
  const videoScenes = safeScenes.map((scene) => {
    let visualType = "template";

    if (visualSourceType === "stock") {
      visualType = "stock-search";
    }

    if (visualSourceType === "author-upload") {
      visualType = "author-media";
    }

    return {
      id: scene.id,
      order: scene.order,
      text: scene.text,
      overlay: scene.overlay,
      visualPrompt: scene.visualPrompt,
      visualType,
      duration: scene.duration,
    };
  });

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
    status: renderMode === "full-video" ? "planned" : "assets-ready",
  };
}