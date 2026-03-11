// src/lib/margelet/trendEngine.js
// Margelet Trend Engine
// v1: builds strong trend suggestions from category + locale + simple source signals.
// Designed to work without paid providers.
// Google Trends should be the primary upstream source when connected in API routes.

const CATEGORY_PRESETS = {
  motivation: {
    angles: [
      "discipline over motivation",
      "small habits with visible payoff",
      "what separates action from procrastination",
      "how to stay consistent when mood drops",
    ],
    hooks: [
      "Most people wait for motivation. That is the mistake.",
      "This is why discipline beats motivation every time.",
      "If you keep starting and stopping, watch this.",
    ],
  },
  business: {
    angles: [
      "beginner founder mistakes",
      "simple growth moves that still work",
      "why people do not buy even when the offer is good",
      "small business decisions with outsized impact",
    ],
    hooks: [
      "Most founders lose here before they even notice it.",
      "This one mistake kills small business momentum.",
      "If your business feels stuck, start with this.",
    ],
  },
  news: {
    angles: [
      "what happened and why it matters",
      "the one detail everyone misses",
      "fast breakdown without noise",
      "what changes next",
    ],
    hooks: [
      "Here is the only part that actually matters.",
      "Everyone is talking about this, but here is the point.",
      "Fast breakdown: what happened and why it matters.",
    ],
  },
  ai: {
    angles: [
      "new tool with immediate practical value",
      "workflow replaced by AI in minutes",
      "AI tool comparison with clear winner",
      "what people are using right now and why",
    ],
    hooks: [
      "This AI tool is getting attention for a reason.",
      "People are replacing an entire workflow with this.",
      "If you use AI daily, do not miss this.",
    ],
  },
  crypto: {
    angles: [
      "why a coin or theme is back in the spotlight",
      "market attention shift",
      "simple explanation of a narrative",
      "what newcomers misunderstand first",
    ],
    hooks: [
      "This is why everyone is suddenly watching this again.",
      "Most people still do not understand this crypto move.",
      "If crypto feels noisy, start with this one idea.",
    ],
  },
  facts: {
    angles: [
      "surprising fact with retell potential",
      "3 facts that sound fake but are true",
      "fact with a sharp visual payoff",
      "unexpected comparison people remember",
    ],
    hooks: [
      "This sounds fake, but it is true.",
      "Three facts that people instantly retell.",
      "You will not guess which one is real.",
    ],
  },
  tech: {
    angles: [
      "consumer tool people overlooked",
      "tech shift changing normal habits",
      "what is actually useful right now",
      "tool stack simplification",
    ],
    hooks: [
      "This tech is more useful than it looks.",
      "People are sleeping on this tool.",
      "This is already changing daily life.",
    ],
  },
  finance: {
    angles: [
      "avoidable money mistake",
      "simple financial blind spot",
      "bad habit with hidden cost",
      "financial rule that sounds boring but saves money",
    ],
    hooks: [
      "This money mistake looks small until it gets expensive.",
      "Most people leak money here without noticing.",
      "If you want to save more, start here.",
    ],
  },
  marketing: {
    angles: [
      "psychology behind a campaign that worked",
      "simple growth tactic with proof",
      "content angle that increases retention",
      "why a message converts or fails",
    ],
    hooks: [
      "This marketing move still works for a reason.",
      "Most campaigns fail at this exact point.",
      "If content is not converting, check this first.",
    ],
  },
  startup: {
    angles: [
      "startup idea with real demand signal",
      "mistake in early product positioning",
      "what founders build before validating demand",
      "how to explain value in one sentence",
    ],
    hooks: [
      "Most startup ideas fail before launch for this reason.",
      "This is what founders should validate first.",
      "If nobody gets the product, start here.",
    ],
  },
  design: {
    angles: [
      "design principle with visible before/after",
      "why a layout feels expensive",
      "mistake that kills visual clarity",
      "small design decision with massive impact",
    ],
    hooks: [
      "This tiny design fix changes everything.",
      "Why does one layout feel expensive and the other not?",
      "Most people miss this design principle at first.",
    ],
  },
  blog: {
    angles: [
      "personal angle with instant curiosity",
      "topic framing that feels clickable",
      "story-led content opener",
      "simple opinion people react to",
    ],
    hooks: [
      "This is the kind of topic people actually click.",
      "If you want better blog ideas, start here.",
      "This angle makes a normal topic feel fresh.",
    ],
  },
  default: {
    angles: [
      "clear explanation with immediate payoff",
      "unexpected angle on a familiar topic",
      "strong problem-solution framing",
      "story plus proof structure",
    ],
    hooks: [
      "This is the part most people miss.",
      "Here is the simpler way to explain it.",
      "If you only remember one thing, make it this.",
    ],
  },
};

