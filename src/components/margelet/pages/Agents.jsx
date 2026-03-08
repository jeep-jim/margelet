import React, { useMemo, useState } from "react";
import {
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronRight,
  Search,
  Sparkles,
  Flame,
  Newspaper,
  Brain,
  Zap,
  Briefcase,
  BadgeHelp,
  Wand2,
  Clock3,
  Layers3,
  Palette,
  Filter,
  FolderKanban,
} from "lucide-react";
import { runAgent } from "@/lib/margelet/runAgent";

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/70 bg-white/85 p-4 shadow-[0_18px_50px_rgba(88,94,160,0.12)] backdrop-blur-xl sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function getIsRu(copy) {
  return copy?.language === "Язык" || copy?.locale === "ru";
}

function t(copy, key, fallbackRu, fallbackEn) {
  if (copy && copy[key]) return copy[key];
  return getIsRu(copy) ? fallbackRu : fallbackEn;
}

function StatusPill({ active, copy }) {
  return active ? (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
      <Play size={12} /> {t(copy, "inWork", "В работе", "In work")}
    </div>
  ) : (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
      <Pause size={12} /> {t(copy, "paused", "Пауза", "Paused")}
    </div>
  );
}

function MetricPill({ icon: Icon, children, className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {Icon ? <Icon size={12} /> : null}
      {children}
    </div>
  );
}

const iconPresets = {
  spark: Sparkles,
  flame: Flame,
  news: Newspaper,
  brain: Brain,
  zap: Zap,
  work: Briefcase,
  help: BadgeHelp,
  magic: Wand2,
};

const accentPresets = {
  violet: "from-violet-500 to-fuchsia-500",
  sky: "from-sky-500 to-cyan-500",
  emerald: "from-emerald-500 to-teal-500",
  amber: "from-amber-500 to-orange-500",
  rose: "from-rose-500 to-pink-500",
  slate: "from-slate-600 to-slate-800",
};

const CATEGORY_LIBRARY = [
  {
    key: "motivation",
    icon: "🧘",
    labelRu: "Мотивация",
    labelEn: "Motivation",
    accent: "violet",
  },
  {
    key: "business",
    icon: "💼",
    labelRu: "Бизнес",
    labelEn: "Business",
    accent: "emerald",
  },
  {
    key: "news",
    icon: "📰",
    labelRu: "Новости",
    labelEn: "News",
    accent: "sky",
  },
  {
    key: "ai",
    icon: "🤖",
    labelRu: "AI",
    labelEn: "AI",
    accent: "violet",
  },
  {
    key: "crypto",
    icon: "₿",
    labelRu: "Крипта",
    labelEn: "Crypto",
    accent: "amber",
  },
  {
    key: "facts",
    icon: "📚",
    labelRu: "Факты",
    labelEn: "Facts",
    accent: "sky",
  },
  {
    key: "history",
    icon: "🏛️",
    labelRu: "История",
    labelEn: "History",
    accent: "amber",
  },
  {
    key: "reddit",
    icon: "💬",
    labelRu: "Reddit",
    labelEn: "Reddit",
    accent: "rose",
  },
  {
    key: "story",
    icon: "🎬",
    labelRu: "Истории",
    labelEn: "Story",
    accent: "rose",
  },
  {
    key: "marketing",
    icon: "📈",
    labelRu: "Маркетинг",
    labelEn: "Marketing",
    accent: "emerald",
  },
  {
    key: "gaming",
    icon: "🎮",
    labelRu: "Игры",
    labelEn: "Gaming",
    accent: "violet",
  },
  {
    key: "finance",
    icon: "💸",
    labelRu: "Финансы",
    labelEn: "Finance",
    accent: "emerald",
  },
  {
    key: "tech",
    icon: "⚡",
    labelRu: "Технологии",
    labelEn: "Tech",
    accent: "sky",
  },
  {
    key: "luxury",
    icon: "💎",
    labelRu: "Люкс",
    labelEn: "Luxury",
    accent: "slate",
  },
  {
    key: "travel",
    icon: "✈️",
    labelRu: "Путешествия",
    labelEn: "Travel",
    accent: "sky",
  },
  {
    key: "fitness",
    icon: "🏋️",
    labelRu: "Фитнес",
    labelEn: "Fitness",
    accent: "emerald",
  },
  {
    key: "food",
    icon: "🍔",
    labelRu: "Еда",
    labelEn: "Food",
    accent: "amber",
  },
  {
    key: "fashion",
    icon: "👗",
    labelRu: "Мода",
    labelEn: "Fashion",
    accent: "rose",
  },
  {
    key: "psychology",
    icon: "🧠",
    labelRu: "Психология",
    labelEn: "Psychology",
    accent: "violet",
  },
  {
    key: "productivity",
    icon: "🗂️",
    labelRu: "Продуктивность",
    labelEn: "Productivity",
    accent: "emerald",
  },
];

