import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  Clapperboard,
  Captions,
  Send,
  Link as LinkIcon,
  Settings2,
  FileText,
  Layers3,
  Rocket,
  Clock3,
  CheckCircle2,
  Wand2,
  Flame,
  Newspaper,
  Brain,
  Zap,
  Briefcase,
  BadgeHelp,
  Palette,
  Play,
  Save,
  RefreshCcw,
  ChevronDown,
  Target,
  Download,
  FolderOutput,
  ShieldCheck,
  AlertCircle,
  Check,
  Hash,
  Users,
  AudioLines,
  Globe,
  MonitorPlay,
  Youtube,
  Instagram,
  Music4,
  Package,
  Video,
  Image as ImageIcon,
  Library,
  Bot,
  LayoutTemplate,
  FileVideo,
  ListChecks,
  FolderKanban,
  Cpu,
  Radio,
  LibraryBig,
  SlidersHorizontal,
} from "lucide-react";

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_50px_rgba(88,94,160,0.10)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, desc, action = null }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-2xl bg-slate-100 p-2 text-slate-700">
          <Icon size={16} />
        </div>
        <div>
          <div className="text-lg font-black text-slate-900">{title}</div>
          {desc ? <div className="mt-1 text-sm text-slate-500">{desc}</div> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

function Input({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <label className="block space-y-1.5">
      <div className="text-xs font-bold text-slate-600">{label}</div>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 4,
}) {
  return (
    <label className="block space-y-1.5">
      <div className="text-xs font-bold text-slate-600">{label}</div>
      <textarea
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
      />
    </label>
  );
}

function Select({ label, value, onChange, options = [] }) {
  return (
    <label className="block space-y-1.5">
      <div className="text-xs font-bold text-slate-600">{label}</div>
      <div className="relative">
        <select
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full appearance-none rounded-2xl border border-slate-300 bg-white px-3.5 py-3 pr-10 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </label>
  );
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      onClick={() => onChange?.(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-400 hover:bg-white"
    >
      <div>
        <div className="text-sm font-bold text-slate-900">{label}</div>
        {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
      </div>

      <div
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-sky-500" : "bg-slate-300"
        }`}
      >
        <div
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </div>
    </button>
  );
}

function Pill({ children, className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${className}`}
    >
      {children}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
        {Icon ? <Icon size={13} /> : null}
        {label}
      </div>
      <div className="mt-2 text-lg font-black text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

function MiniInfo({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-300 bg-slate-50 px-3.5 py-3">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {Icon ? <Icon size={12} /> : null}
        {label}
      </div>
      <div className="mt-2 text-sm font-bold text-slate-800">{value || "—"}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
        <Icon size={18} />
      </div>
      <div className="mt-3 text-sm font-bold text-slate-900">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{desc}</div>
    </div>
  );
}

function PlatformPickerCard({ item, checked, onToggle }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onToggle(item.key)}
      className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
        checked
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            checked ? "bg-white/15" : "bg-white"
          }`}
        >
          <Icon size={20} className={checked ? "text-white" : item.iconClassName} />
        </div>
        <div>
          <div className={`text-sm font-bold ${checked ? "text-white" : "text-slate-900"}`}>
            {item.label}
          </div>
          <div className={`text-xs ${checked ? "text-white/75" : "text-slate-500"}`}>
            {item.hint}
          </div>
        </div>
      </div>

      <div
        className={`flex h-6 w-6 items-center justify-center rounded-full border ${
          checked
            ? "border-white bg-white text-slate-900"
            : "border-slate-300 bg-white text-transparent"
        }`}
      >
        <Check size={14} />
      </div>
    </button>
  );
}

function ModeCard({ item, active, onClick }) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onClick(item.key || item.value)}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
            active ? "bg-white/15 text-white" : "bg-white text-slate-600"
          }`}
        >
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <div className={`text-sm font-black ${active ? "text-white" : "text-slate-900"}`}>
            {item.label}
          </div>
          <div className={`mt-1 text-xs ${active ? "text-white/75" : "text-slate-500"}`}>
            {item.desc}
          </div>
        </div>
      </div>
    </button>
  );
}

