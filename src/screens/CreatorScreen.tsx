import {
  Heart,
  Info,
  Bookmark,
  ArrowRightLeft,
  Send,
  Play,
  LogOut,
  Plus,
  Image as ImageIcon,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { VerifiedBadge } from "../components/shared/VerifiedBadge";
import type { Video } from "../types/app";

const TELEGRAM_BOT_ID = "8298054487";
const TG_STORAGE_KEY = "margelet_tg_user";
const LIKES_STORAGE_KEY = "margelet_likes";
const SAVES_STORAGE_KEY = "margelet_saves";

function getTelegramAuthUrl() {
  const origin = window.location.origin;
  return `https://oauth.telegram.org/auth?bot_id=${TELEGRAM_BOT_ID}&origin=${origin}&request_access=write`;
}

type Props = {
  locale: "ru" | "en";
  videos: Video[];
  openPost: (video: Video) => void;
};

type CabinetTab = "added" | "saved" | "liked" | "about";

type TgUser = {
  id: string;
  first_name: string;
  username?: string;
  photo_url?: string;
};

function readTelegramUserFromStorage(): TgUser | null {
  const raw = localStorage.getItem(TG_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TgUser;
  } catch {
    localStorage.removeItem(TG_STORAGE_KEY);
    return null;
  }
}

function readNumberArrayFromStorage(key: string): number[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

function getDisplayText(video: Video, locale: "ru" | "en") {
  const caption = video.caption?.[locale]?.trim();
  const title = video.title?.[locale]?.trim();
  return caption || title || video.channel || "";
}

function isAvatarUrl(value?: string | null) {
  if (!value) return false;
  return /^https?:\/\//i.test(value);
}

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
      type="button"
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
            Сохраняй посты, ставь лайки, добавляй публикации и управляй своим
            потоком внутри margeleT.
          </div>

          <button
            onClick={() => {
              window.location.href = getTelegramAuthUrl();
            }}
            className="mt-5 inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100"
            type="button"
          >
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

function ProfileBlock({
  user,
  verified,
  onLogout,
}: {
  user: TgUser;
  verified: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white text-neutral-950 shadow-sm">
      <div className="grid gap-5 px-5 py-5 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-3 rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">
            <span>margeleT</span>
            <ArrowRightLeft className="h-4 w-4" />
            <span>Telegram</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-full bg-neutral-200">
              {user.photo_url ? (
                <img
                  src={user.photo_url}
                  alt={user.first_name}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : null}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="truncate text-lg font-semibold">
                  {user.first_name}
                </div>
                {verified ? (
                  <VerifiedBadge className="shrink-0 text-[#2AABEE]" />
                ) : null}
              </div>

              <div className="truncate text-sm text-neutral-500">
                {user.username ? `@${user.username}` : "Telegram user"}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Подключено к Telegram
            </div>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
              type="button"
            >
              <LogOut className="h-3.5 w-3.5" />
              Выйти
            </button>
          </div>
        </div>

        <div className="relative hidden min-h-[150px] md:block">
          <div className="absolute right-0 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-neutral-100 blur-xl" />
          <div className="absolute right-8 top-1/2 flex h-24 w-24 -translate-y-1/2 items-center justify-center rounded-[28px] border border-neutral-200 bg-neutral-50">
            <Send className="h-10 w-10 -rotate-12 text-neutral-700" />
          </div>
          <div className="absolute right-28 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white">
            <ArrowRightLeft className="h-6 w-6 text-neutral-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CabinetTile({
  video,
  locale,
  onOpen,
}: {
  video: Video;
  locale: "ru" | "en";
  onOpen: () => void;
}) {
  const text = getDisplayText(video, locale);

  return (
    <button
      onClick={onOpen}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-200 text-left"
      type="button"
    >
      {video.previewUrl ? (
        <img
          src={video.previewUrl}
          alt={text || video.channel}
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            video.bg || "from-neutral-300 to-neutral-200"
          }`}
        />
      )}

      <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/5" />

      <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
        {video.mediaType === "video" ? "Video" : "Image"}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-3 text-white">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/90 text-[11px] font-bold text-black">
            {isAvatarUrl(video.avatar) ? (
              <img
                src={video.avatar}
                alt={video.channel}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                {String(video.avatar || "TG").slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{video.channel}</div>
            <div className="truncate text-xs text-white/75">{video.handle}</div>
          </div>
        </div>

        <div className="line-clamp-2 text-xs leading-5 text-white/90">
          {text || "Telegram post"}
        </div>

        <div className="mt-2 flex items-center gap-2 text-[11px] text-white/70">
          {video.mediaType === "video" ? (
            <Play className="h-3.5 w-3.5" />
          ) : (
            <ImageIcon className="h-3.5 w-3.5" />
          )}
          <span>{video.likes}</span>
        </div>
      </div>
    </button>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-5 text-sm leading-6 text-neutral-500">
      {text}
    </div>
  );
}

function AboutBlock() {
  return (
    <div className="rounded-[28px] border border-neutral-200 bg-white p-5 text-neutral-900 shadow-sm">
      <div className="text-lg font-semibold">О проекте</div>
      <div className="mt-3 text-sm leading-7 text-neutral-600">
        MargeleT собирает Telegram-посты в общую ленту. Пост может добавить
        любой пользователь, но в центре внимания всегда остаётся источник —
        канал Telegram, а не человек, который принёс ссылку в ленту.
      </div>
    </div>
  );
}

export function CreatorScreen({ locale, videos, openPost }: Props) {
  const [tab, setTab] = useState<CabinetTab>("added");
  const [user, setUser] = useState<TgUser | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);

  useEffect(() => {
    const syncFromStorage = () => {
      setUser(readTelegramUserFromStorage());
      setLikedPostIds(readNumberArrayFromStorage(LIKES_STORAGE_KEY));
      setSavedPostIds(readNumberArrayFromStorage(SAVES_STORAGE_KEY));
    };

    syncFromStorage();

    window.addEventListener("focus", syncFromStorage);
    window.addEventListener("storage", syncFromStorage);

    return () => {
      window.removeEventListener("focus", syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  const isAuthorized = !!user;

  const handleLogout = () => {
    localStorage.removeItem(TG_STORAGE_KEY);
    setUser(null);
  };

  const addedVideos = useMemo(() => {
    if (!user?.id) return [];

    return [...videos]
      .filter((video) => video.addedByTelegramId === user.id)
      .sort((a, b) => b.id - a.id);
  }, [videos, user?.id]);

  const savedVideos = useMemo(() => {
    const ids = new Set(savedPostIds);
    return [...videos]
      .filter((video) => ids.has(video.id))
      .sort((a, b) => b.id - a.id);
  }, [videos, savedPostIds]);

  const likedVideos = useMemo(() => {
    const ids = new Set(likedPostIds);
    return [...videos]
      .filter((video) => ids.has(video.id))
      .sort((a, b) => b.id - a.id);
  }, [videos, likedPostIds]);

  const profileVerified = isAuthorized
    ? videos.some(
        (video) =>
          !!video.channelVerified &&
          user?.username &&
          video.handle.toLowerCase() === `@${user.username.toLowerCase()}`
      )
    : false;

  const tabContent = useMemo(() => {
    if (tab === "added") {
      if (!isAuthorized) {
        return (
          <EmptyState text="Авторизуйтесь через Telegram, чтобы видеть публикации, которые вы добавили." />
        );
      }

      if (addedVideos.length === 0) {
        return <EmptyState text="Вы ещё ничего не добавляли." />;
      }

      return (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {addedVideos.map((video) => (
            <CabinetTile
              key={video.id}
              video={video}
              locale={locale}
              onOpen={() => openPost(video)}
            />
          ))}
        </div>
      );
    }

    if (tab === "saved") {
      if (!isAuthorized) {
        return (
          <EmptyState text="Авторизуйтесь, чтобы сохранять посты и видеть их здесь." />
        );
      }

      if (savedVideos.length === 0) {
        return <EmptyState text="У вас пока нет сохранённых публикаций." />;
      }

      return (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {savedVideos.map((video) => (
            <CabinetTile
              key={video.id}
              video={video}
              locale={locale}
              onOpen={() => openPost(video)}
            />
          ))}
        </div>
      );
    }

    if (tab === "liked") {
      if (!isAuthorized) {
        return (
          <EmptyState text="Авторизуйтесь, чтобы ставить лайки и видеть их здесь." />
        );
      }

      if (likedVideos.length === 0) {
        return <EmptyState text="У вас пока нет лайкнутых публикаций." />;
      }

      return (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {likedVideos.map((video) => (
            <CabinetTile
              key={video.id}
              video={video}
              locale={locale}
              onOpen={() => openPost(video)}
            />
          ))}
        </div>
      );
    }

    return <AboutBlock />;
  }, [
    tab,
    isAuthorized,
    addedVideos,
    savedVideos,
    likedVideos,
    locale,
    openPost,
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-20 text-neutral-950">
      <div className="mx-auto max-w-[720px]">
        <div className="mb-5">
          {isAuthorized && user ? (
            <ProfileBlock
              user={user}
              verified={profileVerified}
              onLogout={handleLogout}
            />
          ) : (
            <AuthBlock />
          )}
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          <LightTab
            active={tab === "added"}
            onClick={() => setTab("added")}
            icon={Plus}
            label="Добавленные"
          />
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
            label="Лайки"
          />
          <LightTab
            active={tab === "about"}
            onClick={() => setTab("about")}
            icon={Info}
            label="О проекте"
          />
        </div>

        {tabContent}
      </div>
    </div>
  );
}