const QUICK_PRESETS = {
  motivation: [
    {
      nameRu: "Motivation Hook Agent",
      nameEn: "Motivation Hook Agent",
      topicRu: "мотивация",
      topicEn: "motivation",
      style: "Hook + advice",
      videos: 5,
      length: 30,
      voice: "AI voice",
      autopost: false,
      mode: "Manual",
      icon: "flame",
      accent: "violet",
      categoryRu: "мотивация",
      categoryEn: "motivation",
    },
    {
      nameRu: "Discipline Shorts Agent",
      nameEn: "Discipline Shorts Agent",
      topicRu: "дисциплина",
      topicEn: "discipline",
      style: "Hook + script + captions",
      videos: 3,
      length: 30,
      voice: "AI voice",
      autopost: false,
      mode: "Manual",
      icon: "spark",
      accent: "violet",
      categoryRu: "мотивация",
      categoryEn: "motivation",
    },
    {
      nameRu: "Mindset Story Agent",
      nameEn: "Mindset Story Agent",
      topicRu: "мышление",
      topicEn: "mindset",
      style: "Story + payoff",
      videos: 4,
      length: 45,
      voice: "Cloned voice",
      autopost: false,
      mode: "Manual",
      icon: "brain",
      accent: "rose",
      categoryRu: "мотивация",
      categoryEn: "motivation",
    },
  ],
  business: [
    {
      nameRu: "Business Insight Agent",
      nameEn: "Business Insight Agent",
      topicRu: "бизнес",
      topicEn: "business",
      style: "Talking head assistant",
      videos: 3,
      length: 60,
      voice: "Cloned voice",
      autopost: false,
      mode: "Manual",
      icon: "work",
      accent: "emerald",
      categoryRu: "бизнес",
      categoryEn: "business",
    },
    {
      nameRu: "Startup Lessons Agent",
      nameEn: "Startup Lessons Agent",
      topicRu: "стартапы",
      topicEn: "startup",
      style: "Hook + explainer",
      videos: 4,
      length: 45,
      voice: "AI voice",
      autopost: false,
      mode: "Manual",
      icon: "zap",
      accent: "emerald",
      categoryRu: "бизнес",
      categoryEn: "business",
    },
    {
      nameRu: "Money Mistakes Agent",
      nameEn: "Money Mistakes Agent",
      topicRu: "ошибки в деньгах",
      topicEn: "money mistakes",
      style: "Advice + captions",
      videos: 5,
      length: 30,
      voice: "AI voice",
      autopost: false,
      mode: "Manual",
      icon: "help",
      accent: "amber",
      categoryRu: "бизнес",
      categoryEn: "business",
    },
  ],
  news: [
    {
      nameRu: "Fast News Agent",
      nameEn: "Fast News Agent",
      topicRu: "новости",
      topicEn: "news",
      style: "News recap",
      videos: 12,
      length: 45,
      voice: "AI voice",
      autopost: true,
      mode: "Auto",
      icon: "news",
      accent: "sky",
      categoryRu: "новости",
      categoryEn: "news",
    },
    {
      nameRu: "Global Headlines Agent",
      nameEn: "Global Headlines Agent",
      topicRu: "мировые новости",
      topicEn: "world news",
      style: "Recap + captions",
      videos: 8,
      length: 30,
      voice: "AI voice",
      autopost: true,
      mode: "Auto",
      icon: "news",
      accent: "sky",
      categoryRu: "новости",
      categoryEn: "news",
    },
    {
      nameRu: "Daily Brief Agent",
      nameEn: "Daily Brief Agent",
      topicRu: "краткие сводки",
      topicEn: "daily brief",
      style: "Brief format",
      videos: 6,
      length: 30,
      voice: "AI voice",
      autopost: false,
      mode: "Manual",
      icon: "spark",
      accent: "sky",
      categoryRu: "новости",
      categoryEn: "news",
    },
  ],
  ai: [
    {
      nameRu: "AI Tools Agent",
      nameEn: "AI Tools Agent",
      topicRu: "ai tools",
      topicEn: "ai tools",
      style: "Tool demo + hooks",
      videos: 5,
      length: 30,
      voice: "AI voice",
      autopost: false,
      mode: "Manual",
      icon: "spark",
      accent: "violet",
      categoryRu: "ai",
      categoryEn: "ai",
    },
    {
      nameRu: "Prompt Tricks Agent",
      nameEn: "Prompt Tricks Agent",
      topicRu: "промпты",
      topicEn: "prompts",
      style: "Tips + captions",
      videos: 4,
      length: 30,
      voice: "AI voice",
      autopost: false,
      mode: "Manual",
      icon: "magic",
      accent: "violet",
      categoryRu: "ai",
      categoryEn: "ai",
    },
    {
      nameRu: "AI News Agent",
      nameEn: "AI News Agent",
      topicRu: "новости ai",
      topicEn: "ai news",
      style: "News recap",
      videos: 6,
      length: 45,
      voice: "AI voice",
      autopost: true,
      mode: "Auto",
      icon: "brain",
      accent: "violet",
      categoryRu: "ai",
      categoryEn: "ai",
    },
  ],
  crypto: [
    {
      nameRu: "Crypto News Agent",
      nameEn: "Crypto News Agent",
      topicRu: "крипта",
      topicEn: "crypto",
      style: "Fast update",
      videos: 8,
      length: 30,
      voice: "AI voice",
      autopost: true,
      mode: "Auto",
      icon: "zap",
      accent: "amber",
      categoryRu: "крипта",
      categoryEn: "crypto",
    },
    {
      nameRu: "Crypto Explain Agent",
      nameEn: "Crypto Explain Agent",
      topicRu: "объяснение крипты",
      topicEn: "crypto explain",
      style: "Explainer",
      videos: 4,
      length: 45,
      voice: "AI voice",
      autopost: false,
      mode: "Manual",
      icon: "brain",
      accent: "amber",
      categoryRu: "крипта",
      categoryEn: "crypto",
    },
    {
      nameRu: "Market Moves Agent",
      nameEn: "Market Moves Agent",
      topicRu: "движение рынка",
      topicEn: "market moves",
      style: "Hook + analysis",
      videos: 5,
      length: 30,
      voice: "Cloned voice",
      autopost: false,
      mode: "Manual",
      icon: "zap",
      accent: "amber",
      categoryRu: "крипта",
      categoryEn: "crypto",
    },
  ],
};

