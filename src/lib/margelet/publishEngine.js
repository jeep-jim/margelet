function getPlatforms(agent) {
  if (Array.isArray(agent?.publishing?.platforms) && agent.publishing.platforms.length) {
    return agent.publishing.platforms;
  }

  if (Array.isArray(agent?.platforms) && agent.platforms.length) {
    return agent.platforms;
  }

  if (agent?.platform) {
    return [agent.platform];
  }

  return ["telegram"];
}

function getPublishMode(agent) {
  if (agent?.publishing?.mode) return agent.publishing.mode;
  return agent?.autopost ? "autopost" : "manual";
}

function getFrequency(agent) {
  return agent?.publishing?.frequency || "daily";
}

function getSchedule(agent) {
  return agent?.publishing?.schedule || "";
}

function getQueueEnabled(agent) {
  if (typeof agent?.publishing?.queueEnabled === "boolean") {
    return agent.publishing.queueEnabled;
  }
  return true;
}

function getPublishAssetType(agent, videoPlan) {
  const outputType = agent?.outputType || videoPlan?.type || "slideshow-video";
  const renderMode = agent?.renderMode || videoPlan?.renderMode || "full-video";

  if (outputType === "content-pack") return "content-pack";
  if (outputType === "script-voice") return "script-voice";
  if (renderMode === "assets-only") return "assets";

  return "video";
}

function getGlobalStatus(assetType, mode, queueEnabled) {
  if (assetType === "content-pack") return "draft";
  if (assetType === "script-voice" || assetType === "assets") return "assets-ready";

  if (mode === "autopost") {
    return queueEnabled ? "queued" : "ready";
  }

  return "planned";
}

function getPlatformStatus(mode, assetType, queueEnabled) {
  if (assetType === "content-pack") return "draft";
  if (assetType === "script-voice" || assetType === "assets") return "assets-ready";

  if (mode === "autopost") {
    return queueEnabled ? "queued" : "ready";
  }

  return "review";
}

function getPlatformMeta(platform) {
  if (platform === "telegram") {
    return {
      label: "Telegram",
      contentType: "channel-post",
      recommendedFormat: "short-post-with-media",
    };
  }

  if (platform === "youtube-shorts") {
    return {
      label: "YouTube Shorts",
      contentType: "short-video",
      recommendedFormat: "9:16",
    };
  }

  if (platform === "instagram-reels") {
    return {
      label: "Instagram Reels",
      contentType: "reel",
      recommendedFormat: "9:16",
    };
  }

  if (platform === "tiktok") {
    return {
      label: "TikTok",
      contentType: "short-video",
      recommendedFormat: "9:16",
    };
  }

  return {
    label: platform,
    contentType: "post",
    recommendedFormat: "9:16",
  };
}

function buildPlatformDescription(videoPlan) {
  if (videoPlan?.hook) return videoPlan.hook;
  if (videoPlan?.title) return videoPlan.title;
  return "";
}

function buildCaptionSeed(videoPlan, agent) {
  const topic = agent?.topic || videoPlan?.topic || "";
  const title = videoPlan?.title || "";
  const hook = videoPlan?.hook || "";
  const cta = agent?.cta || agent?.generation?.cta || "";

  return [title, hook, topic, cta].filter(Boolean).join(" • ");
}

function buildHashtags(agent) {
  const raw = agent?.generation?.hashtags || "";
  return String(raw)
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildSchedulePreview(agent, index) {
  const frequency = getFrequency(agent);
  const schedule = getSchedule(agent);

  return {
    frequency,
    preferredTime: schedule || null,
    slotIndex: index + 1,
  };
}

export async function createPublishPlan(agent, videoPlan) {
  const platforms = getPlatforms(agent);
  const mode = getPublishMode(agent);
  const frequency = getFrequency(agent);
  const schedule = getSchedule(agent);
  const queueEnabled = getQueueEnabled(agent);
  const assetType = getPublishAssetType(agent, videoPlan);
  const hashtags = buildHashtags(agent);

  const outputType = agent?.outputType || videoPlan?.type || "slideshow-video";
  const renderMode = agent?.renderMode || videoPlan?.renderMode || "full-video";
  const globalStatus = getGlobalStatus(assetType, mode, queueEnabled);

  return {
    status: globalStatus,
    autopost: mode === "autopost",
    mode,
    frequency,
    schedule,
    queueEnabled,
    assetType,
    outputType,
    renderMode,
    title: videoPlan?.title || "",
    description: buildPlatformDescription(videoPlan),
    captionSeed: buildCaptionSeed(videoPlan, agent),
    hashtags,
    platforms: platforms.map((platform, index) => {
      const meta = getPlatformMeta(platform);

      return {
        platform,
        label: meta.label,
        enabled: true,
        status: getPlatformStatus(mode, assetType, queueEnabled),
        title: videoPlan?.title || "",
        description: buildPlatformDescription(videoPlan),
        captionSeed: buildCaptionSeed(videoPlan, agent),
        hashtags,
        scheduledAt: null,
        schedulePreview: buildSchedulePreview(agent, index),
        assetType,
        outputType,
        renderMode,
        contentType: meta.contentType,
        recommendedFormat: meta.recommendedFormat,
      };
    }),
  };
}