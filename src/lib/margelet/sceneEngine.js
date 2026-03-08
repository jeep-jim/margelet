function toArrayScript(scriptResult) {
  if (Array.isArray(scriptResult?.script)) return scriptResult.script;
  if (Array.isArray(scriptResult?.structure)) return scriptResult.structure;

  if (typeof scriptResult?.body === "string") {
    return scriptResult.body
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getBrain(agent) {
  const brain = agent?.brain || {};

  return {
    style: brain.style || "sharp",
    hookType: brain.hookType || "problem-first",
    scriptLogic: brain.scriptLogic || "insight-to-action",
    videoStructure: brain.videoStructure || "hook-problem-solution-cta",
    persona: brain.persona || "expert-friend",
    proofMode: brain.proofMode || "examples",
    ctaStyle: brain.ctaStyle || "soft",
    energy:
      typeof brain.energy === "number"
        ? brain.energy
        : Number(brain.energy || 70),
  };
}

function getVisualStyle(agent, brain) {
  const outputType = agent?.outputType || "slideshow-video";
  const visualSourceType = agent?.visualSourceType || "template";

  if (outputType === "script-voice") {
    return {
      visualType: "voice-only",
      basePrompt: "",
    };
  }

  if (outputType === "stock-video" || visualSourceType === "stock") {
    return {
      visualType: "stock",
      basePrompt:
        brain.style === "premium"
          ? "cinematic premium stock footage"
          : brain.style === "educational"
          ? "clean illustrative stock footage"
          : brain.style === "entertaining"
          ? "dynamic engaging stock footage"
          : "cinematic stock footage",
    };
  }

  if (outputType === "author-media-video" || visualSourceType === "author-upload") {
    return {
      visualType: "author-media",
      basePrompt: "use uploaded creator media",
    };
  }

  if (visualSourceType === "mixed") {
    return {
      visualType: "mixed",
      basePrompt: "mix of creator media, slides, and stock visuals",
    };
  }

  return {
    visualType: "slide",
    basePrompt:
      brain.style === "premium"
        ? "minimal premium slide background"
        : brain.style === "educational"
        ? "clean educational slide background"
        : brain.style === "entertaining"
        ? "bold dynamic slide background"
        : "minimal slide background",
  };
}

function buildSceneRole(index, total, brain) {
  const structure = brain?.videoStructure || "hook-problem-solution-cta";

  if (structure === "hook-steps-result") {
    if (index === 0) return "hook";
    if (index === total - 1) return "result";
    return "step";
  }

  if (structure === "question-answer-cta") {
    if (index === 0) return "question";
    if (index === total - 1) return "cta";
    return "answer";
  }

  if (structure === "story-lesson-cta") {
    if (index === 0) return "story-open";
    if (index === total - 2) return "lesson";
    if (index === total - 1) return "cta";
    return "story";
  }

  if (structure === "claim-proof-offer") {
    if (index === 0) return "claim";
    if (index === total - 1) return "offer";
    return "proof";
  }

  if (index === 0) return "hook";
  if (index === 1) return "problem";
  if (index === total - 1) return "cta";
  return "solution";
}

function getDurationMap(totalDuration, count, brain) {
  const safeTotal = Math.max(15, Number(totalDuration) || 30);
  const safeCount = Math.max(1, count);
  const base = Math.floor(safeTotal / safeCount);
  const energy = Number(brain?.energy || 70);

  return Array.from({ length: safeCount }, (_, index) => {
    const isFirst = index === 0;
    const isLast = index === safeCount - 1;

    if (energy >= 75) {
      if (isFirst) return Math.max(2, base - 1);
      if (isLast) return Math.max(2, base - 1);
      return Math.max(3, base);
    }

    if (energy <= 35) {
      if (isFirst) return Math.max(3, base);
      if (isLast) return Math.max(3, base + 1);
      return Math.max(4, base);
    }

    if (isFirst) return Math.max(2, base);
    if (isLast) return Math.max(3, base);
    return Math.max(3, base);
  });
}

function buildOverlay(line, role, brain) {
  const text = String(line || "").trim();
  if (!text) return "";

  if (brain.style === "sharp" || brain.energy >= 80) {
    return text.length > 72 ? `${text.slice(0, 69)}...` : text;
  }

  if (role === "hook" || role === "claim" || role === "question") {
    return text.length > 84 ? `${text.slice(0, 81)}...` : text;
  }

  return text.length > 96 ? `${text.slice(0, 93)}...` : text;
}

function buildVisualPrompt(agent, line, role, brain, visual) {
  if (visual.visualType === "voice-only") return "";

  const topic = agent?.topic || "topic";
  const persona = brain.persona || "expert-friend";
  const proofMode = brain.proofMode || "examples";

  if (visual.visualType === "author-media") {
    return `${visual.basePrompt} for ${role} scene about ${topic}: ${line}`;
  }

  if (visual.visualType === "mixed") {
    return `${visual.basePrompt}, ${role} scene, ${persona} tone, ${proofMode}, ${topic}: ${line}`;
  }

  return `${visual.basePrompt}, ${role} scene, ${persona} tone, ${proofMode}, ${topic}: ${line}`;
}

export async function generateScenes(agent, scriptResult) {
  const outputType = agent?.outputType || "slideshow-video";

  if (outputType === "content-pack") {
    return [];
  }

  const lines = toArrayScript(scriptResult);
  const safeLines =
    lines.length > 0
      ? lines
      : [scriptResult?.hook, scriptResult?.cta].filter(Boolean);

  const brain = getBrain(agent);
  const visual = getVisualStyle(agent, brain);
  const durations = getDurationMap(agent?.lengthSec || agent?.length, safeLines.length, brain);

  return safeLines.map((line, index) => {
    const role = buildSceneRole(index, safeLines.length, brain);

    return {
      id: index + 1,
      order: index + 1,
      role,
      text: line,
      duration: durations[index] || 4,
      visualType: visual.visualType,
      visualPrompt: buildVisualPrompt(agent, line, role, brain, visual),
      overlay: buildOverlay(line, role, brain),
      transition:
        brain.energy >= 75 ? "fast-cut" : brain.style === "premium" ? "smooth-fade" : "cut",
    };
  });
}