function normalizeCategory(agent, copy) {
  if (agent?.category) return agent.category;
  const topic = String(agent?.topic || "").toLowerCase();

  if (topic.includes("crypto") || topic.includes("крип"))
    return getIsRu(copy) ? "крипта" : "crypto";
  if (topic.includes("news") || topic.includes("нов"))
    return getIsRu(copy) ? "новости" : "news";
  if (topic.includes("ai")) return "ai";
  if (topic.includes("business") || topic.includes("бизн"))
    return getIsRu(copy) ? "бизнес" : "business";
  if (topic.includes("story") || topic.includes("истор"))
    return getIsRu(copy) ? "истории" : "story";
  if (topic.includes("reddit")) return "reddit";
  if (topic.includes("motivation") || topic.includes("мотив"))
    return getIsRu(copy) ? "мотивация" : "motivation";

  return getIsRu(copy) ? "контент" : "content";
}

function normalizeAccent(agent) {
  if (agent?.accent && accentPresets[agent.accent]) return agent.accent;

  const topic = String(agent?.topic || "").toLowerCase();

  if (topic.includes("crypto") || topic.includes("крип")) return "amber";
  if (topic.includes("news") || topic.includes("нов")) return "sky";
  if (topic.includes("ai")) return "violet";
  if (topic.includes("business") || topic.includes("бизн")) return "emerald";
  if (topic.includes("story") || topic.includes("истор")) return "rose";

  return "violet";
}

