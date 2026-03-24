import {
  Heart,
  Info,
  Bookmark,
  ArrowRightLeft,
  Send,
  Play,
} from "lucide-react";
import { useState } from "react";
import type { Video } from "../types/app";

type Props = {
  locale: "ru" | "en";
  videos: Video[];
  openPost: (video: Video) => void;
};

type CabinetTab = "saved" | "liked" | "about";

function LightTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
        active
          ? "bg-neutral-950 text-white"
          : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
      }`}
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function AuthBlock() {
  return (
    <div className="overflow-hidden rounded-[32px] bg-[#4da3ff] text-white">
      <div className="grid gap-5 px-5 py-5 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-3 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
            <span>margeleT</span>
            <ArrowRightLeft className="h-4 w-4" />
            <span>Telegram</span>
          </div>

          <div className="text-[26px] font-semibold leading-tight">
            Войти через Telegram
          </div>

          <div className="mt-2 max-w-[28rem] text-sm leading-6 text-white/92">
            Сохраняй видео, ставь лайки и управляй своим потоком внутри
            margeleT.
          </div>

          <button className="mt-5 inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100">
            Авторизоваться
          </button>
        </div>

        <div className="relative hidden min-h-[150px] md:block">
          <div className="absolute right-0 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-white/14 blur-xl" />
          <div className="absolute right-8 top-1/2 flex h-24 w-24 -translate-y-1/2 items-center justify-center rounded-[28px] border border-white/20 bg-white/10 backdrop-blur-md">
            <Send className="h-10 w-10 -rotate-12 text-white" />
          </div>
          <div className="absolute right-28 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-white/10 backdrop-blur-md">
            <ArrowRightLeft className="h-6 w-6 text-white/95" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileBlock() {
  return (
    <div className="overflow-hidden rounded-[32px] bg-[#4da3ff] text-white">
      <div className="grid gap-5 px-5 py-5 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-3 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
            <span>margeleT</span>
            <ArrowRightLeft className="h-4 w-4" />
            <span>Telegram</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-white/25" />
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold">
                Имя пользователя
              </div>
              <div className="truncate text-sm text-white/90">@username</div>
            </div>
          </div>

          <div className="mt-3 text-sm text-white/90">
            Подключено к Telegram
          </div>
        </div>

        <div className="relative hidden min-h-[150px] md:block">
          <div className="absolute right-0 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-white/14 blur-xl" />
          <div className="absolute right-8 top-1/2 flex h-24 w-24 -translate-y-1/2 items-center justify-center rounded-[28px] border border-white/20 bg-white/10 backdrop-blur-md">
            <Send className="h-10 w-10 -rotate-12 text-white" />
          </div>
          <div className="absolute right-28 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-white/18 bg-white/10 backdrop-blur-md">
            <ArrowRightLeft className="h-6 w-6 text-white/95" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CabinetTile({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-200"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#d4d4d8_0%,#e5e7eb_100%)]" />
      <div className="absolute inset-0 flex items-center justify-center opacity-70 transition group-hover:opacity-100">
        <Play className="h-7 w-7 text-neutral-800" />
      </div>
    </button>
  );
}

export function CreatorScreen({ videos, openPost }: Props) {
  const [tab, setTab] = useState<CabinetTab>("saved");

  // временно: переключи на true, когда подключим Telegram auth
  const isAuthorized = false;

  const savedVideos = videos.slice(0, 5);
  const likedVideos = videos.slice(1, 6);

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-20 text-neutral-950">
      <div className="mx-auto max-w-[720px]">
        <div className="mb-5">
          {isAuthorized ? <ProfileBlock /> : <AuthBlock />}
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          <LightTab
            active={tab === "saved"}
            onClick={() => setTab("saved")}
            icon={Bookmark}
            label="Избранное"
          />
          <LightTab
            active={tab === "liked"}
            onClick={() => setTab("liked")}
            icon={Heart}
            label="Нравится"
          />
          <LightTab
            active={tab === "about"}
            onClick={() => setTab("about")}
            icon={Info}
            label="О проекте"
          />
        </div>

        {!isAuthorized && tab !== "about" ? (
          <div className="rounded-2xl bg-white px-4 py-4 text-sm leading-6 text-neutral-600">
            Авторизуйтесь, чтобы сохранять видео, которые вам понравились,
            и иметь доступ к другим возможностям margeleT.
          </div>
        ) : (
          <>
            {tab === "saved" && (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {savedVideos.map((video) => (
                  <CabinetTile
                    key={video.id}
                    onOpen={() => openPost(video)}
                  />
                ))}
              </div>
            )}

            {tab === "liked" && (
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                {likedVideos.map((video) => (
                  <CabinetTile
                    key={video.id}
                    onOpen={() => openPost(video)}
                  />
                ))}
              </div>
            )}

            {tab === "about" && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-white px-4 py-4 text-[15px] leading-7 text-neutral-700">
                  MargeleT — это общая лента видео из Telegram. Мы не храним и
                  не создаём новый контент, а даём Telegram-постам с видео новую
                  жизнь в удобной ленте просмотра.
                </div>

                <div className="rounded-2xl bg-white px-4 py-4 text-[15px] leading-7 text-neutral-700">
                  Автор добавляет ссылку на свой Telegram-пост, а пользователь
                  смотрит видео как в привычной ленте и переходит к источнику.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}