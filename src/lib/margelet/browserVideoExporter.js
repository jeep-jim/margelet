// src/lib/margelet/browserVideoExporter.js

export async function exportVideo(renderJob) {
  if (!renderJob) {
    throw new Error("Render job is required");
  }

  const visuals = Array.isArray(renderJob?.tracks?.visuals)
    ? renderJob.tracks.visuals
    : [];
  const captions = Array.isArray(renderJob?.tracks?.captions)
    ? renderJob.tracks.captions
    : [];
  const narration = Array.isArray(renderJob?.tracks?.narration)
    ? renderJob.tracks.narration
    : [];

  const resolution =
    renderJob?.job?.resolution ||
    renderJob?.renderJob?.resolution || {
      width: 1080,
      height: 1920,
    };

  const fps =
    Number(renderJob?.job?.fps) ||
    Number(renderJob?.renderJob?.fps) ||
    30;

  const durationSec =
    Number(renderJob?.job?.durationSec) ||
    Number(renderJob?.renderJob?.durationSec) ||
    Number(renderJob?.structure?.totalDurationSec) ||
    inferDurationSec({ visuals, captions, narration }) ||
    30;

  const canvas = document.createElement("canvas");
  canvas.width = resolution.width;
  canvas.height = resolution.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to create canvas context");
  }

  const loadedImages = await preloadVisualImages(visuals);

  const stream = canvas.captureStream(fps);
  const audioStream = await buildNarrationAudioStream(narration);

  if (audioStream) {
    for (const track of audioStream.getAudioTracks()) {
      stream.addTrack(track);
    }
  }

  const recorder = new MediaRecorder(stream, pickBestMimeType(), {
    videoBitsPerSecond: 8_000_000,
  });

  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data?.size > 0) {
      chunks.push(e.data);
    }
  };

  recorder.start();

  if (audioStream) {
    scheduleNarrationPlayback(narration);
  }

  const totalFrames = Math.max(1, Math.ceil(durationSec * fps));

  for (let frame = 0; frame < totalFrames; frame++) {
    const timeSec = frame / fps;

    renderFrame({
      ctx,
      canvas,
      visuals,
      captions,
      loadedImages,
      timeSec,
    });

    await sleep(1000 / fps);
  }

  recorder.stop();

  const blob = await waitForRecorder(recorder, chunks);
  downloadBlob(blob, "margelet-video.webm");
  return blob;
}

function renderFrame({ ctx, canvas, visuals, captions, loadedImages, timeSec }) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground(ctx, canvas);

  const visual = getVisualAtTime(visuals, timeSec);
  if (visual) {
    drawVisual(ctx, visual, loadedImages, canvas);
  }

  const caption = getCaptionAtTime(captions, timeSec);
  const captionText = buildCaptionText(caption);

  if (captionText) {
    drawCaption(ctx, captionText, canvas);
  }
}