function normalizeIcon(agent) {
  if (agent?.icon && iconPresets[agent.icon]) return agent.icon;

  const topic = String(agent?.topic || "").toLowerCase();

  if (topic.includes("crypto") || topic.includes("крип")) return "zap";
  if (topic.includes("news") || topic.includes("нов")) return "news";
  if (topic.includes("ai")) return "spark";
  if (topic.includes("business") || topic.includes("бизн")) return "work";
  if (topic.includes("story") || topic.includes("истор")) return "magic";

  return "spark";
}

function normalizeTagline(agent, copy) {
  if (agent?.tagline) return agent.tagline;

  if (getIsRu(copy)) {
    return `Агент для short-form контента по теме: ${agent?.topic || "контент"}`;
  }

  return `Short-form content agent for ${agent?.topic || "content"}`;
}

function getAgentPlatforms(agent) {
  if (Array.isArray(agent?.platforms) && agent.platforms.length) {
    return agent.platforms;
  }

  if (typeof agent?.platform === "string" && agent.platform.trim()) {
    return agent.platform
      .split("+")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  return ["telegram"];
}

function getAgentLength(agent) {
  return Number(agent?.lengthSec || agent?.length || 30) || 30;
}

function AgentIdentityBadge({ agent, copy }) {
  const accent = normalizeAccent(agent);
  const accentClass = accentPresets[accent] || accentPresets.violet;
  const iconKey = normalizeIcon(agent);
  const Icon = iconPresets[iconKey] || Sparkles;
  const category = normalizeCategory(agent, copy);

  return (
    <div className={`rounded-[24px] bg-gradient-to-br ${accentClass} p-[0.5px]`}>
      <div className="rounded-[23px] bg-white/92 p-3 backdrop-blur">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accentClass} text-white shadow-lg`}
          >
            <Icon size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-black text-slate-900">
              {agent.name}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <MetricPill className="bg-slate-100 text-slate-700">
                <Layers3 size={12} />
                {category}
              </MetricPill>

              <MetricPill className="bg-violet-50 text-violet-700">
                <Palette size={12} />
                {accent}
              </MetricPill>
            </div>

            <div className="mt-2 line-clamp-2 text-sm text-slate-500">
              {normalizeTagline(agent, copy)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryChip({ category, active, onClick, isRu }) {
  const label = isRu ? category.labelRu : category.labelEn;

  return (
    <button
      onClick={onClick}
      className={`flex min-w-[88px] flex-col items-center gap-2 rounded-[22px] px-3 py-3 text-center transition ${
        active
          ? "bg-slate-900 text-white shadow-lg"
          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full text-xl ${
          active ? "bg-white/15" : "bg-slate-100"
        }`}
      >
        {category.icon}
      </div>
      <span className="text-[11px] font-semibold leading-4">{label}</span>
    </button>
  );
}

function QuickPresetCard({ preset, isRu, onCreate }) {
  const title = isRu ? preset.nameRu : preset.nameEn;
  const topic = isRu ? preset.topicRu : preset.topicEn;
  const accent = accentPresets[preset.accent] || accentPresets.violet;
  const Icon = iconPresets[preset.icon] || Sparkles;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-md`}
        >
          <Icon size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-black text-slate-900">
            {title}
          </div>
          <div className="mt-1 text-xs text-slate-500">{topic}</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <MetricPill className="bg-slate-100 text-slate-700">
          {preset.videos} {isRu ? "в день" : "per day"}
        </MetricPill>
        <MetricPill className="bg-sky-50 text-sky-700">
          {preset.length}s
        </MetricPill>
        <MetricPill className="bg-emerald-50 text-emerald-700">
          {preset.voice}
        </MetricPill>
      </div>

      <div className="mt-4 text-sm text-slate-600">{preset.style}</div>

      <button
        onClick={onCreate}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        <Plus size={14} />
        {isRu ? "Создать на базе шаблона" : "Create from preset"}
      </button>
    </div>
  );
}