export async function findTrendIdeas(input = {}) {
  const {
    format = "default",
    topic = "",
    locale = "US",
    language = "ru",
    upstreamTrends = [],
    links = [],
    notes = "",
  } = input;

  const preset = CATEGORY_PRESETS[format] || CATEGORY_PRESETS.default;
  const cleanedTopic = safeText(topic);
  const normalizedTrends = normalizeUpstreamTrends(upstreamTrends);
  const contextSignals = extractContextSignals({ links, notes, topic: cleanedTopic });

  const ranked = rankTrendCandidates({
    format,
    preset,
    cleanedTopic,
    normalizedTrends,
    contextSignals,
  });

  const selected = ranked.slice(0, 6);

  const suggestions = selected.map((item, index) =>
    buildTrendSuggestion({
      item,
      index,
      format,
      language,
      locale,
      cleanedTopic,
      preset,
      contextSignals,
    })
  );

  const best = suggestions[0] || buildFallbackSuggestion({
    format,
    language,
    locale,
    cleanedTopic,
    preset,
  });

  return {
    ok: true,
    source: {
      primary: normalizedTrends.length > 0 ? "google-trends-or-upstream" : "local-heuristics",
      locale,
      language,
      upstreamCount: normalizedTrends.length,
    },
    summary: {
      format,
      originalTopic: cleanedTopic,
      suggestionCount: suggestions.length,
    },
    best,
    suggestions,
  };
}

function buildTrendSuggestion({
  item,
  index,
  format,
  language,
  locale,
  cleanedTopic,
  preset,
  contextSignals,
}) {
  const trendTitle = item.title;
  const angle = chooseByIndex(
    buildAngleOptions({
      format,
      trendTitle,
      cleanedTopic,
      preset,
      contextSignals,
    }),
    index
  );

  const hook = chooseByIndex(
    buildHookOptions({
      format,
      trendTitle,
      cleanedTopic,
      preset,
      language,
    }),
    index
  );

  const suggestedTone = suggestToneByFormat(format);
  const suggestedDuration = suggestDurationByFormat(format);
  const topic = buildSuggestedTopic({
    trendTitle,
    cleanedTopic,
    angle,
    language,
  });

  return {
    id: item.id || `trend_${index + 1}`,
    score: item.score,
    source: item.source,
    rawTrend: trendTitle,
    topic,
    whyNow: buildWhyNow(item, language),
    angle,
    hookOptions: buildHookPack(hook, trendTitle, language),
    suggestedTone,
    suggestedDuration,
    metadata: {
      locale,
      language,
      format,
      keywords: item.keywords || [],
      sourceSignals: item.sourceSignals || [],
    },
  };
}

function buildFallbackSuggestion({
  format,
  language,
  locale,
  cleanedTopic,
  preset,
}) {
  const baseTopic =
    cleanedTopic ||
    (language === "ru"
      ? "актуальная тема для короткого ролика"
      : "a current topic for a short video");

  const hook = chooseByIndex(preset.hooks || CATEGORY_PRESETS.default.hooks, 0);
  const angle = chooseByIndex(preset.angles || CATEGORY_PRESETS.default.angles, 0);

  return {
    id: "trend_fallback",
    score: 60,
    source: "local-heuristics",
    rawTrend: baseTopic,
    topic: cleanedTopic || baseTopic,
    whyNow:
      language === "ru"
        ? "Тема подходит под формат короткого ролика и быстро считывается с первых секунд."
        : "This topic fits short-form video and can be understood in the first seconds.",
    angle,
    hookOptions: buildHookPack(hook, baseTopic, language),
    suggestedTone: suggestToneByFormat(format),
    suggestedDuration: suggestDurationByFormat(format),
    metadata: {
      locale,
      language,
      format,
      keywords: [],
      sourceSignals: [],
    },
  };
}

