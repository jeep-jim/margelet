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

function getVoiceStyle(agent, brain) {
  const voice = agent?.voice || agent?.generation?.voice || "ai";

  return {
    provider: "planned",
    voice,
    language: "auto",
    pace:
      brain.energy >= 80
        ? "fast"
        : brain.energy <= 35
        ? "calm"
        : "balanced",
    tone:
      brain.style === "premium"
        ? "polished"
        : brain.style === "educational"
        ? "clear"
        : brain.style === "entertaining"
        ? "animated"
        : brain.style === "aggressive"
        ? "punchy"
        : "natural",
    persona: brain.persona || "expert-friend",
  };
}

function normalizeSegments(scriptResult, scenes) {
  const safeScenes = Array.isArray(scenes) ? scenes : [];

  if (safeScenes.length) {
    return safeScenes.map((scene) => ({
      id: scene.id,
      role: scene.role || "body",
      text: scene.text || "",
      duration: Number(scene.duration) || 4,
    }));
  }

  const fallback = [];

  if (scriptResult?.hook) {
    fallback.push({
      id: "hook",
      role: "hook",
      text: scriptResult.hook,
      duration: 3,
    });
  }

  if (Array.isArray(scriptResult?.structure)) {
    scriptResult.structure.forEach((line, index) => {
      fallback.push({
        id: `line-${index + 1}`,
        role: "body",
        text: line,
        duration: 4,
      });
    });
  }

  if (scriptResult?.cta) {
    fallback.push({
      id: "cta",
      role: "cta",
      text: scriptResult.cta,
      duration: 2.5,
    });
  }

  return fallback;
}

function buildVoiceDirection(role, brain) {
  if (role === "hook") {
    return brain.energy >= 75
      ? "Open strong and immediately grab attention."
      : "Open clearly and confidently.";
  }

  if (role === "cta") {
    if (brain.ctaStyle === "soft") return "Finish softly and naturally.";
    if (brain.ctaStyle === "curiosity") return "Finish with intrigue.";
    if (brain.ctaStyle === "community") return "Invite response and participation.";
    return "Finish with a clear direct call to action.";
  }

  if (brain.style === "premium") return "Deliver in a polished controlled way.";
  if (brain.style === "educational") return "Deliver clearly and explain simply.";
  if (brain.style === "entertaining") return "Deliver with movement and energy.";
  if (brain.style === "aggressive") return "Deliver with punch and urgency.";

  return "Deliver naturally and clearly.";
}

export async function generateVoicePlan(agent, scriptResult, scenes) {
  const brain = getBrain(agent);
  const voiceStyle = getVoiceStyle(agent, brain);
  const segments = normalizeSegments(scriptResult, scenes);

  return {
    provider: voiceStyle.provider,
    voice: voiceStyle.voice,
    language: voiceStyle.language,
    status: "planned",
    pace: voiceStyle.pace,
    tone: voiceStyle.tone,
    persona: voiceStyle.persona,
    energy: brain.energy,
    segments: segments.map((segment) => ({
      id: segment.id,
      role: segment.role,
      text: segment.text,
      duration: segment.duration,
      direction: buildVoiceDirection(segment.role, brain),
      file: null,
    })),
    fullText: segments
      .map((segment) => segment.text)
      .filter(Boolean)
      .join(" "),
  };
}