function BatchOutputPreview({ output, copy }) {
  const items = Array.isArray(output?.items) ? output.items : [];

  if (!items.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <FolderKanban size={14} className="text-violet-600" />
          {t(copy, "batchResult", "Пачка результатов", "Batch results")}
        </div>

        <MetricPill className="bg-white text-slate-700 ring-1 ring-slate-200/70">
          <Sparkles size={12} />
          {items.length} {getIsRu(copy) ? "видео" : "videos"}
        </MetricPill>
      </div>

      <div className="mt-3 grid gap-2">
        {items.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className="rounded-xl bg-white px-3 py-3 text-sm ring-1 ring-slate-200/70"
          >
            <div className="font-semibold text-slate-900">
              {item.label} — {item.script?.title || item.topic}
            </div>
            <div className="mt-1 text-slate-600">
              {item.script?.hook || item.topic}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <MetricPill className="bg-white text-slate-600 ring-1 ring-slate-200/70">
          <Clock3 size={12} />
          {output.generatedVideos || items.length}{" "}
          {getIsRu(copy) ? "готово" : "ready"}
        </MetricPill>

        <MetricPill className="bg-white text-slate-600 ring-1 ring-slate-200/70">
          <Sparkles size={12} />
          {output.queueStatus || "ready"}
        </MetricPill>
      </div>
    </div>
  );
}

function SingleOutputPreview({ output, agent, copy }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Sparkles size={14} className="text-violet-600" />
        {t(
          copy,
          "latestGeneratedOutput",
          "Последний сгенерированный результат",
          "Latest generated output"
        )}
      </div>

      <div className="mt-3 text-sm font-semibold text-slate-800">
        {output.script?.title}
      </div>

      <div className="mt-2 text-sm text-slate-600">
        {output.script?.hook}
      </div>

      <div className="mt-3 space-y-2">
        {output.scenes?.slice(0, 3).map((scene) => (
          <div
            key={scene.id}
            className="rounded-xl bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200/70"
          >
            {scene.text}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <MetricPill className="bg-white text-slate-600 ring-1 ring-slate-200/70">
          <Clock3 size={12} />
          {output.videoPlan?.totalDuration || getAgentLength(agent)}s
        </MetricPill>

        <MetricPill className="bg-white text-slate-600 ring-1 ring-slate-200/70">
          <Sparkles size={12} />
          {output.scenes?.length || 0} {getIsRu(copy) ? "сцен" : "scenes"}
        </MetricPill>
      </div>
    </div>
  );
}

export default function Agents({
  copy,
  agentSearch,
  setAgentSearch,
  agentFilter,
  setAgentFilter,
  filteredAgents,
  setShowWizard,
  setSelectedWorkspaceId,
  toggleAgent,
  setEditingAgentId,
  setAgentOutput,
}) {
  const [runningAgentId, setRunningAgentId] = useState(null);
  const [agentOutputs, setAgentOutputs] = useState({});
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("motivation");

  const isRu = getIsRu(copy);

  const filters = useMemo(
    () => [
      { key: "all", label: t(copy, "all", "Все", "All") },
      { key: "active", label: t(copy, "active", "Активные", "Active") },
      { key: "manual", label: t(copy, "manual", "Ручной", "Manual") },
      { key: "auto", label: t(copy, "auto", "Авто", "Auto") },
    ],
    [copy]
  );

  const visibleCategories = showAllCategories
    ? CATEGORY_LIBRARY
    : CATEGORY_LIBRARY.slice(0, 10);

  const quickPresets =
    QUICK_PRESETS[selectedCategory] || QUICK_PRESETS.motivation || [];

  const handleRunAgent = async (agent) => {
    try {
      setRunningAgentId(agent.id);

      const result = await runAgent({
        name: agent.name,
        topic: agent.topic,
        lengthSec: getAgentLength(agent),
        voice: agent.voice,
        autopost: agent.autopost,
        platforms: getAgentPlatforms(agent),
        requestedVideos: Number(agent.videos || 1),
        videosPerDay: Number(agent.videos || 1),
        outputType: agent.outputType || "slideshow-video",
        visualSourceType: agent.visualSourceType || "template",
        renderMode: agent.renderMode || "full-video",
        workspace: agent.workspace || {},
      });

      setAgentOutputs((prev) => ({
        ...prev,
        [agent.id]: result,
      }));

      return result;
    } finally {
      setRunningAgentId(null);
    }
  };

  const handleOpenWorkspace = async (agent) => {
    const result = agentOutputs[agent.id] || (await handleRunAgent(agent));

    if (result?.type === "agent-batch") {
      const firstItem = result.items?.[0] || null;
      if (firstItem) {
        setSelectedWorkspaceId(agent.id);
        setAgentOutput({
          ...firstItem,
          batch: result,
        });
      }
      return;
    }

    setSelectedWorkspaceId(agent.id);
    setAgentOutput(result);
  };

  const handleCreateFromPreset = (preset) => {
    const newAgent = {
      id: Date.now(),
      name: isRu ? preset.nameRu : preset.nameEn,
      topic: isRu ? preset.topicRu : preset.topicEn,
      videos: preset.videos,
      active: false,
      status: "Paused",
      platform: "Telegram + Shorts",
      platforms: ["telegram", "youtube-shorts"],
      lastRun: isRu ? "только что создан" : "just created",
      health: "warning",
      autopost: preset.autopost,
      mode: preset.mode,
      length: preset.length,
      lengthSec: preset.length,
      voice: preset.voice,
      style: preset.style,
      icon: preset.icon,
      accent: preset.accent,
      category: isRu ? preset.categoryRu : preset.categoryEn,
      outputType: "slideshow-video",
      visualSourceType: "template",
      renderMode: "full-video",
      tagline: isRu
        ? `Быстрый старт для ниши: ${preset.topicRu}`
        : `Fast start preset for: ${preset.topicEn}`,
    };

    setSelectedWorkspaceId(newAgent.id);
    setAgentOutput({
      agent: newAgent,
      script: {
        title: isRu
          ? `${preset.topicRu} explained in ${preset.length} seconds`
          : `${preset.topicEn} explained in ${preset.length} seconds`,
        hook: isRu
          ? `Быстрый хук для темы: ${preset.topicRu}`
          : `Quick hook for ${preset.topicEn}`,
      },
      scenes: [
        {
          id: 1,
          text: isRu
            ? "Первый сильный тезис для удержания внимания."
            : "First strong point to hold attention.",
        },
        {
          id: 2,
          text: isRu
            ? "Главное объяснение простыми словами."
            : "Main explanation in simple language.",
        },
        {
          id: 3,
          text: isRu
            ? "Финальный вывод и CTA."
            : "Final takeaway and CTA.",
        },
      ],
      videoPlan: {
        totalDuration: preset.length,
      },
    });
  };

  return (
    <>
      <Card>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-xl font-semibold">
              {t(copy, "agents", "Агенты", "Agents")}
            </div>
            <div className="text-sm text-slate-500">
              {t(
                copy,
                "launchPauseConfigure",
                "Запускай, ставь на паузу и настраивай агентов",
                "Launch, pause and configure your agents"
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200/70">
              <Search size={15} className="text-slate-400" />
              <input
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                placeholder={t(
                  copy,
                  "searchAgents",
                  "Поиск агентов",
                  "Search agents"
                )}
                className="w-40 bg-transparent text-sm outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1">
              {filters.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setAgentFilter(item.key)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    agentFilter === item.key
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowWizard(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-fuchsia-600 px-4 py-3 font-semibold text-white transition hover:bg-fuchsia-700"
            >
              <Plus size={16} />{" "}
              {t(copy, "createAgent", "Создать агента", "Create agent")}
            </button>
          </div>
        </div>
      </Card>

      <Card className="py-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Filter size={14} />
          {isRu ? "Ниши и тематики" : "Niches and categories"}
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {visibleCategories.map((category) => (
            <CategoryChip
              key={category.key}
              category={category}
              active={selectedCategory === category.key}
              onClick={() => setSelectedCategory(category.key)}
              isRu={isRu}
            />
          ))}

          <button
            onClick={() => setShowAllCategories((prev) => !prev)}
            className="flex min-w-[88px] flex-col items-center gap-2 rounded-[22px] bg-white px-3 py-3 text-center text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl">
              {showAllCategories ? "−" : "→"}
            </div>
            <span className="text-[11px] font-semibold leading-4">
              {showAllCategories
                ? isRu
                  ? "Скрыть"
                  : "Less"
                : isRu
                ? "Ещё"
                : "More"}
            </span>
          </button>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900">
              {isRu ? "Быстрый старт" : "Quick presets"}
            </div>
            <div className="text-sm text-slate-500">
              {isRu
                ? "Выбери нишу и создай агента в один клик"
                : "Choose a niche and create an agent in one click"}
            </div>
          </div>

          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {isRu ? "Готовые заготовки" : "Ready-made presets"}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickPresets.map((preset, index) => (
            <QuickPresetCard
              key={`${selectedCategory}-${index}`}
              preset={preset}
              isRu={isRu}
              onCreate={() => handleCreateFromPreset(preset)}
            />
          ))}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredAgents.map((agent) => {
          const output = agentOutputs[agent.id];
          const isRunning = runningAgentId === agent.id;
          const category = normalizeCategory(agent, copy);

          return (
            <Card key={agent.id} className="p-4">
              <div className="space-y-3">
                <AgentIdentityBadge agent={agent} copy={copy} />

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xl font-semibold text-slate-900">
                      {agent.name}
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {agent.topic}
                    </div>
                  </div>

                  <StatusPill active={agent.active} copy={copy} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-3 text-center">
                    <div className="text-2xl font-black text-slate-900">
                      {agent.videos}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t(copy, "videosPerDay", "Видео в день", "Videos per day")}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 text-center">
                    <div className="text-2xl font-black text-slate-900">24k</div>
                    <div className="text-xs text-slate-500">
                      {t(copy, "views", "Просмотры", "Views").toLowerCase()}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 text-center">
                    <div className="text-sm font-bold text-slate-900">
                      {agent.mode}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t(copy, "agentMode", "Режим агента", "Agent mode")}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-700">
                    {agent.platform}
                  </span>
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-700">
                    {getAgentLength(agent)}s
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                    {agent.voice}
                  </span>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                    {category}
                  </span>
                </div>

                {output?.type === "agent-batch" ? (
                  <BatchOutputPreview output={output} copy={copy} />
                ) : output ? (
                  <SingleOutputPreview output={output} agent={agent} copy={copy} />
                ) : null}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
                  <button
                    onClick={() => handleOpenWorkspace(agent)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <ChevronRight size={14} />{" "}
                    {t(
                      copy,
                      "openWorkspace",
                      "Открыть workspace",
                      "Open workspace"
                    )}
                  </button>

                  <button
                    onClick={() => handleRunAgent(agent)}
                    disabled={isRunning}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                      isRunning
                        ? "cursor-not-allowed bg-slate-400"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {isRunning
                      ? t(copy, "running", "Запуск...", "Running...")
                      : t(copy, "run", "Запустить", "Run")}
                  </button>

                  <button
                    onClick={() => toggleAgent(agent.id)}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${
                      agent.active
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {agent.active
                      ? t(copy, "pauseAgent", "Пауза", "Pause agent")
                      : t(copy, "startAgent", "Старт", "Start agent")}
                  </button>

                  <button
                    onClick={() => setEditingAgentId(agent.id)}
                    className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                  >
                    {t(copy, "configure", "Настроить", "Configure")}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {agent.health === "healthy" ? (
                    <CheckCircle2 size={12} className="text-emerald-500" />
                  ) : (
                    <AlertCircle size={12} className="text-amber-500" />
                  )}

                  {agent.health === "healthy"
                    ? t(copy, "healthy", "Система в норме", "Healthy")
                    : t(
                        copy,
                        "needsAuth",
                        "Нужна авторизация",
                        "Needs authorization"
                      )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}