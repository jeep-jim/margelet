// scriptEngine.js
// Генерация 3 сценарных вариантов для Margelet.
// На этом этапе движок строит сильные short-form сценарии
// на основе темы, формата, материалов и пользовательского контекста.

const FORMAT_STYLES = {
  motivation: {
    pacing: "fast",
    vibe: "inspiring",
    defaultCta: "Сохрани, чтобы не забыть",
    defaultCtaEn: "Save this so you do not forget",
  },
  business: {
    pacing: "fast",
    vibe: "expert",
    defaultCta: "Напиши, если хочешь разбор второй части",
    defaultCtaEn: "Comment if you want part two",
  },
  news: {
    pacing: "fast",
    vibe: "urgent",
    defaultCta: "Подпишись, чтобы не пропустить главное",
    defaultCtaEn: "Follow for the next update",
  },
  ai: {
    pacing: "fast",
    vibe: "smart",
    defaultCta: "Сохрани этот инструмент себе",
    defaultCtaEn: "Save this tool for later",
  },
  crypto: {
    pacing: "fast",
    vibe: "bold",
    defaultCta: "Пиши, если хочешь ещё разборы по крипте",
    defaultCtaEn: "Comment for more crypto breakdowns",
  },
  facts: {
    pacing: "fast",
    vibe: "surprising",
    defaultCta: "Сохрани, чтобы переслать друзьям",
    defaultCtaEn: "Save this to share with friends",
  },
  tech: {
    pacing: "fast",
    vibe: "smart",
    defaultCta: "Хочешь ещё таких подборок — напиши",
    defaultCtaEn: "Want more picks like this? Comment below",
  },
  finance: {
    pacing: "medium",
    vibe: "expert",
    defaultCta: "Сохрани, чтобы не терять деньги на этом",
    defaultCtaEn: "Save this to avoid costly mistakes",
  },
  education: {
    pacing: "medium",
    vibe: "clear",
    defaultCta: "Сохрани как мини-шпаргалку",
    defaultCtaEn: "Save this as a quick cheat sheet",
  },
  history: {
    pacing: "medium",
    vibe: "dramatic",
    defaultCta: "Если хочешь ещё такие истории — напиши",
    defaultCtaEn: "Comment if you want more stories like this",
  },
  gaming: {
    pacing: "fast",
    vibe: "hype",
    defaultCta: "Какая игра у тебя номер один?",
    defaultCtaEn: "What game is number one for you?",
  },
  reviews: {
    pacing: "medium",
    vibe: "honest",
    defaultCta: "Нужен ещё честный обзор — пиши",
    defaultCtaEn: "Want another honest review? Comment below",
  },
  gadgets: {
    pacing: "fast",
    vibe: "useful",
    defaultCta: "Сохрани, если пригодится",
    defaultCtaEn: "Save this if it might help",
  },
  cars: {
    pacing: "medium",
    vibe: "confident",
    defaultCta: "Напиши, если разобрать ещё варианты",
    defaultCtaEn: "Comment if you want more options reviewed",
  },
  travel: {
    pacing: "medium",
    vibe: "aspirational",
    defaultCta: "Сохрани это место в список",
    defaultCtaEn: "Save this place to your list",
  },
  food: {
    pacing: "fast",
    vibe: "sensory",
    defaultCta: "Сохрани, чтобы попробовать позже",
    defaultCtaEn: "Save this to try later",
  },
  fitness: {
    pacing: "fast",
    vibe: "energetic",
    defaultCta: "Сохрани и начни сегодня",
    defaultCtaEn: "Save it and start today",
  },
  health: {
    pacing: "medium",
    vibe: "trustworthy",
    defaultCta: "Сохрани себе как напоминание",
    defaultCtaEn: "Save this as a reminder",
  },
  science: {
    pacing: "medium",
    vibe: "fascinating",
    defaultCta: "Если удивило — сохрани",
    defaultCtaEn: "If this surprised you, save it",
  },
  space: {
    pacing: "medium",
    vibe: "epic",
    defaultCta: "Сохрани, если любишь космос",
    defaultCtaEn: "Save this if you love space",
  },
  animals: {
    pacing: "fast",
    vibe: "cute",
    defaultCta: "Сохрани, это слишком классно",
    defaultCtaEn: "Save this, it is too good",
  },
  music: {
    pacing: "fast",
    vibe: "rhythmic",
    defaultCta: "Хочешь ещё такие треки — пиши",
    defaultCtaEn: "Comment if you want more tracks like this",
  },
  movies: {
    pacing: "medium",
    vibe: "cinematic",
    defaultCta: "Сохрани, чтобы не забыть посмотреть",
    defaultCtaEn: "Save this so you remember to watch it",
  },
  culture: {
    pacing: "medium",
    vibe: "curious",
    defaultCta: "Сохрани, чтобы пересказать друзьям",
    defaultCtaEn: "Save this to retell it later",
  },
  psychology: {
    pacing: "medium",
    vibe: "insightful",
    defaultCta: "Сохрани, это пригодится в жизни",
    defaultCtaEn: "Save this, it will help in real life",
  },
  books: {
    pacing: "medium",
    vibe: "thoughtful",
    defaultCta: "Сохрани себе в список книг",
    defaultCtaEn: "Save this to your reading list",
  },
  marketing: {
    pacing: "fast",
    vibe: "sharp",
    defaultCta: "Хочешь ещё такие приёмы — напиши",
    defaultCtaEn: "Comment if you want more tactics like this",
  },
  startup: {
    pacing: "fast",
    vibe: "ambitious",
    defaultCta: "Сохрани, если строишь что-то своё",
    defaultCtaEn: "Save this if you are building something",
  },
  design: {
    pacing: "medium",
    vibe: "clean",
    defaultCta: "Сохрани как дизайнерскую заметку",
    defaultCtaEn: "Save this as a design note",
  },
  blog: {
    pacing: "fast",
    vibe: "personal",
    defaultCta: "Сохрани идею для следующего ролика",
    defaultCtaEn: "Save this idea for your next video",
  },
  default: {
    pacing: "medium",
    vibe: "clear",
    defaultCta: "Сохрани себе",
    defaultCtaEn: "Save this",
  },
};

