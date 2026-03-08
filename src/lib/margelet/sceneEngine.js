export async function generateScenes(agent, scriptResult) {
  const lines = Array.isArray(scriptResult?.script) ? scriptResult.script : [];

  const safeLength = Math.max(15, Number(agent?.lengthSec) || 30);
  const perScene = Math.max(4, Math.floor(safeLength / Math.max(lines.length, 1)));

  const outputType = agent?.outputType || "slideshow-video";
  const visualSourceType = agent?.visualSourceType || "template";

  // content-pack вообще не делает сцены
  if (outputType === "content-pack") {
    return [];
  }

  return lines.map((line, index) => {
    let visualType = "template";
    let visualPrompt = `${agent?.topic || "topic"}, ${line}`;

    // ---------- SLIDESHOW ----------
    if (outputType === "slideshow-video") {
      visualType = "slide";
      visualPrompt = `minimal slide background, ${line}`;
    }

    // ---------- STOCK VIDEO ----------
    if (outputType === "stock-video") {
      visualType = "stock";
      visualPrompt = `${agent?.topic || "topic"}, cinematic stock footage, ${line}`;
    }

    // ---------- AUTHOR MEDIA ----------
    if (outputType === "author-media-video") {
      visualType = "author-media";
      visualPrompt = `use uploaded creator media for scene about: ${line}`;
    }

    // ---------- SCRIPT VOICE ----------
    if (outputType === "script-voice") {
      visualType = "voice-only";
      visualPrompt = "";
    }

    return {
      id: index + 1,
      order: index + 1,
      text: line,
      duration: perScene,
      visualType,
      visualPrompt,
      overlay: line,
    };
  });
}