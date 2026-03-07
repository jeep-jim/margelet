"use client";

import React, { useMemo, useState } from "react";
import {
  Play,
  Pause,
  X,
  Wand2,
  Hash,
  FileText,
  Mic,
  Clapperboard,
  Upload,
  Lock,
  Layers3,
  FolderKanban,
  ChevronRight,
} from "lucide-react";

import Sidebar from "./layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import Marketplace from "./pages/Marketplace";
import Analytics from "./pages/Analytics";
import Billing from "./pages/Billing";
import SettingsPage from "./pages/Settings";
import {
  getCurrentAuthor,
  getPublicTotals,
  getLocalizedFeedItems,
  getPublicStoreAgents,
  getFilteredAgents,
  getSelectedWorkspaceAgent,
  getEditingAgent,
} from "@/lib/margelet/publicSelectors";

function ModalShell({ children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
      <div
        className={`w-full ${
          wide ? "max-w-6xl" : "max-w-3xl"
        } rounded-[32px] border border-white/70 bg-white shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="text-sm font-semibold text-slate-500">margelet</div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
          >
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[82vh] overflow-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(88,94,160,0.12)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function Avatar({ name, image, size = "md" }) {
  const sizeMap = {
    sm: "h-9 w-9 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-14 w-14 text-base",
  };

  return image ? (
    <img
      src={image}
      alt={name}
      className={`${sizeMap[size]} rounded-full object-cover ring-2 ring-white/80`}
    />
  ) : (
    <div
      className={`${sizeMap[size]} flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#8b5cf6,#60a5fa)] font-bold text-white ring-2 ring-white/80`}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function StatusPill({ active, copy }) {
  return active ? (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
      <Play size={12} /> {copy.inWork}
    </div>
  ) : (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
      <Pause size={12} /> {copy.paused}
    </div>
  );
}

function StepChip({ icon, label, active = false }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium ${
        active ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}

function Toggle({ checked, onChange, leftLabel, rightLabel }) {
  return (
    <div className="inline-flex rounded-2xl bg-slate-100 p-1">
      <button
        onClick={() => onChange(false)}
        className={`rounded-xl px-4 py-2 text-sm font-medium ${
          !checked ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
        }`}
      >
        {leftLabel}
      </button>
      <button
        onClick={() => onChange(true)}
        className={`rounded-xl px-4 py-2 text-sm font-medium ${
          checked ? "bg-violet-600 text-white shadow-sm" : "text-slate-500"
        }`}
      >
        {rightLabel}
      </button>
    </div>
  );
}

function AuthorMini({ author, onOpen }) {
  return (
    <button
      onClick={() => onOpen(author)}
      className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:bg-white"
    >
      <Avatar name={author.name} image={author.image} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-slate-900">
          {author.name}
        </div>
        <div className="truncate text-xs text-slate-500">{author.handle}</div>
      </div>
      <ChevronRight size={14} className="text-slate-400" />
    </button>
  );
}

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#229ED9">
    <path d="M9.04 15.54l-.39 5.46c.56 0 .8-.24 1.1-.53l2.63-2.52 5.45 3.99c1 .55 1.7.26 1.96-.92l3.56-16.67.01-.01c.31-1.46-.53-2.03-1.5-1.67L1.74 9.67c-1.43.56-1.41 1.36-.24 1.72l5.1 1.59L18.4 6.1c.55-.33 1.05-.15.64.18" />
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#FF0000">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8zM9.8 15.5v-7l6.2 3.5-6.2 3.5z" />
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#E1306C">
    <path d="M7 2C4.2 2 2 4.2 2 7v10c0 2.8 2.2 5 5 5h10c2.8 0 5-2.2 5-5V7c0-2.8-2.2-5-5-5H7zm5 5a5 5 0 110 10 5 5 0 010-10zm6.5-.9a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#000000">
    <path d="M16.5 3c.4 2.1 2 3.7 4.1 4v3.1c-1.5 0-2.9-.4-4.1-1.2v6.2a6 6 0 11-6-6c.3 0 .6 0 .9.1v3.1a3 3 0 10 2.1 2.9V3h3z" />
  </svg>
);

const COPY = {
  en: {
    dashboard: "Dashboard",
    agents: "Agents",
    marketplace: "Marketplace",
    analytics: "Analytics",
    billing: "Billing",
    settings: "Settings",
    language: "Language",
    platformLabel: "Agent content platform",
    heroTitle: "Help your channel create more content with less effort",
    heroDesc:
      "Connect your channels, create agents for different tasks and manage how they help with ideas, scripts, videos, publishing and growth.",
    liveStatus: "Live status",
    agentsCurrently: "agents currently in work",
    videos: "Videos",
    views: "Views",
    installs: "Installs",
    agent: "Agent",
    agentsCount: "Agents",
    inWork: "In work",
    paused: "Paused",
    generatedThisMonth: "generated this month",
    totalTrackedReach: "total tracked reach",
    configuredInWorkspace: "configured in workspace",
    runningRightNow: "running right now",
    agentActivity: "Agent activity",
    statusesAndRuns: "Statuses and recent runs",
    createAgent: "Create agent",
    videosPerDay: "videos/day",
    healthy: "healthy",
    needsAuth: "needs auth",
    connectedChannels: "Connected channels",
    connected: "Connected",
    pending: "Pending",
    connectNewChannel: "Connect new channel",
    launchPauseConfigure: "Launch, pause and configure automation workers",
    pauseAgent: "Pause agent",
    startAgent: "Start agent",
    configure: "Configure",
    generatedThisWeek: "generated this week",
    crossPlatformTotal: "cross-platform total",
    billingTitle: "Telegram Stars plans",
    billingDesc:
      "Pay inside Telegram and unlock more agents and video capacity",
    starsBilling: "Stars billing",
    perMonth: "per month",
    starter: "Starter",
    creator: "Creator",
    agency: "Agency",
    chooseStarter: "Choose Starter",
    chooseCreator: "Choose Creator",
    chooseAgency: "Choose Agency",
    popular: "Popular",
    workspaceSettings: "Workspace settings",
    automationSafety: "Automation safety",
    telegramStarsBilling: "Telegram Stars billing",
    apiKeys: "API keys",
    connectedNetworks: "Connected networks",
    enabled: "Enabled",
    missing: "missing",
    channelsCount: "channels",
    postingLimits: "✅ Posting limits active",
    reviewRequired: "⚠ Review required for Instagram",
    fallbackEnabled: "🧠 AI fallback model enabled",
    manageTeam: "Manage team access",
    unlimitedVideos: "🎬 unlimited videos",
    unlimitedChannels: "📤 unlimited channels",
    learnMore: "Learn more",
    hideDetails: "Hide details",
    connectModalTitle: "Connect a new channel",
    connectModalDesc:
      "Choose where Margelet should publish and collect analytics.",
    agentWizardTitle: "Create agent",
    readyTemplates: "Ready templates",
    customAgent: "Custom agent",
    pickTemplate:
      "Pick a template or build your own agent from scratch.",
    topic: "Topic",
    automationMode: "Automation mode",
    manualMode: "Manual review",
    autoMode: "Auto publish (Pro)",
    length: "Length",
    voice: "Voice",
    style: "Style",
    frequency: "Frequency",
    back: "Back",
    installTemplate: "Install template",
    saveAgent: "Save agent",
    agentSettings: "Agent settings",
    pipeline: "Pipeline",
    queue: "Publishing queue",
    generatedAssets: "Generated assets",
    agentMode: "Agent mode",
    platforms: "Platforms",
    videosPerDayLabel: "Videos per day",
    generatedVideo: "Generated video",
    script: "Script",
    captions: "Captions",
    hashtags: "Hashtags",
    voiceover: "Voiceover",
    postingWindow: "Posting window",
    queueReady: "Ready for queue",
    connect: "Connect",
    proOnly: "Pro only",
    detailsOpenHint:
      "Understand the product first, then create your first working agent.",
    autopostLabel: "Autoposting",
    templatesHint:
      "Start fast with ready-made agents or build a custom one.",
    historyTitle: "History",
    openWorkspace: "Open workspace",
    all: "All",
    active: "Active",
    manual: "Manual",
    auto: "Auto",
    madeWith: "made with margelet",
    authorAgents: "Agents",
    authorCatalog: "Author agents",
    authorCatalogHint: "Public catalog from this creator",
    openAgent: "Open agent",
    telegramIdentityHint:
      "Telegram login will be the creator identity, Stars wallet and future payout profile.",
    details1Title: "What is Margelet",
    details1Text:
      "Control panel for content agents, channels and publishing workflows.",
    details2Title: "What agents actually do",
    details2Text:
      "They create scripts, voiceovers, captions, scenes and publishing-ready outputs.",
    details3Title: "How it works",
    details3Text:
      "Connect channels, create agents, queue content and track performance from one workspace.",
    details4Title: "Autoposting on Pro",
    details4Text:
      "Autoposting works only where platform access and rules allow it.",
    creatorHub: "Creator Hub",
    creatorHubDesc: "Public growth page for every creator",
    totalAgentInstalls: "Total agent installs",
    viewsGenerated: "Views generated",
    allAgents: "all agents",
    growing: "growing",
    feedTitle: "Agent Feed",
    feedDesc:
      "Public discovery page where viral agent outputs sell the product themselves",
    discoveryLoop: "discovery loop",
    whyMatters: "Why this page matters",
    whyMattersText:
      "People do not just browse agents. They discover proof that agents create winning content.",
    growthMechanic: "Growth mechanic",
    growthMechanicText:
      "Every good video becomes a store ad for the agent and a profile ad for the creator.",
    outcome: "Outcome",
    outcomeText:
      "Margelet becomes both the factory and the discovery layer for content agents.",
    variantLearning: "Variant learning",
    variantLearningDesc: "What the system should keep reusing",
  },
  ru: {
    dashboard: "Панель",
    agents: "Агенты",
    marketplace: "Маркетплейс",
    analytics: "Аналитика",
    billing: "Тарифы",
    settings: "Настройки",
    language: "Язык",
    platformLabel: "Платформа контент-агентов",
    heroTitle:
      "Помогай каналу выпускать больше контента с меньшими усилиями",
    heroDesc:
      "Подключай каналы, создавай агентов под разные задачи и управляй тем, как они помогают с идеями, сценариями, видео, публикацией и ростом канала.",
    liveStatus: "Живой статус",
    agentsCurrently: "агентов сейчас в работе",
    videos: "Видео",
    views: "Просмотры",
    installs: "Установки",
    agent: "Агент",
    agentsCount: "Агенты",
    inWork: "В работе",
    paused: "Пауза",
    generatedThisMonth: "сгенерировано за месяц",
    totalTrackedReach: "общий охват",
    configuredInWorkspace: "настроено в проекте",
    runningRightNow: "запущено сейчас",
    agentActivity: "Активность агентов",
    statusesAndRuns: "Статусы и последние запуски",
    createAgent: "Создать агента",
    videosPerDay: "видео/день",
    healthy: "здоров",
    needsAuth: "нужна авторизация",
    connectedChannels: "Подключённые каналы",
    connected: "Подключено",
    pending: "Ожидает",
    connectNewChannel: "Подключить новый канал",
    launchPauseConfigure:
      "Запускай, ставь на паузу и настраивай автоматизацию",
    pauseAgent: "Пауза",
    startAgent: "Запустить",
    configure: "Настроить",
    generatedThisWeek: "сгенерировано за неделю",
    crossPlatformTotal: "суммарно по платформам",
    billingTitle: "Тарифы Telegram Stars",
    billingDesc:
      "Плати внутри Telegram и открывай больше агентов и объёма видео",
    starsBilling: "Оплата Stars",
    perMonth: "в месяц",
    starter: "Старт",
    creator: "Креатор",
    agency: "Агентство",
    chooseStarter: "Выбрать Старт",
    chooseCreator: "Выбрать Креатор",
    chooseAgency: "Выбрать Агентство",
    popular: "Популярный",
    workspaceSettings: "Настройки проекта",
    automationSafety: "Безопасность автоматизации",
    telegramStarsBilling: "Оплата Telegram Stars",
    apiKeys: "API ключи",
    connectedNetworks: "Подключённые сети",
    enabled: "Включено",
    missing: "не хватает",
    channelsCount: "канала",
    postingLimits: "✅ Лимиты публикации активны",
    reviewRequired: "⚠ Для Instagram нужна проверка",
    fallbackEnabled: "🧠 Включена запасная AI-модель",
    manageTeam: "Управление доступом команды",
    unlimitedVideos: "🎬 безлимитные видео",
    unlimitedChannels: "📤 безлимитные каналы",
    learnMore: "Подробнее",
    hideDetails: "Скрыть",
    connectModalTitle: "Подключить новый канал",
    connectModalDesc:
      "Выбери площадки, куда Margelet будет публиковать и откуда собирать аналитику.",
    agentWizardTitle: "Создать агента",
    readyTemplates: "Готовые агенты",
    customAgent: "Свой агент",
    pickTemplate:
      "Начни с готового шаблона или собери агента с нуля.",
    topic: "Тема",
    automationMode: "Режим автоматизации",
    manualMode: "Ручное одобрение",
    autoMode: "Автопостинг (Pro)",
    length: "Длина",
    voice: "Голос",
    style: "Стиль",
    frequency: "Частота",
    back: "Назад",
    installTemplate: "Установить шаблон",
    saveAgent: "Сохранить агента",
    agentSettings: "Настройки агента",
    pipeline: "Пайплайн",
    queue: "Очередь публикаций",
    generatedAssets: "Генерируемые материалы",
    agentMode: "Режим агента",
    platforms: "Платформы",
    videosPerDayLabel: "Видео в день",
    generatedVideo: "Генерируемое видео",
    script: "Сценарий",
    captions: "Субтитры",
    hashtags: "Хештеги",
    voiceover: "Озвучка",
    postingWindow: "Окно публикации",
    queueReady: "Готово к очереди",
    connect: "Подключить",
    proOnly: "Только Pro",
    detailsOpenHint:
      "Сначала пойми продукт, потом собери первого рабочего агента.",
    autopostLabel: "Автопостинг",
    templatesHint:
      "Начни быстро с готовых агентов или собери своего.",
    historyTitle: "История",
    openWorkspace: "Открыть рабочую зону",
    all: "Все",
    active: "Активные",
    manual: "Ручные",
    auto: "Авто",
    madeWith: "сделано в margelet",
    authorAgents: "Агенты",
    authorCatalog: "Агенты автора",
    authorCatalogHint: "Публичный каталог этого автора",
    openAgent: "Открыть агента",
    telegramIdentityHint:
      "Telegram-логин будет личностью автора, Stars-кошельком и будущим профилем выплат.",
    details1Title: "Что такое Margelet",
    details1Text:
      "Панель управления для контент-агентов, каналов и процессов публикации.",
    details2Title: "Чем занимаются агенты",
    details2Text:
      "Они создают сценарии, озвучку, субтитры, сцены и готовый к публикации контент.",
    details3Title: "Как это работает",
    details3Text:
      "Подключай каналы, создавай агентов, ставь контент в очередь и отслеживай результат в одном рабочем пространстве.",
    details4Title: "Автопостинг на Pro",
    details4Text:
      "Автопостинг работает только там, где платформа даёт доступ и разрешает такой сценарий.",
    creatorHub: "Хаб автора",
    creatorHubDesc: "Публичная страница роста для каждого автора",
    totalAgentInstalls: "Всего установок агентов",
    viewsGenerated: "Просмотров принесено",
    allAgents: "все агенты",
    growing: "растёт",
    feedTitle: "Лента агентов",
    feedDesc:
      "Публичная страница, где вирусные результаты агентов сами продают продукт",
    discoveryLoop: "петля роста",
    whyMatters: "Почему это важно",
    whyMattersText:
      "Люди не просто листают агентов. Они видят доказательство, что агенты реально приносят результат.",
    growthMechanic: "Механика роста",
    growthMechanicText:
      "Каждое удачное видео становится рекламой агента и профиля автора.",
    outcome: "Результат",
    outcomeText:
      "Margelet становится и фабрикой, и слоем discovery для контент-агентов.",
    variantLearning: "Обучение вариаций",
    variantLearningDesc: "Что система должна переиспользовать дальше",
  },
};

function ConnectChannelModal({ copy, onClose }) {
  const rows = [
    { name: "Telegram", icon: <TelegramIcon />, note: "Bot / channel admin" },
    { name: "YouTube Shorts", icon: <YouTubeIcon />, note: "Upload API" },
    {
      name: "Instagram Reels",
      icon: <InstagramIcon />,
      note: "Business / Graph API",
    },
    {
      name: "TikTok",
      icon: <TikTokIcon />,
      note: "Creator upload access",
    },
  ];

  return (
    <ModalShell onClose={onClose}>
      <div>
        <div className="text-2xl font-black text-slate-900">
          {copy.connectModalTitle}
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {copy.connectModalDesc}
        </p>
      </div>

      <div className="mt-6 grid gap-3">
        {rows.map((row) => (
          <div
            key={row.name}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
          >
            <div className="flex items-center gap-3">
              {row.icon}
              <div>
                <div className="font-semibold text-slate-900">{row.name}</div>
                <div className="text-sm text-slate-500">{row.note}</div>
              </div>
            </div>

            <button className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white">
              {copy.connect}
            </button>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}

function AgentWizardModal({ copy, onClose, onSave }) {
  const [mode, setMode] = useState("templates");
  const [selectedTemplate, setSelectedTemplate] = useState(
    getPublicStoreAgents("en")[0]
  );
  const [name, setName] = useState("Custom Agent");
  const [topic, setTopic] = useState("business");
  const [videosPerDay, setVideosPerDay] = useState(3);
  const [length, setLength] = useState(30);
  const [autopost, setAutopost] = useState(false);
  const [channels, setChannels] = useState({
    telegram: true,
    youtube: true,
    instagram: false,
    tiktok: false,
  });
  const [voice, setVoice] = useState("AI voice");
  const [style, setStyle] = useState("Hook + script + captions");
  const selectedCount = Object.values(channels).filter(Boolean).length;
  const templateLibrary = useMemo(() => getPublicStoreAgents("en"), []);

  const createFromTemplate = () => {
    onSave({
      name:
        selectedTemplate.key === "motivation"
          ? "Motivation Agent"
          : selectedTemplate.key === "news"
          ? "News Agent"
          : selectedTemplate.key === "business"
          ? "Business Agent"
          : "Facts Agent",
      topic: selectedTemplate.topic,
      videos: selectedTemplate.videos,
      active: false,
      status: "Paused",
      platform:
        [
          channels.telegram && "Telegram",
          channels.youtube && "Shorts",
          channels.instagram && "Reels",
          channels.tiktok && "TikTok",
        ]
          .filter(Boolean)
          .join(" + ") || "Telegram",
      lastRun: "never",
      health: "warning",
      autopost: selectedTemplate.autopost,
      mode: selectedTemplate.autopost ? "Auto" : "Manual",
      length: selectedTemplate.length,
      voice: selectedTemplate.key === "business" ? "AI voice" : "Mixed",
      style: selectedTemplate.style,
    });
    onClose();
  };

  const createCustom = () => {
    onSave({
      name,
      topic,
      videos: videosPerDay,
      active: false,
      status: "Paused",
      platform:
        [
          channels.telegram && "Telegram",
          channels.youtube && "Shorts",
          channels.instagram && "Reels",
          channels.tiktok && "TikTok",
        ]
          .filter(Boolean)
          .join(" + ") || "Telegram",
      lastRun: "never",
      health: "warning",
      autopost,
      mode: autopost ? "Auto" : "Manual",
      length,
      voice,
      style,
    });
    onClose();
  };

  return (
    <ModalShell onClose={onClose} wide>
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-2xl font-black text-slate-900">
            {copy.agentWizardTitle}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {copy.pickTemplate}
          </p>
        </div>

        <div className="rounded-2xl bg-slate-100 p-1">
          <button
            onClick={() => setMode("templates")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              mode === "templates"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            {copy.readyTemplates}
          </button>
          <button
            onClick={() => setMode("custom")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              mode === "custom"
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-500"
            }`}
          >
            {copy.customAgent}
          </button>
        </div>
      </div>

      {mode === "templates" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="mb-3 text-sm font-semibold text-slate-500">
              {copy.readyTemplates}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {templateLibrary.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`rounded-3xl border p-4 text-left transition ${
                    selectedTemplate.id === tpl.id
                      ? "border-violet-300 bg-violet-50 shadow-sm"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="text-2xl">{tpl.icon}</div>
                  <div className="mt-2 font-semibold text-slate-900">
                    {tpl.key === "motivation"
                      ? "Motivation Agent"
                      : tpl.key === "news"
                      ? "News Agent"
                      : tpl.key === "business"
                      ? "Business Agent"
                      : "Facts Agent"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {tpl.videos} {copy.videosPerDay}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {tpl.topic}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {tpl.length}s
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Card className="bg-slate-50/80">
            <div className="text-lg font-semibold text-slate-900">
              {copy.templatesHint}
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-sm text-slate-500">{copy.topic}</div>
                <div className="font-semibold text-slate-900">
                  {selectedTemplate.topic}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">{copy.frequency}</div>
                <div className="font-semibold text-slate-900">
                  {selectedTemplate.videos} {copy.videosPerDay}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">{copy.length}</div>
                <div className="font-semibold text-slate-900">
                  {selectedTemplate.length}s
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">{copy.style}</div>
                <div className="font-semibold text-slate-900">
                  {selectedTemplate.style}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-500">
                  {copy.autopostLabel}
                </div>
                <div className="font-semibold text-slate-900">
                  {selectedTemplate.autopost
                    ? copy.autoMode
                    : copy.manualMode}
                </div>
              </div>

              <button
                onClick={createFromTemplate}
                className="mt-2 w-full rounded-2xl bg-violet-600 py-3 text-sm font-semibold text-white"
              >
                {copy.installTemplate}
              </button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div>
              <div className="mb-2 text-sm font-semibold text-slate-500">
                {copy.customAgent}
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-500">
                  {copy.topic}
                </div>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                />
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-500">
                  {copy.videosPerDayLabel}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 5, 10].map((v) => (
                    <button
                      key={v}
                      onClick={() => setVideosPerDay(v)}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                        videosPerDay === v
                          ? "bg-violet-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-500">
                  {copy.length}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 60].map((v) => (
                    <button
                      key={v}
                      onClick={() => setLength(v)}
                      className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                        length === v
                          ? "bg-sky-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {v}s
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-500">
                  {copy.voice}
                </div>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                >
                  <option>AI voice</option>
                  <option>Cloned voice</option>
                  <option>Text only</option>
                </select>
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-500">
                {copy.style}
              </div>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
              >
                <option>Hook + script + captions</option>
                <option>News recap</option>
                <option>Voice + stock footage</option>
                <option>Talking head assistant</option>
              </select>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-500">
                {copy.platforms}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["telegram", "Telegram"],
                  ["youtube", "YouTube Shorts"],
                  ["instagram", "Instagram Reels"],
                  ["tiktok", "TikTok"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() =>
                      setChannels((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium ${
                      channels[key]
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Card className="bg-slate-50/80">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Layers3 size={18} /> {copy.pipeline}
            </div>

            <div className="space-y-3 text-sm">
              <StepChip icon={<Wand2 size={14} />} label={copy.script} active />
              <StepChip
                icon={<Hash size={14} />}
                label={copy.hashtags}
                active
              />
              <StepChip
                icon={<Mic size={14} />}
                label={copy.voiceover}
                active
              />
              <StepChip
                icon={<FileText size={14} />}
                label={copy.captions}
                active
              />
              <StepChip
                icon={<Clapperboard size={14} />}
                label="Variant scoring"
                active
              />
              <StepChip
                icon={<Upload size={14} />}
                label={copy.queueReady}
                active={selectedCount > 0}
              />
            </div>

            <div className="mt-5 border-t border-slate-200 pt-5">
              <div className="mb-2 text-sm font-semibold text-slate-500">
                {copy.automationMode}
              </div>
              <Toggle
                checked={autopost}
                onChange={setAutopost}
                leftLabel={copy.manualMode}
                rightLabel={copy.autoMode}
              />
              {autopost && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  <Lock size={12} /> {copy.proOnly}
                </div>
              )}
            </div>

            <button
              onClick={createCustom}
              className="mt-6 w-full rounded-2xl bg-violet-600 py-3 text-sm font-semibold text-white"
            >
              {copy.saveAgent}
            </button>
          </Card>
        </div>
      )}
    </ModalShell>
  );
}

function AgentSettingsModal({ copy, agent, onClose, onSave }) {
  const [form, setForm] = useState({
    videos: agent.videos,
    autopost: agent.autopost || false,
    length: agent.length || 30,
    voice: agent.voice || "AI voice",
    style: agent.style || "Hook + script",
  });

  return (
    <ModalShell onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-2xl font-black text-slate-900">
            {copy.agentSettings}
          </div>
          <div className="mt-1 text-sm text-slate-500">{agent.name}</div>
        </div>
        <StatusPill active={agent.active} copy={copy} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          <Card className="bg-slate-50/80">
            <div className="mb-4 text-sm font-semibold text-slate-500">
              {copy.agentMode}
            </div>
            <Toggle
              checked={form.autopost}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, autopost: value }))
              }
              leftLabel={copy.manualMode}
              rightLabel={copy.autoMode}
            />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[1, 3, 5, 10].map((v) => (
                <button
                  key={v}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, videos: v }))
                  }
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                    form.videos === v
                      ? "bg-violet-600 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </Card>

          <Card className="bg-slate-50/80">
            <div className="mb-4 text-sm font-semibold text-slate-500">
              {copy.generatedAssets}
            </div>
            <div className="grid gap-2">
              <StepChip icon={<Wand2 size={14} />} label={copy.script} active />
              <StepChip
                icon={<Hash size={14} />}
                label={copy.hashtags}
                active
              />
              <StepChip
                icon={<Mic size={14} />}
                label={copy.voiceover}
                active
              />
              <StepChip
                icon={<FileText size={14} />}
                label={copy.captions}
                active
              />
              <StepChip
                icon={<Clapperboard size={14} />}
                label={copy.generatedVideo}
                active
              />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="bg-slate-50/80">
            <div className="mb-3 text-sm font-semibold text-slate-500">
              {copy.length}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map((v) => (
                <button
                  key={v}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, length: v }))
                  }
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                    form.length === v
                      ? "bg-sky-600 text-white"
                      : "border border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {v}s
                </button>
              ))}
            </div>

            <div className="mt-5 text-sm font-semibold text-slate-500">
              {copy.voice}
            </div>
            <select
              value={form.voice}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, voice: e.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
            >
              <option>AI voice</option>
              <option>Cloned voice</option>
              <option>Text only</option>
            </select>

            <div className="mt-5 text-sm font-semibold text-slate-500">
              {copy.style}
            </div>
            <select
              value={form.style}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, style: e.target.value }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
            >
              <option>Hook + script + captions</option>
              <option>News recap</option>
              <option>Voice + stock footage</option>
              <option>Talking head assistant</option>
            </select>
          </Card>

          <Card className="bg-slate-50/80">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
              <FolderKanban size={14} /> {copy.queue}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              {copy.postingWindow}: 09:00 · 13:00 · 18:00
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          {copy.back}
        </button>
        <button
          onClick={() => {
            onSave({
              ...agent,
              ...form,
              mode: form.autopost ? "Auto" : "Manual",
            });
            onClose();
          }}
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {copy.configure}
        </button>
      </div>
    </ModalShell>
  );
}