function drawBackground(ctx, canvas) {
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawVisual(ctx, visual, loadedImages, canvas) {
  const src =
    visual?.source?.url ||
    visual?.source?.previewUrl ||
    visual?.source?.posterUrl ||
    visual?.src ||
    "";

  const textFallback =
    visual?.source?.text ||
    visual?.overlays?.text ||
    "";

  const img = src ? loadedImages.get(src) : null;

  if (img && img.complete) {
    drawImageCover(ctx, img, canvas.width, canvas.height);
    return;
  }

  // fallback if no image
  ctx.fillStyle = "#1f1f24";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (textFallback) {
    drawCenteredFallbackText(ctx, textFallback, canvas);
  }
}

function drawImageCover(ctx, img, width, height) {
  const imageRatio = img.width / img.height;
  const frameRatio = width / height;

  let drawWidth;
  let drawHeight;
  let offsetX;
  let offsetY;

  if (imageRatio > frameRatio) {
    drawHeight = height;
    drawWidth = img.width * (height / img.height);
    offsetX = (width - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = width;
    drawHeight = img.height * (width / img.width);
    offsetX = 0;
    offsetY = (height - drawHeight) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
}

function drawCenteredFallbackText(ctx, text, canvas) {
  const lines = wrapText(ctx, text, canvas.width * 0.78, "bold 54px sans-serif");

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 54px sans-serif";

  const lineHeight = 66;
  const totalHeight = lines.length * lineHeight;
  let y = canvas.height / 2 - totalHeight / 2 + lineHeight / 2;

  for (const line of lines) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(
      canvas.width * 0.08,
      y - 34,
      canvas.width * 0.84,
      52
    );

    ctx.fillStyle = "#ffffff";
    ctx.fillText(line, canvas.width / 2, y);
    y += lineHeight;
  }

  ctx.restore();
}

function drawCaption(ctx, text, canvas) {
  const maxWidth = canvas.width * 0.82;
  const lines = wrapText(ctx, text, maxWidth, "bold 58px sans-serif");

  ctx.save();
  ctx.font = "bold 58px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lineHeight = 68;
  const paddingX = 26;
  const paddingY = 18;
  const boxWidth = maxWidth + paddingX * 2;
  const boxHeight = lines.length * lineHeight + paddingY * 2;

  const x = canvas.width / 2;
  const y = canvas.height * 0.84;

  ctx.fillStyle = "rgba(0,0,0,0.58)";
  roundRect(
    ctx,
    x - boxWidth / 2,
    y - boxHeight / 2,
    boxWidth,
    boxHeight,
    18
  );
  ctx.fill();

  ctx.fillStyle = "#ffffff";

  let lineY = y - ((lines.length - 1) * lineHeight) / 2;
  for (const line of lines) {
    ctx.fillText(line, x, lineY);
    lineY += lineHeight;
  }

  ctx.restore();
}

function wrapText(ctx, text, maxWidth, font) {
  ctx.save();
  if (font) ctx.font = font;

  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    const width = ctx.measureText(next).width;

    if (width <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);

  ctx.restore();
  return lines.slice(0, 4);
}

function getVisualAtTime(visuals, timeSec) {
  const ms = timeSec * 1000;

  const active = visuals.find((v) => {
    const start = Number(v?.timing?.startMs) || 0;
    const end =
      Number(v?.timing?.endMs) ||
      start + (Number(v?.timing?.durationMs) || 0);

    return ms >= start && ms < end;
  });

  if (active) return active;

  if (!visuals.length) return null;
  return visuals[visuals.length - 1];
}

function getCaptionAtTime(captions, timeSec) {
  const ms = timeSec * 1000;

  return captions.find((c) => {
    const start = Number(c?.timing?.startMs) || 0;
    const end =
      Number(c?.timing?.endMs) ||
      start + (Number(c?.timing?.durationMs) || 0);

    return ms >= start && ms <= end;
  });
}

function buildCaptionText(caption) {
  if (!caption) return "";

  if (caption?.text) return String(caption.text).trim();

  if (Array.isArray(caption?.chunks)) {
    return caption.chunks
      .map((chunk) => String(chunk?.text || "").trim())
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

async function preloadVisualImages(visuals) {
  const map = new Map();

  const urls = Array.from(
    new Set(
      visuals
        .map((item) =>
          item?.source?.url ||
          item?.source?.previewUrl ||
          item?.source?.posterUrl ||
          ""
        )
        .filter(Boolean)
    )
  );

  await Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            map.set(url, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = url;
        })
    )
  );

  return map;
}

async function buildNarrationAudioStream(narration) {
  const audioUrls = narration
    .map((track) => track?.execution?.audioUrl || "")
    .filter(Boolean);

  if (!audioUrls.length) return null;

  // simplest version: create destination stream from Web Audio
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const destination = audioContext.createMediaStreamDestination();

  for (const track of narration) {
    const audioUrl = track?.execution?.audioUrl;
    if (!audioUrl) continue;

    const audio = new Audio(audioUrl);
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    audio.muted = false;

    const source = audioContext.createMediaElementSource(audio);
    source.connect(destination);
    source.connect(audioContext.destination);

    track.__audioElement = audio;
  }

  return destination.stream;
}

function scheduleNarrationPlayback(narration) {
  const startedAt = performance.now();

  for (const track of narration) {
    const audio = track?.__audioElement;
    if (!audio) continue;

    const startMs =
      Number(track?.timing?.speechStartMs) ||
      Number(track?.timing?.startMs) ||
      0;

    const delay = Math.max(0, startMs - (performance.now() - startedAt));

    window.setTimeout(() => {
      audio.play().catch(() => {});
    }, delay);
  }
}

function inferDurationSec({ visuals, captions, narration }) {
  const visualEnd = visuals.reduce((max, item) => {
    const start = Number(item?.timing?.startMs) || 0;
    const end =
      Number(item?.timing?.endMs) ||
      start + (Number(item?.timing?.durationMs) || 0);
    return Math.max(max, end);
  }, 0);

  const captionEnd = captions.reduce((max, item) => {
    const end =
      Number(item?.timing?.endMs) ||
      Number(item?.timing?.startMs) + (Number(item?.timing?.durationMs) || 0) ||
      0;
    return Math.max(max, end);
  }, 0);

  const narrationEnd = narration.reduce((max, item) => {
    const end =
      Number(item?.timing?.speechEndMs) ||
      Number(item?.timing?.endMs) ||
      0;
    return Math.max(max, end);
  }, 0);

  const maxMs = Math.max(visualEnd, captionEnd, narrationEnd);
  if (!maxMs) return 0;

  return Math.max(1, Math.ceil(maxMs / 1000));
}

function pickBestMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  for (const mimeType of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mimeType)) {
      return { mimeType };
    }
  }

  return {};
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForRecorder(recorder, chunks) {
  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      try {
        const blob = new Blob(chunks, {
          type: chunks[0]?.type || "video/webm",
        });
        resolve(blob);
      } catch (error) {
        reject(error);
      }
    };

    recorder.onerror = (event) => {
      reject(event?.error || new Error("Recorder failed"));
    };
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}