function normalizeUpstreamTrends(list) {
  return (Array.isArray(list) ? list : [])
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          id: `upstream_${index + 1}`,
          title: item.trim(),
          score: 70 - index,
          source: "upstream-string",
          keywords: tokenize(item),
          sourceSignals: [],
        };
      }

      return {
        id: item?.id || `upstream_${index + 1}`,
        title: safeText(item?.title || item?.query || item?.name),
        score: normalizeScore(item?.score, 70 - index),
        source: safeText(item?.source || "upstream-object"),
        keywords: Array.isArray(item?.keywords)
          ? item.keywords.map((v) => safeText(v)).filter(Boolean)
          : tokenize(item?.title || item?.query || item?.name || ""),
        sourceSignals: Array.isArray(item?.sourceSignals) ? item.sourceSignals : [],
      };
    })
    .filter((item) => item.title);
}

function extractContextSignals({ links, notes, topic }) {
  const hostSignals = (Array.isArray(links) ? links : [])
    .map((item) => {
      try {
        return new URL(item).hostname.replace(/^www\./, "");
      } catch {
        return "";
      }
    })
    .filter(Boolean);

  const noteKeywords = tokenize(notes).slice(0, 12);
  const topicKeywords = tokenize(topic).slice(0, 8);

  return {
    hosts: hostSignals,
    noteKeywords,
    topicKeywords,
  };
}

function rankTrendCandidates({
  format,
  preset,
  cleanedTopic,
  normalizedTrends,
  contextSignals,
}) {
  const localCandidates = buildLocalCandidates({
    format,
    preset,
    cleanedTopic,
    contextSignals,
  });

  const combined = [...normalizedTrends, ...localCandidates];

  return combined
    .map((item, index) => {
      let score = Number(item.score) || 50;

      const title = safeText(item.title).toLowerCase();

      for (const kw of contextSignals.topicKeywords) {
        if (title.includes(kw.toLowerCase())) score += 8;
      }

      for (const kw of contextSignals.noteKeywords) {
        if (title.includes(kw.toLowerCase())) score += 4;
      }

      if (format === "ai" && includesAny(title, ["ai", "gpt", "model", "agent", "tool"])) {
        score += 10;
      }
      if (format === "crypto" && includesAny(title, ["bitcoin", "btc", "ethereum", "solana", "token"])) {
        score += 10;
      }
      if (format === "business" && includesAny(title, ["business", "startup", "founder", "sales", "growth"])) {
        score += 8;
      }

      return {
        ...item,
        score: Math.max(1, Math.min(100, score - index * 0.2)),
      };
    })
    .sort((a, b) => b.score - a.score);
}

function buildLocalCandidates({ format, preset, cleanedTopic, contextSignals }) {
  const seeds = [...(preset.angles || []), ...(contextSignals.topicKeywords || [])]
    .filter(Boolean)
    .slice(0, 8);

  return seeds.map((seed, index) => ({
    id: `local_${format}_${index + 1}`,
    title: cleanedTopic ? `${cleanedTopic}: ${seed}` : seed,
    score: 58 - index,
    source: "local-heuristics",
    keywords: tokenize(seed),
    sourceSignals: contextSignals.hosts || [],
  }));
}

function buildAngleOptions({
  format,
  trendTitle,
  cleanedTopic,
  preset,
  contextSignals,
}) {
  const sourceHint =
    contextSignals.hosts.length > 0
      ? ` with source angle from ${contextSignals.hosts[0]}`
      : "";

  const angles = [
    `${trendTitle} explained through a short, clear angle${sourceHint}`,
    `why ${trendTitle} matters right now`,
    `the strongest short-form angle for ${trendTitle}`,
    ...(preset.angles || []),
  ];

  if (cleanedTopic) {
    angles.unshift(`${trendTitle} connected to ${cleanedTopic}`);
  }

  if (format === "news") {
    angles.unshift(`${trendTitle}: what happened and why it matters`);
  }

  return uniqueStrings(angles);
}

