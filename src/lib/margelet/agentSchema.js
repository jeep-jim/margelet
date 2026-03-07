export const defaultAgentConfig = {
  topic: "",
  audience: "general",
  format: "faceless",
  tone: "viral",
  lengthSec: 30,
  videosPerDay: 3,
  voice: "ai",
  autopost: false,
  platforms: ["telegram"],
};

export function normalizeAgent(agent) {
  return {
    ...defaultAgentConfig,
    ...agent,
  };
}