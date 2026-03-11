// generationSchema.js
// Нормализация и контракт данных для генерации Margelet

export function normalizeGenerationRequest(input = {}) {
  const format = normalizeFormat(input.format);
  const topic = normalizeString(input.topic);
  const duration = normalizeDuration(input.duration);
  const tone = normalizeTone(input.tone);
  const voice = normalizeVoice(input.voice);
  const textOverlayMode = normalizeTextOverlayMode(input.textOverlayMode);

  const links = normalizeLinks(input.links || input.link);
  const notes = normalizeString(input.notes || "");

  const assets = normalizeAssets(input.assets || []);
  const mode = input.mode === "download" ? "download" : "preview";

  return {
    meta: {
      createdAt: Date.now(),
      requestId: createId()
    },

    config: {
      format,
      topic,
      duration,
      tone,
      voice,
      mode,
      textOverlayMode
    },

    sources: {
      links,
      notes,
      assets
    }
  };
}

function normalizeFormat(format) {
  if (!format) return null;

  const allowed = [
    "motivation",
    "business",
    "news",
    "ai",
    "crypto",
    "facts",
    "tech",
    "finance",
    "education",
    "history",
    "gaming",
    "reviews",
    "gadgets",
    "cars",
    "travel",
    "food",
    "fitness",
    "health",
    "science",
    "space",
    "animals",
    "music",
    "movies",
    "culture",
    "psychology",
    "books",
    "marketing",
    "startup",
    "design",
    "blog"
  ];

  if (allowed.includes(format)) return format;

  return null;
}

function normalizeDuration(duration) {
  if (!duration) return 30;

  if (typeof duration === "number") return duration;

  const map = {
    "10 секунд": 10,
    "15 секунд": 15,
    "20 секунд": 20,
    "30 секунд": 30,
    "40 секунд": 40,
    "60 секунд": 60,
    "10 sec": 10,
    "15 sec": 15,
    "20 sec": 20,
    "30 sec": 30,
    "40 sec": 40,
    "60 sec": 60
  };

  return map[duration] || 30;
}

function normalizeTone(tone) {
  if (!tone) return "dynamic";

  const map = {
    "Динамично": "dynamic",
    "Спокойно": "calm",
    "Дорого": "premium",
    "Дружелюбно": "friendly",
    Dynamic: "dynamic",
    Calm: "calm",
    Premium: "premium",
    Friendly: "friendly"
  };

  return map[tone] || "dynamic";
}

function normalizeVoice(voice) {
  if (!voice) return "auto";

  const map = {
    "Автоматический": "auto",
    "Энергичный": "energetic",
    "Спокойный": "calm",
    "Рассказчик": "narrator",
    Automatic: "auto",
    Energetic: "energetic",
    Calm: "calm",
    Narrator: "narrator"
  };

  return map[voice] || "auto";
}

function normalizeTextOverlayMode(value) {
  if (!value) return "subtitles";

  const mode = String(value).trim().toLowerCase();

  if (mode === "off") return "off";
  if (mode === "highlights") return "highlights";

  return "subtitles";
}

function normalizeLinks(input) {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input.filter(Boolean);
  }

  if (typeof input === "string") {
    return input.trim() ? [input.trim()] : [];
  }

  return [];
}

function normalizeAssets(list) {
  const result = {
    images: [],
    videos: [],
    audio: [],
    files: []
  };

  for (const asset of list) {
    if (!asset) continue;

    const type = detectAssetType(asset);

    if (type === "image") result.images.push(asset);
    else if (type === "video") result.videos.push(asset);
    else if (type === "audio") result.audio.push(asset);
    else result.files.push(asset);
  }

  return result;
}

function detectAssetType(asset) {
  const name = asset.name || "";
  const ext = name.split(".").pop()?.toLowerCase();

  if (!ext) return "file";

  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "image";
  if (["mp4", "mov", "webm"].includes(ext)) return "video";
  if (["mp3", "wav", "aac"].includes(ext)) return "audio";

  return "file";
}

function normalizeString(str) {
  if (!str) return "";
  return String(str).trim();
}

function createId() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).substring(2, 8)
  );
}