const TONE_RULES = {
  dynamic: {
    sentenceStyle: "short",
    energy: "high",
    captionStyle: "punchy",
    transitionStyle: "hard-cuts",
  },
  calm: {
    sentenceStyle: "medium",
    energy: "soft",
    captionStyle: "clean",
    transitionStyle: "smooth",
  },
  premium: {
    sentenceStyle: "medium",
    energy: "controlled",
    captionStyle: "minimal",
    transitionStyle: "elegant",
  },
  friendly: {
    sentenceStyle: "conversational",
    energy: "warm",
    captionStyle: "human",
    transitionStyle: "gentle",
  },
};

const VOICE_RULES = {
  auto: { delivery: "balanced" },
  energetic: { delivery: "energetic" },
  calm: { delivery: "calm" },
  narrator: { delivery: "narrative" },
};

export async function buildScripts(request) {
  const config = request?.config || {};
  const prepared = request?.prepared || {};
  const summary = prepared?.summary || {};
  const notes = prepared?.notes?.text || "";
  const links = prepared?.links || [];
  const files = prepared?.files || [];
  const images = prepared?.images || [];
  const videos = prepared?.videos || [];
  const audio = prepared?.audio || [];

  const format = config.format || "default";
  const topic = safeText(config.topic) || inferFallbackTopic(summary);
  const duration = normalizeDuration(config.duration);
  const tone = config.tone || "dynamic";
  const voice = config.voice || "auto";

  const formatStyle = FORMAT_STYLES[format] || FORMAT_STYLES.default;
  const toneRule = TONE_RULES[tone] || TONE_RULES.dynamic;
  const voiceRule = VOICE_RULES[voice] || VOICE_RULES.auto;

  const context = buildContextDigest({
    topic,
    notes,
    links,
    files,
    images,
    videos,
    audio,
    summary,
  });

  const strategyA = buildVariantStrategy({
    id: "v1",
    kind: "hook-first",
    title: "Hook first",
    titleRu: "Сильный хук",
    format,
    topic,
    duration,
    tone,
    voice,
    formatStyle,
    toneRule,
    voiceRule,
    context,
  });

  const strategyB = buildVariantStrategy({
    id: "v2",
    kind: "problem-solution",
    title: "Problem → solution",
    titleRu: "Проблема → решение",
    format,
    topic,
    duration,
    tone,
    voice,
    formatStyle,
    toneRule,
    voiceRule,
    context,
  });

  const strategyC = buildVariantStrategy({
    id: "v3",
    kind: "story-proof",
    title: "Story + proof",
    titleRu: "История + доказательство",
    format,
    topic,
    duration,
    tone,
    voice,
    formatStyle,
    toneRule,
    voiceRule,
    context,
  });

  return {
    input: {
      format,
      topic,
      duration,
      tone,
      voice,
    },
    context,
    variants: [strategyA, strategyB, strategyC],
  };
}

