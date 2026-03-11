"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  Play,
  Pause,
  Info,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { runBrowserPreviewRenderer } from "@/lib/margelet/browserPreviewRenderer";
import { exportVideo } from "@/lib/margelet/browserVideoExporter";

const STORAGE_KEY = "margelet_agent_workspace_v3";
const TG_USER_KEY = "margelet_tg_user_v1";
const MAX_ASSETS = 12;
const ASSET_SLOTS = 9;

const COPY = {
  ru: {
    step1Title: "1. Выбери формат агента",
    step1Tail: "или оставь пустым",
    step1Hint: "Формат влияет на стиль сценария, подачу и монтаж видео.",
    step2Title: "2. Материалы",
    step2Tail:
      "сюда можно бросить файлы, фото, видео, аудио, ссылки и пояснения.",
    step3Title: "3. Тема видео",
    step3Tail: "пиши так, как будто ставишь задачу реальному продюсеру.",
    dropTitle: "Перетащи файлы или нажми загрузить",
    dropHint: "jpeg, png, webp, mp4, avi, mp3, PDF, DOC, TXT.",
    upload: "Загрузить",
    linkPlaceholder: "https://Ссылка на любой источник",
    duration: "Длительность",
    tone: "Тон",
    voice: "Голос",
    trend: "Найти тренд",
    trendLoading: "Ищем тренд...",
    trendError: "Не удалось подобрать тренд. Попробуй ещё раз.",
    doForMe: "Заполни всё за меня",
    preview: "Предпросмотр",
    previewAction: "Предпросмотр",
    generateAction: "Сгенерировать!",
    regenerateAction: "Перегенерировать",
    createdThree: "Создано три варианта",
    download: "Скачать видео",
    downloading: "Собираем видео...",
    generating: "Генерируем 3 варианта...",
    examplePrefix: "Например:",
    variant: "Формат",
    readyToPost: "Готово для выгрузки в соцсети:",
    fileWeight: "Вес файла",
    fileFormat: "Файл",
    confirmRegenerateTitle: "Эти ролики не то, переделаем?",
    confirmRegenerateText:
      "Текущие варианты будут заменены новыми. Продолжить?",
    yes: "Да",
    no: "Нет",
    removeFile: "Удалить файл",
    previewPreparing: "Собираем превью...",
    previewReady: "Превью собрано",
    previewNotPlayable: "Нажми, чтобы посмотреть превью",
    previewPlay: "Смотреть превью",
    previewPause: "Пауза",
    generationErrorFallback:
      "Не удалось сгенерировать варианты. Попробуй ещё раз.",
    generationRequestTooLarge:
      "Слишком тяжёлый запрос. Удали часть файлов или большие изображения и попробуй снова.",
    generationPanelTitle: "Что собрал Margelet",
    generationHook: "Хук",
    generationAngle: "Угол",
    generationScenes: "Сцены",
    captionsLabel: "Показывать субтитры",
    authRequired: "Сначала авторизуйся через Telegram.",
    planRequired: "Для скачивания нужен активный тариф.",
    downloadError: "Не удалось скачать видео. Попробуй ещё раз.",
    loadingPreview: "Загружаем живое превью...",
    autoMode: "Автогенерация выключена до нажатия кнопки",
    socials: {
      instagram: "Instagram",
      tiktok: "TikTok",
      youtube: "YouTube",
      telegram: "Telegram",
      vk: "VK",
      discord: "Discord",
    },
    durations: [
      "10 секунд",
      "15 секунд",
      "20 секунд",
      "30 секунд",
      "40 секунд",
      "60 секунд",
    ],
    tones: ["Динамично", "Спокойно", "Дорого", "Дружелюбно"],
    voices: ["Автоматический", "Энергичный", "Спокойный", "Рассказчик"],
    formats: {
      other: "Другое",
      motivation: "Мотивация",
      business: "Бизнес",
      news: "Новости",
      ai: "AI",
      crypto: "Крипта",
      facts: "Факты",
      tech: "Техно",
      finance: "Финансы",
      education: "Обучение",
      history: "История",
      gaming: "Игры",
      stream: "Стримы",
      reviews: "Обзоры",
      gadgets: "Гаджеты",
      cars: "Авто",
      travel: "Путешествия",
      food: "Еда",
      fitness: "Фитнес",
      health: "Здоровье",
      science: "Наука",
      space: "Космос",
      animals: "Животные",
      kids: "Детям",
      music: "Музыка",
      movies: "Кино",
      culture: "Культура",
      psychology: "Психология",
      books: "Книги",
      marketing: "Маркетинг",
      startup: "Стартапы",
      design: "Дизайн",
      blog: "Блог",
    },
    topicByFormat: {
      other:
        "Опиши любой формат ролика, который хочешь создать, простыми словами",
      motivation: "Напиши ролик о том, почему дисциплина важнее мотивации",
      business: "Сделай ролик про 3 ошибки предпринимателей в начале пути",
      news: "Кратко перескажи главное событие дня простым языком",
      ai: "Объясни простыми словами новый AI инструмент и чем он полезен",
      crypto: "Объясни, почему Bitcoin снова у всех на слуху",
      facts: "Сделай короткий ролик с 3 неожиданными фактами",
      tech: "Покажи 3 технологии, которые уже меняют повседневную жизнь",
      finance: "Объясни 3 ошибки в обращении с деньгами",
      education: "Сделай ролик, который помогает быстро запомнить тему",
      history:
        "Кратко расскажи об историческом событии, которое всё изменило",
      gaming: "Сделай топ-5 игр, которые стоит ждать в этом году",
      stream: "Придумай формат клипа из ярких моментов стрима",
      reviews: "Сделай честный короткий обзор нового продукта",
      gadgets: "Покажи гаджет, который реально полезен каждый день",
      cars: "Сделай ролик про авто, которое стоит своих денег",
      travel: "Собери короткий ролик о месте, куда хочется улететь",
      food: "Покажи блюдо, которое хочется попробовать сразу",
      fitness: "Сделай ролик о простой привычке для хорошей формы",
      health: "Объясни важную привычку для здоровья без перегруза",
      science: "Расскажи научный факт, который удивляет с первых секунд",
      space: "Сделай ролик о космическом объекте, который поражает масштабом",
      animals: "Сделай видео про необычное поведение животных",
      kids: "Придумай короткий полезный ролик для детей",
      music: "Сделай ролик о треке или музыкальном тренде",
      movies: "Расскажи о фильме, который стоит посмотреть",
      culture: "Покажи культурный факт, который хочется пересказать друзьям",
      psychology: "Объясни психологическую ловушку, в которую все попадают",
      books: "Сделай ролик про книгу, которая реально меняет мышление",
      marketing: "Расскажи о маркетинговом приёме, который работает",
      startup: "Сделай ролик про стартап-идею с потенциалом",
      design: "Объясни дизайнерский приём на простом примере",
      blog: "Придумай тему для личного блога, которая цепляет",
      default: "Используй примеры только с рыжими котами",
    },
  },
  en: {
    step1Title: "1. Choose agent format",
    step1Tail: "or leave it empty",
    step1Hint: "The format affects script style, delivery, and video editing.",
    step2Title: "2. Materials",
    step2Tail: "drop files, photos, videos, audio, links and notes here.",
    step3Title: "3. Video topic",
    step3Tail: "write it like you're briefing a real producer.",
    dropTitle: "Drag files or click upload",
    dropHint: "jpeg, png, webp, mp4, avi, mp3, PDF, DOC, TXT.",
    upload: "Upload",
    linkPlaceholder: "https://Link to any source",
    duration: "Duration",
    tone: "Tone",
    voice: "Voice",
    trend: "Find trend",
    trendLoading: "Finding trend...",
    trendError: "Failed to find a trend. Try again.",
    doForMe: "Fill everything for me",
    preview: "Preview",
    previewAction: "Preview",
    generateAction: "Generate!",
    regenerateAction: "Regenerate",
    createdThree: "Three variants created",
    download: "Download video",
    downloading: "Building video...",
    generating: "Generating 3 variants...",
    examplePrefix: "For example:",
    variant: "Format",
    readyToPost: "Ready to upload to social media:",
    fileWeight: "File size",
    fileFormat: "File",
    confirmRegenerateTitle: "These videos are not right. Regenerate them?",
    confirmRegenerateText:
      "The current variants will be replaced with new ones. Continue?",
    yes: "Yes",
    no: "No",
    removeFile: "Remove file",
    previewPreparing: "Building preview...",
    previewReady: "Preview ready",
    previewNotPlayable: "Tap to watch preview",
    previewPlay: "Play preview",
    previewPause: "Pause",
    generationErrorFallback: "Failed to generate variants. Please try again.",
    generationRequestTooLarge:
      "The request is too large. Remove some files or heavy images and try again.",
    generationPanelTitle: "What Margelet built",
    generationHook: "Hook",
    generationAngle: "Angle",
    generationScenes: "Scenes",
    captionsLabel: "Show subtitles",
    authRequired: "Please sign in with Telegram first.",
    planRequired: "An active plan is required to download.",
    downloadError: "Failed to download the video. Please try again.",
    loadingPreview: "Loading live preview...",
    autoMode: "Auto-generate is off until you click the button",
    socials: {
      instagram: "Instagram",
      tiktok: "TikTok",
      youtube: "YouTube",
      telegram: "Telegram",
      vk: "VK",
      discord: "Discord",
    },
    durations: ["10 sec", "15 sec", "20 sec", "30 sec", "40 sec", "60 sec"],
    tones: ["Dynamic", "Calm", "Premium", "Friendly"],
    voices: ["Automatic", "Energetic", "Calm", "Narrator"],
    formats: {
      other: "Other",
      motivation: "Motivation",
      business: "Business",
      news: "News",
      ai: "AI",
      crypto: "Crypto",
      facts: "Facts",
      tech: "Tech",
      finance: "Finance",
      education: "Education",
      history: "History",
      gaming: "Gaming",
      stream: "Streams",
      reviews: "Reviews",
      gadgets: "Gadgets",
      cars: "Cars",
      travel: "Travel",
      food: "Food",
      fitness: "Fitness",
      health: "Health",
      science: "Science",
      space: "Space",
      animals: "Animals",
      kids: "Kids",
      music: "Music",
      movies: "Movies",
      culture: "Culture",
      psychology: "Psychology",
      books: "Books",
      marketing: "Marketing",
      startup: "Startup",
      design: "Design",
      blog: "Blog",
    },
    topicByFormat: {
      other: "Describe any kind of video you want to create in simple words",
      motivation:
        "Create a video about why discipline matters more than motivation",
      business: "Make a video about 3 mistakes founders make early on",
      news: "Summarize the biggest event of the day in simple words",
      ai: "Explain a new AI tool and why people care about it",
      crypto: "Explain why Bitcoin is back in the spotlight",
      facts: "Make a short video with 3 surprising facts",
      tech: "Show 3 technologies already changing daily life",
      finance: "Explain 3 money mistakes most people make",
      education: "Create a short video that helps learn a topic fast",
      history:
        "Tell a short story about a historical event that changed everything",
      gaming: "Make a top-5 video of games worth waiting for this year",
      stream: "Create a short highlight format from a live stream",
      reviews: "Make a short honest review of a new product",
      gadgets: "Show a gadget that is genuinely useful every day",
      cars: "Make a video about a car that is worth the price",
      travel: "Create a short video about a place people want to visit",
      food: "Show a dish that instantly makes people hungry",
      fitness: "Make a short video about one habit for better shape",
      health: "Explain one important health habit without overcomplicating it",
      science:
        "Tell a science fact that surprises people in the first seconds",
      space: "Make a video about a space object that feels unbelievable",
      animals: "Show unusual animal behavior in a fun way",
      kids: "Create a useful short video for kids",
      music: "Make a video about a song or music trend",
      movies: "Talk about a movie worth watching",
      culture: "Show a culture fact people want to retell",
      psychology: "Explain a psychology trap most people fall into",
      books: "Make a short video about a book that changes thinking",
      marketing: "Explain a marketing move that really works",
      startup: "Make a video about a startup idea with real potential",
      design: "Explain a design principle with a simple example",
      blog: "Suggest a blog topic that feels instantly clickable",
      default: "Use examples only with orange cats",
    },
  },
};

