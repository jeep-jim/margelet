"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  Play,
  RefreshCcw,
  Upload,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";

const COPY = {
  ru: {
    step1Title: "1. Выбери формат агента",
    step1Tail: "или оставь пустым",
    step2Title: "2. Материалы",
    step2Tail: "сюда можно бросить файлы, фото, видео, ссылки и пояснения.",
    step3Title: "3. Тема видео",
    step3Tail: "пиши так, как будто ставишь задачу реальному продюсеру.",
    dropTitle: "Перетащи файлы сюда или нажми для загрузки",
    dropHint: "Поддержка: фото, видео, PDF, DOC, TXT.",
    upload: "Загрузить",
    linkPlaceholder: "https://Ссылка на любой источник",
    topicPlaceholder:
      "Поставь задачу, например: Используй примеры только с рыжими котами",
    duration: "Длительность",
    tone: "Тон",
    voice: "Голос",
    trend: "Найди тренд",
    doForMe: "Сделай за меня",
    start: "Готово, начинай!",
    preview: "Предпросмотр",
    createdThree: "Создано три варианта",
    download: "Скачать видео",
    regenerate: "Перегенерировать",
    mobilePreview: "Предпросмотр",
    generating: "Генерируем 3 варианта...",
    variant: "Вариант",
    formats: {
      motivation: "Мотивация",
      business: "Бизнес",
      news: "Новости",
      ai: "AI",
      crypto: "Крипта",
      facts: "Факты",
      more: "Ещё",
    },
    durations: ["10 секунд", "15 секунд", "20 секунд", "30 секунд", "40 секунд", "60 секунд"],
    tones: ["Динамично", "Спокойно", "Дорого", "Дружелюбно"],
    voices: ["Автоматический", "Энергичный", "Спокойный", "Рассказчик"],
  },
  en: {
    step1Title: "1. Choose agent format",
    step1Tail: "or leave it empty",
    step2Title: "2. Materials",
    step2Tail: "drop files, photos, videos, links and notes here.",
    step3Title: "3. Video topic",
    step3Tail: "write it like you're briefing a real producer.",
    dropTitle: "Drag files here or click to upload",
    dropHint: "Supports: photo, video, PDF, DOC, TXT.",
    upload: "Upload",
    linkPlaceholder: "https://Link to any source",
    topicPlaceholder:
      "Describe the task, for example: use examples only with orange cats",
    duration: "Duration",
    tone: "Tone",
    voice: "Voice",
    trend: "Find trend",
    doForMe: "Do it for me",
    start: "Ready, start!",
    preview: "Preview",
    createdThree: "Three variants created",
    download: "Download video",
    regenerate: "Regenerate",
    mobilePreview: "Preview",
    generating: "Generating 3 variants...",
    variant: "Variant",
    formats: {
      motivation: "Motivation",
      business: "Business",
      news: "News",
      ai: "AI",
      crypto: "Crypto",
      facts: "Facts",
      more: "More",
    },
    durations: ["10 sec", "15 sec", "20 sec", "30 sec", "40 sec", "60 sec"],
    tones: ["Dynamic", "Calm", "Premium", "Friendly"],
    voices: ["Automatic", "Energetic", "Calm", "Narrator"],
  },
};

const FORMAT_ITEMS = [
  { id: "motivation", icon: "🧘" },
  { id: "business", icon: "💼" },
  { id: "news", icon: "📰" },
  { id: "ai", icon: "🤖" },
  { id: "crypto", icon: "₿" },
  { id: "facts", icon: "📚" },
  { id: "more", icon: "✚" },
];

const DEMO_POSTERS = [
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=800&auto=format&fit=crop",
];