function buildVariantStrategy({
  id,
  kind,
  title,
  titleRu,
  format,
  topic,
  duration,
  tone,
  voice,
  formatStyle,
  toneRule,
  voiceRule,
  context,
}) {
  const secondsPerScene = estimateSceneTiming(duration, kind);
  const angle = buildAngle(kind, topic, format, context);
  const hook = buildHook(kind, topic, format, context, tone);
  const scenes = buildScenes({
    kind,
    topic,
    angle,
    context,
    secondsPerScene,
    duration,
    tone,
  });
  const narration = buildNarrationFromScenes(scenes, toneRule);
  const captions = buildCaptionsFromScenes(scenes, toneRule);
  const cta = buildCta(format, context);
  const editDirection = buildEditDirection({
    kind,
    tone,
    voice,
    formatStyle,
    toneRule,
    voiceRule,
    context,
  });

  return {
    id,
    kind,
    label: {
      en: title,
      ru: titleRu,
    },
    creative: {
      angle,
      hook,
      cta,
    },
    direction: {
      tone,
      voice,
      pacing: formatStyle.pacing,
      vibe: formatStyle.vibe,
      editDirection,
    },
    structure: {
      targetDurationSec: duration,
      sceneCount: scenes.length,
      scenes,
    },
    narration: {
      fullText: narration.fullText,
      lines: narration.lines,
      delivery: voiceRule.delivery,
    },
    captions: {
      style: toneRule.captionStyle,
      lines: captions,
    },
    score: scoreVariant({ kind, context, tone, format }),
  };
}

function buildScenes({
  kind,
  topic,
  angle,
  context,
  secondsPerScene,
  duration,
  tone,
}) {
  const sceneTemplates = getSceneTemplates(kind, topic, angle, context);
  const limited = fitScenesToDuration(sceneTemplates, secondsPerScene, duration);

  return limited.map((scene, index) => ({
    id: `scene_${index + 1}`,
    order: index + 1,
    role: scene.role,
    durationSec: scene.durationSec,
    narration: scene.narration,
    caption: scene.caption,
    visualIntent: scene.visualIntent,
    motionIntent: scene.motionIntent,
    sourcePreference: pickSourcePreference(scene.role, context),
    emphasis: pickEmphasis(scene.role, tone),
  }));
}

