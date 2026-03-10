// prepareGenerationInput.js
// Подготовка пользовательских данных перед генерацией ролика.
// Ничего не сохраняет постоянно: только нормализует, читает метаданные
// и подготавливает временную структуру для pipeline.

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"];
const VIDEO_EXTENSIONS = ["mp4", "mov", "webm", "m4v"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "aac", "m4a", "ogg"];
const TEXT_EXTENSIONS = ["txt", "md", "json", "csv"];
const DOC_EXTENSIONS = ["pdf", "doc", "docx", "rtf"];

export async function prepareGenerationInput(request) {
  const safeRequest = request || {};
  const sourceAssets = safeRequest?.sources?.assets || {
    images: [],
    videos: [],
    audio: [],
    files: [],
  };

  const preparedImages = await prepareImages(sourceAssets.images || []);
  const preparedVideos = await prepareVideos(sourceAssets.videos || []);
  const preparedAudio = await prepareAudio(sourceAssets.audio || []);
  const preparedFiles = await prepareFiles(sourceAssets.files || []);
  const preparedLinks = prepareLinks(safeRequest?.sources?.links || []);
  const preparedNotes = prepareNotes(safeRequest?.sources?.notes || "");

  const summary = buildInputSummary({
    config: safeRequest.config || {},
    images: preparedImages,
    videos: preparedVideos,
    audio: preparedAudio,
    files: preparedFiles,
    links: preparedLinks,
    notes: preparedNotes,
  });

  return {
    ...safeRequest,
    prepared: {
      images: preparedImages,
      videos: preparedVideos,
      audio: preparedAudio,
      files: preparedFiles,
      links: preparedLinks,
      notes: preparedNotes,
      summary,
    },
  };
}

async function prepareImages(images) {
  const result = [];

  for (const item of images) {
    const prepared = await prepareSingleImage(item);
    if (prepared) result.push(prepared);
  }

  return result;
}

async function prepareVideos(videos) {
  const result = [];

  for (const item of videos) {
    const prepared = await prepareSingleVideo(item);
    if (prepared) result.push(prepared);
  }

  return result;
}

async function prepareAudio(audioList) {
  const result = [];

  for (const item of audioList) {
    const prepared = await prepareSingleAudio(item);
    if (prepared) result.push(prepared);
  }

  return result;
}

async function prepareFiles(files) {
  const result = [];

  for (const item of files) {
    const prepared = await prepareSingleFile(item);
    if (prepared) result.push(prepared);
  }

  return result;
}

async function prepareSingleImage(asset) {
  if (!asset) return null;

  const base = createBaseAsset(asset, "image");
  const src = extractAssetSource(asset);

  if (!src) {
    return {
      ...base,
      width: null,
      height: null,
      aspectRatio: null,
      previewUrl: "",
      canUseInVisualTimeline: false,
      compression: {
        attempted: false,
        applied: false,
      },
    };
  }

  const imageMeta = await readImageMeta(src);

  return {
    ...base,
    width: imageMeta.width,
    height: imageMeta.height,
    aspectRatio: imageMeta.aspectRatio,
    orientation: imageMeta.orientation,
    previewUrl: src,
    canUseInVisualTimeline: true,
    compression: {
      attempted: false,
      applied: false,
    },
  };
}

async function prepareSingleVideo(asset) {
  if (!asset) return null;

  const base = createBaseAsset(asset, "video");
  const src = extractAssetSource(asset);

  if (!src) {
    return {
      ...base,
      durationMs: null,
      width: null,
      height: null,
      aspectRatio: null,
      posterUrl: "",
      hasAudioTrack: true,
      canUseInVisualTimeline: false,
    };
  }

  const videoMeta = await readVideoMeta(src);

  return {
    ...base,
    durationMs: videoMeta.durationMs,
    width: videoMeta.width,
    height: videoMeta.height,
    aspectRatio: videoMeta.aspectRatio,
    orientation: videoMeta.orientation,
    posterUrl: videoMeta.posterUrl,
    previewUrl: src,
    hasAudioTrack: true,
    canUseInVisualTimeline: true,
  };
}

async function prepareSingleAudio(asset) {
  if (!asset) return null;

  const base = createBaseAsset(asset, "audio");
  const src = extractAssetSource(asset);

  if (!src) {
    return {
      ...base,
      durationMs: null,
      waveformPreview: null,
      canUseAsSoundtrack: false,
    };
  }

  const audioMeta = await readAudioMeta(src);

  return {
    ...base,
    durationMs: audioMeta.durationMs,
    previewUrl: src,
    waveformPreview: null,
    canUseAsSoundtrack: true,
  };
}