const DEMO_POSTERS = [
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop",
];

const FORMAT_ITEMS = [
  { id: "other", icon: "✨" },
  { id: "motivation", icon: "🧘" },
  { id: "business", icon: "💼" },
  { id: "news", icon: "📰" },
  { id: "ai", icon: "🤖" },
  { id: "crypto", icon: "₿" },
  { id: "facts", icon: "📚" },
  { id: "tech", icon: "💻" },
  { id: "finance", icon: "📈" },
  { id: "education", icon: "🎓" },
  { id: "history", icon: "🏛️" },
  { id: "gaming", icon: "🎮" },
  { id: "stream", icon: "📺" },
  { id: "reviews", icon: "⭐" },
  { id: "gadgets", icon: "📱" },
  { id: "cars", icon: "🚗" },
  { id: "travel", icon: "✈️" },
  { id: "food", icon: "🍔" },
  { id: "fitness", icon: "💪" },
  { id: "health", icon: "🧬" },
  { id: "science", icon: "🔬" },
  { id: "space", icon: "🚀" },
  { id: "animals", icon: "🐶" },
  { id: "kids", icon: "🧸" },
  { id: "music", icon: "🎵" },
  { id: "movies", icon: "🎬" },
  { id: "culture", icon: "🎭" },
  { id: "psychology", icon: "🧠" },
  { id: "books", icon: "📖" },
  { id: "marketing", icon: "📢" },
  { id: "startup", icon: "🚀" },
  { id: "design", icon: "🎨" },
  { id: "blog", icon: "✍️" },
];

function pixelClip() {
  return {
    clipPath:
      "polygon(0 8px, 8px 8px, 8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px))",
  };
}

function createDefaultAssets() {
  return [
    {
      id: "a1",
      src: DEMO_POSTERS[0],
      name: "demo-1.jpg",
      ext: "jpg",
      kind: "image",
    },
    {
      id: "a2",
      src: DEMO_POSTERS[1],
      name: "demo-2.jpg",
      ext: "jpg",
      kind: "image",
    },
    {
      id: "a3",
      src: DEMO_POSTERS[2],
      name: "demo-3.jpg",
      ext: "jpg",
      kind: "image",
    },
    {
      id: "a4",
      src: DEMO_POSTERS[3],
      name: "demo-4.jpg",
      ext: "jpg",
      kind: "image",
    },
  ];
}

function getDefaultWorkspace(lang) {
  const copy = COPY[lang] || COPY.ru;

  return {
    selectedFormat: null,
    topic: "",
    duration: copy.durations?.[3] || COPY.ru.durations[3],
    tone: copy.tones?.[0] || COPY.ru.tones[0],
    voice: copy.voices?.[0] || COPY.ru.voices[0],
    link: "",
    showCaptions: true,
    assets: createDefaultAssets(),
    variants: [],
    activeVariant: 0,
    lastPreviewPayload: null,
    lastGeneratedFingerprint: "",
  };
}

function InstagramIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="igGradFixed" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#feda75" />
          <stop offset="35%" stopColor="#fa7e1e" />
          <stop offset="65%" stopColor="#d62976" />
          <stop offset="100%" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        fill="url(#igGradFixed)"
      />
      <circle
        cx="12"
        cy="12"
        r="4.2"
        fill="none"
        stroke="white"
        strokeWidth="1.8"
      />
      <circle cx="17.2" cy="6.8" r="1.2" fill="white" />
    </svg>
  );
}

function TikTokIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M14.8 4c.5 1.6 1.6 2.8 3.2 3.5V10c-1.2 0-2.4-.3-3.5-1v5.4a4.9 4.9 0 1 1-4.9-4.9c.3 0 .6 0 .9.1v2.7a2.3 2.3 0 1 0 1.4 2.1V4h2.9z"
        fill="#111111"
      />
      <path
        d="M13.4 4v10.4a2.3 2.3 0 1 1-2.3-2.3c.2 0 .5 0 .7.1V9.5a4.9 4.9 0 0 0-.7 9.7 4.9 4.9 0 0 0 4.9-4.9V8.9c1 .7 2.1 1.1 3.4 1.1V7.5c-1.6-.7-2.8-1.9-3.2-3.5h-2.8z"
        fill="#25F4EE"
        opacity="0.9"
      />
      <path
        d="M14.1 4v10.2a2.3 2.3 0 1 1-2.3-2.3c.2 0 .4 0 .6.1V9.4a4.9 4.9 0 1 0 4.9 4.9V8.7c1 .7 2.1 1.1 3.4 1.1V7.3c-1.6-.7-2.8-1.9-3.2-3.3h-3.4z"
        fill="#FE2C55"
        opacity="0.9"
      />
      <path
        d="M14.3 4.2c.5 1.4 1.6 2.5 3.1 3.1v2c-1.2 0-2.3-.3-3.3-1v6a4.2 4.2 0 1 1-4.2-4.2c.3 0 .5 0 .8.1v2.1a2.1 2.1 0 1 0 1.3 2v-10h2.3z"
        fill="#111111"
      />
    </svg>
  );
}

function YouTubeIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M21 8.5a3 3 0 0 0-2.1-2.1C17.1 6 12 6 12 6s-5.1 0-6.9.4A3 3 0 0 0 3 8.5 31 31 0 0 0 3 12a31 31 0 0 0 .4 3.5 3 3 0 0 0 2.1 2.1C6.9 18 12 18 12 18s5.1 0 6.9-.4a3 3 0 0 0 2.1-2.1c.3-1.1.4-2.3.4-3.5a31 31 0 0 0-.4-3.5z"
        fill="#FF0033"
      />
      <path d="M10 9.3v5.4l4.7-2.7L10 9.3z" fill="white" />
    </svg>
  );
}

function TelegramIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#27A6E5" />
      <path
        d="M17.7 7.2 6.8 11.4c-.7.3-.7.7-.1.9l2.8.9 6.4-4c.3-.2.7-.1.4.1l-5.2 4.7-.2 2.8c.4 0 .6-.2.8-.4l1.4-1.4 2.9 2.1c.6.3 1 .1 1.1-.5l1.7-8.7c.2-.7-.2-1-.9-.7z"
        fill="white"
      />
    </svg>
  );
}

function VkIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#0077FF" />
      <path
        d="M7.2 8.2c.1 0 .3 0 .3.2.6 1.2 1.2 2.3 2 3.3.2.3.4.4.5.4.1 0 .2-.1.2-.5V8.8c0-.4.1-.6.5-.6h1.8c.3 0 .4.2.4.5v1.5c0 .5 0 .8.2.8.2 0 .4-.3.8-.8.7-.9 1.2-1.9 1.5-1.9H17c.3 0 .5.2.4.5-.2.7-1.6 2.5-1.6 2.5-.1.1-.2.3 0 .5 0 0 1.2 1.2 1.5 2 .1.3 0 .5-.4.5h-1.4c-.3 0-.4-.1-.6-.3-.8-.9-1-1-1.2-1-.1 0-.2.1-.2.4v.4c0 .4-.1.5-.5.5-2.4 0-4.5-2.9-5.4-5-.1-.3 0-.5.3-.5h1.3z"
        fill="white"
      />
    </svg>
  );
}

function DiscordIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#5865F2" />
      <path
        d="M16.8 8.1c-1-.5-2-.8-2-.8l-.1.2c.9.2 1.3.5 1.3.5-1.4-.8-2.8-.8-4-.6-.9.1-1.7.4-2.4.8.2-.1.7-.3 1.4-.5l-.1-.2s-1 .3-2 .8c0 0-1 1.4-1.3 4.1.8 1 1.9 1.5 1.9 1.5l.5-.7c-.5-.2-.8-.5-.8-.5.1.1.2.1.3.2 0 0 0 0 .1 0 .1 0 .1.1.2.1.4.2.8.3 1.2.3.7.1 1.5.1 2.2 0 .4-.1.8-.2 1.2-.3.1 0 .1-.1.2-.1 0 0 0 0 .1 0 .1-.1.2-.1.3-.2 0 0-.3.3-.8.5l.5.7s1.1-.5 1.9-1.5c-.4-2.7-1.3-4.1-1.3-4.1zM10.3 12.8c-.4 0-.8-.4-.8-.9s.3-.9.8-.9c.4 0 .8.4.8.9s-.3.9-.8.9zm3.4 0c-.4 0-.8-.4-.8-.9s.3-.9.8-.9c.4 0 .8.4.8.9s-.3.9-.8.9z"
        fill="white"
      />
    </svg>
  );
}