function getSceneTemplates(kind, topic, angle, context) {
  const socialProof = context.bestProof || buildGenericProof(topic);
  const contextLine = context.bestContextLine || buildGenericContext(topic);
  const sourceMention = context.hasSources
    ? "Основано на твоих материалах и исходниках."
    : "Собрано в короткий и понятный формат.";
  const sourceMentionEn = context.hasSources
    ? "Built from your uploaded materials and source inputs."
    : "Packed into a short and clear format.";

  if (kind === "hook-first") {
    return [
      {
        role: "hook",
        durationSec: 4,
        narration: `Вот что реально важно понять про ${topic}.`,
        caption: `Что важно понять про ${topic}`,
        visualIntent: "high-contrast opener with instant curiosity",
        motionIntent: "hard reveal",
      },
      {
        role: "setup",
        durationSec: 5,
        narration: `${angle}. ${contextLine}`,
        caption: simplifyCaption(`${angle}`),
        visualIntent: "topic framing with strongest user visual",
        motionIntent: "push-in",
      },
      {
        role: "proof",
        durationSec: 6,
        narration: `${socialProof}`,
        caption: simplifyCaption(socialProof),
        visualIntent: "proof scene with details or close crop",
        motionIntent: "quick cuts",
      },
      {
        role: "takeaway",
        durationSec: 7,
        narration: `Если упростить, смысл такой: не усложняй, а показывай главное быстро и ясно.`,
        caption: "Смысл: быстро, ясно, по делу",
        visualIntent: "clean takeaway screen",
        motionIntent: "stabilize",
      },
      {
        role: "cta",
        durationSec: 4,
        narration: `${sourceMention}`,
        caption: context.hasSources ? "Собрано из твоих материалов" : "Коротко и понятно",
        visualIntent: "ending tag / logo / CTA",
        motionIntent: "fade out",
      },
    ];
  }

  if (kind === "problem-solution") {
    return [
      {
        role: "hook",
        durationSec: 4,
        narration: `Проблема в том, что большинство делает ролики про ${topic} слишком скучно.`,
        caption: `Главная ошибка в роликах про ${topic}`,
        visualIntent: "problem statement opener",
        motionIntent: "snap cut",
      },
      {
        role: "problem",
        durationSec: 6,
        narration: `Сначала дают лишний контекст, потом теряют внимание, а ценность появляется слишком поздно.`,
        caption: "Сначала скучно → потом поздно",
        visualIntent: "bad example / overloaded visuals",
        motionIntent: "restless cuts",
      },
      {
        role: "solution",
        durationSec: 6,
        narration: `Решение простое: с первых секунд дай факт, боль или результат. Потом уже раскрой детали.`,
        caption: "Сначала факт, боль или результат",
        visualIntent: "clean structure reveal",
        motionIntent: "organized sequence",
      },
      {
        role: "proof",
        durationSec: 6,
        narration: `${socialProof}`,
        caption: simplifyCaption(socialProof),
        visualIntent: "evidence scene using best user asset",
        motionIntent: "focus shift",
      },
      {
        role: "cta",
        durationSec: 4,
        narration: `${sourceMentionEn === sourceMention ? sourceMention : sourceMention}`,
        caption: context.hasSources ? "Твой материал + сильная подача" : "Подача решает всё",
        visualIntent: "final confidence frame",
        motionIntent: "fade",
      },
    ];
  }

  return [
    {
      role: "hook",
      durationSec: 4,
      narration: `История про ${topic} обычно начинается не там, где все думают.`,
      caption: `История про ${topic}`,
      visualIntent: "mysterious intro",
      motionIntent: "cinematic reveal",
    },
    {
      role: "story",
      durationSec: 6,
      narration: `${contextLine}`,
      caption: simplifyCaption(contextLine),
      visualIntent: "story framing with emotional visual",
      motionIntent: "slow move",
    },
    {
      role: "turn",
      durationSec: 6,
      narration: `Но самое интересное вот в чём: ${angle.toLowerCase()}.`,
      caption: simplifyCaption(angle),
      visualIntent: "turning point scene",
      motionIntent: "impact cut",
    },
    {
      role: "proof",
      durationSec: 6,
      narration: `${socialProof}`,
      caption: simplifyCaption(socialProof),
      visualIntent: "proof or example montage",
      motionIntent: "evidence montage",
    },
    {
      role: "cta",
      durationSec: 4,
      narration: `${sourceMention}`,
      caption: context.hasSources ? "Сценарий собран по твоим материалам" : "История, смысл, результат",
      visualIntent: "ending statement",
      motionIntent: "soft end",
    },
  ];
}

function buildNarrationFromScenes(scenes, toneRule) {
  const lines = scenes.map((scene) => ({
    sceneId: scene.id,
    text: styleNarration(scene.narration, toneRule.sentenceStyle),
    durationSec: scene.durationSec,
  }));

  return {
    lines,
    fullText: lines.map((line) => line.text).join(" "),
  };
}

function buildCaptionsFromScenes(scenes, toneRule) {
  return scenes.map((scene) => ({
    sceneId: scene.id,
    text: styleCaption(scene.caption, toneRule.captionStyle),
    role: scene.role,
  }));
}

function buildHook(kind, topic, format, context, tone) {
  const opener = {
    "hook-first": [
      `Вот что почти все упускают в теме ${topic}.`,
      `Если говорить про ${topic}, главный смысл вообще не в том, что думают.`,
      `Сейчас быстро покажу, что реально важно в теме ${topic}.`,
    ],
    "problem-solution": [
      `Главная ошибка в теме ${topic} ломает результат с первых секунд.`,
      `Большинство делает это неправильно, когда говорит про ${topic}.`,
      `Вот почему контент про ${topic} часто не цепляет.`,
    ],
    "story-proof": [
      `У этой темы есть поворот, который люди замечают слишком поздно.`,
      `История про ${topic} интереснее, чем кажется в начале.`,
      `Самое сильное в теме ${topic} обычно скрыто в деталях.`,
    ],
  };

  const selected = opener[kind] || opener["hook-first"];
  const hook = chooseBySignal(selected, topic.length + context.signalScore + tone.length);

  if (format === "news") return `Главное по теме ${topic} — быстро и без шума.`;
  if (format === "ai") return `Вот почему тема ${topic} сейчас реально заслуживает внимания.`;
  if (format === "facts") return `Один неожиданный факт про ${topic} меняет всё восприятие темы.`;

  return hook;
}

