export async function generateCaptions(agent, scriptResult, scenes) {
  const hook = scriptResult?.hook || "";
  const safeScenes = Array.isArray(scenes) ? scenes : [];

  const captions = [];

  if (hook) {
    captions.push({
      id: "hook",
      start: 0,
      end: 2,
      text: hook,
      style: "hook",
    });
  }

  let cursor = 2;

  safeScenes.forEach((scene, index) => {
    const duration = Math.max(2, Number(scene?.duration) || 4);

    captions.push({
      id: `scene-${index + 1}`,
      start: cursor,
      end: cursor + duration,
      text: scene.overlay || scene.text || "",
      style: "body",
    });

    cursor += duration;
  });

  return captions;
}