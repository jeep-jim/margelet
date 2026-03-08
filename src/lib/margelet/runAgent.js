import { normalizeAgent } from "./agentSchema";
import { generateScript } from "./scriptEngine";
import { generateScenes } from "./sceneEngine";
import { generateCaptions } from "./captionEngine";
import { generateVoicePlan } from "./voiceEngine";
import { renderVideoPlan } from "./videoRenderer";
import { createPublishPlan } from "./publishEngine";

function getProduction(agent) {
  const outputType = agent?.outputType || "slideshow-video";

  const visualSourceType =
    agent?.visualSourceType ||
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
    agent?.renderMode ||
    (outputType === "content-pack"
      ? "ideas-only"
      : outputType === "script-voice"
      ? "assets-only"
      : "full-video");

  return {
    outputType,
    visualSourceType,
    renderMode,
  };
}

function buildPipeline(outputType, renderMode) {
  if (outputType === "content-pack") {
    return ["script", "captions", "publish"];
  }

  if (outputType === "script-voice") {
    return ["script", "scenes", "captions", "voice", "publish"];
  }

  if (outputType === "slideshow-video") {
    return renderMode === "full-video"
      ? ["script", "scenes", "captions", "voice", "video", "publish"]
      : ["script", "scenes", "captions", "voice", "publish"];
  }

  if (outputType === "stock-video") {
    return renderMode === "full-video"
      ? ["script", "scenes", "captions", "voice", "video", "publish"]
      : ["script", "scenes", "captions", "voice", "publish"];
  }

  if (outputType === "author-media-video") {
    return renderMode === "full-video"
      ? ["script", "scenes", "captions", "voice", "video", "publish"]
      : ["script", "scenes", "captions", "voice", "publish"];
  }

  return ["script", "scenes", "captions", "voice", "video", "publish"];
}

function buildFallbackVideoPlan(agent, script, scenes, captions, production) {
  return {
    type: agent?.outputType || "slideshow-video",
    format: agent?.format || "9:16",
    topic: agent?.topic || "",
    title: script?.title || "",
    hook: script?.hook || "",
    style: agent?.briefStyle || agent?.style || "default",
    voice: agent?.voice || "ai",
    totalDuration: Number(agent?.lengthSec || agent?.length || 30),
    visualSourceType: production.visualSourceType,
    renderMode: production.renderMode,
    status: "assets-only",
    scenes: Array.isArray(scenes) ? scenes : [],
    captions: Array.isArray(captions) ? captions : [],
  };
}

function clampBatchSize(value) {
  return Math.max(1, Math.min(30, Number(value) || 1));
}

function splitIdeas(sourceIdeas) {
  return String(sourceIdeas || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildBatchTopic(baseTopic, index, total, workspace) {
  const backlog = splitIdeas(workspace?.sourceIdeas);

  if (backlog[index]) {
    return backlog[index];
  }

  if (total <= 1) {
    return baseTopic || "general topic";
  }

  return `${baseTopic || "general topic"} — выпуск ${index + 1}`;
}

function buildVariantAgent(agentConfig, index, total) {
  const workspace = agentConfig?.workspace || {};

  return {
    ...agentConfig,
    topic: buildBatchTopic(agentConfig?.topic, index, total, workspace),
    cta: workspace?.cta || agentConfig?.cta || "",
    batchIndex: index + 1,
    batchTotal: total,
    variantLabel: `Вариант ${index + 1}`,
  };
}

async function runSingleAgent(agentConfig) {
  const normalized = normalizeAgent(agentConfig);
  const production = getProduction(normalized);

  const agent = {
    ...normalized,
    ...production,
    pipeline: buildPipeline(production.outputType, production.renderMode),
  };

  const script = await generateScript(agent);

  const needsScenes =
    agent.pipeline.includes("scenes") || agent.pipeline.includes("video");
  const scenes = needsScenes ? await generateScenes(agent, script) : [];

  const needsCaptions = agent.pipeline.includes("captions");
  const captions = needsCaptions
    ? await generateCaptions(agent, script, scenes)
    : [];

  const needsVoice = agent.pipeline.includes("voice");
  const voicePlan = needsVoice
    ? await generateVoicePlan(agent, script, scenes)
    : null;

  const needsVideo = agent.pipeline.includes("video");
  let videoPlan = null;

  if (needsVideo) {
    videoPlan = await renderVideoPlan(agent, script, scenes, captions);
  } else if (agent.renderMode === "assets-only") {
    videoPlan = buildFallbackVideoPlan(agent, script, scenes, captions, production);
  } else if (agent.outputType === "content-pack") {
    videoPlan = await renderVideoPlan(agent, script, scenes, captions);
  }

  const publishSource =
    videoPlan ||
    buildFallbackVideoPlan(agent, script, scenes, captions, production);

  const publishPlan = await createPublishPlan(agent, publishSource);

  return {
    agent,
    script,
    scenes,
    captions,
    voicePlan,
    videoPlan,
    publishPlan,
  };
}

export async function runAgent(agentConfig) {
  const requestedVideos =
    agentConfig?.requestedVideos ||
    agentConfig?.videosPerDay ||
    agentConfig?.workspace?.videosPerDay ||
    1;

  const batchSize = clampBatchSize(requestedVideos);

  if (batchSize <= 1) {
    return runSingleAgent(agentConfig);
  }

  return runAgentBatch({
    ...agentConfig,
    requestedVideos: batchSize,
  });
}

export async function runAgentBatch(agentConfig) {
  const requestedVideos =
    agentConfig?.requestedVideos ||
    agentConfig?.videosPerDay ||
    agentConfig?.workspace?.videosPerDay ||
    1;

  const batchSize = clampBatchSize(requestedVideos);
  const items = [];

  for (let index = 0; index < batchSize; index += 1) {
    const variantAgent = buildVariantAgent(agentConfig, index, batchSize);
    const result = await runSingleAgent(variantAgent);

    items.push({
      id: `batch-${index + 1}`,
      index: index + 1,
      label: `Видео ${index + 1}`,
      topic: variantAgent.topic,
      outputType: result?.agent?.outputType || variantAgent?.outputType,
      renderMode: result?.agent?.renderMode || variantAgent?.renderMode,
      publishPlan: result?.publishPlan || null,
      script: result?.script || null,
      scenes: Array.isArray(result?.scenes) ? result.scenes : [],
      captions: Array.isArray(result?.captions) ? result.captions : [],
      voicePlan: result?.voicePlan || null,
      videoPlan: result?.videoPlan || null,
      agent: result?.agent || variantAgent,
    });
  }

  return {
    type: "agent-batch",
    requestedVideos: batchSize,
    generatedVideos: items.length,
    queueStatus: "ready",
    items,
  };
}