function getPublishAssetType(agent, videoPlan) {
  const outputType = agent?.outputType || videoPlan?.type || "slideshow-video";
  const renderMode = agent?.renderMode || videoPlan?.renderMode || "full-video";

  if (outputType === "content-pack") {
    return "content-pack";
  }

  if (outputType === "script-voice") {
    return "script-voice";
  }

  if (renderMode === "assets-only") {
    return "assets";
  }

  return "video";
}

function getPlatformStatus(agent, assetType) {
  const autopost = !!agent?.autopost;

  if (assetType === "content-pack") {
    return "draft";
  }

  if (assetType === "script-voice" || assetType === "assets") {
    return "assets-ready";
  }

  if (autopost) {
    return "ready";
  }

  return "queued";
}

function buildPlatformDescription(videoPlan) {
  if (videoPlan?.hook) return videoPlan.hook;
  if (videoPlan?.title) return videoPlan.title;
  return "";
}

export async function createPublishPlan(agent, videoPlan) {
  const platforms = Array.isArray(agent?.platforms) && agent.platforms.length
    ? agent.platforms
    : ["telegram"];

  const assetType = getPublishAssetType(agent, videoPlan);
  const autopost = !!agent?.autopost;
  const globalStatus =
    assetType === "video"
      ? autopost
        ? "ready"
        : "planned"
      : "draft";

  return {
    status: globalStatus,
    autopost,
    assetType,
    outputType: agent?.outputType || videoPlan?.type || "slideshow-video",
    renderMode: agent?.renderMode || videoPlan?.renderMode || "full-video",
    platforms: platforms.map((platform) => ({
      platform,
      enabled: true,
      status: getPlatformStatus(agent, assetType),
      title: videoPlan?.title || "",
      description: buildPlatformDescription(videoPlan),
      scheduledAt: null,
      assetType,
      outputType: agent?.outputType || videoPlan?.type || "slideshow-video",
      renderMode: agent?.renderMode || videoPlan?.renderMode || "full-video",
    })),
  };
}