function buildAngle(kind, topic, format, context) {
  const suffix = context.hasSources
    ? "и это особенно видно по твоим материалам"
    : "и именно поэтому это можно подать гораздо сильнее";

  if (kind === "hook-first") {
    return `Суть темы ${topic} можно раскрыть быстрее, чище и интереснее, чем обычно ${suffix}`;
  }

  if (kind === "problem-solution") {
    return `Люди теряют внимание не из-за самой темы ${topic}, а из-за слабой подачи, и это можно исправить`;
  }

  if (format === "business" || format === "marketing" || format === "startup") {
    return `Самая сильная сторона темы ${topic} — конкретика, результат и быстрая ценность`;
  }

  return `Тему ${topic} лучше всего раскрывать через сильный ракурс, понятный пример и один точный вывод`;
}

function buildCta(format, context) {
  const style = FORMAT_STYLES[format] || FORMAT_STYLES.default;
  if (context.hasSources && context.hasUserMedia) {
    return {
      ru: `${style.defaultCta}. И можно собрать ещё сильнее из твоих исходников.`,
      en: `${style.defaultCtaEn}. And it can go even further with your own media.`,
    };
  }

  return {
    ru: style.defaultCta,
    en: style.defaultCtaEn,
  };
}

function buildEditDirection({
  kind,
  tone,
  voice,
  formatStyle,
  toneRule,
  voiceRule,
  context,
}) {
  const visualBase = context.hasUserVideo
    ? "prefer uploaded video as primary footage"
    : context.hasUserImages
    ? "prefer uploaded images for scene backbone"
    : "build typography-led scenes with generated visual fallback";

  const soundtrack = context.hasMusic
    ? "mix around uploaded music as base soundtrack"
    : "use neutral rhythmic soundtrack if allowed";

  return {
    cutStyle: toneRule.transitionStyle,
    narrationDelivery: voiceRule.delivery,
    energy: toneRule.energy,
    pacing: formatStyle.pacing,
    visualBase,
    soundtrack,
    variantStyle:
      kind === "hook-first"
        ? "front-load attention and visual contrast"
        : kind === "problem-solution"
        ? "clear contrast between mistake and fix"
        : "story arc with emotional turn and proof",
  };
}

function scoreVariant({ kind, context, tone, format }) {
  let score = 72;

  if (kind === "hook-first") score += 8;
  if (kind === "problem-solution") score += 6;
  if (context.hasUserVideo) score += 5;
  if (context.hasSources) score += 4;
  if (tone === "dynamic") score += 3;
  if (format === "news" || format === "ai" || format === "facts") score += 2;

  return Math.min(score, 99);
}

function buildContextDigest({
  topic,
  notes,
  links,
  files,
  images,
  videos,
  audio,
  summary,
}) {
  const fileTexts = files
    .map((file) => safeText(file.extractedText || ""))
    .filter(Boolean)
    .join("\n")
    .slice(0, 1200);

  const notesTrimmed = safeText(notes).slice(0, 1200);
  const hostnames = links.map((item) => item.hostname).filter(Boolean);
  const sourceCount = files.length + links.length + (notesTrimmed ? 1 : 0);

  const bestContextLine =
    firstSentence(notesTrimmed) ||
    firstSentence(fileTexts) ||
    fallbackContextLine(topic, sourceCount);

  const bestProof =
    buildProofFromContext({
      videos,
      images,
      hostnames,
      notes: notesTrimmed,
      fileTexts,
      topic,
    }) || buildGenericProof(topic);

  return {
    topic,
    hasSources: sourceCount > 0,
    hasUserMedia: (images.length + videos.length + audio.length) > 0,
    hasUserVideo: videos.length > 0,
    hasUserImages: images.length > 0,
    hasMusic: audio.length > 0,
    bestContextLine,
    bestProof,
    sourceCount,
    hostnames,
    signalScore:
      sourceCount * 3 +
      videos.length * 4 +
      images.length * 2 +
      (summary?.flags?.hasUserMedia ? 3 : 0),
  };
}

function buildProofFromContext({ videos, images, hostnames, notes, fileTexts, topic }) {
  if (videos.length > 0) {
    return `У тебя уже есть живой видеоматериал, а значит можно показать тему ${topic} не абстрактно, а через реальные кадры.`;
  }

  if (images.length > 0) {
    return `По твоим изображениям тему ${topic} можно собрать визуально и сделать ролик более цепким с первых секунд.`;
  }

  if (hostnames.length > 0) {
    return `Есть внешние источники, значит можно усилить подачу темы ${topic} фактами, углом и актуальным контекстом.`;
  }

  if (notes || fileTexts) {
    return `У тебя уже есть исходный текстовый контекст, а значит тему ${topic} можно раскрыть точнее и без воды.`;
  }

  return "";
}

