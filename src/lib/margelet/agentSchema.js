export const defaultAgentConfig = {
  // ---------- CORE ----------
  topic: "",
  audience: "general",
  tone: "viral",

  // ---------- PRODUCTION ----------
  outputType: "slideshow-video",
  visualSourceType: "template",
  renderMode: "full-video",

  // ---------- VIDEO ----------
  format: "9:16",
  lengthSec: 30,
  videosPerDay: 3,

  // ---------- AUDIO ----------
  voice: "ai",

  // ---------- PUBLISH ----------
  autopost: false,
  platforms: ["telegram"],

  // ---------- META ----------
  name: "",
  category: "",
  pipeline: [],
};

export function normalizeAgent(agent) {
  const merged = {
    ...defaultAgentConfig,
    ...(agent || {}),
  };

  // safety: platforms
  if (!Array.isArray(merged.platforms) || merged.platforms.length === 0) {
    merged.platforms = ["telegram"];
  }

  // safety: duration
  merged.lengthSec = Math.max(15, Number(merged.lengthSec) || 30);

  // safety: videos per batch
  merged.videosPerDay = Math.max(1, Number(merged.videosPerDay) || 1);

  return merged;
}