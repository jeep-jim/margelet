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

  const visuals = Array.isArray(renderDescriptor?.tracks?.visuals)
    ? renderDescriptor.tracks.visuals
    : [];
  const narration = Array.isArray(renderDescriptor?.tracks?.narration)
    ? renderDescriptor.tracks.narration
    : [];
  const captions = Array.isArray(renderDescriptor?.tracks?.captions)
    ? renderDescriptor.tracks.captions
    : [];

  const durationSec =
    Number(renderDescriptor?.job?.durationSec) ||
    Number(renderDescriptor?.renderJob?.durationSec) ||
    inferDurationSec({ visuals, narration, captions }) ||
    30;

  const runtime = createPreviewRuntime(container, durationSec);

  runtime.mountPoster(renderDescriptor?.preview?.posterUrl || "");
  runtime.setVisualTrack(visuals);
  runtime.setCaptions(captions);

  await runtime.prepareNarration(narration);

  return runtime;
}

function createPreviewRuntime(container, durationSec) {
  const root = document.createElement("div");
  root.style.position = "relative";
  root.style.width = "100%";
  root.style.height = "100%";
  root.style.overflow = "hidden";
  root.style.background = "transparent";

  const sceneLayer = document.createElement("div");
  sceneLayer.style.position = "absolute";
  sceneLayer.style.inset = "0";
  sceneLayer.style.background = "transparent center / cover no-repeat";
  sceneLayer.style.transition = "opacity 220ms ease";
  sceneLayer.style.opacity = "1";

  const overlayLayer = document.createElement("div");
  overlayLayer.style.position = "absolute";
  overlayLayer.style.inset = "0";
  overlayLayer.style.background =
    "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.24) 100%)";
  overlayLayer.style.pointerEvents = "none";

  const posterLayer = document.createElement("img");
  posterLayer.style.position = "absolute";
  posterLayer.style.inset = "0";
  posterLayer.style.width = "100%";
  posterLayer.style.height = "100%";
  posterLayer.style.objectFit = "cover";
  posterLayer.style.transition = "opacity 220ms ease";
  posterLayer.style.opacity = "0";
  posterLayer.style.pointerEvents = "none";

  const captionLayer = document.createElement("div");
  captionLayer.style.position = "absolute";
  captionLayer.style.left = "5%";
  captionLayer.style.right = "5%";
  captionLayer.style.bottom = "8%";
  captionLayer.style.textAlign = "center";
  captionLayer.style.fontSize = "28px";
  captionLayer.style.lineHeight = "1.2";
  captionLayer.style.fontWeight = "800";
  captionLayer.style.color = "#fff";
  captionLayer.style.textShadow = "0 4px 12px rgba(0,0,0,0.82)";
  captionLayer.style.pointerEvents = "none";
  captionLayer.style.wordBreak = "break-word";

  root.appendChild(sceneLayer);
  root.appendChild(posterLayer);
  root.appendChild(overlayLayer);
  root.appendChild(captionLayer);

  container.innerHTML = "";
  container.appendChild(root);

  let audioTracks = [];
  let captionTrack = [];
  let visualTrack = [];

  let rafId = null;
  let startedAtMs = 0;
  let elapsedBeforePauseSec = 0;
  let isPlaying = false;
  let activeVisualKey = "";
  let activeCaptionText = "";

  function mountPoster(url) {
    if (!url) {
      posterLayer.removeAttribute("src");
      posterLayer.style.opacity = "0";
      return;
    }

    posterLayer.src = url;
    posterLayer.style.opacity = "1";
  }

  async function prepareNarration(narrationSegments) {
    audioTracks = [];

    for (const seg of narrationSegments || []) {
      const audioUrl =
        seg?.execution?.audioUrl ||
        seg?.executed?.audioUrl ||
        seg?.audioUrl ||
        "";

      const startSec = toSeconds(
        seg?.timing?.startMs ??
          seg?.timing?.speechStartMs ??
          seg?.startMs ??
          0
      );

      const duration =
        toSeconds(
          seg?.timing?.durationMs ??
            safeMsDelta(seg?.timing?.speechStartMs, seg?.timing?.speechEndMs)
        ) || 0;

      if (!audioUrl || !duration) continue;

      const audio = new Audio(audioUrl);
      audio.preload = "auto";

      audioTracks.push({
        audio,
        start: startSec,
        duration,
        end: startSec + duration,
        hasStarted: false,
      });
    }
  }

  function setCaptions(captions) {
    captionTrack = (captions || [])
      .map((c, index) => {
        const startSec = toSeconds(
          c?.timing?.startMs ??
            c?.timing?.fromMs ??
            c?.timing?.speechStartMs ??
            0
        );

        const endSec = toSeconds(
          c?.timing?.endMs ??
            c?.timing?.toMs ??
            c?.timing?.finishMs ??
            c?.timing?.speechEndMs ??
            0
        );

        return {
          id: c?.id || `caption-${index + 1}`,
          start: startSec,
          end: endSec > startSec ? endSec : startSec + 2,
          text: buildCaptionText(c),
        };
      })
      .filter((item) => item.text);
  }

  function setVisualTrack(visuals) {
    visualTrack = normalizeVisualTrack(visuals);
    renderVisualAt(0);
  }

  function play() {
    if (isPlaying) return;

    startedAtMs = performance.now();
    isPlaying = true;
    syncAudioToCurrentTime(getCurrentTimeSec());
    tick();
  }

  function pause() {
    if (!isPlaying) return;

    elapsedBeforePauseSec = getCurrentTimeSec();
    isPlaying = false;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    for (const track of audioTracks) {
      try {
        track.audio.pause();
      } catch {}
    }
  }

  function stop() {
    isPlaying = false;
    elapsedBeforePauseSec = 0;
    startedAtMs = 0;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    for (const track of audioTracks) {
      track.hasStarted = false;
      try {
        track.audio.pause();
        track.audio.currentTime = 0;
      } catch {}
    }

    activeCaptionText = "";
    captionLayer.textContent = "";
    renderVisualAt(0);
  }

  function tick() {
    if (!isPlaying) return;

    const timeSec = getCurrentTimeSec();

    if (timeSec >= durationSec) {
      stop();
      return;
    }

    updateVisuals(timeSec);
    updateCaptions(timeSec);
    updateAudio(timeSec);

    rafId = requestAnimationFrame(tick);
  }

  function getCurrentTimeSec() {
    if (!isPlaying) {
      return elapsedBeforePauseSec;
    }

    const deltaSec = (performance.now() - startedAtMs) / 1000;
    return elapsedBeforePauseSec + deltaSec;
  }

  function updateVisuals(timeSec) {
    renderVisualAt(timeSec);
  }

  function updateCaptions(timeSec) {
    const active = captionTrack.find(
      (item) => timeSec >= item.start && timeSec <= item.end
    );

    const nextText = active ? active.text : "";

    if (nextText === activeCaptionText) return;

    activeCaptionText = nextText;
    captionLayer.textContent = nextText;
  }

  function updateAudio(timeSec) {
    for (const track of audioTracks) {
      const inside = timeSec >= track.start && timeSec <= track.end;

      if (!inside) {
        if (!track.audio.paused) {
          try {
            track.audio.pause();
          } catch {}
        }
        continue;
      }

      const targetTime = Math.max(0, timeSec - track.start);
      const drift = Math.abs((track.audio.currentTime || 0) - targetTime);

      if (drift > 0.35) {
        try {
          track.audio.currentTime = targetTime;
        } catch {}
      }

      if (track.audio.paused) {
        track.audio.play().catch(() => {});
      }
    }
  }

  function syncAudioToCurrentTime(timeSec) {
    for (const track of audioTracks) {
      const inside = timeSec >= track.start && timeSec <= track.end;

      try {
        track.audio.pause();
      } catch {}

      if (!inside) continue;

      try {
        track.audio.currentTime = Math.max(0, timeSec - track.start);
      } catch {}
    }
  }

  function renderVisualAt(timeSec) {
    const active = findActiveVisual(visualTrack, timeSec);

    if (!active) {
      if (posterLayer.getAttribute("src")) {
        posterLayer.style.opacity = "1";
      }
      sceneLayer.style.backgroundImage = "";
      activeVisualKey = "";
      return;
    }

    const key = `${active.id}|${active.src}|${active.start}|${active.end}`;
    if (key === activeVisualKey) return;

    activeVisualKey = key;

    if (active.src) {
      sceneLayer.style.backgroundImage = `url("${escapeCssUrl(active.src)}")`;
      posterLayer.style.opacity = "0";
    } else if (posterLayer.getAttribute("src")) {
      sceneLayer.style.backgroundImage = "";
      posterLayer.style.opacity = "1";
    }
  }

  return {
    mountPoster,
    prepareNarration,
    setCaptions,
    setVisualTrack,
    play,
    pause,
    stop,
  };
}

