"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  Play,
  Info,
  X,
} from "lucide-react";

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
    dropHint: "jpeg, png, mp4, avi, mp3, PDF, DOC, TXT.",
    upload: "Загрузить",
    linkPlaceholder: "https://Ссылка на любой источник",
    duration: "Длительность",
    tone: "Тон",
    voice: "Голос",
    trend: "Найди тренд",
    doForMe: "Сделай за меня",
    preview: "Предпросмотр",
    previewAction: "Предпросмотр",
    generateAction: "Сгенерировать!",
    regenerateAction: "Перегенерировать",
    createdThree: "Создано три варианта",
    download: "Скачать видео",
    generating: "Генерируем 3 варианта...",
    examplePrefix: "Например:",
    variant: "Формат",
    readyToPost: "Готово для выгрузки в соцсети:",
    fileWeight: "Вес файла",
    fileFormat: "Файл",
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
    socials: {
      instagram: "Instagram",
      tiktok: "TikTok",
      youtube: "YouTube",
      telegram: "Telegram",
    },
    formats: {
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
    dropHint: "jpeg, png, mp4, avi, mp3, PDF, DOC, TXT.",
    upload: "Upload",
    linkPlaceholder: "https://Link to any source",
    duration: "Duration",
    tone: "Tone",
    voice: "Voice",
    trend: "Find trend",
    doForMe: "Do it for me",
    preview: "Preview",
    previewAction: "Preview",
    generateAction: "Generate!",
    regenerateAction: "Regenerate",
    createdThree: "Three variants created",
    download: "Download video",
    generating: "Generating 3 variants...",
    examplePrefix: "For example:",
    variant: "Format",
    readyToPost: "Ready to upload to social media:",
    fileWeight: "File size",
    fileFormat: "File",
    durations: ["10 sec", "15 sec", "20 sec", "30 sec", "40 sec", "60 sec"],
    tones: ["Dynamic", "Calm", "Premium", "Friendly"],
    voices: ["Automatic", "Energetic", "Calm", "Narrator"],
    socials: {
      instagram: "Instagram",
      tiktok: "TikTok",
      youtube: "YouTube",
      telegram: "Telegram",
    },
    formats: {
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

function LogoArrowIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <rect x="4" y="4" width="6" height="6" />
      <rect x="10" y="10" width="6" height="6" />
      <rect x="16" y="4" width="4" height="4" />
    </svg>
  );
}

function InstagramIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="igGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#feda75" />
          <stop offset="35%" stopColor="#fa7e1e" />
          <stop offset="65%" stopColor="#d62976" />
          <stop offset="100%" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="url(#igGrad)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="white" strokeWidth="1.8" />
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
      } ${disabled ? "cursor-not-allowed opacity-55" : "hover:brightness-[1.03]"}`}
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

function AssetThumb({ src, onRemove }) {
  return (
    <div className="group relative h-[58px] w-[58px] shrink-0 overflow-hidden bg-white md:h-[60px] md:w-[60px]">
      <img src={src} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center bg-black/55 text-white opacity-100 transition md:opacity-0 md:group-hover:opacity-100"
        aria-label="Remove file"
      >
        <X size={14} />
      </button>
    </div>
  );
}

function AssetArrowSlot() {
  return (
    <button
      type="button"
      className="flex h-[58px] w-[58px] shrink-0 items-center justify-center bg-white text-[#b7bddd] md:h-[60px] md:w-[60px]"
      aria-label="More files"
    >
      <LogoArrowIcon className="h-7 w-7 text-[#b7bddd]" />
    </button>
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

function PreviewReadyCard({
  t,
  currentFormatLabel,
  duration,
  tone,
}) {
  return (
    <div className="space-y-2 text-[13px] text-[#6f7394]">
      <div className="font-semibold text-[#5a628d]">{t.readyToPost}</div>

      <div>
        {t.variant}: {currentFormatLabel || "—"} · {duration} · {tone} · MP4 ·{" "}
        {t.fileWeight}: 14.8 MB
      </div>

      <div className="flex items-center gap-3 pt-1">
        <div className="flex items-center gap-2 text-[13px] text-[#4c557d]">
          <InstagramIcon className="h-5 w-5 shrink-0" />
          <span>{t.socials.instagram}</span>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-[#4c557d]">
          <TikTokIcon className="h-5 w-5 shrink-0" />
          <span>{t.socials.tiktok}</span>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-[#4c557d]">
          <YouTubeIcon className="h-5 w-5 shrink-0" />
          <span>{t.socials.youtube}</span>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-[#4c557d]">
          <TelegramIcon className="h-5 w-5 shrink-0" />
          <span>{t.socials.telegram}</span>
        </div>
      </div>
    </div>
  );
}

export default function AgentWorkspace({ lang = "ru" }) {
  const t = COPY[lang] || COPY.ru;

  const [selectedFormat, setSelectedFormat] = useState(null);
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(t.durations[3]);
  const [tone, setTone] = useState(t.tones[0]);
  const [voice, setVoice] = useState(t.voices[0]);
  const [link, setLink] = useState("");
  const [assets, setAssets] = useState([
    { id: "a1", src: DEMO_POSTERS[0] },
    { id: "a2", src: DEMO_POSTERS[1] },
    { id: "a3", src: DEMO_POSTERS[2] },
    { id: "a4", src: DEMO_POSTERS[3] },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState([]);
  const [activeVariant, setActiveVariant] = useState(0);

  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const categoryRef = useRef(null);

  const previewPoster = useMemo(() => {
    if (variants.length) {
      return variants[activeVariant]?.poster || DEMO_POSTERS[0];
    }
    return DEMO_POSTERS[1];
  }, [variants, activeVariant]);

  const previewVideo = useMemo(() => {
    if (variants.length) return variants[activeVariant]?.video || "";
    return "";
  }, [variants, activeVariant]);

  const currentFormatLabel = selectedFormat ? t.formats[selectedFormat] : "";

  const topicPlaceholder = `${t.examplePrefix} ${
    t.topicByFormat[selectedFormat] || t.topicByFormat.default
  }`;

  const hasCategory = Boolean(selectedFormat);
  const hasMaterials = assets.length > 0 || link.trim().length > 3;
  const hasTopic = topic.trim().length > 8;

  const progress =
    (hasCategory ? 20 : 0) +
    (hasMaterials ? 35 : 0) +
    (hasTopic ? 45 : 0);

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

  const handleFiles = (fileList) => {
    const list = Array.from(fileList || []);
    if (!list.length) return;

    const next = list.slice(0, 8).map((file, idx) => {
      const isImage = file.type.startsWith("image/");
      return {
        id: `${Date.now()}-${idx}`,
        src: isImage ? URL.createObjectURL(file) : "",
        file,
      };
    });

    setAssets((prev) =>
      [...next, ...prev].filter((item) => item.src).slice(0, 8)
    );
  };

  const removeAsset = (id) => {
    setAssets((prev) => prev.filter((item) => item.id !== id));
  };

  const runGenerate = () => {
    if (isGenerating || !canGenerate) return;

    setIsGenerating(true);

    setTimeout(() => {
      setVariants([
        {
          id: "v1",
          poster: assets[0]?.src || DEMO_POSTERS[0],
          video:
            "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        },
        {
          id: "v2",
          poster: assets[1]?.src || DEMO_POSTERS[1],
          video:
            "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        },
        {
          id: "v3",
          poster: assets[2]?.src || DEMO_POSTERS[2],
          video:
            "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        },
      ]);
      setActiveVariant(0);
      setIsGenerating(false);

      requestAnimationFrame(() => {
        previewRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }, 1400);
  };

  const handleFillForMe = () => {
    const nextFormat = selectedFormat || "business";
    setSelectedFormat(nextFormat);

    if (!topic.trim()) {
      setTopic(t.topicByFormat[nextFormat] || t.topicByFormat.default);
    }
  };

  const handlePrimaryAction = () => {
    if (variants.length) {
      runGenerate();
      return;
    }

    if (canGenerate) {
      runGenerate();
      return;
    }

    previewRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const toggleFormat = (item) => {
    setSelectedFormat((prev) => (prev === item.id ? null : item.id));
  };

  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-[#dfe6fb] pb-20 pt-0 md:px-8 xl:px-0">
        <div className="mx-auto w-full max-w-[1120px] lg:grid lg:grid-cols-[1fr_354px] lg:gap-7">
          <div className="min-w-0 space-y-4 md:space-y-5">
            <section className="w-full bg-transparent">
              <div className="section-inner px-4 py-0 md:px-0">
                <div className="flex flex-wrap items-baseline gap-2 border-b border-white/60 pb-4 md:pb-5">
                  <h2 className="text-[20px] font-bold text-[#7a5d9d] md:text-[24px]">
                    {t.step1Title}
                  </h2>
                  <span className="text-[15px] text-[#8d84b8] md:text-[18px]">
                    {t.step1Tail}
                  </span>
                  <InfoHint text={t.step1Hint} />
                </div>

                <div className="relative mt-5 md:mt-7">
                  <div className="flex items-start gap-4">
                    <div
                      ref={categoryRef}
                      className="no-scrollbar min-w-0 flex-1 overflow-x-auto pb-2"
                    >
                      <div className="flex gap-[16px] pl-[2px] md:gap-[18px]">
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

                    <button
                      type="button"
                      onClick={() =>
                        categoryRef.current?.scrollBy({
                          left: 320,
                          behavior: "smooth",
                        })
                      }
                      className="hidden shrink-0 flex-col items-center md:flex"
                      aria-label="Scroll formats"
                    >
                      <div className="flex h-[88px] w-[88px] items-center justify-center bg-white">
                        <LogoArrowIcon className="h-8 w-8 text-[#b78dff]" />
                      </div>
                      <div className="mt-3 text-center text-[15px] font-semibold text-[#171717]">
                        Ещё
                      </div>
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:mt-6 md:grid-cols-2">
                  <PixelButton color="soft" className="w-full">
                    {t.trend}
                  </PixelButton>
                  <PixelButton
                    color="violet"
                    className="w-full"
                    onClick={handleFillForMe}
                  >
                    {t.doForMe}
                  </PixelButton>
                </div>
              </div>
            </section>

            <section className="w-full bg-[#cad4f4]">
              <div className="section-inner px-4 py-5 md:p-7">
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
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFiles(e.dataTransfer.files);
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
                    onChange={(e) => handleFiles(e.target.files)}
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
                  <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto pb-1 md:mt-7 md:gap-4">
                    {assets.map((item) => (
                      <AssetThumb
                        key={item.id}
                        src={item.src}
                        onRemove={() => removeAsset(item.id)}
                      />
                    ))}

                    {Array.from(
                      { length: Math.max(0, 8 - assets.length) },
                      (_, i) => assets.length + i + 1
                    ).map((n) => (
                      <div
                        key={n}
                        className="flex h-[58px] w-[58px] shrink-0 items-center justify-center bg-white text-[18px] font-semibold text-[#c8c9df] md:h-[60px] md:w-[60px]"
                      >
                        {n}
                      </div>
                    ))}

                    <AssetArrowSlot />
                  </div>
                )}
              </div>
            </section>

            <section className="w-full bg-[#c9b8f3]">
              <div className="section-inner px-4 py-5 md:p-7">
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
                  {previewVideo ? (
                    <video
                      src={previewVideo}
                      controls
                      className="h-full w-full object-cover"
                      poster={previewPoster}
                    />
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
                icon={<Download size={18} />}
                disabled={!variants.length}
              >
                {t.download}
              </PixelButton>

              <div className="hidden lg:block">
                <ProgressActionButton
                  text={isGenerating ? t.generating : desktopActionText}
                  progress={progress}
                  onClick={handlePrimaryAction}
                  disabled={isGenerating}
                  showProgress={hasCategory}
                />
              </div>

              {variants.length > 0 && (
                <PreviewReadyCard
                  t={t}
                  currentFormatLabel={currentFormatLabel}
                  duration={duration}
                  tone={tone}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
        <div className="space-y-3">
          {variants.length > 0 && (
            <div className="rounded-none bg-[#dfe6fb] px-1 py-0">
              <PreviewReadyCard
                t={t}
                currentFormatLabel={currentFormatLabel}
                duration={duration}
                tone={tone}
              />
            </div>
          )}

          <ProgressActionButton
            text={isGenerating ? t.generating : mobileActionText}
            progress={progress}
            onClick={handlePrimaryAction}
            disabled={isGenerating}
            mobile
            showProgress={hasCategory}
          />
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

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

        @media (max-width: 767px) {
          section.w-full.bg-transparent,
          section.w-full.bg-\[\#cad4f4\],
          section.w-full.bg-\[\#c9b8f3\] {
            width: 100vw;
            margin-left: calc(50% - 50vw);
            margin-right: calc(50% - 50vw);
          }

          .section-inner {
            padding-left: 16px;
            padding-right: 16px;
          }
        }
      `}</style>
    </>
  );
}