async function prepareSingleFile(asset) {
  if (!asset) return null;

  const base = createBaseAsset(asset, detectGenericFileKind(asset));
  const src = extractAssetSource(asset);

  let extractedText = "";
  const fileKind = detectGenericFileKind(asset);

  if (fileKind === "text" && src) {
    try {
      extractedText = await tryReadTextFromAsset(asset);
    } catch (error) {
      extractedText = "";
    }
  }

  return {
    ...base,
    previewUrl: src || "",
    extractedText,
    canUseAsContext: true,
    fileKind,
  };
}

function prepareLinks(links) {
  return links
    .map((link) => normalizeLink(link))
    .filter(Boolean)
    .map((url) => ({
      url,
      hostname: safeHostname(url),
      canUseAsContext: true,
    }));
}

function prepareNotes(notes) {
  const safeNotes = typeof notes === "string" ? notes.trim() : "";

  return {
    text: safeNotes,
    hasValue: safeNotes.length > 0,
    charCount: safeNotes.length,
    canUseAsContext: safeNotes.length > 0,
  };
}

function buildInputSummary({
  config,
  images,
  videos,
  audio,
  files,
  links,
  notes,
}) {
  const totalVisualAssets = images.length + videos.length;
  const totalContextSources =
    files.length + links.length + (notes?.hasValue ? 1 : 0);

  const hasUserMedia = totalVisualAssets > 0 || audio.length > 0;
  const hasContext = totalContextSources > 0;
  const primaryVisualMode =
    videos.length > 0 ? "video-first" : images.length > 0 ? "image-first" : "generated-first";

  return {
    format: config?.format || null,
    topic: config?.topic || "",
    duration: config?.duration || 30,
    tone: config?.tone || "dynamic",
    voice: config?.voice || "auto",

    counts: {
      images: images.length,
      videos: videos.length,
      audio: audio.length,
      files: files.length,
      links: links.length,
      notes: notes?.hasValue ? 1 : 0,
    },

    flags: {
      hasUserMedia,
      hasContext,
      hasMusic: audio.length > 0,
      hasUserVideo: videos.length > 0,
      hasUserImages: images.length > 0,
      shouldPreferUserAssets: totalVisualAssets > 0,
    },

    primaryVisualMode,

    generationHints: {
      useUploadedVideoAsPrimaryFootage: videos.length > 0,
      useUploadedImagesAsSceneVisuals: images.length > 0,
      useUploadedAudioAsSoundtrack: audio.length > 0,
      enrichScriptWithFiles: files.length > 0,
      enrichScriptWithLinks: links.length > 0,
      enrichScriptWithNotes: !!notes?.hasValue,
    },
  };
}

function createBaseAsset(asset, normalizedType) {
  const name = normalizeString(asset.name || asset.filename || "asset");
  const extension = extractExtension(name);
  const mimeType =
    normalizeString(asset.mimeType || asset.type || guessMimeType(name)) || "";
  const sizeBytes = normalizeNumber(asset.sizeBytes ?? asset.size ?? null);

  return {
    id: normalizeString(asset.id || createId()),
    originalType: normalizedType,
    name,
    extension,
    mimeType,
    sizeBytes,
    localOnly: true,
    temporary: true,
  };
}

function extractAssetSource(asset) {
  if (!asset) return "";

  if (typeof asset.previewUrl === "string" && asset.previewUrl) {
    return asset.previewUrl;
  }

  if (typeof asset.src === "string" && asset.src) {
    return asset.src;
  }

  if (typeof asset.url === "string" && asset.url) {
    return asset.url;
  }

  return "";
}

async function readImageMeta(src) {
  if (typeof window === "undefined") {
    return {
      width: null,
      height: null,
      aspectRatio: null,
      orientation: "unknown",
    };
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const width = safeFinite(img.naturalWidth);
      const height = safeFinite(img.naturalHeight);

      resolve({
        width,
        height,
        aspectRatio: buildAspectRatio(width, height),
        orientation: detectOrientation(width, height),
      });
    };

    img.onerror = () => {
      resolve({
        width: null,
        height: null,
        aspectRatio: null,
        orientation: "unknown",
      });
    };

    img.src = src;
  });
}