function normalizeVisualTrack(visuals) {
  return (visuals || [])
    .map((item, index) => {
      const src =
        item?.source?.url ||
        item?.source?.previewUrl ||
        item?.source?.src ||
        item?.asset?.url ||
        item?.asset?.previewUrl ||
        item?.url ||
        item?.src ||
        "";

      const start = toSeconds(
        item?.timing?.startMs ??
          item?.timing?.fromMs ??
          item?.startMs ??
          index * 3 * 1000
      );

      const rawEnd = toSeconds(
        item?.timing?.endMs ??
          item?.timing?.toMs ??
          item?.endMs ??
          0
      );

      const duration = toSeconds(
        item?.timing?.durationMs ??
          safeMsDelta(item?.timing?.startMs, item?.timing?.endMs) ??
          0
      );

      const end =
        rawEnd > start ? rawEnd : duration > 0 ? start + duration : start + 3;

      return {
        id: item?.id || `visual-${index + 1}`,
        src,
        start,
        end,
      };
    })
    .filter((item) => item.end > item.start);
}

function findActiveVisual(visualTrack, timeSec) {
  const active = visualTrack.find(
    (item) => timeSec >= item.start && timeSec < item.end
  );

  if (active) return active;

  if (!visualTrack.length) return null;

  if (timeSec < visualTrack[0].start) {
    return visualTrack[0];
  }

  return visualTrack[visualTrack.length - 1];
}