function StoreAgentModal({ agent, onClose, onInstall, onOpenAuthor, copy }) {
  if (!agent) return null;

  return (
    <ModalShell onClose={onClose} wide>
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-4xl">{agent.icon}</div>
              <div className="mt-3 text-2xl font-black text-slate-900">
                {agent.title}
              </div>
              <div className="mt-2 text-sm text-slate-500">
                {agent.installs} {copy.installs.toLowerCase()} • ★ {agent.rating} •{" "}
                {agent.type}
              </div>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {agent.price}
            </div>
          </div>

          <AuthorMini author={agent.author} onOpen={onOpenAuthor} />

          <div className="mt-5 rounded-3xl bg-slate-50 p-5">
            <div className="text-sm font-semibold text-slate-500">
              Description
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {agent.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {agent.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Card className="bg-slate-50/80 p-4">
              <div className="text-xs text-slate-500">Monthly installs</div>
              <div className="mt-2 text-xl font-bold text-slate-900">
                {agent.installs}
              </div>
            </Card>
            <Card className="bg-slate-50/80 p-4">
              <div className="text-xs text-slate-500">Avg CTR</div>
              <div className="mt-2 text-xl font-bold text-slate-900">
                {agent.ctr}
              </div>
            </Card>
            <Card className="bg-slate-50/80 p-4">
              <div className="text-xs text-slate-500">Creator revenue</div>
              <div className="mt-2 text-xl font-bold text-slate-900">
                {agent.revenue}
              </div>
            </Card>
          </div>

          <Card className="mt-4 bg-slate-50/80">
            <div className="text-lg font-semibold text-slate-900">
              Revenue split
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-white p-4">
                <div className="text-xs text-slate-500">Creator</div>
                <div className="mt-2 text-xl font-black text-slate-900">
                  70%
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-xs text-slate-500">Platform</div>
                <div className="mt-2 text-xl font-black text-slate-900">
                  30%
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4">
                <div className="text-xs text-slate-500">Payout</div>
                <div className="mt-2 text-xl font-black text-slate-900">
                  Stars
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <div className="text-lg font-semibold text-slate-900">Preview</div>
            <div className="mt-4 rounded-3xl bg-[linear-gradient(135deg,#ede9fe,#dbeafe)] p-5">
              <div className="aspect-[9/16] rounded-3xl border border-white/70 bg-white/70 p-4 shadow-inner">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <div className="inline-flex rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                      {agent.previewLabel}
                    </div>
                    <div className="mt-4 text-lg font-black text-slate-900">
                      {agent.previewTitle}
                    </div>
                    <div className="mt-2 text-sm text-slate-600">
                      {agent.previewText}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-900/90 p-3 text-xs text-white">
                    voice + captions + video composition
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="text-lg font-semibold text-slate-900">Reviews</div>
            <div className="mt-4 space-y-3">
              {agent.reviews.map((review) => (
                <div
                  key={review.name}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-900">
                      {review.name}
                    </div>
                    <div className="text-xs font-semibold text-amber-600">
                      ★ {review.rating}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {review.text}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onInstall}
              className={`mt-4 w-full rounded-2xl py-3 text-sm font-semibold text-white ${
                agent.type === "Paid" ? "bg-slate-500" : "bg-indigo-600"
              }`}
            >
              {agent.type === "Paid" ? "Buy & Install" : "Install"}
            </button>
          </Card>
        </div>
      </div>
    </ModalShell>
  );
}

function PublishAgentModal({ agent, onClose, onPublish, author }) {
  const [title, setTitle] = useState(agent?.name || "");
  const [description, setDescription] = useState(
    "Built for short-form content with strong hooks, captions and queue-ready publishing."
  );
  const [category, setCategory] = useState("Growth");
  const [price, setPrice] = useState("120");
  const [tags, setTags] = useState("growth, hooks, shorts");

  return (
    <ModalShell onClose={onClose} wide>
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <div className="text-2xl font-black text-slate-900">
            Publish agent
          </div>
          <div className="mt-2 text-sm text-slate-500">
            Create a public store page and start earning Stars from installs.
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <Avatar name={author.name} image={author.image} size="sm" />
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {author.name}
              </div>
              <div className="text-xs text-slate-500">
                Telegram creator identity
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="mb-2 text-sm font-semibold text-slate-500">
                Agent name
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
              />
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-500">
                Description
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <div className="mb-2 text-sm font-semibold text-slate-500">
                  Category
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                >
                  <option>Growth</option>
                  <option>News</option>
                  <option>Motivation</option>
                  <option>Finance</option>
                  <option>AI content</option>
                </select>
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-500">
                  Price (Stars)
                </div>
                <input
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 text-sm font-semibold text-slate-500">
                Tags
              </div>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
              />
            </div>
          </div>
        </div>

        <Card className="bg-slate-50/80">
          <div className="text-lg font-semibold text-slate-900">
            Store preview
          </div>

          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-2xl">🤖</div>
                <div className="mt-3 text-xl font-black text-slate-900">
                  {title || agent?.name || "Untitled agent"}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  ★ 4.8 • new listing • Paid
                </div>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                ⭐ {price || "0"}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <Avatar name={author.name} image={author.image} size="sm" />
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  {author.name}
                </div>
                <div className="text-xs text-slate-500">{author.handle}</div>
              </div>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">
              {description}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
                .map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Creator</div>
                <div className="mt-2 font-black text-slate-900">70%</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Platform</div>
                <div className="mt-2 font-black text-slate-900">30%</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Category</div>
                <div className="mt-2 font-black text-slate-900">
                  {category}
                </div>
              </div>
            </div>

            <button
              onClick={onPublish}
              className="mt-5 w-full rounded-2xl bg-violet-600 py-3 text-sm font-semibold text-white"
            >
              Publish listing
            </button>
          </div>
        </Card>
      </div>
    </ModalShell>
  );
}

function AuthorProfileModal({ author, agents, onClose, onOpenStoreAgent, copy }) {
  if (!author) return null;

  const authored = agents.filter((a) => a.author.id === author.id);

  return (
    <ModalShell onClose={onClose} wide>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-slate-50/80">
          <div className="flex items-center gap-4">
            <Avatar name={author.name} image={author.image} size="lg" />
            <div>
              <div className="text-2xl font-black text-slate-900">
                {author.name}
              </div>
              <div className="text-sm text-slate-500">{author.handle}</div>
            </div>
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-600">{author.bio}</p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white p-4 text-center">
              <div className="text-xs text-slate-500">{copy.authorAgents}</div>
              <div className="mt-2 text-xl font-black text-slate-900">
                {authored.length}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 text-center">
              <div className="text-xs text-slate-500">{copy.installs}</div>
              <div className="mt-2 text-xl font-black text-slate-900">
                {author.installs}
              </div>
            </div>
            <div className="rounded-2xl bg-white p-4 text-center">
              <div className="text-xs text-slate-500">Stars</div>
              <div className="mt-2 text-xl font-black text-slate-900">
                {author.revenue}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-slate-600">
            {copy.telegramIdentityHint}
          </div>
        </Card>

        <div className="space-y-4">
          <div>
            <div className="text-xl font-semibold text-slate-900">
              {copy.authorCatalog}
            </div>
            <div className="text-sm text-slate-500">
              {copy.authorCatalogHint}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {authored.map((agent) => (
              <Card key={agent.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="text-3xl">{agent.icon}</div>
                  <div className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                    {agent.type}
                  </div>
                </div>
                <div className="mt-3 text-lg font-semibold text-slate-900">
                  {agent.title}
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {agent.installs} {copy.installs.toLowerCase()} • ★{" "}
                  {agent.rating}
                </div>
                <button
                  onClick={() => onOpenStoreAgent(agent)}
                  className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  {copy.openAgent}
                </button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

export default function MargeletApp() {
  const [tab, setTab] = useState("dashboard");
  const [lang, setLang] = useState("en");
  const [showDetails, setShowDetails] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
  const [selectedStoreAgent, setSelectedStoreAgent] = useState(null);
  const [publishingAgent, setPublishingAgent] = useState(null);
  const [creatorStars, setCreatorStars] = useState(8420);
  const [publishedListings, setPublishedListings] = useState(3);
  const [selectedAuthor, setSelectedAuthor] = useState(null);
  const [agentSearch, setAgentSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");

  const copy = COPY[lang];

  const currentAuthor = getCurrentAuthor();

  const feedItems = useMemo(() => getLocalizedFeedItems(lang), [lang]);

  const [agents, setAgents] = useState([
    {
      id: 1,
      name: "Motivation Agent",
      topic: "мотивация",
      videos: 5,
      active: true,
      status: "In work",
      platform: "TikTok + Shorts",
      lastRun: "2 min ago",
      health: "healthy",
      autopost: false,
      mode: "Manual",
      length: 30,
      voice: "AI voice",
      style: "Hook + script + captions",
    },
    {
      id: 2,
      name: "Business Agent",
      topic: "бизнес",
      videos: 3,
      active: false,
      status: "Paused",
      platform: "Telegram",
      lastRun: "1 hour ago",
      health: "warning",
      autopost: false,
      mode: "Manual",
      length: 60,
      voice: "Cloned voice",
      style: "Talking head assistant",
    },
    {
      id: 3,
      name: "News Agent",
      topic: "новости",
      videos: 12,
      active: true,
      status: "In work",
      platform: "Reels + Telegram",
      lastRun: "just now",
      health: "healthy",
      autopost: true,
      mode: "Auto",
      length: 45,
      voice: "AI voice",
      style: "News recap",
    },
  ]);

  const storeAgents = useMemo(() => getPublicStoreAgents(lang), [lang]);

  const totals = useMemo(() => getPublicTotals(agents), [agents]);

  const editingAgent = useMemo(
    () => getEditingAgent(agents, editingAgentId),
    [agents, editingAgentId]
  );

  const selectedWorkspaceAgent = useMemo(
    () => getSelectedWorkspaceAgent(agents, selectedWorkspaceId),
    [agents, selectedWorkspaceId]
  );

  const filteredAgents = useMemo(
    () =>
      getFilteredAgents({
        agents,
        agentSearch,
        agentFilter,
      }),
    [agents, agentSearch, agentFilter]
  );

  const addAgent = (payload) =>
    setAgents((prev) => [...prev, { id: Date.now(), ...payload }]);

  const toggleAgent = (id) =>
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === id
          ? {
              ...agent,
              active: !agent.active,
              status: agent.active ? "Paused" : "In work",
            }
          : agent
      )
    );

  const updateAgent = (updatedAgent) =>
    setAgents((prev) =>
      prev.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent))
    );

  const simulateInstall = (price = 0) => {
    const creatorShare = Math.floor(price * 0.7);
    if (creatorShare > 0) setCreatorStars((s) => s + creatorShare);
  };

  const publishAgentToStore = () => {
    setPublishedListings((n) => n + 1);
    setPublishingAgent(null);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#d9d6ff_0%,#dde8ff_50%,#d8f0ff_100%)] text-slate-900">
      <div className="mx-auto grid max-w-7xl grid-cols-[240px_1fr] gap-4 p-4">
        <Card className="sticky top-4 h-fit">
          <div className="mb-4">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <img
                src="/icon.png"
                alt="margelet"
                className="h-7 w-7 rounded-md"
              />
              <span className="text-2xl font-black tracking-tight text-slate-900">
                margelet
              </span>
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {copy.platformLabel}
            </div>
          </div>

          <Sidebar
            tab={tab}
            setTab={setTab}
            lang={lang}
            setLang={setLang}
            copy={copy}
            currentAuthor={currentAuthor}
            onOpenAuthor={() => setSelectedAuthor(currentAuthor)}
          />
        </Card>

        <div className="space-y-4">
          {tab === "dashboard" && (
            <Dashboard
              copy={copy}
              showDetails={showDetails}
              setShowDetails={setShowDetails}
              setShowConnectModal={setShowConnectModal}
              setShowWizard={setShowWizard}
              totals={totals}
              agents={agents}
              selectedWorkspaceAgent={selectedWorkspaceAgent}
              setSelectedWorkspaceId={setSelectedWorkspaceId}
              setEditingAgentId={setEditingAgentId}
              setPublishingAgent={setPublishingAgent}
              currentAuthor={currentAuthor}
              feedItems={feedItems}
              setSelectedAuthor={setSelectedAuthor}
              lang={lang}
            />
          )}

          {tab === "agents" && (
            <Agents
              copy={copy}
              agentSearch={agentSearch}
              setAgentSearch={setAgentSearch}
              agentFilter={agentFilter}
              setAgentFilter={setAgentFilter}
              filteredAgents={filteredAgents}
              setShowWizard={setShowWizard}
              setSelectedWorkspaceId={setSelectedWorkspaceId}
              toggleAgent={toggleAgent}
              setEditingAgentId={setEditingAgentId}
            />
          )}

          {tab === "marketplace" && (
            <Marketplace
              copy={copy}
              lang={lang}
              storeAgents={storeAgents}
              setSelectedAuthor={setSelectedAuthor}
              setSelectedStoreAgent={setSelectedStoreAgent}
              creatorStars={creatorStars}
              publishedListings={publishedListings}
              agents={agents}
              setPublishingAgent={setPublishingAgent}
            />
          )}

          {tab === "analytics" && <Analytics copy={copy} agents={agents} />}

          {tab === "billing" && <Billing copy={copy} />}

          {tab === "settings" && <SettingsPage copy={copy} />}
        </div>
      </div>

      {showConnectModal && (
        <ConnectChannelModal
          copy={copy}
          onClose={() => setShowConnectModal(false)}
        />
      )}

      {showWizard && (
        <AgentWizardModal
          copy={copy}
          onClose={() => setShowWizard(false)}
          onSave={addAgent}
        />
      )}

      {selectedStoreAgent && (
        <StoreAgentModal
          agent={selectedStoreAgent}
          onClose={() => setSelectedStoreAgent(null)}
          onInstall={() => {
            const price =
              selectedStoreAgent.type === "Paid"
                ? Number(
                    (selectedStoreAgent.price || "").replace(/[^0-9]/g, "")
                  )
                : 0;
            simulateInstall(price);
            setSelectedStoreAgent(null);
          }}
          onOpenAuthor={(author) => {
            setSelectedStoreAgent(null);
            setSelectedAuthor(author);
          }}
          copy={copy}
        />
      )}

      {publishingAgent && (
        <PublishAgentModal
          agent={publishingAgent}
          author={currentAuthor}
          onClose={() => setPublishingAgent(null)}
          onPublish={publishAgentToStore}
        />
      )}

      {editingAgent && (
        <AgentSettingsModal
          copy={copy}
          agent={editingAgent}
          onClose={() => setEditingAgentId(null)}
          onSave={updateAgent}
        />
      )}

      {selectedAuthor && (
        <AuthorProfileModal
          author={selectedAuthor}
          agents={storeAgents}
          onClose={() => setSelectedAuthor(null)}
          onOpenStoreAgent={(agent) => {
            setSelectedAuthor(null);
            setSelectedStoreAgent(agent);
          }}
          copy={copy}
        />
      )}

      <div className="fixed bottom-4 right-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg">
        Creator balance ⭐ {creatorStars}
      </div>
    </div>
  );
}