function pixelClip() {
  return {
    clipPath:
      "polygon(0 8px, 8px 8px, 8px 0, calc(100% - 8px) 0, calc(100% - 8px) 8px, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 8px), 0 calc(100% - 8px))",
  };
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

function PixelSelect({ label, value, onChange, options }) {
  return (
    <div className="space-y-2">
      <div className="text-[16px] font-semibold text-[#57558c]">{label}</div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={pixelClip()}
          className="w-full appearance-none bg-white px-5 py-4 text-[15px] text-[#6b5fa0] outline-none"
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
      className="group flex w-[88px] shrink-0 flex-col items-center"
    >
      <div
        className={`flex h-[88px] w-[88px] items-center justify-center transition ${
          active ? "bg-[#b78dff]" : "bg-white"
        }`}
        style={pixelClip()}
      >
        <span className={`text-[34px] leading-none ${active ? "text-white" : ""}`}>{icon}</span>
      </div>
      <div className={`mt-3 text-center text-[15px] font-semibold ${active ? "text-[#be8cff]" : "text-[#171717]"}`}>
        {label}
      </div>
    </button>
  );
}

function ThumbSlot({ src, text, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-[60px] w-[60px] shrink-0 overflow-hidden bg-white ${
        active ? "ring-2 ring-[#7e63ff]" : ""
      }`}
      style={pixelClip()}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[18px] font-semibold text-[#c8c9df]">
          {text}
        </div>
      )}
    </button>
  );
}

export default function AgentStudioWorkspace() {
  const [lang, setLang] = useState("ru");
  const t = COPY[lang];

  const [selectedFormat, setSelectedFormat] = useState("crypto");
  const [topic, setTopic] = useState("");
  const [duration, setDuration] = useState(t.durations[3]);
  const [tone, setTone] = useState(t.tones[0]);
  const [voice, setVoice] = useState(t.voices[0]);
  const [link, setLink] = useState("");
  const [assets, setAssets] = useState([
    { id: "a1", src: DEMO_POSTERS[0] },
    { id: "a2", src: DEMO_POSTERS[1] },
    { id: "a3", src: DEMO_POSTERS[2] },
    { id: "a4", src: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop" },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState([]);
  const [activeVariant, setActiveVariant] = useState(0);

  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

  const previewPoster = useMemo(() => {
    if (variants.length) return variants[activeVariant]?.poster || DEMO_POSTERS[0];
    return DEMO_POSTERS[1];
  }, [variants, activeVariant]);

  const previewVideo = useMemo(() => {
    if (variants.length) return variants[activeVariant]?.video || "";
    return "";
  }, [variants, activeVariant]);

  const currentFormatLabel = t.formats[selectedFormat] || "";

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

    setAssets((prev) => [...next, ...prev].slice(0, 8));
  };

  const handleGenerate = () => {
    if (isGenerating) return;
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
    }, 1400);
  };

  const scrollToPreview = () => {
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#dfe6fb] px-4 pb-28 pt-8 md:px-8 xl:px-0">
      <div className="mx-auto w-full max-w-[1120px] lg:grid lg:grid-cols-[1fr_354px] lg:gap-7">
        <div className="space-y-4 md:space-y-5">
          <section>
            <div className="px-2 md:px-0">
              <div className="flex flex-wrap items-baseline gap-2 border-b border-white/60 pb-5">
                <h2 className="text-[24px] font-bold text-[#7a5d9d]">{t.step1Title}</h2>
                <span className="text-[18px] text-[#8d84b8]">{t.step1Tail}</span>
              </div>
            </div>

            <div className="mt-7 flex gap-[18px] overflow-x-auto pb-2">
              {FORMAT_ITEMS.map((item) => (
                <FormatTile
                  key={item.id}
                  icon={item.icon}
                  label={t.formats[item.id]}
                  active={selectedFormat === item.id}
                  onClick={() => setSelectedFormat(item.id)}
                />
              ))}
            </div>
          </section>

          <section className="bg-[#cad4f4] p-5 md:p-7" style={pixelClip()}>
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-[24px] font-bold text-[#4d5b92]">{t.step2Title}</h2>
              <span className="text-[18px] text-[#5f6796]">{t.step2Tail}</span>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-0 md:grid-cols-[1fr_200px]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFiles(e.dataTransfer.files);
                }}
                className="border-[3px] border-dashed border-white bg-[#d9e2fb] px-5 py-7 text-center"
              >
                <div className="text-[18px] font-bold text-[#4d5b92]">{t.dropTitle}</div>
                <div className="mt-2 text-[15px] text-[#4d5b92]">{t.dropHint}</div>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#91a5d9] px-5 py-7 text-[18px] font-bold text-white"
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

            <div className="mt-6">
              <div className="relative">
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder={t.linkPlaceholder}
                  className="w-full bg-white px-6 py-5 text-[15px] text-[#b0b8d9] outline-none placeholder:text-[#b0b8d9]"
                  style={pixelClip()}
                />
                <LinkIcon
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#c9cfe7]"
                />
              </div>
            </div>

            <div className="mt-7 flex gap-4 overflow-x-auto pb-1">
              <ThumbSlot src={assets[0]?.src} active={false} />
              <ThumbSlot src={assets[1]?.src} active={false} />
              <ThumbSlot src={assets[2]?.src} active={false} />
              <ThumbSlot src={assets[3]?.src} active={false} />
              <ThumbSlot text="6" active={false} />
              <ThumbSlot text="7" active={false} />
              <ThumbSlot text="8" active={false} />
              <ThumbSlot text="✚" active={false} />
            </div>
          </section>

          <section className="bg-[#c9b8f3] p-5 md:p-7" style={pixelClip()}>
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="text-[24px] font-bold text-[#5b447b]">{t.step3Title}</h2>
              <span className="text-[18px] text-[#6b5b8f]">{t.step3Tail}</span>
            </div>

            <div className="mt-7">
              <textarea
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t.topicPlaceholder}
                className="w-full resize-none bg-white px-6 py-5 text-[16px] text-[#6b5fa0] outline-none placeholder:text-[#7d72a8]"
                style={pixelClip()}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <PixelSelect
                label={t.duration}
                value={duration}
                onChange={setDuration}
                options={t.durations}
              />
              <PixelSelect
                label={t.tone}
                value={tone}
                onChange={setTone}
                options={t.tones}
              />
              <PixelSelect
                label={t.voice}
                value={voice}
                onChange={setVoice}
                options={t.voices}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <PixelButton color="soft" className="w-full">
                {t.trend}
              </PixelButton>
              <PixelButton color="violet" className="w-full">
                {t.doForMe}
              </PixelButton>
              <PixelButton
                color="pink"
                className="w-full"
                onClick={handleGenerate}
                disabled={isGenerating}
                icon={isGenerating ? <RefreshCcw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              >
                {isGenerating ? t.generating : t.start}
              </PixelButton>
            </div>
          </section>
        </div>

        <div
          ref={previewRef}
          className="mt-6 lg:mt-0 lg:sticky lg:top-6 lg:self-start"
        >
          <div className="space-y-5">
            <div className="overflow-hidden bg-[#111111]" style={pixelClip()}>
              <div className="aspect-[9/16] w-full bg-[linear-gradient(90deg,#17151d_0%,#17151d_50%,#22202a_50%,#22202a_100%)] bg-[length:52px_52px]">
                {previewVideo ? (
                  <video
                    src={previewVideo}
                    controls
                    className="h-full w-full object-cover"
                    poster={previewPoster}
                  />
                ) : (
                  <div className="relative flex h-full w-full items-center justify-center">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,#17151d_0%,#17151d_50%,#26232f_50%,#26232f_100%)] bg-[length:52px_52px]" />
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

            <div className="bg-[#d7e3f3] p-0" style={pixelClip()}>
              <div className="grid grid-cols-3 gap-[18px] p-[0]">
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
                        <div className="flex h-full w-full items-center justify-center bg-[#26232f] text-[26px] font-semibold text-[#c3c3d0]">
                          {idx + 1}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="px-3 pb-5 pt-4 text-center text-[17px] text-[#2a2a2a]">
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

            <PixelButton
              color="soft"
              className="w-full text-[18px]"
              icon={<RefreshCcw size={18} />}
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {t.regenerate}
            </PixelButton>

            <div className="hidden lg:flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setLang("ru")}
                className={`text-[14px] font-semibold ${lang === "ru" ? "text-[#1b1b1b]" : "text-[#8a8ca7]"}`}
              >
                RU
              </button>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`text-[14px] font-semibold ${lang === "en" ? "text-[#1b1b1b]" : "text-[#8a8ca7]"}`}
              >
                EN
              </button>
            </div>

            <div className="hidden lg:block text-[13px] text-[#7a729d]">
              {currentFormatLabel ? `${t.variant}: ${currentFormatLabel}` : ""}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
        <button
          type="button"
          onClick={scrollToPreview}
          style={pixelClip()}
          className="w-full bg-[#8c62ff] px-5 py-4 text-[16px] font-bold text-white shadow-[0_10px_30px_rgba(88,62,155,0.25)]"
        >
          {t.mobilePreview}
        </button>
      </div>
    </div>
  );
}