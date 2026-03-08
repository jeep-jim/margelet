export function normalizeAgent(agent = {}) {
  const safeAgent = agent || {};

  const normalizedPlatforms = Array.isArray(safeAgent.platforms)
    ? safeAgent.platforms.filter(Boolean)
    : typeof safeAgent.platforms === "string"
    ? safeAgent.platforms
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : safeAgent.platform
    ? [safeAgent.platform]
    : ["telegram", "youtube-shorts"];

  const outputType = safeAgent.outputType || "slideshow-video";

  const visualSourceType =
    safeAgent.visualSourceType ||
    (outputType === "content-pack"
      ? "none"
      : outputType === "script-voice"
      ? "none"
      : outputType === "slideshow-video"
      ? "template"
      : outputType === "stock-video"
      ? "stock"
      : outputType === "author-media-video"
      ? "author-upload"
      : "template");

  const renderMode =
    safeAgent.renderMode ||
    (outputType === "content-pack"
      ? "ideas-only"
      : outputType === "script-voice"
      ? "assets-only"
      : "full-video");

  return {
    id: safeAgent.id || `agent_${Date.now()}`,
    name: safeAgent.name || "New Agent",
    topic: safeAgent.topic || "",
    audience: safeAgent.audience || "",
    tone: safeAgent.tone || "",
    style: safeAgent.style || "",
    cta: safeAgent.cta || "",
    icon: safeAgent.icon || "spark",
    accent: safeAgent.accent || "sky",
    tagline:
      safeAgent.tagline ||
      "Ежедневные идеи и структура short-form видео под публикацию.",
    active: typeof safeAgent.active === "boolean" ? safeAgent.active : false,

    category: safeAgent.category || "ai-tools",

    outputType,
    visualSourceType,
    renderMode,

    lengthSec:
      typeof safeAgent.lengthSec === "number"
        ? safeAgent.lengthSec
        : Number(safeAgent.lengthSec || safeAgent.length || 30),

    length: safeAgent.length || safeAgent.lengthSec || 30,
    format: safeAgent.format || "9:16",
    voice: safeAgent.voice || "auto",

    videosPerDay:
      typeof safeAgent.videosPerDay === "number"
        ? safeAgent.videosPerDay
        : Number(safeAgent.videosPerDay || safeAgent.videos || 1),

    videos:
      typeof safeAgent.videos === "number"
        ? safeAgent.videos
        : Number(safeAgent.videos || safeAgent.videosPerDay || 1),

    autopost: typeof safeAgent.autopost === "boolean" ? safeAgent.autopost : false,

    platforms: normalizedPlatforms,
    platform: safeAgent.platform || normalizedPlatforms[0] || "telegram",

    brain: {
      style: safeAgent.brain?.style || "sharp",
      hookType: safeAgent.brain?.hookType || "problem-first",
      scriptLogic: safeAgent.brain?.scriptLogic || "insight-to-action",
      videoStructure:
        safeAgent.brain?.videoStructure || "hook-problem-solution-cta",
      persona: safeAgent.brain?.persona || "expert-friend",
      proofMode: safeAgent.brain?.proofMode || "examples",
      ctaStyle: safeAgent.brain?.ctaStyle || "soft",
      energy:
        typeof safeAgent.brain?.energy === "number"
          ? safeAgent.brain.energy
          : Number(safeAgent.brain?.energy || 70),
    },

    brief: {
      channel: safeAgent.brief?.channel || safeAgent.topic || "",
      audience: safeAgent.brief?.audience || safeAgent.audience || "",
      goal: safeAgent.brief?.goal || "",
      tone: safeAgent.brief?.tone || safeAgent.tone || "",
      style: safeAgent.brief?.style || safeAgent.style || "",
      restrictions: safeAgent.brief?.restrictions || "",
    },

    sources: {
      links: safeAgent.sources?.links || "",
      notes: safeAgent.sources?.notes || "",
      references: safeAgent.sources?.references || "",
      ideas: safeAgent.sources?.ideas || "",
      authorAssetsNotes: safeAgent.sources?.authorAssetsNotes || "",
    },

    generation: {
      duration:
        safeAgent.generation?.duration ||
        safeAgent.lengthSec ||
        safeAgent.length ||
        30,
      format: safeAgent.generation?.format || safeAgent.format || "9:16",
      voice: safeAgent.generation?.voice || safeAgent.voice || "auto",
      captionsEnabled:
        typeof safeAgent.generation?.captionsEnabled === "boolean"
          ? safeAgent.generation.captionsEnabled
          : true,
      cta: safeAgent.generation?.cta || safeAgent.cta || "",
      hashtags: safeAgent.generation?.hashtags || "",
      videosPerDay:
        safeAgent.generation?.videosPerDay ||
        safeAgent.videosPerDay ||
        safeAgent.videos ||
        1,
    },

    publishing: {
      platforms: safeAgent.publishing?.platforms || normalizedPlatforms,
      mode: safeAgent.publishing?.mode || (safeAgent.autopost ? "autopost" : "manual"),
      frequency: safeAgent.publishing?.frequency || "daily",
      schedule: safeAgent.publishing?.schedule || "",
      queueEnabled:
        typeof safeAgent.publishing?.queueEnabled === "boolean"
          ? safeAgent.publishing.queueEnabled
          : true,
    },

    createdAt: safeAgent.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default normalizeAgent;