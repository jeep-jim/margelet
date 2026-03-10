// src/lib/margelet/providers/ttsProvider.js
// Real browser-based TTS provider for Margelet.
// Zero direct provider cost, client-side only.
// Uses the built-in Web Speech API (speechSynthesis).

const DEFAULT_TIMEOUT_MS = 30000;

export function isBrowserTtsAvailable() {
  return (
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    typeof window.SpeechSynthesisUtterance !== "undefined"
  );
}

export async function getAvailableTtsVoices() {
  ensureBrowserTts();

  const voices = await loadVoices();

  return voices.map((voice) => ({
    voiceURI: voice.voiceURI || "",
    name: voice.name || "",
    lang: voice.lang || "",
    localService: Boolean(voice.localService),
    default: Boolean(voice.default),
  }));
}

export async function synthesizeSpeechSegments(input = {}) {
  ensureBrowserTts();

  const {
    segments = [],
    voice = "auto",
    tone = "dynamic",
    language = "ru",
    interrupt = true,
  } = input;

  if (!Array.isArray(segments) || segments.length === 0) {
    return {
      ok: false,
      error: {
        code: "NO_SEGMENTS",
        message: "No speech segments provided.",
      },
    };
  }

  const voices = await loadVoices();
  const selectedVoice = selectBestVoice({
    voices,
    requestedVoice: voice,
    language,
  });

  if (interrupt) {
    stopSpeaking();
  }

  const startedAt = Date.now();
  const results = [];

  for (const segment of segments) {
    const prepared = prepareUtteranceConfig({
      segment,
      selectedVoice,
      tone,
      language,
      voice,
    });

    const execution = await speakSingleUtterance(prepared);
    results.push(execution);
  }

  return {
    ok: true,
    provider: "browser-speech-synthesis",
    mode: "client-only",
    limitations: {
      downloadableAudioFile: false,
      deterministicAcrossDevices: false,
      requiresBrowserRuntime: true,
    },
    meta: {
      startedAt,
      finishedAt: Date.now(),
      durationMs: Date.now() - startedAt,
      voice: selectedVoice
        ? {
            voiceURI: selectedVoice.voiceURI || "",
            name: selectedVoice.name || "",
            lang: selectedVoice.lang || "",
            localService: Boolean(selectedVoice.localService),
            default: Boolean(selectedVoice.default),
          }
        : null,
    },
    segments: results,
  };
}

export function stopSpeaking() {
  if (!isBrowserTtsAvailable()) return;
  window.speechSynthesis.cancel();
}

function ensureBrowserTts() {
  if (!isBrowserTtsAvailable()) {
    throw createTtsError(
      "BROWSER_TTS_UNAVAILABLE",
      "Browser speech synthesis is not available in this environment."
    );
  }
}

async function loadVoices() {
  ensureBrowserTts();

  const synth = window.speechSynthesis;
  let voices = synth.getVoices();

  if (voices && voices.length > 0) {
    return voices;
  }

  voices = await new Promise((resolve) => {
    let settled = false;

    const finalize = () => {
      if (settled) return;
      settled = true;
      resolve(synth.getVoices() || []);
    };

    const timeout = window.setTimeout(finalize, 1500);

    const handleVoicesChanged = () => {
      window.clearTimeout(timeout);
      synth.removeEventListener("voiceschanged", handleVoicesChanged);
      finalize();
    };

    synth.addEventListener("voiceschanged", handleVoicesChanged);

    // Kick voice loading in browsers that lazily load voices.
    synth.getVoices();
  });

  return voices || [];
}

function selectBestVoice({ voices, requestedVoice, language }) {
  if (!Array.isArray(voices) || voices.length === 0) return null;

  const langPrefix = normalizeLang(language);
  const sameLang = voices.filter((voice) =>
    normalizeLang(voice.lang).startsWith(langPrefix)
  );

  const pool = sameLang.length > 0 ? sameLang : voices;

  const heuristics = buildVoiceHeuristics(requestedVoice, langPrefix);

  for (const test of heuristics) {
    const match = pool.find(test);
    if (match) return match;
  }

  return pool[0] || voices[0] || null;
}

function buildVoiceHeuristics(requestedVoice, langPrefix) {
  const voiceMode = requestedVoice || "auto";

  const tests = [];

  if (voiceMode === "energetic") {
    tests.push((v) => hasAny(v.name, ["expressive", "premium", "zira", "aria", "samantha"]));
  }

  if (voiceMode === "calm") {
    tests.push((v) => hasAny(v.name, ["serena", "milena", "helena", "anna", "alina"]));
  }

  if (voiceMode === "narrator") {
    tests.push((v) => hasAny(v.name, ["narrator", "daniel", "alex", "victoria"]));
  }

  tests.push((v) => normalizeLang(v.lang).startsWith(langPrefix) && v.default);
  tests.push((v) => normalizeLang(v.lang).startsWith(langPrefix) && v.localService);
  tests.push((v) => normalizeLang(v.lang).startsWith(langPrefix));
  tests.push((v) => v.default);

  return tests;
}