function ChoiceCard({ title, desc, active, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
            active ? "bg-white/15 text-white" : "bg-white text-slate-600"
          }`}
        >
          {Icon ? <Icon size={18} /> : <Check size={16} />}
        </div>
        <div className="min-w-0">
          <div className={`text-sm font-black ${active ? "text-white" : "text-slate-900"}`}>
            {title}
          </div>
          {desc ? (
            <div className={`mt-1 text-xs ${active ? "text-white/75" : "text-slate-500"}`}>
              {desc}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  );
}

const categoryOptions = [
  { value: "motivation", label: "Мотивация" },
  { value: "news", label: "Новости" },
  { value: "ai-tools", label: "AI-инструменты" },
  { value: "crypto", label: "Крипта" },
  { value: "business", label: "Бизнес" },
  { value: "storytelling", label: "Истории" },
  { value: "education", label: "Обучение" },
  { value: "reddit", label: "Reddit-истории" },
];

const voiceOptions = [
  { value: "auto", label: "AI voice" },
  { value: "energetic", label: "Энергичный" },
  { value: "calm", label: "Спокойный" },
  { value: "storyteller", label: "Рассказчик" },
  { value: "news", label: "Новостной" },
];

const formatOptions = [
  { value: "9:16", label: "Вертикальное 9:16" },
  { value: "1:1", label: "Квадрат 1:1" },
  { value: "16:9", label: "Горизонтальное 16:9" },
];

const publishModeOptions = [
  { value: "manual", label: "Ручное одобрение" },
  { value: "autopost", label: "Автопостинг" },
];

const frequencyOptions = [
  { value: "daily", label: "Каждый день" },
  { value: "weekdays", label: "По будням" },
  { value: "3x-week", label: "3 раза в неделю" },
  { value: "custom", label: "Свое расписание" },
];

const iconPresets = [
  { key: "spark", label: "Искра", icon: Sparkles },
  { key: "flame", label: "Огонь", icon: Flame },
  { key: "news", label: "Новости", icon: Newspaper },
  { key: "brain", label: "Мозг", icon: Brain },
  { key: "zap", label: "Быстро", icon: Zap },
  { key: "work", label: "Дело", icon: Briefcase },
  { key: "help", label: "Гайд", icon: BadgeHelp },
  { key: "magic", label: "Магия", icon: Wand2 },
];

const accentPresets = [
  { key: "violet", name: "Фиолетовый", className: "from-violet-500 to-fuchsia-500" },
  { key: "sky", name: "Синий", className: "from-sky-500 to-cyan-500" },
  { key: "emerald", name: "Изумрудный", className: "from-emerald-500 to-teal-500" },
  { key: "amber", name: "Янтарный", className: "from-amber-500 to-orange-500" },
  { key: "rose", name: "Розовый", className: "from-rose-500 to-pink-500" },
  { key: "slate", name: "Сланец", className: "from-slate-500 to-slate-700" },
];

const platformOptions = [
  {
    key: "telegram",
    label: "Telegram",
    hint: "Канал / посты / очередь",
    icon: Send,
    iconClassName: "text-sky-500",
  },
  {
    key: "youtube-shorts",
    label: "YouTube Shorts",
    hint: "Короткие ролики",
    icon: Youtube,
    iconClassName: "text-red-500",
  },
  {
    key: "instagram-reels",
    label: "Instagram Reels",
    hint: "Reels и клипы",
    icon: Instagram,
    iconClassName: "text-pink-500",
  },
  {
    key: "tiktok",
    label: "TikTok",
    hint: "Вертикальные ролики",
    icon: Music4,
    iconClassName: "text-slate-900",
  },
];

const outputTypeOptions = [
  {
    key: "content-pack",
    label: "Контент-пак",
    desc: "Идеи, хуки, сценарии, субтитры, заголовки и подписи без финального видео.",
    icon: Package,
  },
  {
    key: "script-voice",
    label: "Сценарий + озвучка",
    desc: "Сценарий, разбивка на сцены, voiceover и subtitles без готового рендера.",
    icon: AudioLines,
  },
  {
    key: "slideshow-video",
    label: "Слайд-видео",
    desc: "Карточки и слайды + текст + озвучка. Самый реалистичный MVP для старта.",
    icon: LayoutTemplate,
  },
  {
    key: "stock-video",
    label: "Faceless со стоками",
    desc: "Сценарий и видеоряд из открытых стоков или внутренней библиотеки.",
    icon: Library,
  },
  {
    key: "author-media-video",
    label: "Из материалов автора",
    desc: "Видео собирается из загруженных фото, видео и референсов автора.",
    icon: FileVideo,
  },
];

const visualSourceOptions = [
  {
    key: "none",
    label: "Без визуала",
    desc: "Только текстовый контент-пак без видеоряда.",
    icon: FileText,
  },
  {
    key: "template",
    label: "Шаблонные слайды",
    desc: "Карточки, текстовые слайды, иконки и фоновые композиции.",
    icon: ImageIcon,
  },
  {
    key: "stock",
    label: "Открытые стоки",
    desc: "Подбор b-roll и фонов из стоков и библиотеки.",
    icon: Video,
  },
  {
    key: "author-upload",
    label: "Материалы автора",
    desc: "Фото и видео, которые загрузил сам автор.",
    icon: Bot,
  },
  {
    key: "mixed",
    label: "Смешанный режим",
    desc: "Микс шаблонов, стоков и материалов автора.",
    icon: Layers3,
  },
];

const renderModeOptions = [
  {
    value: "ideas-only",
    label: "Только контент",
    desc: "Без видео и без ассетов, только смысловой пакет.",
    icon: FileText,
  },
  {
    value: "assets-only",
    label: "Контент + ассеты",
    desc: "Сценарий, сцены, субтитры, voice или визуальные заготовки.",
    icon: FolderOutput,
  },
  {
    value: "full-video",
    label: "Готовое видео",
    desc: "Полный результат под публикацию или очередь.",
    icon: Video,
  },
];

const brainStyleOptions = [
  {
    value: "sharp",
    label: "Sharp",
    desc: "Остро, коротко, уверенно.",
    icon: Zap,
  },
  {
    value: "educational",
    label: "Educational",
    desc: "Понятно, полезно, по шагам.",
    icon: BadgeHelp,
  },
  {
    value: "entertaining",
    label: "Entertaining",
    desc: "Живо, с драйвом и вау-эффектом.",
    icon: Sparkles,
  },
  {
    value: "premium",
    label: "Premium",
    desc: "Дорого, чисто, статусно.",
    icon: Briefcase,
  },
  {
    value: "aggressive",
    label: "Aggressive",
    desc: "Жёстко, напористо, с провокацией.",
    icon: Flame,
  },
  {
    value: "calm",
    label: "Calm",
    desc: "Спокойно, ровно, без шума.",
    icon: Brain,
  },
];

const brainHookOptions = [
  {
    value: "problem-first",
    label: "Problem first",
    desc: "Сразу заходит через боль.",
    icon: AlertCircle,
  },
  {
    value: "bold-claim",
    label: "Bold claim",
    desc: "Сильное заявление с первых секунд.",
    icon: Rocket,
  },
  {
    value: "question",
    label: "Question",
    desc: "Вопросом цепляет внимание.",
    icon: BadgeHelp,
  },
  {
    value: "contrarian",
    label: "Contrarian",
    desc: "Ломает привычное мнение.",
    icon: Target,
  },
  {
    value: "story-hook",
    label: "Story hook",
    desc: "Начинает как историю.",
    icon: FileText,
  },
  {
    value: "trend-hook",
    label: "Trend hook",
    desc: "Опирается на тренд или инфоповод.",
    icon: Newspaper,
  },
];

const brainLogicOptions = [
  {
    value: "insight-to-action",
    label: "Insight → Action",
    desc: "Сначала мысль, потом действие.",
    icon: Brain,
  },
  {
    value: "problem-to-fix",
    label: "Problem → Fix",
    desc: "Боль и сразу решение.",
    icon: WoundIcon(),
  },
  {
    value: "myth-to-truth",
    label: "Myth → Truth",
    desc: "Разрушает заблуждение.",
    icon: ShieldCheck,
  },
  {
    value: "steps-tutorial",
    label: "Steps / Tutorial",
    desc: "Пошаговый сценарий.",
    icon: ListChecks,
  },
  {
    value: "storytelling",
    label: "Storytelling",
    desc: "Логика через сюжет.",
    icon: LibraryBig,
  },
  {
    value: "comparison",
    label: "Comparison",
    desc: "Сравнение двух подходов.",
    icon: SlidersHorizontal,
  },
];

const brainStructureOptions = [
  {
    value: "hook-problem-solution-cta",
    label: "Hook → Problem → Solution → CTA",
    desc: "Классическая быстрая структура.",
    icon: Layers3,
  },
  {
    value: "hook-steps-result",
    label: "Hook → Steps → Result",
    desc: "Через конкретные шаги.",
    icon: ListChecks,
  },
  {
    value: "question-answer-cta",
    label: "Question → Answer → CTA",
    desc: "Простой понятный формат.",
    icon: BadgeHelp,
  },
  {
    value: "story-lesson-cta",
    label: "Story → Lesson → CTA",
    desc: "История и вывод.",
    icon: FileText,
  },
  {
    value: "claim-proof-offer",
    label: "Claim → Proof → Offer",
    desc: "Сначала тезис, потом доказательство.",
    icon: ShieldCheck,
  },
];

const brainPersonaOptions = [
  {
    value: "expert-friend",
    label: "Expert friend",
    desc: "Эксперт, но без занудства.",
    icon: Users,
  },
  {
    value: "analyst",
    label: "Analyst",
    desc: "Факты, разбор, логика.",
    icon: Cpu,
  },
  {
    value: "creator",
    label: "Creator",
    desc: "От лица практикующего автора.",
    icon: Sparkles,
  },
  {
    value: "mentor",
    label: "Mentor",
    desc: "Подача как наставник.",
    icon: Brain,
  },
  {
    value: "news-voice",
    label: "News voice",
    desc: "Холодно, быстро, по фактам.",
    icon: Newspaper,
  },
  {
    value: "storyteller",
    label: "Storyteller",
    desc: "Говорит как рассказчик.",
    icon: LibraryBig,
  },
];

const brainProofOptions = [
  {
    value: "examples",
    label: "Examples",
    desc: "Через примеры и кейсы.",
    icon: FolderKanban,
  },
  {
    value: "facts",
    label: "Facts",
    desc: "Факты и тезисы.",
    icon: ShieldCheck,
  },
  {
    value: "personal-tone",
    label: "Personal tone",
    desc: "Как будто из личного опыта.",
    icon: Users,
  },
  {
    value: "visual-cues",
    label: "Visual cues",
    desc: "Упор на кадры и подсказки визуала.",
    icon: ImageIcon,
  },
  {
    value: "data-points",
    label: "Data points",
    desc: "Через цифры и метрики.",
    icon: Hash,
  },
  {
    value: "social-proof",
    label: "Social proof",
    desc: "Через доверие и подтверждение извне.",
    icon: CheckCircle2,
  },
];

const brainCtaOptions = [
  {
    value: "soft",
    label: "Soft",
    desc: "Мягкий ненавязчивый CTA.",
    icon: Sparkles,
  },
  {
    value: "direct",
    label: "Direct",
    desc: "Прямой призыв к действию.",
    icon: Rocket,
  },
  {
    value: "community",
    label: "Community",
    desc: "Вовлекает в диалог и комьюнити.",
    icon: Users,
  },
  {
    value: "curiosity",
    label: "Curiosity",
    desc: "Оставляет интригу.",
    icon: BadgeHelp,
  },
  {
    value: "save-share",
    label: "Save & share",
    desc: "Под сохранение и репост.",
    icon: Download,
  },
  {
    value: "follow-part-2",
    label: "Follow for part 2",
    desc: "Сериализация контента.",
    icon: Radio,
  },
];

function WoundIcon() {
  return Target;
}

function getAccentClass(accentKey) {
  return (
    accentPresets.find((item) => item.key === accentKey)?.className ||
    "from-sky-500 to-cyan-500"
  );
}

function getIconPreset(iconKey) {
  return iconPresets.find((item) => item.key === iconKey) || iconPresets[0];
}

function normalizeFormat(value) {
  if (value === "vertical") return "9:16";
  if (value === "square") return "1:1";
  if (value === "landscape") return "16:9";
  return value || "9:16";
}

function splitLines(value) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizePlatforms(input) {
  if (Array.isArray(input)) return input.filter(Boolean);

  return String(input || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .map((item) => {
      if (item.includes("telegram")) return "telegram";
      if (item.includes("short")) return "youtube-shorts";
      if (item.includes("instagram") || item.includes("reels")) return "instagram-reels";
      if (item.includes("tiktok")) return "tiktok";
      return item;
    });
}

function mapPlatformKeyToLabel(key) {
  return platformOptions.find((item) => item.key === key)?.label || key;
}

function getOutputTypeMeta(key) {
  return outputTypeOptions.find((item) => item.key === key) || outputTypeOptions[0];
}

function getVisualSourceMeta(key) {
  return visualSourceOptions.find((item) => item.key === key) || visualSourceOptions[0];
}

function getRenderModeMeta(value) {
  return renderModeOptions.find((item) => item.value === value) || renderModeOptions[2];
}

function deriveVisualSourceFromOutputType(outputType) {
  if (outputType === "content-pack") return "none";
  if (outputType === "script-voice") return "none";
  if (outputType === "slideshow-video") return "template";
  if (outputType === "stock-video") return "stock";
  if (outputType === "author-media-video") return "author-upload";
  return "template";
}

function deriveRenderModeFromOutputType(outputType) {
  if (outputType === "content-pack") return "ideas-only";
  if (outputType === "script-voice") return "assets-only";
  return "full-video";
}

function derivePipeline(outputType, renderMode) {
  if (outputType === "content-pack") {
    return ["Идеи", "Хуки", "Сценарий", "Субтитры", "Публикация"];
  }

  if (outputType === "script-voice") {
    return ["Сценарий", "Сцены", "Озвучка", "Субтитры", "Публикация"];
  }

  if (outputType === "slideshow-video") {
    return renderMode === "assets-only"
      ? ["Сценарий", "Слайды", "Озвучка", "Субтитры", "Ассеты"]
      : ["Сценарий", "Слайды", "Озвучка", "Субтитры", "Видео"];
  }

  if (outputType === "stock-video") {
    return renderMode === "assets-only"
      ? ["Сценарий", "Сцены", "Стоки", "Озвучка", "Ассеты"]
      : ["Сценарий", "Сцены", "Стоки", "Озвучка", "Видео"];
  }

  if (outputType === "author-media-video") {
    return renderMode === "assets-only"
      ? ["Сценарий", "Подбор медиа", "Таймлайн", "Субтитры", "Ассеты"]
      : ["Сценарий", "Подбор медиа", "Таймлайн", "Субтитры", "Видео"];
  }

  return ["Сценарий", "Сцены", "Субтитры"];
}

function CompactBatchPreview({ batch }) {
  const items = Array.isArray(batch?.items) ? batch.items : [];
  if (!items.length) return null;

  return (
    <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900">
          <FolderKanban size={16} className="text-violet-600" />
          Пачка результатов
        </div>

        <Pill className="bg-white text-slate-700 ring-1 ring-slate-200">
          <Sparkles size={12} />
          {items.length} видео
        </Pill>
      </div>

      <div className="mt-3 grid gap-2">
        {items.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className="rounded-xl bg-white px-3 py-3 ring-1 ring-slate-200"
          >
            <div className="text-sm font-bold text-slate-900">
              {item.label} — {item.script?.title || item.topic}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {item.script?.hook || item.topic}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AgentWorkspace({
  agentOutput,
  onBack,
  onRunAgent,
  onSaveDraft,
  onApplyWorkspace,
}) {
  if (!agentOutput) return null;

  const batch = agentOutput?.batch || (agentOutput?.type === "agent-batch" ? agentOutput : null);
  const currentOutput =
    batch?.items?.[0] ||
    agentOutput;

  const { agent, script, scenes, captions, videoPlan, publishPlan } = currentOutput || {};

  const initialPlatforms = useMemo(() => {
    if (publishPlan?.platforms?.length) {
      return publishPlan.platforms
        .map((item) => normalizePlatforms(item.platform))
        .flat()
        .filter(Boolean);
    }
    if (agent?.platforms?.length) return normalizePlatforms(agent.platforms);
    if (agent?.platform) return normalizePlatforms(agent.platform);
    return ["telegram", "youtube-shorts"];
  }, [publishPlan, agent]);

  const inferredCategory = useMemo(() => {
    const topic = String(agent?.topic || "").toLowerCase();
    if (topic.includes("мотив")) return "motivation";
    if (topic.includes("ai")) return "ai-tools";
    if (topic.includes("news") || topic.includes("нов")) return "news";
    if (topic.includes("crypto") || topic.includes("крип")) return "crypto";
    if (topic.includes("business") || topic.includes("бизн")) return "business";
    if (topic.includes("story") || topic.includes("истор")) return "storytelling";
    if (topic.includes("educ") || topic.includes("обуч")) return "education";
    return "ai-tools";
  }, [agent]);

  const initialOutputType = useMemo(() => {
    return agent?.outputType || "slideshow-video";
  }, [agent]);

  const initialBrain = useMemo(
    () => ({
      style: agent?.brain?.style || "sharp",
      hookType: agent?.brain?.hookType || "problem-first",
      scriptLogic: agent?.brain?.scriptLogic || "insight-to-action",
      videoStructure: agent?.brain?.videoStructure || "hook-problem-solution-cta",
      persona: agent?.brain?.persona || "expert-friend",
      proofMode: agent?.brain?.proofMode || "examples",
      ctaStyle: agent?.brain?.ctaStyle || "soft",
      energy:
        typeof agent?.brain?.energy === "number"
          ? agent.brain.energy
          : Number(agent?.brain?.energy || 70),
    }),
    [agent]
  );

  const [workspace, setWorkspace] = useState({
    name: agent?.name || "",
    topic: agent?.topic || "",
    status: agent?.active ? "Активен" : "Черновик",
    category: inferredCategory,
    icon: agent?.icon || "spark",
    accent: agent?.accent || "sky",
    tagline:
      agent?.tagline ||
      "Ежедневные идеи и структура short-form видео под публикацию.",

    outputType: initialOutputType,
    visualSourceType:
      agent?.visualSourceType || deriveVisualSourceFromOutputType(initialOutputType),
    renderMode:
      agent?.renderMode || deriveRenderModeFromOutputType(initialOutputType),

    briefChannel: agent?.topic || "",
    briefAudience: agent?.audience || "",
    briefGoal: "",
    briefTone: agent?.tone || "",
    briefStyle: videoPlan?.style || agent?.style || "",
    briefRestrictions: "",

    brainStyle: initialBrain.style,
    brainHookType: initialBrain.hookType,
    brainScriptLogic: initialBrain.scriptLogic,
    brainVideoStructure: initialBrain.videoStructure,
    brainPersona: initialBrain.persona,
    brainProofMode: initialBrain.proofMode,
    brainCtaStyle: initialBrain.ctaStyle,
    brainEnergy: initialBrain.energy,

    sourceLinks: "",
    sourceNotes: "",
    sourceReferences: "",
    sourceIdeas: "",
    authorAssetsNotes: "",

    duration: String(videoPlan?.totalDuration || agent?.lengthSec || agent?.length || 30),
    format: normalizeFormat(videoPlan?.format || agent?.format),
    voice: agent?.voice || "auto",
    captionsEnabled: true,
    cta: agent?.cta || "",
    hashtags: "",
    videosPerDay: String(agent?.videosPerDay || agent?.videos || 1),

    publishPlatforms: initialPlatforms,
    publishMode: agent?.autopost ? "autopost" : "manual",
    publishFrequency: "daily",
    publishSchedule: "",
    queueEnabled: true,
  });

  const [ui, setUi] = useState({
    hasUnsavedChanges: false,
    isGenerating: false,
    isSaving: false,
    lastRunLabel: "Пока не запускался из рабочей зоны",
  });

  const scenesCount = scenes?.length || 0;
  const captionsCount = captions?.length || 0;
  const publishTargets =
    publishPlan?.platforms?.length || workspace.publishPlatforms.length || 0;

  const sourceLinksList = useMemo(
    () => splitLines(workspace.sourceLinks),
    [workspace.sourceLinks]
  );
  const sourceReferencesList = useMemo(
    () => splitLines(workspace.sourceReferences),
    [workspace.sourceReferences]
  );
  const ideaBacklogList = useMemo(
    () => splitLines(workspace.sourceIdeas),
    [workspace.sourceIdeas]
  );

  const hashtagList = useMemo(
    () =>
      String(workspace.hashtags || "")
        .split(/[\s,]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    [workspace.hashtags]
  );

  const selectedPlatformLabels = useMemo(
    () => workspace.publishPlatforms.map(mapPlatformKeyToLabel),
    [workspace.publishPlatforms]
  );

  const currentPipeline = useMemo(
    () => derivePipeline(workspace.outputType, workspace.renderMode),
    [workspace.outputType, workspace.renderMode]
  );

  const outputMeta = useMemo(
    () => getOutputTypeMeta(workspace.outputType),
    [workspace.outputType]
  );

  const visualMeta = useMemo(
    () => getVisualSourceMeta(workspace.visualSourceType),
    [workspace.visualSourceType]
  );

  const activeBrainStyle = brainStyleOptions.find((item) => item.value === workspace.brainStyle);
  const activeBrainHook = brainHookOptions.find((item) => item.value === workspace.brainHookType);
  const activeBrainLogic = brainLogicOptions.find((item) => item.value === workspace.brainScriptLogic);
  const activeBrainStructure = brainStructureOptions.find(
    (item) => item.value === workspace.brainVideoStructure
  );
  const activeBrainPersona = brainPersonaOptions.find(
    (item) => item.value === workspace.brainPersona
  );
  const activeBrainProof = brainProofOptions.find(
    (item) => item.value === workspace.brainProofMode
  );
  const activeBrainCta = brainCtaOptions.find(
    (item) => item.value === workspace.brainCtaStyle
  );

  const readiness = useMemo(() => {
    const items = [
      {
        ok: Boolean(workspace.name.trim()),
        title: "Название агента заполнено",
        hint: workspace.name.trim()
          ? workspace.name
          : "Придумай понятное имя агенту.",
      },
      {
        ok: Boolean(workspace.outputType && workspace.visualSourceType && workspace.renderMode),
        title: "Формат производства выбран",
        hint: `${outputMeta.label} • ${visualMeta.label} • ${getRenderModeMeta(workspace.renderMode).label}`,
      },
      {
        ok: Boolean((workspace.topic || workspace.briefChannel).trim()),
        title: "Тема контента определена",
        hint: (workspace.topic || workspace.briefChannel).trim()
          ? workspace.topic || workspace.briefChannel
          : "Добавь тему или описание канала.",
      },
      {
        ok: Boolean(workspace.briefAudience.trim() && workspace.briefGoal.trim()),
        title: "Есть аудитория и цель",
        hint:
          workspace.briefAudience.trim() && workspace.briefGoal.trim()
            ? `${workspace.briefAudience} • ${workspace.briefGoal}`
            : "Заполни, для кого контент и зачем он нужен.",
      },
      {
        ok: Boolean(
          workspace.brainStyle &&
            workspace.brainHookType &&
            workspace.brainScriptLogic &&
            workspace.brainVideoStructure
        ),
        title: "Логика поведения агента выбрана",
        hint:
          activeBrainStyle && activeBrainHook
            ? `${activeBrainStyle.label} • ${activeBrainHook.label}`
            : "Настрой Agent Brain.",
      },
      {
        ok: Boolean(workspace.duration && workspace.voice && workspace.format),
        title: "Генерация настроена",
        hint:
          workspace.duration && workspace.voice && workspace.format
            ? `${workspace.duration}с • ${workspace.format} • ${workspace.voice}`
            : "Выбери длительность, формат и голос.",
      },
      {
        ok: workspace.publishPlatforms.length > 0,
        title: "Выбраны площадки",
        hint:
          workspace.publishPlatforms.length > 0
            ? selectedPlatformLabels.join(", ")
            : "Выбери хотя бы одну соцсеть.",
      },
    ];

    const completed = items.filter((item) => item.ok).length;
    return {
      items,
      completed,
      total: items.length,
      percent: Math.round((completed / items.length) * 100),
      ready: completed >= 6,
    };
  }, [workspace, selectedPlatformLabels, outputMeta, visualMeta, activeBrainStyle, activeBrainHook]);

  const workspaceReady =
    workspace.name.trim() &&
    workspace.outputType &&
    workspace.visualSourceType &&
    workspace.renderMode &&
    (workspace.topic.trim() || workspace.briefChannel.trim()) &&
    workspace.duration &&
    workspace.voice &&
    workspace.publishPlatforms.length > 0 &&
    workspace.brainStyle &&
    workspace.brainHookType &&
    workspace.brainScriptLogic &&
    workspace.brainVideoStructure;

  const setField = (key, value) => {
    setWorkspace((prev) => ({ ...prev, [key]: value }));
    setUi((prev) => ({ ...prev, hasUnsavedChanges: true }));
  };

  const handleOutputTypeChange = (value) => {
    setWorkspace((prev) => ({
      ...prev,
      outputType: value,
      visualSourceType: deriveVisualSourceFromOutputType(value),
      renderMode: deriveRenderModeFromOutputType(value),
    }));
    setUi((prev) => ({ ...prev, hasUnsavedChanges: true }));
  };

  const togglePlatform = (key) => {
    setWorkspace((prev) => {
      const exists = prev.publishPlatforms.includes(key);
      const nextPlatforms = exists
        ? prev.publishPlatforms.filter((item) => item !== key)
        : [...prev.publishPlatforms, key];

      return { ...prev, publishPlatforms: nextPlatforms };
    });

    setUi((prev) => ({ ...prev, hasUnsavedChanges: true }));
  };

  const buildWorkspacePayload = () => ({
    identity: {
      name: workspace.name,
      topic: workspace.topic,
      status: workspace.status,
      category: workspace.category,
      icon: workspace.icon,
      accent: workspace.accent,
      tagline: workspace.tagline,
    },
    production: {
      outputType: workspace.outputType,
      visualSourceType: workspace.visualSourceType,
      renderMode: workspace.renderMode,
      pipeline: currentPipeline,
    },
    brief: {
      channel: workspace.briefChannel,
      audience: workspace.briefAudience,
      goal: workspace.briefGoal,
      tone: workspace.briefTone,
      style: workspace.briefStyle,
      restrictions: workspace.briefRestrictions,
    },
    brain: {
      style: workspace.brainStyle,
      hookType: workspace.brainHookType,
      scriptLogic: workspace.brainScriptLogic,
      videoStructure: workspace.brainVideoStructure,
      persona: workspace.brainPersona,
      proofMode: workspace.brainProofMode,
      ctaStyle: workspace.brainCtaStyle,
      energy: Number(workspace.brainEnergy) || 70,
    },
    sources: {
      links: workspace.sourceLinks,
      notes: workspace.sourceNotes,
      references: workspace.sourceReferences,
      ideas: workspace.sourceIdeas,
      authorAssetsNotes: workspace.authorAssetsNotes,
    },
    generation: {
      duration: workspace.duration,
      format: workspace.format,
      voice: workspace.voice,
      captionsEnabled: workspace.captionsEnabled,
      cta: workspace.cta,
      hashtags: workspace.hashtags,
      videosPerDay: workspace.videosPerDay,
    },
    publishing: {
      platforms: workspace.publishPlatforms,
      mode: workspace.publishMode,
      frequency: workspace.publishFrequency,
      schedule: workspace.publishSchedule,
      queueEnabled: workspace.queueEnabled,
    },
  });

  const buildRunPayload = (requestedVideos = 1) => ({
    name: workspace.name,
    topic: workspace.topic || workspace.briefChannel,
    outputType: workspace.outputType,
    visualSourceType: workspace.visualSourceType,
    renderMode: workspace.renderMode,
    lengthSec: Number(workspace.duration) || 30,
    format: workspace.format,
    voice: workspace.voice,
    autopost: workspace.publishMode === "autopost",
    platforms: workspace.publishPlatforms,
    requestedVideos,
    videosPerDay: requestedVideos,
    brain: {
      style: workspace.brainStyle,
      hookType: workspace.brainHookType,
      scriptLogic: workspace.brainScriptLogic,
      videoStructure: workspace.brainVideoStructure,
      persona: workspace.brainPersona,
      proofMode: workspace.brainProofMode,
      ctaStyle: workspace.brainCtaStyle,
      energy: Number(workspace.brainEnergy) || 70,
    },
    workspace,
  });

  const handleSaveDraft = async () => {
    try {
      setUi((prev) => ({ ...prev, isSaving: true }));

      const payload = buildWorkspacePayload();

      if (onSaveDraft) {
        await onSaveDraft(payload);
      }

      if (onApplyWorkspace) {
        await onApplyWorkspace(payload);
      }

      setUi((prev) => ({
        ...prev,
        isSaving: false,
        hasUnsavedChanges: false,
      }));
    } catch (error) {
      setUi((prev) => ({ ...prev, isSaving: false }));
      console.error(error);
    }
  };

  const handleGenerateOne = async () => {
    try {
      setUi((prev) => ({ ...prev, isGenerating: true }));

      if (onApplyWorkspace) {
        await onApplyWorkspace(buildWorkspacePayload());
      }

      if (onRunAgent) {
        await onRunAgent(buildRunPayload(1));
      }

      setUi((prev) => ({
        ...prev,
        isGenerating: false,
        hasUnsavedChanges: false,
        lastRunLabel: "Только что",
      }));
    } catch (error) {
      setUi((prev) => ({ ...prev, isGenerating: false }));
      console.error(error);
    }
  };

  const handleGenerateBatch = async () => {
    try {
      setUi((prev) => ({ ...prev, isGenerating: true }));

      if (onApplyWorkspace) {
        await onApplyWorkspace(buildWorkspacePayload());
      }

      if (onRunAgent) {
        await onRunAgent(buildRunPayload(Number(workspace.videosPerDay) || 3));
      }

      setUi((prev) => ({
        ...prev,
        isGenerating: false,
        hasUnsavedChanges: false,
        lastRunLabel: "Только что",
      }));
    } catch (error) {
      setUi((prev) => ({ ...prev, isGenerating: false }));
      console.error(error);
    }
  };

  const quickApplyIdea = (text) => {
    setField("sourceIdeas", workspace.sourceIdeas ? `${workspace.sourceIdeas}\n${text}` : text);
  };

  const quickApplyRestriction = (text) => {
    setField(
      "briefRestrictions",
      workspace.briefRestrictions
        ? `${workspace.briefRestrictions}\n• ${text}`
        : `• ${text}`
    );
  };

  return (
    <div className="space-y-6 pb-24">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-500">Рабочая зона агента</div>

            <div className="mt-1 flex flex-wrap items-center gap-3">
              <div className="min-w-0 text-2xl font-black text-slate-900">
                {workspace.name || "Без названия"}
              </div>

              <Pill className="bg-violet-100 text-violet-700">
                <Sparkles size={12} />
                {workspace.status}
              </Pill>

              <Pill className="bg-sky-100 text-sky-700">
                <Layers3 size={12} />
                {categoryOptions.find((item) => item.value === workspace.category)?.label ||
                  workspace.category}
              </Pill>

              <Pill className="bg-emerald-100 text-emerald-700">
                <ShieldCheck size={12} />
                {readiness.percent}% готовности
              </Pill>
            </div>

            <div className="mt-3 max-w-3xl text-sm text-slate-600">
              Здесь настраивается агент целиком: что он производит, откуда берёт визуал,
              как думает, что выдаёт на выходе, куда публикует и как работает вживую.
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-800 transition hover:bg-slate-200"
            >
              <ArrowLeft size={16} />
              Назад к агентам
            </button>

            <button
              onClick={handleSaveDraft}
              disabled={ui.isSaving}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                ui.isSaving
                  ? "bg-slate-200 text-slate-400"
                  : "bg-sky-100 text-sky-700 hover:bg-sky-200"
              }`}
            >
              {ui.isSaving ? (
                <RefreshCcw size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {ui.isSaving ? "Сохранение..." : "Сохранить"}
            </button>

            <button
              onClick={handleGenerateOne}
              disabled={!workspaceReady || ui.isGenerating}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white transition ${
                !workspaceReady || ui.isGenerating
                  ? "cursor-not-allowed bg-slate-300"
                  : "bg-sky-500 hover:bg-sky-600"
              }`}
            >
              {ui.isGenerating ? (
                <RefreshCcw size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              {ui.isGenerating ? "Генерация..." : "Сгенерировать"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Target}
            label="Статус рабочей зоны"
            value={workspaceReady ? "Готов к запуску" : "Нужно заполнить"}
            hint={`${readiness.completed}/${readiness.total} блоков заполнено`}
          />
          <MetricCard
            icon={Package}
            label="Формат производства"
            value={outputMeta.label}
            hint={getRenderModeMeta(workspace.renderMode).label}
          />
          <MetricCard
            icon={FolderOutput}
            label="Текущий результат"
            value={script?.title ? "Есть результат" : "Пусто"}
            hint={script?.title || "Пока ничего не сгенерировано"}
          />
          <MetricCard
            icon={Clock3}
            label="Последний запуск"
            value={ui.lastRunLabel}
            hint="Из этой рабочей зоны"
          />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-6">
          <Card>
            <SectionTitle
              icon={Palette}
              title="Основа агента"
              desc="Название, тема, базовая роль и компактное превью без пустых блоков."
            />

            <div className="mt-5 space-y-5">
              <div
                className={`rounded-[28px] bg-gradient-to-br ${getAccentClass(workspace.accent)} p-[1px]`}
              >
                <div className="rounded-[27px] bg-white/95 p-4 backdrop-blur">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_340px]">
                    <div className="min-w-0">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${getAccentClass(
                            workspace.accent
                          )} text-white shadow-lg`}
                        >
                          {(() => {
                            const Icon = getIconPreset(workspace.icon).icon;
                            return <Icon size={24} />;
                          })()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-2xl font-black text-slate-900">
                            {workspace.name || "Без названия"}
                          </div>

                          <div className="mt-2">
                            <Pill className="bg-slate-100 text-slate-700">
                              <Layers3 size={12} />
                              {categoryOptions.find((item) => item.value === workspace.category)
                                ?.label || workspace.category}
                            </Pill>
                          </div>

                          <div className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                            {workspace.tagline ||
                              "Помогает стабильно выпускать short-form контент."}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Формат
                        </div>
                        <div className="mt-1 text-sm font-bold text-slate-900">
                          {workspace.format}
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Длительность
                        </div>
                        <div className="mt-1 text-sm font-bold text-slate-900">
                          {workspace.duration || 30}с
                        </div>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                          Голос
                        </div>
                        <div className="mt-1 text-sm font-bold text-slate-900">
                          {voiceOptions.find((item) => item.value === workspace.voice)?.label ||
                            workspace.voice}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Pill className="bg-sky-100 text-sky-700">
                      <Package size={12} />
                      {getOutputTypeMeta(workspace.outputType).label}
                    </Pill>

                    <Pill className="bg-violet-100 text-violet-700">
                      <ImageIcon size={12} />
                      {getVisualSourceMeta(workspace.visualSourceType).label}
                    </Pill>

                    <Pill className="bg-emerald-100 text-emerald-700">
                      <Video size={12} />
                      {getRenderModeMeta(workspace.renderMode).label}
                    </Pill>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Название агента"
                  value={workspace.name}
                  onChange={(v) => setField("name", v)}
                  placeholder="Mindset Story Agent"
                />

                <Input
                  label="Главная тема"
                  value={workspace.topic}
                  onChange={(v) => setField("topic", v)}
                  placeholder="мышление"
                />

                <div className="md:col-span-2">
                  <Input
                    label="Краткое обещание"
                    value={workspace.tagline}
                    onChange={(v) => setField("tagline", v)}
                    placeholder="Что агент делает полезного одной фразой"
                  />
                </div>

                <Select
                  label="Категория"
                  value={workspace.category}
                  onChange={(v) => setField("category", v)}
                  options={categoryOptions}
                />

                <Select
                  label="Режим публикации"
                  value={workspace.publishMode}
                  onChange={(v) => setField("publishMode", v)}
                  options={publishModeOptions}
                />
              </div>

              <div>
                <div className="text-xs font-bold text-slate-600">Иконка агента</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {iconPresets.map((item) => {
                    const Icon = item.icon;
                    const active = workspace.icon === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setField("icon", item.key)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                            : "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-white"
                        }`}
                      >
                        <Icon size={14} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-600">Цвет агента</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {accentPresets.map((item) => {
                    const active = workspace.accent === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setField("accent", item.key)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                            : "border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-white"
                        }`}
                      >
                        <span
                          className={`h-3 w-3 rounded-full bg-gradient-to-br ${item.className}`}
                        />
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={Package}
              title="Формат производства"
              desc="Самая важная настройка: что именно делает агент и что человек получает на выходе."
            />

            <div className="mt-5 grid gap-3">
              {outputTypeOptions.map((item) => (
                <ModeCard
                  key={item.key}
                  item={item}
                  active={workspace.outputType === item.key}
                  onClick={handleOutputTypeChange}
                />
              ))}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-bold text-slate-600">Источник визуала</div>
                <div className="mt-2 grid gap-3">
                  {visualSourceOptions.map((item) => (
                    <ModeCard
                      key={item.key}
                      item={item}
                      active={workspace.visualSourceType === item.key}
                      onClick={(value) => setField("visualSourceType", value)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold text-slate-600">Что выдавать на выходе</div>
                  <div className="mt-2 grid gap-3">
                    {renderModeOptions.map((item) => (
                      <ModeCard
                        key={item.value}
                        item={item}
                        active={workspace.renderMode === item.value}
                        onClick={(value) => setField("renderMode", value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    Текущий режим
                  </div>
                  <div className="mt-2 text-lg font-black text-slate-900">
                    {outputMeta.label}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{outputMeta.desc}</div>

                  <div className="mt-4 space-y-2">
                    <div className="rounded-2xl border border-slate-300 bg-white px-3 py-3">
                      <div className="text-xs font-bold text-slate-500">Визуал</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">
                        {visualMeta.label}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{visualMeta.desc}</div>
                    </div>

                    <div className="rounded-2xl border border-slate-300 bg-white px-3 py-3">
                      <div className="text-xs font-bold text-slate-500">Выход</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">
                        {getRenderModeMeta(workspace.renderMode).label}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                    <ListChecks size={16} />
                    Пайплайн агента
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {currentPipeline.map((step, index) => (
                      <Pill key={`${step}-${index}`} className="bg-white text-slate-700 ring-1 ring-slate-200">
                        {index + 1}. {step}
                      </Pill>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={FileText}
              title="Бриф"
              desc="Кому нужен этот контент, в каком стиле и с какой целью он создаётся."
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input
                label="О чём канал"
                value={workspace.briefChannel}
                onChange={(v) => setField("briefChannel", v)}
                placeholder="Ежедневный контент про мотивацию и дисциплину"
              />
              <Input
                label="Аудитория"
                value={workspace.briefAudience}
                onChange={(v) => setField("briefAudience", v)}
                placeholder="Новички, создатели контента, предприниматели"
              />
              <Input
                label="Цель"
                value={workspace.briefGoal}
                onChange={(v) => setField("briefGoal", v)}
                placeholder="Рост охвата, лиды, доверие, просмотры"
              />
              <Input
                label="Тон общения"
                value={workspace.briefTone}
                onChange={(v) => setField("briefTone", v)}
                placeholder="Просто, уверенно, быстро, по делу"
              />
            </div>

            <div className="mt-4 grid gap-4">
              <TextArea
                label="Стиль"
                value={workspace.briefStyle}
                onChange={(v) => setField("briefStyle", v)}
                placeholder="Hook + script + captions, списки, быстрые переходы, практичные примеры"
              />
              <TextArea
                label="Ограничения"
                value={workspace.briefRestrictions}
                onChange={(v) => setField("briefRestrictions", v)}
                placeholder="Без кликбейта, фейковой статистики и токсичного контента"
              />
            </div>

            <div className="mt-4">
              <div className="text-xs font-bold text-slate-600">Быстрые ограничения</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  "Без фейковой статистики",
                  "Без завышенных обещаний",
                  "Без политики",
                  "Без хейта",
                  "Простой язык",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => quickApplyRestriction(item)}
                    className="rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={Brain}
              title="Agent Brain"
              desc="Как агент думает, с какого хука стартует, как строит ролик и каким голосом подаёт идею."
            />

            <div className="mt-5 space-y-5">
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill className="bg-white text-slate-700 ring-1 ring-slate-200">
                    <Brain size={12} />
                    {activeBrainStyle?.label || "Style"}
                  </Pill>
                  <Pill className="bg-white text-slate-700 ring-1 ring-slate-200">
                    <Rocket size={12} />
                    {activeBrainHook?.label || "Hook"}
                  </Pill>
                  <Pill className="bg-white text-slate-700 ring-1 ring-slate-200">
                    <Cpu size={12} />
                    {activeBrainLogic?.label || "Logic"}
                  </Pill>
                  <Pill className="bg-white text-slate-700 ring-1 ring-slate-200">
                    <Layers3 size={12} />
                    {activeBrainStructure?.label || "Structure"}
                  </Pill>
                  <Pill className="bg-white text-slate-700 ring-1 ring-slate-200">
                    <Users size={12} />
                    {activeBrainPersona?.label || "Persona"}
                  </Pill>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <MiniInfo icon={Brain} label="Style" value={activeBrainStyle?.label} />
                  <MiniInfo icon={Rocket} label="Hook" value={activeBrainHook?.label} />
                  <MiniInfo icon={Cpu} label="Logic" value={activeBrainLogic?.label} />
                  <MiniInfo icon={Layers3} label="Structure" value={activeBrainStructure?.label} />
                  <MiniInfo icon={ShieldCheck} label="Proof" value={activeBrainProof?.label} />
                  <MiniInfo icon={Radio} label="CTA style" value={activeBrainCta?.label} />
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-bold text-slate-600">Style</div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {brainStyleOptions.map((item) => (
                    <ChoiceCard
                      key={item.value}
                      title={item.label}
                      desc={item.desc}
                      icon={item.icon}
                      active={workspace.brainStyle === item.value}
                      onClick={() => setField("brainStyle", item.value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-bold text-slate-600">Hook type</div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {brainHookOptions.map((item) => (
                    <ChoiceCard
                      key={item.value}
                      title={item.label}
                      desc={item.desc}
                      icon={item.icon}
                      active={workspace.brainHookType === item.value}
                      onClick={() => setField("brainHookType", item.value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-bold text-slate-600">Script logic</div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {brainLogicOptions.map((item) => (
                    <ChoiceCard
                      key={item.value}
                      title={item.label}
                      desc={item.desc}
                      icon={item.icon}
                      active={workspace.brainScriptLogic === item.value}
                      onClick={() => setField("brainScriptLogic", item.value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-bold text-slate-600">Video structure</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {brainStructureOptions.map((item) => (
                    <ChoiceCard
                      key={item.value}
                      title={item.label}
                      desc={item.desc}
                      icon={item.icon}
                      active={workspace.brainVideoStructure === item.value}
                      onClick={() => setField("brainVideoStructure", item.value)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-bold text-slate-600">Persona</div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {brainPersonaOptions.map((item) => (
                    <ChoiceCard
                      key={item.value}
                      title={item.label}
                      desc={item.desc}
                      icon={item.icon}
                      active={workspace.brainPersona === item.value}
                      onClick={() => setField("brainPersona", item.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs font-bold text-slate-600">Proof mode</div>
                  <div className="grid gap-3">
                    {brainProofOptions.map((item) => (
                      <ChoiceCard
                        key={item.value}
                        title={item.label}
                        desc={item.desc}
                        icon={item.icon}
                        active={workspace.brainProofMode === item.value}
                        onClick={() => setField("brainProofMode", item.value)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-xs font-bold text-slate-600">CTA style</div>
                  <div className="grid gap-3">
                    {brainCtaOptions.map((item) => (
                      <ChoiceCard
                        key={item.value}
                        title={item.label}
                        desc={item.desc}
                        icon={item.icon}
                        active={workspace.brainCtaStyle === item.value}
                        onClick={() => setField("brainCtaStyle", item.value)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">Energy</div>
                    <div className="mt-1 text-xs text-slate-500">
                      Насколько напористо и интенсивно агент подаёт контент.
                    </div>
                  </div>

                  <Pill className="bg-white text-slate-700 ring-1 ring-slate-200">
                    <Zap size={12} />
                    {workspace.brainEnergy}%
                  </Pill>
                </div>

                <div className="mt-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={workspace.brainEnergy}
                    onChange={(e) => setField("brainEnergy", Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-sky-500"
                  />
                </div>

                <div className="mt-3 flex justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  <span>Calm</span>
                  <span>Balanced</span>
                  <span>Intense</span>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={LinkIcon}
              title="Источники"
              desc="Ссылки, заметки, референсы и запас идей для будущих роликов."
            />

            <div className="mt-5 grid gap-4">
              <TextArea
                label="Ссылки"
                value={workspace.sourceLinks}
                onChange={(v) => setField("sourceLinks", v)}
                placeholder="Вставляй статьи, видео, треды и сайты — по одной ссылке на строку"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <TextArea
                  label="Заметки"
                  value={workspace.sourceNotes}
                  onChange={(v) => setField("sourceNotes", v)}
                  placeholder="Исследования, мысли, углы подачи, наброски"
                />
                <TextArea
                  label="Референсы"
                  value={workspace.sourceReferences}
                  onChange={(v) => setField("sourceReferences", v)}
                  placeholder="Авторы, форматы, каналы, примеры для ориентира"
                />
              </div>

              <TextArea
                label="Бэклог идей"
                value={workspace.sourceIdeas}
                onChange={(v) => setField("sourceIdeas", v)}
                placeholder="Идеи роликов, хуки, названия выпусков, направления контента"
              />

              {(workspace.visualSourceType === "author-upload" ||
                workspace.visualSourceType === "mixed" ||
                workspace.outputType === "author-media-video") && (
                <TextArea
                  label="Материалы автора"
                  value={workspace.authorAssetsNotes}
                  onChange={(v) => setField("authorAssetsNotes", v)}
                  placeholder="Опиши, что автор будет загружать: селфи-видео, b-roll, фото, брендовые материалы, примеры прошлых роликов"
                />
              )}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Globe size={13} />
                  Ссылок
                </div>
                <div className="mt-2 text-lg font-black text-slate-900">
                  {sourceLinksList.length}
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {sourceLinksList.length ? sourceLinksList[0] : "Пока нет ссылок"}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Users size={13} />
                  Референсов
                </div>
                <div className="mt-2 text-lg font-black text-slate-900">
                  {sourceReferencesList.length}
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {sourceReferencesList.length ? sourceReferencesList[0] : "Пока нет референсов"}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Sparkles size={13} />
                  Идей
                </div>
                <div className="mt-2 text-lg font-black text-slate-900">
                  {ideaBacklogList.length}
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {ideaBacklogList.length ? ideaBacklogList[0] : "Пока нет идей"}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs font-bold text-slate-600">Быстрые заготовки идей</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  "3 инструмента, которыми почти никто не пользуется",
                  "Одну ошибку создатели повторяют каждый день",
                  "До / после на одном рабочем примере",
                  "Быстрый список из 5 пунктов",
                  "Реакция на новость с практической пользой",
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => quickApplyIdea(item)}
                    className="rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                  >
                    + {item}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={Settings2}
              title="Параметры генерации"
              desc="Что именно агент должен сгенерировать перед запуском."
            />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input
                label="Длительность видео (сек)"
                value={workspace.duration}
                onChange={(v) => setField("duration", v)}
                placeholder="30"
                type="number"
              />

              <Select
                label="Формат"
                value={workspace.format}
                onChange={(v) => setField("format", v)}
                options={formatOptions}
              />

              <Select
                label="Голос"
                value={workspace.voice}
                onChange={(v) => setField("voice", v)}
                options={voiceOptions}
              />

              <Input
                label="Видео за запуск"
                value={workspace.videosPerDay}
                onChange={(v) => setField("videosPerDay", v)}
                placeholder="3"
                type="number"
              />

              <Input
                label="CTA"
                value={workspace.cta}
                onChange={(v) => setField("cta", v)}
                placeholder="Подпишись / ссылка в био / напиши кодовое слово"
              />

              <Input
                label="Хештеги"
                value={workspace.hashtags}
                onChange={(v) => setField("hashtags", v)}
                placeholder="#мотивация #shorts #reels"
              />
            </div>

            <div className="mt-4">
              <Toggle
                checked={workspace.captionsEnabled}
                onChange={(v) => setField("captionsEnabled", v)}
                label="Генерировать субтитры"
                hint="Добавлять caption-блоки в итоговый short-form результат"
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <MiniInfo icon={Clapperboard} label="Формат" value={workspace.format} />
              <MiniInfo
                icon={AudioLines}
                label="Голос"
                value={
                  voiceOptions.find((item) => item.value === workspace.voice)?.label
                }
              />
              <MiniInfo
                icon={Hash}
                label="Хештеги"
                value={hashtagList.length ? hashtagList.slice(0, 3).join(", ") : "Нет"}
              />
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={Send}
              title="Размещение контента"
              desc="Выбери, для каких соцсетей работает этот агент и как он публикует результат."
            />

            <div className="mt-5">
              <div className="text-xs font-bold text-slate-600">Площадки агента</div>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {platformOptions.map((item) => (
                  <PlatformPickerCard
                    key={item.key}
                    item={item}
                    checked={workspace.publishPlatforms.includes(item.key)}
                    onToggle={togglePlatform}
                  />
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Select
                label="Режим размещения"
                value={workspace.publishMode}
                onChange={(v) => setField("publishMode", v)}
                options={publishModeOptions}
              />

              <Select
                label="Частота"
                value={workspace.publishFrequency}
                onChange={(v) => setField("publishFrequency", v)}
                options={frequencyOptions}
              />

              <Input
                label="Расписание"
                value={workspace.publishSchedule}
                onChange={(v) => setField("publishSchedule", v)}
                placeholder="09:00, 15:00, 21:00"
              />
            </div>

            <div className="mt-4">
              <Toggle
                checked={workspace.queueEnabled}
                onChange={(v) => setField("queueEnabled", v)}
                label="Использовать очередь публикации"
                hint="Сначала складывать готовые ролики в очередь перед размещением"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {workspace.publishPlatforms.length ? (
                workspace.publishPlatforms.map((platform) => (
                  <Pill key={platform} className="bg-slate-100 text-slate-700">
                    <MonitorPlay size={12} />
                    {mapPlatformKeyToLabel(platform)}
                  </Pill>
                ))
              ) : (
                <div className="text-xs text-slate-400">Ни одна площадка не выбрана</div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <SectionTitle
              icon={Rocket}
              title="Быстрый статус"
              desc="Главное по агенту в одном месте: готовность, пайплайн и запуск."
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MetricCard
                icon={ShieldCheck}
                label="Готовность"
                value={`${readiness.percent}%`}
                hint={`${readiness.completed}/${readiness.total} блоков`}
              />
              <MetricCard
                icon={Play}
                label="Видео за запуск"
                value={`${workspace.videosPerDay || 1}`}
                hint="Текущий размер пачки"
              />
              <MetricCard
                icon={Package}
                label="Режим"
                value={outputMeta.label}
                hint={getRenderModeMeta(workspace.renderMode).label}
              />
              <MetricCard
                icon={Clock3}
                label="Последний запуск"
                value={ui.lastRunLabel}
                hint="Из этой рабочей зоны"
              />
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-slate-900">Состояние сохранения</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {ui.hasUnsavedChanges
                      ? "Есть несохранённые изменения"
                      : "Все изменения сохранены"}
                  </div>
                </div>

                {ui.hasUnsavedChanges ? (
                  <Pill className="bg-amber-100 text-amber-700">
                    <Clock3 size={12} />
                    Не сохранено
                  </Pill>
                ) : (
                  <Pill className="bg-emerald-100 text-emerald-700">
                    <CheckCircle2 size={12} />
                    Синхронизировано
                  </Pill>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {readiness.items.map((item) => (
                <div
                  key={item.title}
                  className={`rounded-2xl border px-4 py-3 ${
                    item.ok
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-amber-200 bg-amber-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                        item.ok ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                      }`}
                    >
                      {item.ok ? <Check size={14} /> : <AlertCircle size={14} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900">{item.title}</div>
                      <div className="mt-1 text-xs text-slate-600">{item.hint}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <ListChecks size={16} />
                Что агент делает по шагам
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {currentPipeline.map((step, index) => (
                  <Pill key={`${step}-${index}`} className="bg-white text-slate-700 ring-1 ring-slate-200">
                    {index + 1}. {step}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <Brain size={16} />
                Сводка Agent Brain
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <MiniInfo icon={Brain} label="Style" value={activeBrainStyle?.label} />
                <MiniInfo icon={Rocket} label="Hook" value={activeBrainHook?.label} />
                <MiniInfo icon={Cpu} label="Logic" value={activeBrainLogic?.label} />
                <MiniInfo icon={Layers3} label="Structure" value={activeBrainStructure?.label} />
                <MiniInfo icon={Users} label="Persona" value={activeBrainPersona?.label} />
                <MiniInfo icon={Zap} label="Energy" value={`${workspace.brainEnergy}%`} />
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <button
                onClick={handleGenerateOne}
                disabled={!workspaceReady || ui.isGenerating}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition ${
                  !workspaceReady || ui.isGenerating
                    ? "cursor-not-allowed bg-slate-300"
                    : "bg-sky-500 hover:bg-sky-600"
                }`}
              >
                {ui.isGenerating ? (
                  <RefreshCcw size={16} className="animate-spin" />
                ) : (
                  <Play size={16} />
                )}
                {ui.isGenerating ? "Генерация..." : "Сгенерировать 1 видео"}
              </button>

              <button
                onClick={handleGenerateBatch}
                disabled={!workspaceReady || ui.isGenerating}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold transition ${
                  !workspaceReady || ui.isGenerating
                    ? "cursor-not-allowed bg-slate-200 text-slate-400"
                    : "bg-violet-100 text-violet-700 hover:bg-violet-200"
                }`}
              >
                <Sparkles size={16} />
                Сгенерировать {workspace.videosPerDay || 3} видео
              </button>
            </div>

            {!workspaceReady ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Заполни формат производства, тему, бриф, Agent Brain, параметры генерации и выбери соцсети,
                чтобы агент был готов к работе.
              </div>
            ) : null}
          </Card>

          {batch ? <CompactBatchPreview batch={batch} /> : null}

          <Card>
            <SectionTitle
              icon={Sparkles}
              title="Обзор"
              desc="Короткая выжимка по текущим настройкам агента."
            />

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <MiniInfo
                icon={Package}
                label="Формат"
                value={outputMeta.label}
              />
              <MiniInfo
                icon={ImageIcon}
                label="Источник визуала"
                value={visualMeta.label}
              />
              <MiniInfo
                icon={Video}
                label="Результат"
                value={getRenderModeMeta(workspace.renderMode).label}
              />
              <MiniInfo
                icon={Target}
                label="Цель"
                value={workspace.briefGoal}
              />
              <MiniInfo
                icon={Users}
                label="Аудитория"
                value={workspace.briefAudience}
              />
              <MiniInfo
                icon={Send}
                label="Площадки"
                value={selectedPlatformLabels.join(", ")}
              />
              <MiniInfo
                icon={Brain}
                label="Style"
                value={activeBrainStyle?.label}
              />
              <MiniInfo
                icon={Rocket}
                label="Hook"
                value={activeBrainHook?.label}
              />
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={FileText}
              title="Превью результата"
              desc="То, что агент уже сгенерировал на данный момент."
            />

            <div className="mt-5 space-y-4">
              {script?.title ? (
                <>
                  <div>
                    <div className="text-xl font-black text-slate-900">{script.title}</div>
                    <div className="mt-3 rounded-2xl bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700">
                      {script?.hook || "Хук пока не сгенерирован."}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <MetricCard
                      icon={Clapperboard}
                      label="Сцен"
                      value={String(scenesCount)}
                      hint="Текущая структура"
                    />
                    <MetricCard
                      icon={Captions}
                      label="Субтитров"
                      value={String(captionsCount)}
                      hint="Готово для captions"
                    />
                    <MetricCard
                      icon={Download}
                      label="Статус"
                      value="Превью готово"
                      hint="Можно дальше вести к экспорту"
                    />
                    <MetricCard
                      icon={Send}
                      label="Площадок"
                      value={String(publishTargets)}
                      hint="По текущему плану"
                    />
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={Sparkles}
                  title="Пока нет результата"
                  desc="Запусти агента, чтобы увидеть сценарий, сцены, субтитры и план публикации."
                />
              )}
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={Clapperboard}
              title="Сцены"
              desc="Пошаговая структура текущего ролика."
            />

            <div className="mt-5 space-y-3">
              {scenes?.length ? (
                scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className="rounded-2xl border border-slate-300 bg-white p-4"
                  >
                    <div className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Сцена {scene.order || scene.id}
                    </div>
                    <div className="mt-2 text-sm text-slate-700">{scene.text}</div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Clapperboard}
                  title="Сцен пока нет"
                  desc="Сначала запусти генерацию, чтобы увидеть структуру ролика."
                />
              )}
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={Captions}
              title="Субтитры"
              desc="Блоки текста для short-form подачи."
            />

            <div className="mt-5 space-y-2">
              {captions?.length ? (
                captions.map((caption) => (
                  <div
                    key={caption.id}
                    className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200"
                  >
                    {caption.text}
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={Captions}
                  title="Субтитров пока нет"
                  desc="Включи генерацию субтитров и запусти агента."
                />
              )}
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Всего блоков субтитров: {captionsCount}
            </div>
          </Card>

          <Card>
            <SectionTitle
              icon={Send}
              title="План публикации"
              desc="Куда должен пойти текущий результат."
            />

            <div className="mt-5 space-y-2">
              {publishPlan?.platforms?.length ? (
                publishPlan.platforms.map((p) => (
                  <div
                    key={p.platform}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3 text-sm ring-1 ring-slate-200"
                  >
                    <span className="font-bold text-slate-900">
                      {mapPlatformKeyToLabel(normalizePlatforms(p.platform)[0] || p.platform)}
                    </span>
                    <span className="text-slate-500">{p.status}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  План ещё не сгенерирован. Сейчас выбраны площадки:{" "}
                  <span className="font-bold text-slate-700">
                    {selectedPlatformLabels.length
                      ? selectedPlatformLabels.join(", ")
                      : "ничего не выбрано"}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-slate-500">
              Площадок в текущем результате: {publishTargets}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}