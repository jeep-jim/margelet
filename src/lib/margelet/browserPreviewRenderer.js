// src/lib/margelet/browserPreviewRenderer.js
// Browser runtime preview renderer for Margelet.
// Builds a playable preview from render descriptor without server rendering.

export async function runBrowserPreviewRenderer(options = {}) {
  const { container, renderDescriptor } = options;

  if (!container) {
    throw new Error("Preview container element is required.");
  }

  if (!renderDescriptor) {
    throw new Error("Render descriptor is required.");
  }

  const visuals = renderDescriptor?.tracks?.visuals || [];
  const narration = renderDescriptor?.tracks?.narration || [];
  const captions = renderDescriptor?.tracks?.captions || [];

  const durationSec =
    renderDescriptor?.job?.durationSec ||
    renderDescriptor?.renderJob?.durationSec ||
    30;

  const runtime = createPreviewRuntime(container, durationSec);

  runtime.mountPoster(renderDescriptor?.preview?.posterUrl);

  await runtime.prepareNarration(narration);

  runtime.setCaptions(captions);

  runtime.setVisualTrack(visuals);

  return runtime;
}

function createPreviewRuntime(container, durationSec) {
  const root = document.createElement("div");

  root.style.position = "relative";
  root.style.width = "100%";
  root.style.height = "100%";
  root.style.background = "#111";
  root.style.overflow = "hidden";

  const posterLayer = document.createElement("img");
  posterLayer.style.position = "absolute";
  posterLayer.style.width = "100%";
  posterLayer.style.height = "100%";
  posterLayer.style.objectFit = "cover";

  const captionLayer = document.createElement("div");
  captionLayer.style.position = "absolute";
  captionLayer.style.bottom = "8%";
  captionLayer.style.width = "100%";
  captionLayer.style.textAlign = "center";
  captionLayer.style.fontSize = "28px";
  captionLayer.style.fontWeight = "700";
  captionLayer.style.color = "#fff";
  captionLayer.style.textShadow = "0 4px 12px rgba(0,0,0,0.8)";

  root.appendChild(posterLayer);
  root.appendChild(captionLayer);

  container.innerHTML = "";
  container.appendChild(root);

  let audioTracks = [];
  let captionTrack = [];
  let visualTrack = [];

  let timer = null;
  let startTime = null;

  function mountPoster(url) {
    if (url) {
      posterLayer.src = url;
    }
  }

  async function prepareNarration(narrationSegments) {
    audioTracks = [];

    for (const seg of narrationSegments) {
      const audioUrl = seg?.execution?.audioUrl;

      if (!audioUrl) continue;

      const audio = new Audio(audioUrl);
      audio.preload = "auto";

      audioTracks.push({
        audio,
        start: (seg?.timing?.startMs || 0) / 1000,
        duration: (seg?.timing?.durationMs || 0) / 1000,
      });
    }
  }

  function setCaptions(captions) {
    captionTrack = (captions || []).map(c => ({
      start: (c?.timing?.startMs || 0) / 1000,
      end: (c?.timing?.endMs || 0) / 1000,
      text: buildCaptionText(c),
    }));
  }

  function setVisualTrack(visuals) {
    visualTrack = visuals || [];
  }

  function play() {
    stop();

    startTime = performance.now();

    timer = requestAnimationFrame(update);
  }

  function stop() {
    if (timer) {
      cancelAnimationFrame(timer);
      timer = null;
    }

    audioTracks.forEach(t => {
      t.audio.pause();
      t.audio.currentTime = 0;
    });

    captionLayer.textContent = "";
  }

  function update() {
    const now = performance.now();
    const time = (now - startTime) / 1000;

    if (time > durationSec) {
      stop();
      return;
    }

    updateAudio(time);
    updateCaptions(time);

    timer = requestAnimationFrame(update);
  }

  function updateAudio(time) {
    for (const track of audioTracks) {
      if (time >= track.start && time <= track.start + track.duration) {
        if (track.audio.paused) {
          track.audio.currentTime = time - track.start;
          track.audio.play().catch(() => {});
        }
      }
    }
  }

  function updateCaptions(time) {
    const active = captionTrack.find(
      c => time >= c.start && time <= c.end
    );

    captionLayer.textContent = active ? active.text : "";
  }

  function buildCaptionText(caption) {
    const chunks = caption?.chunks || [];

    if (!chunks.length) return "";

    return chunks.map(c => c.text).join(" ");
  }

  return {
    mountPoster,
    prepareNarration,
    setCaptions,
    setVisualTrack,
    play,
    stop,
  };
}