function PixelButton({
  children,
  className = "",
  color = "violet",
  onClick,
  disabled = false,
  icon = null,
  type = "button",
}) {
  const palette =
    color === "green"
      ? "bg-[#63cd8d] text-[#165b35]"
      : color === "pink"
      ? "bg-[linear-gradient(90deg,#7f2cff_0%,#d700ff_100%)] text-white"
      : color === "soft"
      ? "bg-[#b68fe8] text-white"
      : "bg-[#8c62ff] text-white";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={pixelClip()}
      className={`inline-flex items-center justify-center gap-2 px-5 py-4 text-[15px] font-semibold transition ${palette} ${
        disabled ? "cursor-not-allowed opacity-55" : "hover:brightness-[1.03]"
      } ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

function ProgressActionButton({
  text,
  progress,
  onClick,
  mobile = false,
  disabled = false,
  showProgress = false,
}) {
  const pct = Math.max(0, Math.min(100, progress));

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={pixelClip()}
      className={`relative w-full overflow-hidden text-white transition ${
        mobile
          ? "px-5 py-4 text-[16px] font-bold shadow-[0_10px_30px_rgba(88,62,155,0.25)]"
          : "px-5 py-4 text-[18px] font-bold"
      } ${
        disabled
          ? "cursor-not-allowed opacity-55"
          : "hover:brightness-[1.03]"
      }`}
    >
      <div className="absolute inset-0 bg-[#8c62ff]" />
      {showProgress && (
        <div
          className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,#7f2cff_0%,#d700ff_100%)] transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      )}
      <span className="relative z-10">{text}</span>
    </button>
  );
}

function PlainSelect({ label, value, onChange, options }) {
  return (
    <div className="space-y-2">
      <div className="text-[14px] font-semibold text-[#57558c] md:text-[16px]">
        {label}
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white px-4 py-4 text-[15px] text-[#6b5fa0] outline-none md:px-5"
        >
          {options.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <ChevronDown
          size={18}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#b59ce6]"
        />
      </div>
    </div>
  );
}

function FormatTile({ active, icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-[84px] shrink-0 flex-col items-center md:w-[88px]"
    >
      <div
        style={active ? pixelClip() : undefined}
        className={`flex h-[78px] w-[78px] items-center justify-center transition md:h-[88px] md:w-[88px] ${
          active ? "bg-[#b78dff]" : "bg-white"
        }`}
      >
        <span
          className={`text-[31px] leading-none md:text-[34px] ${
            active ? "text-white" : ""
          }`}
        >
          {icon}
        </span>
      </div>
      <div
        className={`mt-3 text-center text-[13px] font-semibold md:text-[15px] ${
          active ? "text-[#be8cff]" : "text-[#171717]"
        }`}
      >
        {label}
      </div>
    </button>
  );
}

function AssetThumb({ item, onRemove, removeLabel }) {
  return (
    <div className="group relative h-[58px] w-[58px] shrink-0 overflow-hidden bg-white md:h-[60px] md:w-[60px]">
      {item.kind === "image" ? (
        <img
          src={item.src}
          alt={item.name || ""}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center px-1 text-center">
          <div className="text-[11px] font-bold uppercase text-[#7780aa]">
            {item.ext || item.kind}
          </div>
          <div className="mt-1 line-clamp-2 text-[9px] leading-[1.15] text-[#8d94ba]">
            {item.name}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center bg-black/55 text-white opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
        aria-label={removeLabel}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function InfoHint({ text }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-5 w-5 items-center justify-center text-[#9e8fc9]"
        aria-label="Info"
      >
        <Info size={14} />
      </button>

      {open && (
        <div className="absolute left-1/2 top-[calc(100%+8px)] z-20 w-[220px] -translate-x-1/2 bg-white px-3 py-2 text-[12px] leading-[1.4] text-[#57558c] shadow-[0_12px_30px_rgba(45,55,90,0.16)]">
          {text}
        </div>
      )}
    </div>
  );
}

function SocialItem({ icon, label }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-[#4c557d]">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function PreviewReadyCard({ t, currentFormatLabel, duration, tone }) {
  return (
    <div className="space-y-2 text-[13px] text-[#6f7394]">
      <div className="font-semibold text-[#5a628d]">{t.readyToPost}</div>

      <div>
        {t.variant}: {currentFormatLabel || "—"} · {duration} · {tone} · WEBM ·{" "}
        {t.fileWeight}: 14.8 MB
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
        <SocialItem
          icon={<InstagramIcon className="h-5 w-5 shrink-0" />}
          label={t.socials.instagram}
        />
        <SocialItem
          icon={<TikTokIcon className="h-5 w-5 shrink-0" />}
          label={t.socials.tiktok}
        />
        <SocialItem
          icon={<YouTubeIcon className="h-5 w-5 shrink-0" />}
          label={t.socials.youtube}
        />
        <SocialItem
          icon={<TelegramIcon className="h-5 w-5 shrink-0" />}
          label={t.socials.telegram}
        />
        <SocialItem
          icon={<VkIcon className="h-5 w-5 shrink-0" />}
          label={t.socials.vk}
        />
        <SocialItem
          icon={<DiscordIcon className="h-5 w-5 shrink-0" />}
          label={t.socials.discord}
        />
      </div>
    </div>
  );
}

function ConfirmModal({ t, open, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 px-4">
      <div
        className="w-full max-w-[420px] bg-white p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] md:p-6"
        style={pixelClip()}
      >
        <div className="text-[20px] font-bold text-[#3f3562]">
          {t.confirmRegenerateTitle}
        </div>
        <div className="mt-3 text-[15px] leading-[1.5] text-[#6b6690]">
          {t.confirmRegenerateText}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <PixelButton color="soft" className="w-full" onClick={onClose}>
            {t.no}
          </PixelButton>
          <PixelButton color="pink" className="w-full" onClick={onConfirm}>
            {t.yes}
          </PixelButton>
        </div>
      </div>
    </div>
  );
}

function GenerationInfoCard({ t, activeVariantData }) {
  if (!activeVariantData) return null;

  return (
    <div
      className="space-y-3 bg-white/70 p-4 text-[13px] text-[#4e557e]"
      style={pixelClip()}
    >
      <div className="font-semibold text-[#4a4272]">
        {t.generationPanelTitle}
      </div>

      {activeVariantData?.creative?.hook ? (
        <div>
          <div className="font-semibold text-[#6c63a2]">
            {t.generationHook}
          </div>
          <div>{activeVariantData.creative.hook}</div>
        </div>
      ) : null}

      {activeVariantData?.creative?.angle ? (
        <div>
          <div className="font-semibold text-[#6c63a2]">
            {t.generationAngle}
          </div>
          <div>{activeVariantData.creative.angle}</div>
        </div>
      ) : null}

      {activeVariantData?.scenes?.length ? (
        <div>
          <div className="font-semibold text-[#6c63a2]">
            {t.generationScenes}
          </div>
          <div className="mt-2 space-y-2">
            {activeVariantData.scenes.slice(0, 3).map((scene) => (
              <div
                key={scene.id}
                className="rounded-[10px] bg-white/80 px-3 py-2"
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.02em] text-[#7d73b2]">
                  {scene.role}
                </div>
                <div className="mt-1 text-[#4e557e]">
                  {scene.caption || scene.narration}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CaptionSwitch({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <div
        onClick={() => onChange(!checked)}
        className={`relative h-[24px] w-[48px] transition-colors ${
          checked ? "bg-[#7a5af8]" : "bg-[#bfb7d6]"
        }`}
        style={pixelClip()}
      >
        <div
          className={`absolute top-[3px] h-[18px] w-[18px] bg-white transition-all ${
            checked ? "left-[27px]" : "left-[3px]"
          }`}
          style={pixelClip()}
        />
      </div>

      <span className="text-[15px] text-[#5e547e] md:text-[16px]">
        {label}
      </span>
    </label>
  );
}

async function fileToAsset(file, index) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const kind = file.type.startsWith("image/")
    ? "image"
    : file.type.startsWith("video/")
    ? "video"
    : file.type.startsWith("audio/")
    ? "audio"
    : "file";

  if (kind === "image") {
    const src = await readFileAsDataUrl(file);

    return {
      id: `${Date.now()}-${index}-${file.name}`,
      src,
      name: file.name,
      ext,
      kind,
      size: file.size,
      mimeType: file.type,
    };
  }

  return {
    id: `${Date.now()}-${index}-${file.name}`,
    src: "",
    name: file.name,
    ext,
    kind,
    size: file.size,
    mimeType: file.type,
  };
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function serializeAssetForApi(item) {
  const safeSrc =
    typeof item.src === "string" && item.src.startsWith("data:")
      ? ""
      : item.src || "";

  return {
    id: item.id,
    name: item.name,
    src: safeSrc,
    previewUrl: safeSrc,
    ext: item.ext || "",
    type: item.mimeType || guessMimeTypeFromKind(item.kind, item.ext),
    mimeType: item.mimeType || guessMimeTypeFromKind(item.kind, item.ext),
    size: item.size || null,
    kind: item.kind || "file",
  };
}

function guessMimeTypeFromKind(kind, ext) {
  if (kind === "image")
    return `image/${ext === "jpg" ? "jpeg" : ext || "jpeg"}`;
  if (kind === "video") return "video/mp4";
  if (kind === "audio") return "audio/mpeg";
  return "application/octet-stream";
}

function mapTrendToneToUi(toneValue, language) {
  if (language === "ru") {
    if (toneValue === "calm") return "Спокойно";
    if (toneValue === "premium") return "Дорого";
    if (toneValue === "friendly") return "Дружелюбно";
    return "Динамично";
  }

  if (toneValue === "calm") return "Calm";
  if (toneValue === "premium") return "Premium";
  if (toneValue === "friendly") return "Friendly";
  return "Dynamic";
}

function mapTrendDurationToUi(durationValue, language) {
  const value = Number(durationValue) || 30;
  if (language === "ru") return `${value} секунд`;
  return `${value} sec`;
}

function getTelegramUser() {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(TG_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getTelegramIdentity(user) {
  if (!user) return "";
  return String(
    user.telegramId ||
      user.telegram_id ||
      user.id ||
      user.username ||
      user.userName ||
      ""
  );
}

function mapApiPreviewVariant(variant, idx) {
  const endpoint = variant?.preview?.endpoint || {};
  return {
    id: variant.id || `v${idx + 1}`,
    poster: variant.poster || DEMO_POSTERS[idx % DEMO_POSTERS.length],
    label: variant.label || null,
    creative: variant.creative || null,
    scenes: variant.scenes || [],
    script: variant.script || null,
    info: variant.info || null,
    captions: variant.captions || [],
    access: variant.access || null,
    kind: variant.kind || null,
    score: variant.score || null,
    previewStatusUrl: endpoint.previewStatusUrl || variant.previewUrl || "",
    previewRenderUrl: endpoint.previewRenderUrl || "",
    previewStatus: variant?.preview?.status || "incomplete",
    readyForPreviewRender: Boolean(variant?.preview?.readyForPreviewRender),
    requestId: variant?.preview?.endpoint?.previewStatusUrl
      ? new URL(
          variant.preview.endpoint.previewStatusUrl,
          "http://localhost"
        ).searchParams.get("requestId")
      : null,
  };
}

function buildGenerationFingerprint({
  selectedFormat,
  topic,
  duration,
  tone,
  voice,
  link,
  showCaptions,
  assets,
}) {
  return JSON.stringify({
    selectedFormat,
    topic: topic.trim(),
    duration,
    tone,
    voice,
    link: link.trim(),
    showCaptions,
    assets: assets.map((item) => ({
      id: item.id,
      name: item.name,
      kind: item.kind,
      src: item.src,
    })),
  });
}

async function readJsonSafely(res) {
  const text = await res.text();

  if (!text) {
    return { ok: false, rawText: "", parseError: "EMPTY_RESPONSE" };
  }

  try {
    return { ok: true, data: JSON.parse(text), rawText: text };
  } catch {
    return { ok: false, rawText: text, parseError: "INVALID_JSON" };
  }
}

function normalizeServerErrorMessage(rawText, fallbackText) {
  const text = String(rawText || "");

  if (/request entity too large/i.test(text)) {
    return fallbackText;
  }

  if (/payload too large/i.test(text)) {
    return fallbackText;
  }

  if (/413/i.test(text) && /entity|payload/i.test(text)) {
    return fallbackText;
  }

  return "";
}

export default function AgentWorkspace({ lang = "ru" }) {
  const t = COPY[lang] || COPY.ru;
  const defaults = useMemo(() => getDefaultWorkspace(lang), [lang]);

  const [selectedFormat, setSelectedFormat] = useState(defaults.selectedFormat);
  const [topic, setTopic] = useState(defaults.topic);
  const [duration, setDuration] = useState(defaults.duration);
  const [tone, setTone] = useState(defaults.tone);
  const [voice, setVoice] = useState(defaults.voice);
  const [link, setLink] = useState(defaults.link);
  const [showCaptions, setShowCaptions] = useState(defaults.showCaptions);
  const [assets, setAssets] = useState(defaults.assets);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isFindingTrend, setIsFindingTrend] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingLivePreview, setIsLoadingLivePreview] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [variants, setVariants] = useState(defaults.variants);
  const [activeVariant, setActiveVariant] = useState(defaults.activeVariant);
  const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [trendError, setTrendError] = useState("");
  const [lastPreviewPayload, setLastPreviewPayload] = useState(
    defaults.lastPreviewPayload
  );
  const [lastGeneratedFingerprint, setLastGeneratedFingerprint] = useState(
    defaults.lastGeneratedFingerprint
  );
  const [telegramIdentity, setTelegramIdentity] = useState("");

  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const livePreviewContainerRef = useRef(null);
  const previewRuntimeRef = useRef(null);
  const livePreviewAbortRef = useRef(null);

  const stopPreviewRuntime = () => {
    if (previewRuntimeRef.current?.pause) {
      try {
        previewRuntimeRef.current.pause();
      } catch {}
    }

    if (previewRuntimeRef.current?.stop) {
      try {
        previewRuntimeRef.current.stop();
      } catch {}
    }

    previewRuntimeRef.current = null;
    setIsPreviewPlaying(false);
  };

  const scrollToPreview = () => {
    requestAnimationFrame(() => {
      previewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const applyWorkspaceState = (state) => {
    setSelectedFormat(state.selectedFormat ?? defaults.selectedFormat);
    setTopic(state.topic ?? defaults.topic);
    setDuration(state.duration ?? defaults.duration);
    setTone(state.tone ?? defaults.tone);
    setVoice(state.voice ?? defaults.voice);
    setLink(state.link ?? defaults.link);
    setShowCaptions(
      typeof state.showCaptions === "boolean"
        ? state.showCaptions
        : defaults.showCaptions
    );
    setAssets(
      Array.isArray(state.assets) && state.assets.length
        ? state.assets.slice(0, MAX_ASSETS)
        : defaults.assets
    );
    setVariants(Array.isArray(state.variants) ? state.variants : []);
    setActiveVariant(
      typeof state.activeVariant === "number" ? state.activeVariant : 0
    );
    setLastPreviewPayload(state.lastPreviewPayload || null);
    setLastGeneratedFingerprint(state.lastGeneratedFingerprint || "");
    setGenerationError("");
    setTrendError("");
    stopPreviewRuntime();
  };

  const resetWorkspace = () => {
    const freshDefaults = getDefaultWorkspace(lang);
    applyWorkspaceState(freshDefaults);

    try {
      const currentIdentity = getTelegramIdentity(getTelegramUser());
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...freshDefaults,
          telegramIdentity: currentIdentity,
        })
      );
    } catch {}
  };

  useEffect(() => {
    try {
      const currentIdentity = getTelegramIdentity(getTelegramUser());
      setTelegramIdentity(currentIdentity);

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setHydrated(true);
        return;
      }

      const saved = JSON.parse(raw);
      const savedIdentity = String(saved?.telegramIdentity || "");

      if (savedIdentity !== currentIdentity) {
        localStorage.removeItem(STORAGE_KEY);
        applyWorkspaceState(getDefaultWorkspace(lang));
        setHydrated(true);
        return;
      }

      applyWorkspaceState({
        ...getDefaultWorkspace(lang),
        ...saved,
      });
    } catch (error) {
      console.error("Failed to restore AgentWorkspace session", error);
    } finally {
      setHydrated(true);
    }
  }, [lang]);

  useEffect(() => {
    if (!hydrated) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selectedFormat,
          topic,
          duration,
          tone,
          voice,
          link,
          showCaptions,
          assets: assets.slice(0, MAX_ASSETS),
          variants,
          activeVariant,
          lastPreviewPayload,
          lastGeneratedFingerprint,
          telegramIdentity,
        })
      );
    } catch (error) {
      console.error("Failed to save AgentWorkspace session", error);
    }
  }, [
    hydrated,
    selectedFormat,
    topic,
    duration,
    tone,
    voice,
    link,
    showCaptions,
    assets,
    variants,
    activeVariant,
    lastPreviewPayload,
    lastGeneratedFingerprint,
    telegramIdentity,
  ]);

  useEffect(() => {
    const syncTelegramState = () => {
      const currentIdentity = getTelegramIdentity(getTelegramUser());

      if (currentIdentity !== telegramIdentity) {
        setTelegramIdentity(currentIdentity);
        resetWorkspace();
      }
    };

    const handleStorage = (event) => {
      if (event.key === TG_USER_KEY) {
        syncTelegramState();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", syncTelegramState);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", syncTelegramState);
    };
  }, [telegramIdentity, lang]);

  useEffect(() => {
    const durationFallback = COPY[lang]?.durations?.[3] || COPY.ru.durations[3];
    const toneFallback = COPY[lang]?.tones?.[0] || COPY.ru.tones[0];
    const voiceFallback = COPY[lang]?.voices?.[0] || COPY.ru.voices[0];

    if (!COPY[lang]?.durations?.includes(duration)) setDuration(durationFallback);
    if (!COPY[lang]?.tones?.includes(tone)) setTone(toneFallback);
    if (!COPY[lang]?.voices?.includes(voice)) setVoice(voiceFallback);
  }, [lang, duration, tone, voice]);

  const previewPoster = useMemo(() => {
    if (variants.length) {
      return variants[activeVariant]?.poster || DEMO_POSTERS[0];
    }
    return DEMO_POSTERS[1];
  }, [variants, activeVariant]);

  const activeVariantData = variants[activeVariant] || null;
  const currentFormatLabel = selectedFormat ? t.formats[selectedFormat] : "";
  const topicPlaceholder = `${t.examplePrefix} ${
    t.topicByFormat[selectedFormat] || t.topicByFormat.default
  }`;

  const hasCategory = Boolean(selectedFormat);
  const hasMaterials = assets.length > 0 || link.trim().length > 3;
  const hasTopic = topic.trim().length > 8;

  const progress =
    (hasCategory ? 25 : 0) + (hasMaterials ? 35 : 0) + (hasTopic ? 40 : 0);

  const canGenerate = hasCategory && (hasMaterials || hasTopic);

  const desktopActionText = variants.length
    ? t.regenerateAction
    : canGenerate
    ? t.generateAction
    : t.previewAction;

  const mobileActionText = variants.length
    ? t.regenerateAction
    : canGenerate
    ? t.generateAction
    : t.previewAction;

  const visibleAssets = assets.slice(0, ASSET_SLOTS);

  const generationFingerprint = useMemo(
    () =>
      buildGenerationFingerprint({
        selectedFormat,
        topic,
        duration,
        tone,
        voice,
        link,
        showCaptions,
        assets,
      }),
    [selectedFormat, topic, duration, tone, voice, link, showCaptions, assets]
  );

  const buildGenerationPayload = () => {
    const textOverlayMode = showCaptions ? "subtitles" : "off";

    return {
      format: selectedFormat,
      topic: topic.trim(),
      duration,
      tone,
      voice,
      link: link.trim(),
      notes: topic.trim(),
      assets: assets.map(serializeAssetForApi),
      mode: "preview",
      showCaptions,
      subtitlesEnabled: showCaptions,
      textOverlayMode,
      config: {
        duration,
        tone,
        voice,
        textOverlayMode,
      },
    };
  };

  const runGenerate = async ({ force = false } = {}) => {
    if (isGenerating) return;
    if (!canGenerate) return;
    if (!force && generationFingerprint === lastGeneratedFingerprint) return;

    setIsGenerating(true);
    setGenerationError("");
    setIsPreviewPlaying(false);

    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      scrollToPreview();
    }

    try {
      const payload = buildGenerationPayload();

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const parsed = await readJsonSafely(res);

      if (!parsed.ok) {
        const normalized = normalizeServerErrorMessage(
          parsed.rawText,
          t.generationRequestTooLarge
        );
        throw new Error(normalized || t.generationErrorFallback);
      }

      const data = parsed.data;

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error?.message || t.generationErrorFallback);
      }

      const nextVariants =
        data?.preview?.variants?.map((variant, idx) =>
          mapApiPreviewVariant(variant, idx)
        ) || [];

      stopPreviewRuntime();
      setVariants(nextVariants);
      setActiveVariant(0);
      setLastPreviewPayload(data.preview || null);
      setLastGeneratedFingerprint(generationFingerprint);

      scrollToPreview();
    } catch (error) {
      console.error("Generation failed:", error);
      setGenerationError(error?.message || t.generationErrorFallback);
      scrollToPreview();
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    async function loadLivePreview() {
      if (!activeVariantData?.previewRenderUrl) return;
      if (!livePreviewContainerRef.current) return;

      stopPreviewRuntime();

      if (livePreviewAbortRef.current) {
        livePreviewAbortRef.current.abort();
      }

      const controller = new AbortController();
      livePreviewAbortRef.current = controller;
      setIsLoadingLivePreview(true);

      try {
        const res = await fetch(activeVariantData.previewRenderUrl, {
          signal: controller.signal,
          cache: "no-store",
        });

        const parsed = await readJsonSafely(res);

        if (!parsed.ok) {
          throw new Error(t.generationErrorFallback);
        }

        const data = parsed.data;

        if (!res.ok || !data?.ok || !data?.render) {
          throw new Error("Preview render is not ready yet.");
        }

        const descriptor = {
          job: data.render.renderJob,
          tracks: data.render.tracks,
          preview: {
            posterUrl: data.render.poster?.url || activeVariantData.poster || "",
          },
        };

        const runtime = await runBrowserPreviewRenderer({
          container: livePreviewContainerRef.current,
          renderDescriptor: descriptor,
        });

        previewRuntimeRef.current = runtime;
        setIsPreviewPlaying(false);
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error("Live preview failed:", error);
        }
      } finally {
        setIsLoadingLivePreview(false);
      }
    }

    loadLivePreview();

    return () => {
      stopPreviewRuntime();
    };
  }, [activeVariantData?.id, activeVariantData?.previewRenderUrl]);

  useEffect(() => {
    return () => {
      stopPreviewRuntime();
      if (livePreviewAbortRef.current) {
        livePreviewAbortRef.current.abort();
      }
    };
  }, []);

  const handleTogglePreviewPlayback = () => {
    const runtime = previewRuntimeRef.current;
    if (!runtime) return;

    if (isPreviewPlaying) {
      if (runtime.pause) {
        runtime.pause();
      } else if (runtime.stop) {
        runtime.stop();
      }
      setIsPreviewPlaying(false);
      return;
    }

    if (runtime.play) {
      runtime.play();
      setIsPreviewPlaying(true);
    }
  };

  const handleFiles = async (fileList) => {
    const list = Array.from(fileList || []);
    if (!list.length) return;

    const next = await Promise.all(
      list.slice(0, MAX_ASSETS).map((file, idx) => fileToAsset(file, idx))
    );

    setAssets((prev) => [...next, ...prev].slice(0, MAX_ASSETS));
  };

  const removeAsset = (id) => {
    setAssets((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFillForMe = async () => {
    const nextFormat = selectedFormat || "business";
    setSelectedFormat(nextFormat);

    if (!topic.trim()) {
      setTopic(t.topicByFormat[nextFormat] || t.topicByFormat.default);
    }

    if (!hasMaterials && assets.length === 0) {
      setAssets([
        {
          id: "a1",
          src: DEMO_POSTERS[0],
          name: "demo-1.jpg",
          ext: "jpg",
          kind: "image",
        },
        {
          id: "a2",
          src: DEMO_POSTERS[1],
          name: "demo-2.jpg",
          ext: "jpg",
          kind: "image",
        },
        {
          id: "a3",
          src: DEMO_POSTERS[2],
          name: "demo-3.jpg",
          ext: "jpg",
          kind: "image",
        },
      ]);
    }
  };

  const handleFindTrend = async () => {
    if (isFindingTrend) return;

    setIsFindingTrend(true);
    setTrendError("");

    try {
      const format = selectedFormat || "other";
      const params = new URLSearchParams({
        format,
        topic: topic.trim(),
        locale: lang === "ru" ? "RU" : "US",
        language: lang,
      });

      if (link.trim()) {
        params.set("links", link.trim());
      }
      if (topic.trim()) {
        params.set("notes", topic.trim());
      }

      const res = await fetch(`/api/trends?${params.toString()}`, {
        cache: "no-store",
      });

      const parsed = await readJsonSafely(res);

      if (!parsed.ok) {
        throw new Error(t.trendError);
      }

      const result = parsed.data;

      if (!res.ok || !result?.ok || !result?.best) {
        throw new Error(result?.error?.message || t.trendError);
      }

      const best = result.best;

      if (!selectedFormat) {
        setSelectedFormat(format);
      }

      if (best.topic) {
        setTopic(best.topic);
      }

      if (best.suggestedTone) {
        const nextTone = mapTrendToneToUi(best.suggestedTone, lang);
        if (COPY[lang]?.tones?.includes(nextTone)) {
          setTone(nextTone);
        }
      }

      if (best.suggestedDuration) {
        const nextDuration = mapTrendDurationToUi(best.suggestedDuration, lang);
        if (COPY[lang]?.durations?.includes(nextDuration)) {
          setDuration(nextDuration);
        }
      }
    } catch (error) {
      console.error("Trend lookup failed:", error);
      setTrendError(error?.message || t.trendError);
    } finally {
      setIsFindingTrend(false);
    }
  };

  const handlePrimaryAction = () => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      scrollToPreview();
    }

    if (variants.length) {
      setShowConfirmRegenerate(true);
      return;
    }

    if (canGenerate) {
      runGenerate({ force: true });
      return;
    }

    scrollToPreview();
  };

  const handleConfirmRegenerate = () => {
    setShowConfirmRegenerate(false);
    setLastGeneratedFingerprint("");
    runGenerate({ force: true });
  };

  const handleDownload = async () => {
    if (!activeVariantData?.previewRenderUrl) return;

    setIsDownloading(true);
    setGenerationError("");

    try {
      const tgUser = getTelegramUser();

      const requestId = activeVariantData?.previewStatusUrl
        ? new URL(
            activeVariantData.previewStatusUrl,
            window.location.origin
          ).searchParams.get("requestId")
        : null;

      if (!requestId) {
        throw new Error(t.downloadError);
      }

      const params = new URLSearchParams({
        requestId,
        variantId: activeVariantData.id,
      });

      if (tgUser?.telegramId || tgUser?.telegram_id || tgUser?.id) {
        params.set(
          "telegramId",
          String(tgUser.telegramId || tgUser.telegram_id || tgUser.id)
        );
      }
      if (tgUser?.username || tgUser?.userName) {
        params.set(
          "username",
          String(tgUser.username || tgUser.userName).replace(/^@/, "")
        );
      }

      const res = await fetch(`/api/download?${params.toString()}`, {
        cache: "no-store",
      });

      const parsed = await readJsonSafely(res);

      if (!parsed.ok) {
        throw new Error(t.downloadError);
      }

      const data = parsed.data;

      if (res.status === 403) {
        const access = data?.access;
        if (access?.ui?.modal === "auth") {
          throw new Error(t.authRequired);
        }
        if (access?.ui?.redirectTo) {
          window.location.href = access.ui.redirectTo;
          return;
        }
        throw new Error(t.planRequired);
      }

      if (!res.ok || !data?.ok || !data?.download?.descriptor) {
        throw new Error(data?.error?.message || t.downloadError);
      }

      await exportVideo(data.download.descriptor);
    } catch (error) {
      console.error("Download failed:", error);
      setGenerationError(error?.message || t.downloadError);
      scrollToPreview();
    } finally {
      setIsDownloading(false);
    }
  };

  const toggleFormat = (item) => {
    setSelectedFormat((prev) => (prev === item.id ? null : item.id));
  };

  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-[#dfe6fb] pb-20 pt-0 md:px-8 xl:px-0">
        <div className="mx-auto w-full max-w-[1120px] lg:grid lg:grid-cols-[1fr_354px] lg:gap-7">
          <div className="min-w-0 space-y-4 md:space-y-5">
            <section className="workspace-section workspace-section-transparent w-full bg-transparent">
              <div className="section-inner py-0 md:px-0">
                <div className="flex flex-wrap items-baseline gap-2 border-b border-white/60 pb-4 md:pb-5">
                  <h2 className="text-[20px] font-bold text-[#7a5d9d] md:text-[24px]">
                    {t.step1Title}
                  </h2>
                  <span className="text-[15px] text-[#8d84b8] md:text-[18px]">
                    {t.step1Tail}
                  </span>
                  <InfoHint text={t.step1Hint} />
                </div>

                <div className="mt-5 md:mt-7">
                  <div className="desktop-scroll mobile-swipe overflow-x-auto pb-3">
                    <div className="flex w-max gap-[16px] pr-2 md:gap-[18px]">
                      {FORMAT_ITEMS.map((item) => (
                        <FormatTile
                          key={item.id}
                          icon={item.icon}
                          label={t.formats[item.id]}
                          active={selectedFormat === item.id}
                          onClick={() => toggleFormat(item)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:mt-6 md:grid-cols-2">
                  <PixelButton
                    color="soft"
                    className="w-full"
                    onClick={handleFindTrend}
                    disabled={isFindingTrend}
                  >
                    {isFindingTrend ? t.trendLoading : t.trend}
                  </PixelButton>
                  <PixelButton
                    color="violet"
                    className="w-full"
                    onClick={handleFillForMe}
                  >
                    {t.doForMe}
                  </PixelButton>
                </div>

                {trendError ? (
                  <div
                    className="mt-4 flex items-start gap-3 bg-[#ffe4e8] px-4 py-4 text-[14px] text-[#8a3550]"
                    style={pixelClip()}
                  >
                    <AlertCircle className="mt-[1px] h-5 w-5 shrink-0" />
                    <div>{trendError}</div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="workspace-section -mx-4 w-[calc(100%+32px)] bg-[#cad4f4] md:mx-0 md:w-full">
              <div className="section-inner w-full py-5 md:p-7">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="text-[20px] font-bold text-[#4d5b92] md:text-[24px]">
                    {t.step2Title}
                  </h2>
                  <span className="text-[15px] text-[#5f6796] md:text-[18px]">
                    {t.step2Tail}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-0 md:mt-7 md:grid-cols-[1fr_200px]">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();
                      await handleFiles(e.dataTransfer.files);
                    }}
                    className="border-[3px] border-dashed border-white bg-[#d9e2fb] px-4 py-7 text-center md:px-5"
                  >
                    <div className="text-[16px] font-bold text-[#4d5b92] md:text-[18px]">
                      {t.dropTitle}
                    </div>
                    <div className="mt-2 text-[14px] text-[#4d5b92] md:text-[15px]">
                      {t.dropHint}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 bg-[#91a5d9] px-5 py-5 text-[17px] font-bold text-white md:mt-0 md:py-7 md:text-[18px]"
                    style={pixelClip()}
                  >
                    {t.upload}
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={async (e) => handleFiles(e.target.files)}
                  />
                </div>

                <div className="mt-5 md:mt-6">
                  <input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder={t.linkPlaceholder}
                    className="w-full bg-white px-5 py-5 text-[15px] text-[#7f86a8] outline-none placeholder:text-[#b0b8d9]"
                  />
                </div>

                {assets.length > 0 && (
                  <div className="mt-5 md:mt-7">
                    <div className="desktop-scroll mobile-swipe overflow-x-auto pb-3">
                      <div className="flex w-max gap-3 pr-2 md:gap-4">
                        {visibleAssets.map((item) => (
                          <AssetThumb
                            key={item.id}
                            item={item}
                            removeLabel={t.removeFile}
                            onRemove={() => removeAsset(item.id)}
                          />
                        ))}

                        {assets.length < ASSET_SLOTS &&
                          Array.from(
                            { length: Math.max(0, ASSET_SLOTS - assets.length) },
                            (_, i) => assets.length + i + 1
                          ).map((n) => (
                            <div
                              key={n}
                              className="flex h-[58px] w-[58px] shrink-0 items-center justify-center bg-white text-[18px] font-semibold text-[#c8c9df] md:h-[60px] md:w-[60px]"
                            >
                              {n}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="workspace-section -mx-4 w-[calc(100%+32px)] bg-[#c9b8f3] md:mx-0 md:w-full">
              <div className="section-inner w-full py-5 md:p-7">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="text-[20px] font-bold text-[#5b447b] md:text-[24px]">
                    {t.step3Title}
                  </h2>
                  <span className="text-[15px] text-[#6b5b8f] md:text-[18px]">
                    {t.step3Tail}
                  </span>
                </div>

                <div className="mt-5 md:mt-7">
                  <textarea
                    rows={3}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={topicPlaceholder}
                    className="w-full resize-none bg-white px-5 py-5 text-[15px] text-[#6b5fa0] outline-none placeholder:text-[#7d72a8] md:text-[16px] md:px-6"
                  />
                </div>

                <div className="mt-4">
                  <CaptionSwitch
                    checked={showCaptions}
                    onChange={setShowCaptions}
                    label={t.captionsLabel}
                  />
                </div>

                <div className="mt-3 text-[12px] font-semibold uppercase tracking-[0.04em] text-[#7b69ae]">
                  {t.autoMode}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:mt-6 md:grid-cols-3">
                  <PlainSelect
                    label={t.duration}
                    value={duration}
                    onChange={setDuration}
                    options={t.durations}
                  />
                  <PlainSelect
                    label={t.tone}
                    value={tone}
                    onChange={setTone}
                    options={t.tones}
                  />
                  <PlainSelect
                    label={t.voice}
                    value={voice}
                    onChange={setVoice}
                    options={t.voices}
                  />
                </div>
              </div>
            </section>
          </div>

          <div
            ref={previewRef}
            className="mt-6 px-4 lg:mt-0 lg:px-0 lg:sticky lg:top-6 lg:self-start"
          >
            <div className="space-y-5">
              <div className="overflow-hidden bg-[#111111]" style={pixelClip()}>
                <div className="checkerboard relative aspect-[9/16] w-full">
                  {isGenerating ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="flex flex-col items-center text-white">
                        <Loader2 className="h-10 w-10 animate-spin" />
                        <div className="mt-5 text-[16px] font-semibold">
                          {t.previewPreparing}
                        </div>
                      </div>
                    </div>
                  ) : variants.length ? (
                    <div className="relative h-full w-full">
                      <div
                        ref={livePreviewContainerRef}
                        className="absolute inset-0 h-full w-full"
                      />
                      {!activeVariantData?.readyForPreviewRender &&
                      previewPoster ? (
                        <>
                          <img
                            src={previewPoster}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0.38)_100%)]" />
                        </>
                      ) : null}

                      <div className="absolute inset-x-4 top-4 flex items-center justify-between">
                        <div
                          className="bg-white/85 px-3 py-2 text-[12px] font-semibold text-[#2b2b35]"
                          style={pixelClip()}
                        >
                          {isLoadingLivePreview ? t.loadingPreview : t.previewReady}
                        </div>
                        {activeVariantData?.score ? (
                          <div
                            className="bg-[#8c62ff]/90 px-3 py-2 text-[12px] font-semibold text-white"
                            style={pixelClip()}
                          >
                            Score {activeVariantData.score}
                          </div>
                        ) : null}
                      </div>

                      <div className="absolute inset-x-4 bottom-4 space-y-2">
                        <button
                          type="button"
                          onClick={handleTogglePreviewPlayback}
                          disabled={!previewRuntimeRef.current || isLoadingLivePreview}
                          className={`inline-flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-white ${
                            !previewRuntimeRef.current || isLoadingLivePreview
                              ? "cursor-not-allowed bg-black/45 opacity-70"
                              : "bg-black/65 hover:bg-black/75"
                          }`}
                          style={pixelClip()}
                        >
                          {isPreviewPlaying ? (
                            <Pause size={14} fill="currentColor" />
                          ) : (
                            <Play size={14} fill="currentColor" />
                          )}
                          {isPreviewPlaying ? t.previewPause : t.previewPlay}
                        </button>

                        {activeVariantData?.creative?.hook ? (
                          <div
                            className="bg-black/65 px-3 py-3 text-[14px] leading-[1.4] text-white"
                            style={pixelClip()}
                          >
                            {activeVariantData.creative.hook}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex h-full w-full items-center justify-center">
                      <div className="relative z-10 flex flex-col items-center">
                        <div
                          className="flex h-[96px] w-[96px] items-center justify-center bg-white text-[#1d1d1d]"
                          style={pixelClip()}
                        >
                          <Play size={42} fill="currentColor" />
                        </div>
                        <div className="mt-8 text-[18px] font-semibold text-[#8c8c8c]">
                          {t.preview}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {generationError ? (
                <div
                  className="flex items-start gap-3 bg-[#ffe4e8] px-4 py-4 text-[14px] text-[#8a3550]"
                  style={pixelClip()}
                >
                  <AlertCircle className="mt-[1px] h-5 w-5 shrink-0" />
                  <div>{generationError}</div>
                </div>
              ) : null}

              <div className="bg-[#d7e3f3]">
                <div className="grid grid-cols-3 gap-[12px] md:gap-[18px]">
                  {[0, 1, 2].map((idx) => {
                    const item = variants[idx];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => item && setActiveVariant(idx)}
                        className={`relative aspect-[0.78/1] overflow-hidden ${
                          idx === activeVariant ? "ring-2 ring-[#8d62ff]" : ""
                        }`}
                      >
                        {item ? (
                          <>
                            {item.poster ? (
                              <img
                                src={item.poster}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-[#26232f] text-[24px] font-semibold text-[#c3c3d0] md:text-[26px]">
                                {idx + 1}
                              </div>
                            )}
                            <div className="absolute inset-x-2 bottom-2">
                              <div
                                className="truncate bg-black/70 px-2 py-1 text-[10px] font-semibold text-white"
                                style={pixelClip()}
                              >
                                {item.label?.ru ||
                                  item.label?.en ||
                                  `Variant ${idx + 1}`}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-[#26232f] text-[24px] font-semibold text-[#c3c3d0] md:text-[26px]">
                            {idx + 1}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="px-3 pb-5 pt-4 text-center text-[16px] text-[#2a2a2a] md:text-[17px]">
                  {t.createdThree}
                </div>
              </div>

              <PixelButton
                color="green"
                className="w-full text-[18px]"
                icon={
                  isDownloading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Download size={18} />
                  )
                }
                disabled={!variants.length || isDownloading}
                onClick={handleDownload}
              >
                {isDownloading ? t.downloading : t.download}
              </PixelButton>

              {variants.length > 0 && (
                <PreviewReadyCard
                  t={t}
                  currentFormatLabel={currentFormatLabel}
                  duration={duration}
                  tone={tone}
                />
              )}

              <GenerationInfoCard t={t} activeVariantData={activeVariantData} />

              <div className="hidden lg:block">
                <ProgressActionButton
                  text={isGenerating ? t.generating : desktopActionText}
                  progress={progress}
                  onClick={handlePrimaryAction}
                  disabled={isGenerating}
                  showProgress={progress > 0}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
        <ProgressActionButton
          text={isGenerating ? t.generating : mobileActionText}
          progress={progress}
          onClick={handlePrimaryAction}
          disabled={isGenerating}
          mobile
          showProgress={progress > 0}
        />
      </div>

      <ConfirmModal
        t={t}
        open={showConfirmRegenerate}
        onClose={() => setShowConfirmRegenerate(false)}
        onConfirm={handleConfirmRegenerate}
      />

      <style jsx>{`
        .checkerboard {
          background-color: #17151d;
          background-image:
            linear-gradient(45deg, #2a2437 25%, transparent 25%),
            linear-gradient(-45deg, #2a2437 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #2a2437 75%),
            linear-gradient(-45deg, transparent 75%, #2a2437 75%);
          background-size: 64px 64px;
          background-position: 0 0, 0 32px, 32px -32px, -32px 0px;
        }

        .mobile-swipe {
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .mobile-swipe::-webkit-scrollbar {
          display: none;
        }

        .desktop-scroll {
          scrollbar-width: thin;
          scrollbar-color: #bb9af9 rgba(255, 255, 255, 0.72);
        }

        .desktop-scroll::-webkit-scrollbar {
          height: 8px;
        }

        .desktop-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.72);
          border-radius: 999px;
        }

        .desktop-scroll::-webkit-scrollbar-thumb {
          background: #bb9af9;
          border-radius: 999px;
        }

        .desktop-scroll::-webkit-scrollbar-thumb:hover {
          background: #a77df0;
        }

        @media (max-width: 767px) {
          .workspace-section {
            width: 100vw;
            margin-left: calc(50% - 50vw);
            margin-right: calc(50% - 50vw);
          }

          .workspace-section-transparent {
            padding-left: 0;
            padding-right: 0;
          }

          .section-inner {
            width: calc(100vw - 32px);
            margin-left: auto;
            margin-right: auto;
            padding-left: 0;
            padding-right: 0;
          }
        }
      `}</style>
    </>
  );
}