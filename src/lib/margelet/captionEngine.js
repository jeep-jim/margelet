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

function splitCaptionText(text, brain) {
  const safe = String(text || "").trim();
  if (!safe) return [];

  const maxLen =
    brain.energy >= 80 ? 26 : brain.style === "premium" ? 38 : 32;

  const words = safe.split(/\s+/);
  const chunks = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length <= maxLen) {
      current = next;
    } else {
      if (current) chunks.push(current);
      current = word;
    }
  }

  if (current) chunks.push(current);

  return chunks.length ? chunks : [safe];
}

function normalizeCaptionText(text, role, brain) {
  let value = String(text || "").trim();
  if (!value) return "";

  if (role === "hook" || role === "claim" || role === "question") {
    if (brain.energy >= 75) {
      value = value.toUpperCase();
    }
    return value;
  }

  return value;
}

function getCaptionStyle(role, brain) {
  if (role === "hook" || role === "claim" || role === "question") return "hook";
  if (role === "cta" || role === "offer" || role === "result") return "cta";
  if (brain.style === "premium") return "premium";
  if (brain.style === "educational") return "educational";
  return "body";
}

export async function generateCaptions(agent, scriptResult, scenes) {
  const brain = getBrain(agent);
  const hook = scriptResult?.hook || "";
  const safeScenes = Array.isArray(scenes) ? scenes : [];
  const captions = [];

  if (hook) {
    captions.push({
      id: "hook",
      start: 0,
      end: brain.energy >= 75 ? 1.8 : 2.2,
      text: normalizeCaptionText(hook, "hook", brain),
      style: "hook",
    });
  }

  let cursor = hook ? (brain.energy >= 75 ? 1.8 : 2.2) : 0;

  safeScenes.forEach((scene, index) => {
    const duration = Math.max(2, Number(scene?.duration) || 4);
    const role = scene?.role || "body";
    const rawText = scene?.overlay || scene?.text || "";
    const normalized = normalizeCaptionText(rawText, role, brain);
    const chunks = splitCaptionText(normalized, brain);

    if (!chunks.length) return;

    const partDuration = Math.max(0.9, duration / chunks.length);

    chunks.forEach((chunk, partIndex) => {
      const start = cursor + partIndex * partDuration;
      const end = start + partDuration;

      captions.push({
        id: `scene-${index + 1}-${partIndex + 1}`,
        start: Number(start.toFixed(2)),
        end: Number(end.toFixed(2)),
        text: chunk,
        style: getCaptionStyle(role, brain),
      });
    });

    cursor += duration;
  });

  if (scriptResult?.cta) {
    captions.push({
      id: "final-cta",
      start: Number(cursor.toFixed(2)),
      end: Number((cursor + 2.2).toFixed(2)),
      text: normalizeCaptionText(scriptResult.cta, "cta", brain),
      style: "cta",
    });
  }

  return captions;
}