function buildCaptionText(caption) {
  const directText =
    caption?.text ||
    caption?.label ||
    caption?.value ||
    "";

  if (directText) {
    return String(directText).trim();
  }

  const chunks = Array.isArray(caption?.chunks) ? caption.chunks : [];
  if (!chunks.length) return "";

  return chunks
    .map((chunk) => String(chunk?.text || "").trim())
    .filter(Boolean)
    .join(" ");
}

function inferDurationSec({ visuals, narration, captions }) {
  const visualEnd = (visuals || []).reduce((max, item) => {
    const endMs =
      item?.timing?.endMs ??
      item?.timing?.toMs ??
      item?.endMs ??
      0;
    return Math.max(max, Number(endMs) || 0);
  }, 0);

  const narrationEnd = (narration || []).reduce((max, item) => {
    const startMs =
      item?.timing?.startMs ??
      item?.timing?.speechStartMs ??
      0;

    const endMs =
      item?.timing?.endMs ??
      item?.timing?.speechEndMs ??
      startMs + (item?.timing?.durationMs ?? 0);

    return Math.max(max, Number(endMs) || 0);
  }, 0);

  const captionsEnd = (captions || []).reduce((max, item) => {
    const endMs =
      item?.timing?.endMs ??
      item?.timing?.toMs ??
      item?.timing?.finishMs ??
      0;
    return Math.max(max, Number(endMs) || 0);
  }, 0);

  const maxMs = Math.max(visualEnd, narrationEnd, captionsEnd);
  if (!maxMs) return 0;

  return Math.max(1, Math.ceil(maxMs / 1000));
}

function toSeconds(value) {
  const num = Number(value) || 0;
  return num / 1000;
}

function safeMsDelta(start, end) {
  const s = Number(start) || 0;
  const e = Number(end) || 0;
  return e > s ? e - s : 0;
}

function escapeCssUrl(url) {
  return String(url).replace(/"/g, '\\"');
}