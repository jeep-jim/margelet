// src/lib/margelet/browserVideoExporter.js

export async function exportVideo(renderJob) {
  if (!renderJob) {
    throw new Error("Render job is required");
  }

  const visuals = renderJob?.tracks?.visuals || [];
  const captions = renderJob?.tracks?.captions || [];
  const narration = renderJob?.tracks?.narration || [];

  const resolution = renderJob?.job?.resolution || {
    width: 1080,
    height: 1920,
  };

  const fps = renderJob?.job?.fps || 30;

  const durationSec =
    renderJob?.job?.durationSec ||
    renderJob?.structure?.totalDurationSec ||
    30;

  const canvas = document.createElement("canvas");

  canvas.width = resolution.width;
  canvas.height = resolution.height;

  const ctx = canvas.getContext("2d");

  const stream = canvas.captureStream(fps);

  const recorder = new MediaRecorder(stream, {
    mimeType: "video/webm",
    videoBitsPerSecond: 8_000_000,
  });

  const chunks = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  const narrationAudio = buildNarrationAudio(narration);

  recorder.start();

  const frameDuration = 1000 / fps;
  const totalFrames = fps * durationSec;

  let frame = 0;

  while (frame < totalFrames) {
    const time = frame / fps;

    renderFrame({
      ctx,
      canvas,
      visuals,
      captions,
      time,
    });

    await sleep(frameDuration);

    frame++;
  }

  recorder.stop();

  const blob = await waitForRecorder(recorder, chunks);

  downloadBlob(blob, "margelet-video.webm");

  return blob;
}

function renderFrame({ ctx, canvas, visuals, captions, time }) {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const visual = getVisualAtTime(visuals, time);

  if (visual?.source?.url) {
    drawVisual(ctx, visual.source.url, canvas);
  }

  const caption = getCaptionAtTime(captions, time);

  if (caption) {
    drawCaption(ctx, caption.text, canvas);
  }
}

function drawVisual(ctx, src, canvas) {
  const img = getCachedImage(src);

  if (!img) return;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

function drawCaption(ctx, text, canvas) {
  ctx.font = "bold 64px Inter, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";

  const x = canvas.width / 2;
  const y = canvas.height * 0.85;

  ctx.fillText(text, x, y);
}

function getVisualAtTime(visuals, time) {
  const ms = time * 1000;

  return visuals.find((v) => {
    const start = v?.timing?.startMs || 0;
    const end = start + (v?.timing?.durationMs || 0);

    return ms >= start && ms < end;
  });
}

function getCaptionAtTime(captions, time) {
  const ms = time * 1000;

  return captions.find((c) => {
    const start = c?.timing?.startMs || 0;
    const end = c?.timing?.endMs || 0;

    return ms >= start && ms <= end;
  });
}

const imageCache = new Map();

function getCachedImage(src) {
  if (imageCache.has(src)) {
    return imageCache.get(src);
  }

  const img = new Image();
  img.src = src;

  imageCache.set(src, img);

  return img;
}

function buildNarrationAudio(narration) {
  if (!narration?.length) return null;

  const audio = new AudioContext();

  // future narration pipeline
  return audio;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForRecorder(recorder, chunks) {
  return new Promise((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, {
        type: "video/webm",
      });

      resolve(blob);
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

  URL.revokeObjectURL(url);
}