function buildGenericProof(topic) {
  return `Когда ролик по теме ${topic} быстро показывает суть, удержание почти всегда выше, чем у затянутого вступления.`;
}

function buildGenericContext(topic) {
  return `Если разложить тему ${topic} по-человечески, становится видно, где именно цепляется внимание.`;
}

function fallbackContextLine(topic, sourceCount) {
  if (sourceCount > 0) {
    return `По твоим материалам видно, что тему ${topic} лучше подавать через конкретику, а не через длинное вступление.`;
  }

  return `Тему ${topic} лучше всего раскрывать коротко, наглядно и с сильного первого кадра.`;
}

function pickSourcePreference(role, context) {
  if (role === "proof" && context.hasUserVideo) return "uploaded-video";
  if ((role === "setup" || role === "story") && context.hasUserImages) return "uploaded-image";
  if (role === "cta") return "typography-logo";
  if (context.hasUserVideo) return "uploaded-video";
  if (context.hasUserImages) return "uploaded-image";
  return "generated-or-typography";
}

function pickEmphasis(role, tone) {
  if (role === "hook") return "high";
  if (role === "cta") return "medium";
  if (tone === "dynamic") return "medium-high";
  return "medium";
}

function estimateSceneTiming(duration, kind) {
  const baseSceneCount = kind === "story-proof" ? 5 : 5;
  const avg = Math.max(3, Math.floor(duration / baseSceneCount));
  return avg;
}

function fitScenesToDuration(sceneTemplates, secondsPerScene, duration) {
  const cloned = sceneTemplates.map((scene) => ({
    ...scene,
    durationSec: scene.durationSec || secondsPerScene,
  }));

  const total = cloned.reduce((sum, scene) => sum + scene.durationSec, 0);
  if (total === duration) return cloned;

  const ratio = duration / total;
  return cloned.map((scene, index) => {
    const scaled = Math.max(2, Math.round(scene.durationSec * ratio));
    if (index === cloned.length - 1) {
      const prev = cloned
        .slice(0, index)
        .reduce((sum, item, idx) => sum + Math.max(2, Math.round(item.durationSec * ratio)), 0);
      return {
        ...scene,
        durationSec: Math.max(2, duration - prev),
      };
    }

    return {
      ...scene,
      durationSec: scaled,
    };
  });
}

function styleNarration(text, sentenceStyle) {
  const clean = safeText(text);
  if (!clean) return "";

  if (sentenceStyle === "short") {
    return splitLongSentence(clean, 110);
  }

  if (sentenceStyle === "conversational") {
    return clean.replace(/\s+/g, " ").trim();
  }

  return clean;
}

function styleCaption(text, captionStyle) {
  const clean = simplifyCaption(text);

  if (captionStyle === "punchy") {
    return clean.length > 48 ? `${clean.slice(0, 47)}…` : clean;
  }

  if (captionStyle === "minimal") {
    return clean.length > 40 ? `${clean.slice(0, 39)}…` : clean;
  }

  return clean;
}

function simplifyCaption(text) {
  return safeText(text)
    .replace(/\s+/g, " ")
    .replace(/[.]{2,}/g, ".")
    .trim();
}

function chooseBySignal(list, signal) {
  if (!Array.isArray(list) || list.length === 0) return "";
  return list[signal % list.length];
}

function firstSentence(text) {
  const clean = safeText(text);
  if (!clean) return "";

  const match = clean.match(/.*?[.!?](\s|$)/);
  if (match?.[0]) return match[0].trim();

  return clean.slice(0, 180).trim();
}

function splitLongSentence(text, maxLen) {
  if (text.length <= maxLen) return text;

  const parts = text.split(", ");
  if (parts.length === 1) return text;

  const lines = [];
  let current = "";

  for (const part of parts) {
    const next = current ? `${current}, ${part}` : part;
    if (next.length > maxLen && current) {
      lines.push(current);
      current = part;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.join(" ");
}

function inferFallbackTopic(summary) {
  const format = summary?.format || "контент";
  return `ролик в формате ${format}`;
}

function normalizeDuration(value) {
  const num = Number(value);
  if (Number.isFinite(num) && num > 0) return Math.round(num);
  return 30;
}

function safeText(value) {
  if (value == null) return "";
  return String(value).trim();
}