function buildHookOptions({
  format,
  trendTitle,
  cleanedTopic,
  preset,
  language,
}) {
  const hooks = [...(preset.hooks || CATEGORY_PRESETS.default.hooks)];

  if (language === "ru") {
    hooks.unshift(`Вот почему тема «${trendTitle}» сейчас реально цепляет внимание.`);
    hooks.unshift(`Сейчас быстро покажу, почему «${trendTitle}» у всех на слуху.`);
    if (cleanedTopic) {
      hooks.unshift(`Если тебе интересна тема ${cleanedTopic}, начни с этого.`);
    }
  } else {
    hooks.unshift(`Here is why "${trendTitle}" is getting attention right now.`);
    hooks.unshift(`Fast breakdown: why "${trendTitle}" is suddenly everywhere.`);
    if (cleanedTopic) {
      hooks.unshift(`If you care about ${cleanedTopic}, start here.`);
    }
  }

  if (format === "facts") {
    hooks.unshift(
      language === "ru"
        ? `Это звучит как фейк, но тема «${trendTitle}» реально взлетает.`
        : `This sounds fake, but "${trendTitle}" is genuinely taking off.`
    );
  }

  return uniqueStrings(hooks);
}

function buildSuggestedTopic({ trendTitle, cleanedTopic, angle, language }) {
  if (cleanedTopic) {
    return language === "ru"
      ? `Сделай короткий ролик про ${cleanedTopic} через угол: ${angle}`
      : `Create a short video about ${cleanedTopic} with this angle: ${angle}`;
  }

  return language === "ru"
    ? `Сделай короткий ролик про ${trendTitle}`
    : `Create a short video about ${trendTitle}`;
}

function buildWhyNow(item, language) {
  if (language === "ru") {
    return item.source === "google-trends-or-upstream" || item.source === "upstream-string"
      ? `Тема выглядит актуальной по трендовому сигналу и подходит для быстрого short-form разбора.`
      : `Тема хорошо ложится на текущий формат короткого ролика и быстро считывается зрителем.`;
  }

  return item.source === "google-trends-or-upstream" || item.source === "upstream-string"
    ? `This topic shows a current trend signal and fits a fast short-form breakdown.`
    : `This topic fits current short-form behavior and is easy to understand quickly.`;
}

function buildHookPack(primaryHook, trendTitle, language) {
  const secondary =
    language === "ru"
      ? `Большинство смотрит на «${trendTitle}» не под тем углом.`
      : `Most people are looking at "${trendTitle}" from the wrong angle.`;

  const tertiary =
    language === "ru"
      ? `Если объяснить «${trendTitle}» правильно, удержание будет выше.`
      : `If you frame "${trendTitle}" correctly, retention gets better.`;

  return uniqueStrings([primaryHook, secondary, tertiary]).slice(0, 3);
}

function suggestToneByFormat(format) {
  if (["news", "ai", "crypto", "facts", "marketing", "startup"].includes(format)) {
    return "dynamic";
  }
  if (["design", "movies", "books", "travel"].includes(format)) {
    return "premium";
  }
  if (["psychology", "health", "education"].includes(format)) {
    return "calm";
  }
  return "dynamic";
}

function suggestDurationByFormat(format) {
  if (["facts", "news", "ai", "crypto"].includes(format)) return 20;
  if (["business", "marketing", "startup", "design"].includes(format)) return 30;
  return 30;
}

function tokenize(text) {
  return safeText(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((w) => w && w.length > 2);
}

function includesAny(text, list) {
  return list.some((part) => text.includes(part));
}

function uniqueStrings(list) {
  const out = [];
  for (const item of list) {
    const value = safeText(item);
    if (value && !out.includes(value)) out.push(value);
  }
  return out;
}

function chooseByIndex(list, index) {
  if (!Array.isArray(list) || list.length === 0) return "";
  return list[index % list.length];
}

function normalizeScore(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function safeText(value) {
  if (value == null) return "";
  return String(value).trim();
}