import { runAgent } from "./runAgent";

function clampBatchSize(value) {
  return Math.max(1, Math.min(30, Number(value) || 1));
}

function buildBatchTopic(baseTopic, index, total, workspace) {
  const backlog = String(workspace?.sourceIdeas || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  if (backlog[index]) {
    return backlog[index];
  }

  if (total <= 1) {
    return baseTopic || "general topic";
  }

  return `${baseTopic || "general topic"} — выпуск ${index + 1}`;
}

function buildBatchCTA(baseCta, index) {
  if (!baseCta) return "";
  return index === 0 ? baseCta : `${baseCta}`;
}

function buildVariantAgent(agentConfig, index, total) {
  const workspace = agentConfig?.workspace || {};

  return {
    ...agentConfig,
    topic: buildBatchTopic(agentConfig?.topic, index, total, workspace),
    cta: buildBatchCTA(workspace?.cta || agentConfig?.cta, index),
    batchIndex: index + 1,
    batchTotal: total,
    variantLabel: `Вариант ${index + 1}`,
  };
}

export async function runAgentBatch(agentConfig) {
  const requestedVideos =
    agentConfig?.requestedVideos ||
    agentConfig?.videosPerDay ||
    agentConfig?.workspace?.videosPerDay ||
    1;

  const batchSize = clampBatchSize(requestedVideos);
  const results = [];

  for (let index = 0; index < batchSize; index += 1) {
    const variantAgent = buildVariantAgent(agentConfig, index, batchSize);
    const result = await runAgent(variantAgent);

    results.push({
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
    generatedVideos: results.length,
    queueStatus: "ready",
    items: results,
  };
}