export const defaultAgentConfig = {
  // ---------- CORE ----------
  id: "",
  name: "",
  topic: "",
  audience: "general",
  tone: "viral",
  style: "",
  cta: "",
  icon: "spark",
  accent: "sky",
  tagline: "",
  active: false,
  category: "",

  // ---------- PRODUCTION ----------
  outputType: "slideshow-video",
  visualSourceType: "template",
  renderMode: "full-video",
  pipeline: [],

  // ---------- VIDEO ----------
  format: "9:16",
  lengthSec: 30,
  length: 30,
  videosPerDay: 3,
  videos: 3,

  // ---------- AUDIO ----------
  voice: "ai",

  // ---------- PUBLISH ----------
  autopost: false,
  platforms: ["telegram"],
  platform: "telegram",

  // ---------- WORKSPACE: BRIEF ----------
  briefChannel: "",
  briefAudience: "",
  briefGoal: "",
  briefTone: "",
  briefStyle: "",
  briefRestrictions: "",

  // ---------- WORKSPACE: SOURCES ----------
  sourceLinks: "",
  sourceNotes: "",
  sourceReferences: "",
  sourceIdeas: "",
  authorAssetsNotes: "",

  // ---------- BRAIN ----------
  brain: {
    style: "sharp",
    hookType: "problem-first",
    scriptLogic: "insight-to-action",
    videoStructure: "hook-problem-solution-cta",
    persona: "expert-friend",
    proofMode: "examples",
    ctaStyle: "soft",
    energy: 70,
  },

  // ---------- STRUCTURED SUB-OBJECTS ----------
  brief: {
    channel: "",
    audience: "",
    goal: "",
    tone: "",
    style: "",
    restrictions: "",
  },

  sources: {
    links: "",
    notes: "",
    references: "",
    ideas: "",
    authorAssetsNotes: "",
  },

  generation: {
    duration: 30,
    format: "9:16",
    voice: "ai",
    captionsEnabled: true,
    cta: "",
    hashtags: "",
    videosPerDay: 3,
  },

  publishing: {
    platforms: ["telegram"],
    mode: "manual",
    frequency: "daily",
    schedule: "",
    queueEnabled: true,
  },

  // ---------- META ----------
  createdAt: "",
  updatedAt: "",
};