function prepareUtteranceConfig({
  segment,
  selectedVoice,
  tone,
  language,
  voice,
}) {
  const text =
    normalizeSpeechText(segment?.normalizedText || segment?.text || "");

  if (!text) {
    throw createTtsError("EMPTY_SEGMENT_TEXT", "Speech segment text is empty.");
  }

  const delivery = segment?.delivery || {};
  const role = segment?.role || "body";

  const rate = clamp(
    typeof delivery.speechRate === "number"
      ? delivery.speechRate
      : deriveRateFromToneAndVoice(tone, voice, role),
    0.7,
    1.25
  );

  const pitch = clamp(
    typeof delivery.pitch === "number"
      ? 1 + delivery.pitch * 0.08
      : derivePitchFromToneAndVoice(tone, voice, role),
    0,
    2
  );

  const volume = clamp(
    typeof delivery.volume === "number"
      ? delivery.volume
      : deriveVolumeFromRole(role),
    0,
    1
  );

  return {
    id: segment?.id || createId(),
    sceneId: segment?.sceneId || null,
    role,
    text,
    lang: mapLanguageCode(language, selectedVoice?.lang),
    rate,
    pitch,
    volume,
    pauseAfterMs: Math.max(0, Number(segment?.pauseAfterMs) || 0),
    selectedVoice,
  };
}

async function speakSingleUtterance(config) {
  ensureBrowserTts();

  const synth = window.speechSynthesis;

  return new Promise((resolve, reject) => {
    const utterance = new window.SpeechSynthesisUtterance(config.text);
    const startedAt = Date.now();
    let finished = false;

    utterance.lang = config.lang;
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;

    if (config.selectedVoice) {
      utterance.voice = config.selectedVoice;
    }

    const cleanupAndResolve = (payload) => {
      if (finished) return;
      finished = true;

      const finalize = () => resolve(payload);

      if (config.pauseAfterMs > 0) {
        window.setTimeout(finalize, config.pauseAfterMs);
      } else {
        finalize();
      }
    };

    const cleanupAndReject = (error) => {
      if (finished) return;
      finished = true;
      reject(error);
    };

    const timeout = window.setTimeout(() => {
      try {
        synth.cancel();
      } catch (_err) {
        // ignore
      }

      cleanupAndReject(
        createTtsError(
          "TTS_TIMEOUT",
          `Speech synthesis timed out after ${DEFAULT_TIMEOUT_MS}ms.`
        )
      );
    }, DEFAULT_TIMEOUT_MS);

    utterance.onstart = () => {
      // noop, but keeps this hook ready for future progress reporting
    };

    utterance.onend = () => {
      window.clearTimeout(timeout);

      cleanupAndResolve({
        id: config.id,
        sceneId: config.sceneId,
        role: config.role,
        text: config.text,
        lang: config.lang,
        rate: config.rate,
        pitch: config.pitch,
        volume: config.volume,
        pauseAfterMs: config.pauseAfterMs,
        startedAt,
        finishedAt: Date.now(),
        durationMs: Date.now() - startedAt,
        status: "spoken",
      });
    };

    utterance.onerror = (event) => {
      window.clearTimeout(timeout);

      cleanupAndReject(
        createTtsError(
          "TTS_SPEAK_ERROR",
          event?.error || "Speech synthesis failed."
        )
      );
    };

    try {
      synth.speak(utterance);
    } catch (error) {
      window.clearTimeout(timeout);
      cleanupAndReject(
        createTtsError(
          "TTS_SPEAK_THROW",
          error?.message || "Speech synthesis threw an exception."
        )
      );
    }
  });
}

function deriveRateFromToneAndVoice(tone, voice, role) {
  let rate = 1;

  if (tone === "dynamic") rate += 0.08;
  if (tone === "calm") rate -= 0.06;
  if (tone === "premium") rate -= 0.03;
  if (voice === "energetic") rate += 0.05;
  if (voice === "narrator") rate -= 0.02;
  if (role === "hook") rate += 0.03;

  return Number(rate.toFixed(2));
}

function derivePitchFromToneAndVoice(tone, voice, role) {
  let pitch = 1;

  if (voice === "energetic") pitch += 0.08;
  if (voice === "calm") pitch -= 0.05;
  if (tone === "premium") pitch -= 0.03;
  if (role === "hook") pitch += 0.04;

  return Number(pitch.toFixed(2));
}

function deriveVolumeFromRole(role) {
  if (role === "hook") return 1;
  if (role === "cta") return 0.96;
  return 0.94;
}

function mapLanguageCode(requestedLanguage, voiceLang) {
  if (voiceLang) return voiceLang;

  const lang = normalizeLang(requestedLanguage);
  if (lang.startsWith("ru")) return "ru-RU";
  if (lang.startsWith("en")) return "en-US";
  return requestedLanguage || "ru-RU";
}

function normalizeLang(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeSpeechText(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/\s([,.!?;:])/g, "$1")
    .trim();
}

function hasAny(value, parts) {
  const source = String(value || "").toLowerCase();
  return parts.some((part) => source.includes(String(part).toLowerCase()));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createId() {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

function createTtsError(code, message, details = null) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}