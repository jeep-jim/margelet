export async function generateVoicePlan(agent, scriptResult, scenes) {
  const safeScenes = Array.isArray(scenes) ? scenes : [];

  return {
    provider: "planned",
    voice: agent?.voice || "ai",
    language: "auto",
    status: "planned",
    segments: safeScenes.map((scene) => ({
      id: scene.id,
      text: scene.text,
      duration: scene.duration,
      file: null,
    })),
    fullText: [scriptResult?.hook || "", ...safeScenes.map((s) => s.text)]
      .filter(Boolean)
      .join(" "),
  };
}