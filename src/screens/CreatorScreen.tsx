import { Globe, Heart, Info, Bookmark } from "lucide-react";
import { useState } from "react";
import type { Locale, Video } from "../types/app";
import { Button } from "../components/ui/Button";

type Props = {
  locale: Locale;
  videos: Video[];
  openPost: (video: Video) => void;
};

type CabinetTab = "saved" | "liked" | "about";

function CabinetItem({
  title,
  subtitle,
  onClick,
}: {
  title: string;
  subtitle?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-neutral-200 bg-white p-4 text-left transition hover:bg-neutral-50"
    >
      <div className="text-[16px] font-semibold text-neutral-950">{title}</div>
      {subtitle ? (
        <div className="mt-1 text-sm leading-6 text-neutral-500">{subtitle}</div>
      ) : null}
    </button>
  );
}

function VideoRow({
  video,
  locale,
  onOpen,
}: {
  video: Video;
  locale: Locale;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 text-left transition hover:bg-neutral-50"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-200" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-neutral-950">
          {video.channel}
        </div>
        <div className="mt-1 line-clamp-2 text-sm leading-5 text-neutral-600">
          {video.title[locale]}
        </div>
      </div>
    </button>
  );
}

export function CreatorScreen({ locale, videos, openPost }: Props) {
  const [tab, setTab] = useState<CabinetTab>("saved");
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);

  const savedVideos = videos.slice(0, 3);
  const likedVideos = videos.slice(1, 4);

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-20 text-neutral-950">
      <div className="mx-auto max-w-[720px]">
        <div className="mb-6">
          <div className="text-[28px] font-semibold tracking-tight">Кабинет</div>
          <div className="mt-1 text-sm text-neutral-500">
            Твои действия, настройки и быстрый доступ
          </div>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setTab("saved")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
              tab === "saved"
                ? "bg-neutral-950 text-white"
                : "bg-white text-neutral-700 border border-neutral-200"
            }`}
          >
            <Bookmark className="h-4 w-4" />
            Сохранённое
          </button>

          <button
            onClick={() => setTab("liked")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
              tab === "liked"
                ? "bg-neutral-950 text-white"
                : "bg-white text-neutral-700 border border-neutral-200"
            }`}
          >
            <Heart className="h-4 w-4" />
            Лайкнутое
          </button>

          <button
            onClick={() => setTab("about")}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
              tab === "about"
                ? "bg-neutral-950 text-white"
                : "bg-white text-neutral-700 border border-neutral-200"
            }`}
          >
            <Info className="h-4 w-4" />О проекте
          </button>
        </div>

        {tab === "saved" && (
          <div className="space-y-3">
            {savedVideos.map((video) => (
              <VideoRow
                key={video.id}
                video={video}
                locale={locale}
                onOpen={() => openPost(video)}
              />
            ))}
          </div>
        )}

        {tab === "liked" && (
          <div className="space-y-3">
            {likedVideos.map((video) => (
              <VideoRow
                key={video.id}
                video={video}
                locale={locale}
                onOpen={() => openPost(video)}
              />
            ))}
          </div>
        )}

        {tab === "about" && (
          <div className="space-y-4">
            <CabinetItem
              title="Margelet"
              subtitle="Лента видеоконтента из Telegram. Источник всегда остаётся оригинальным, а Margelet даёт контенту новую жизнь."
            />

            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-neutral-950">
                <Globe className="h-4 w-4" />
                Язык интерфейса
              </div>

              <div className="flex gap-2">
                <Button
                  variant={currentLocale === "ru" ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => {
                    setCurrentLocale("ru");
                    localStorage.setItem("margelet-locale", "ru");
                    window.location.reload();
                  }}
                >
                  RU
                </Button>

                <Button
                  variant={currentLocale === "en" ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => {
                    setCurrentLocale("en");
                    localStorage.setItem("margelet-locale", "en");
                    window.location.reload();
                  }}
                >
                  EN
                </Button>
              </div>
            </div>

            <CabinetItem
              title="Как это работает"
              subtitle="Ты листаешь ленту, открываешь видео по тапу, а весь трафик уходит в оригинальный Telegram-источник."
            />
          </div>
        )}
      </div>
    </div>
  );
}