function normalizePlatforms(input) {
  if (Array.isArray(input)) {
    return input.filter(Boolean);
  }

  if (typeof input === "string") {
    return input
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeBrain(brain = {}) {
  return {
    style: brain.style || "sharp",
    hookType: brain.hookType || "problem-first",
    scriptLogic: brain.scriptLogic || "insight-to-action",
    videoStructure:
      brain.videoStructure || "hook-problem-solution-cta",
    persona: brain.persona || "expert-friend",
    proofMode: brain.proofMode || "examples",
    ctaStyle: brain.ctaStyle || "soft",
    energy: Math.max(0, Math.min(100, Number(brain.energy) || 70)),
  };
}

function deriveVisualSourceType(outputType, currentValue) {
  if (currentValue) return currentValue;

  if (outputType === "content-pack") return "none";
  if (outputType === "script-voice") return "none";
  if (outputType === "slideshow-video") return "template";
  if (outputType === "stock-video") return "stock";
  if (outputType === "author-media-video") return "author-upload";

  return "template";
}

function deriveRenderMode(outputType, currentValue) {
  if (currentValue) return currentValue;

  if (outputType === "content-pack") return "ideas-only";
  if (outputType === "script-voice") return "assets-only";

  return "full-video";
}

export function normalizeAgent(agent) {
  const input = agent || {};

  const merged = {
    ...defaultAgentConfig,
    ...input,
  };

  const outputType = merged.outputType || "slideshow-video";
  const platforms =
    normalizePlatforms(merged.platforms).length > 0
      ? normalizePlatforms(merged.platforms)
      : normalizePlatforms(merged.publishing?.platforms).length > 0
      ? normalizePlatforms(merged.publishing?.platforms)
      : merged.platform
      ? [merged.platform]
      : ["telegram"];

  const lengthSec = Math.max(
    15,
    Number(
      merged.lengthSec ||
        merged.length ||
        merged.generation?.duration ||
        defaultAgentConfig.lengthSec
    ) || 30
  );

  const videosPerDay = Math.max(
    1,
    Number(
      merged.videosPerDay ||
        merged.videos ||
        merged.generation?.videosPerDay ||
        defaultAgentConfig.videosPerDay
    ) || 1
  );

  const voice = merged.voice || merged.generation?.voice || "ai";
  const format = merged.format || merged.generation?.format || "9:16";
  const cta = merged.cta || merged.generation?.cta || "";
  const audience = merged.audience || merged.brief?.audience || "general";
  const tone = merged.tone || merged.brief?.tone || "viral";
  const style = merged.style || merged.brief?.style || "";

  const brief = {
    channel: merged.brief?.channel || merged.briefChannel || merged.topic || "",
    audience: merged.brief?.audience || merged.briefAudience || audience,
    goal: merged.brief?.goal || merged.briefGoal || "",
    tone: merged.brief?.tone || merged.briefTone || tone,
    style: merged.brief?.style || merged.briefStyle || style,
    restrictions:
      merged.brief?.restrictions || merged.briefRestrictions || "",
  };

  const sources = {
    links: merged.sources?.links || merged.sourceLinks || "",
    notes: merged.sources?.notes || merged.sourceNotes || "",
    references: merged.sources?.references || merged.sourceReferences || "",
    ideas: merged.sources?.ideas || merged.sourceIdeas || "",
    authorAssetsNotes:
      merged.sources?.authorAssetsNotes || merged.authorAssetsNotes || "",
  };

  const publishing = {
    platforms,
    mode:
      merged.publishing?.mode ||
      (merged.autopost ? "autopost" : "manual"),
    frequency: merged.publishing?.frequency || "daily",
    schedule: merged.publishing?.schedule || "",
    queueEnabled:
      typeof merged.publishing?.queueEnabled === "boolean"
        ? merged.publishing.queueEnabled
        : true,
  };

  const generation = {
    duration: lengthSec,
    format,
    voice,
    captionsEnabled:
      typeof merged.generation?.captionsEnabled === "boolean"
        ? merged.generation.captionsEnabled
        : true,
    cta,
    hashtags: merged.generation?.hashtags || "",
    videosPerDay,
  };

  return {
    ...merged,

    id: merged.id || `agent_${Date.now()}`,
    name: merged.name || "",
    topic: merged.topic || "",
    audience,
    tone,
    style,
    cta,
    icon: merged.icon || "spark",
    accent: merged.accent || "sky",
    tagline: merged.tagline || "",
    active: typeof merged.active === "boolean" ? merged.active : false,
    category: merged.category || "",

    outputType,
    visualSourceType: deriveVisualSourceType(
      outputType,
      merged.visualSourceType
    ),
    renderMode: deriveRenderMode(outputType, merged.renderMode),

    format,
    lengthSec,
    length: lengthSec,
    videosPerDay,
    videos: videosPerDay,
    voice,

    autopost: publishing.mode === "autopost",
    platforms,
    platform: platforms[0] || "telegram",

    briefChannel: brief.channel,
    briefAudience: brief.audience,
    briefGoal: brief.goal,
    briefTone: brief.tone,
    briefStyle: brief.style,
    briefRestrictions: brief.restrictions,

    sourceLinks: sources.links,
    sourceNotes: sources.notes,
    sourceReferences: sources.references,
    sourceIdeas: sources.ideas,
    authorAssetsNotes: sources.authorAssetsNotes,

    brain: normalizeBrain(merged.brain),

    brief,
    sources,
    generation,
    publishing,

    createdAt: merged.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}