async function readVideoMeta(src) {
  if (typeof window === "undefined") {
    return {
      durationMs: null,
      width: null,
      height: null,
      aspectRatio: null,
      orientation: "unknown",
      posterUrl: "",
    };
  }

  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.removeAttribute("src");
      video.load();
    };

    video.onloadedmetadata = async () => {
      const width = safeFinite(video.videoWidth);
      const height = safeFinite(video.videoHeight);
      const durationMs = Number.isFinite(video.duration)
        ? Math.round(video.duration * 1000)
        : null;

      let posterUrl = "";

      try {
        posterUrl = await captureVideoPoster(video);
      } catch (error) {
        posterUrl = "";
      }

      cleanup();

      resolve({
        durationMs,
        width,
        height,
        aspectRatio: buildAspectRatio(width, height),
        orientation: detectOrientation(width, height),
        posterUrl,
      });
    };

    video.onerror = () => {
      cleanup();
      resolve({
        durationMs: null,
        width: null,
        height: null,
        aspectRatio: null,
        orientation: "unknown",
        posterUrl: "",
      });
    };

    video.src = src;
  });
}

async function readAudioMeta(src) {
  if (typeof window === "undefined") {
    return {
      durationMs: null,
    };
  }

  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";

    const cleanup = () => {
      audio.removeAttribute("src");
      audio.load();
    };

    audio.onloadedmetadata = () => {
      const durationMs = Number.isFinite(audio.duration)
        ? Math.round(audio.duration * 1000)
        : null;

      cleanup();
      resolve({ durationMs });
    };

    audio.onerror = () => {
      cleanup();
      resolve({ durationMs: null });
    };

    audio.src = src;
  });
}

async function captureVideoPoster(videoElement) {
  if (typeof document === "undefined") return "";

  const width = videoElement.videoWidth || 0;
  const height = videoElement.videoHeight || 0;

  if (!width || !height) return "";

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  try {
    ctx.drawImage(videoElement, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch (error) {
    return "";
  }
}

async function tryReadTextFromAsset(asset) {
  if (asset?.textContent && typeof asset.textContent === "string") {
    return asset.textContent.trim();
  }

  if (asset?.file instanceof File && typeof asset.file.text === "function") {
    const text = await asset.file.text();
    return String(text || "").trim();
  }

  return "";
}

function detectGenericFileKind(asset) {
  const name = normalizeString(asset?.name || asset?.filename || "");
  const extension = extractExtension(name);

  if (TEXT_EXTENSIONS.includes(extension)) return "text";
  if (DOC_EXTENSIONS.includes(extension)) return "document";
  return "file";
}

function normalizeLink(value) {
  const text = normalizeString(value);
  if (!text) return "";

  try {
    const url = new URL(text);
    return url.toString();
  } catch (error) {
    return "";
  }
}

function safeHostname(url) {
  try {
    return new URL(url).hostname || "";
  } catch (error) {
    return "";
  }
}

function extractExtension(name) {
  const clean = normalizeString(name).toLowerCase();
  const parts = clean.split(".");
  return parts.length > 1 ? parts.pop() || "" : "";
}

function guessMimeType(name) {
  const ext = extractExtension(name);

  if (IMAGE_EXTENSIONS.includes(ext)) return `image/${ext === "jpg" ? "jpeg" : ext}`;
  if (VIDEO_EXTENSIONS.includes(ext)) return `video/${ext === "mov" ? "quicktime" : ext}`;
  if (AUDIO_EXTENSIONS.includes(ext)) return `audio/${ext}`;
  if (TEXT_EXTENSIONS.includes(ext)) return "text/plain";
  if (ext === "pdf") return "application/pdf";

  return "";
}

function detectOrientation(width, height) {
  if (!width || !height) return "unknown";
  if (height > width) return "portrait";
  if (width > height) return "landscape";
  return "square";
}

function buildAspectRatio(width, height) {
  if (!width || !height) return null;

  const divisor = gcd(width, height) || 1;
  return `${Math.round(width / divisor)}:${Math.round(height / divisor)}`;
}

function gcd(a, b) {
  let x = Math.abs(Number(a) || 0);
  let y = Math.abs(Number(b) || 0);

  while (y) {
    const temp = y;
    y = x % y;
    x = temp;
  }

  return x || 1;
}

function safeFinite(value) {
  return Number.isFinite(value) ? value : null;
}

function normalizeString(value) {
  if (value == null) return "";
  return String(value).trim();
}

function normalizeNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function createId() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}