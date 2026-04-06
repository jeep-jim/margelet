import {
  Heart,
  Info,
  LogOut,
  Globe,
  Sparkles,
  Send,
  ArrowRightLeft,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { VerifiedBadge } from "../components/shared/VerifiedBadge";
import type { IngestedPost, Locale } from "../types/app";
import { SITE_LOCALES } from "../lib/locales";

const TELEGRAM_BOT_ID = "8298054487";
const TG_STORAGE_KEY = "margelet_tg_user";
const LIKES_STORAGE_KEY = "margelet_likes";
const LANGUAGE_STORAGE_KEY = "margelet_locale";

function getTelegramAuthUrl() {
  const origin = window.location.origin;
  return `https://oauth.telegram.org/auth?bot_id=${TELEGRAM_BOT_ID}&origin=${origin}&request_access=write`;
}

type Props = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  posts: IngestedPost[];
  openPost: (post: IngestedPost) => void;
};

type CabinetTab = "liked" | "language" | "channel" | "about";

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

function getPreview(post: IngestedPost) {
  return (
    post.media.find((item) => item.kind === "image")?.url ||
    post.media.find((item) => item.kind === "video")?.poster ||
    null
  );
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
      <span>{label}</span>
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
            Авторизуйся, чтобы управлять своим кабинетом, смотреть понравившиеся
            публикации и отправлять заявку на добавление собственного канала.
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
        </div>
      </div>
    </div>
  );
}

function ProfileBlock({
  user,
  onLogout,
}: {
  user: TgUser;
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
                <VerifiedBadge className="shrink-0 text-[#2AABEE]" />
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
        </div>
      </div>
    </div>
  );
}

function CabinetTile({
  post,
  onOpen,
}: {
  post: IngestedPost;
  onOpen: () => void;
}) {
  const preview = getPreview(post);

  return (
    <button
      onClick={onOpen}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-200 text-left"
      type="button"
    >
      {preview ? (
        <img
          src={preview}
          alt={post.text || post.source.title}
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 to-neutral-200" />
      )}

      <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/5" />

      <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
        {post.contentType}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-3 text-white">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/90 text-[11px] font-bold text-black">
            {post.source.avatar ? (
              <img
                src={post.source.avatar}
                alt={post.source.title}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                {String(post.source.title || "TG").slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{post.source.title}</div>
            <div className="truncate text-xs text-white/75">
              @{post.source.handle}
            </div>
          </div>
        </div>

        <div className="line-clamp-2 text-xs leading-5 text-white/90">
          {post.text || "Telegram post"}
        </div>
      </div>
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[28px] border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
      {text}
    </div>
  );
}

export function CreatorScreen({
  locale,
  setLocale,
  posts,
  openPost,
}: Props) {
  const [user, setUser] = useState<TgUser | null>(null);
  const [tab, setTab] = useState<CabinetTab>("language");
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [channelUrl, setChannelUrl] = useState("");

  useEffect(() => {
    const sync = () => {
      setUser(readTelegramUserFromStorage());
      setLikedIds(readNumberArrayFromStorage(LIKES_STORAGE_KEY));
    };

    sync();

    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const likedPosts = useMemo(() => {
    return posts.filter((post) => likedIds.includes(post.id));
  }, [posts, likedIds]);

  const handleLogout = () => {
    localStorage.removeItem(TG_STORAGE_KEY);
    setUser(null);
  };

  const handleChangeLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
  };

  const handleReplayIntro = () => {
    localStorage.removeItem("margelet-intro-seen");
    window.location.reload();
  };

  const handleSubmitChannel = () => {
    const value = channelUrl.trim();

    if (!value) {
      alert("Вставь ссылку на Telegram-канал");
      return;
    }

    if (!/^https?:\/\/t\.me\/[A-Za-z0-9_]+\/?$/.test(value)) {
      alert("Нужна ссылка вида https://t.me/channel_name");
      return;
    }

    alert("Заявка на канал отправлена. Позже подключим реальную отправку в админку.");
    setChannelUrl("");
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-20 text-neutral-950">
      <div className="mx-auto max-w-[720px] space-y-6">
        {!user ? (
          <AuthBlock />
        ) : (
          <ProfileBlock user={user} onLogout={handleLogout} />
        )}

        <div className="flex flex-wrap gap-2">
          <LightTab
            active={tab === "language"}
            onClick={() => setTab("language")}
            icon={Globe}
            label="Язык"
          />
          <LightTab
            active={tab === "liked"}
            onClick={() => setTab("liked")}
            icon={Heart}
            label="Нравится"
          />
          <LightTab
            active={tab === "channel"}
            onClick={() => setTab("channel")}
            icon={Send}
            label="Добавить канал"
          />
          <LightTab
            active={tab === "about"}
            onClick={() => setTab("about")}
            icon={Info}
            label="О проекте"
          />
        </div>

        {tab === "language" ? (
          <div className="space-y-4">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Globe className="h-4 w-4" />
                Выбор языка
              </div>

              <div className="flex flex-wrap gap-2">
                {SITE_LOCALES.filter((item) => item.enabled).map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleChangeLocale(item.code as Locale)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      locale === item.code
                        ? "bg-neutral-950 text-white"
                        : "border border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    {item.nativeLabel}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-neutral-200 bg-white p-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4" />
                Интро
              </div>

              <div className="text-sm leading-6 text-neutral-600">
                Здесь можно снова открыть первое приветственное интро и проверить
                тексты, слайды и будущие арты.
              </div>

              <button
                type="button"
                onClick={handleReplayIntro}
                className="mt-4 inline-flex items-center rounded-full bg-neutral-950 px-4 py-2 text-sm text-white transition hover:bg-neutral-800"
              >
                Смотреть интро снова
              </button>
            </div>
          </div>
        ) : null}

        {tab === "liked" ? (
          likedPosts.length === 0 ? (
            <EmptyState text="Здесь пока пусто." />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {likedPosts.map((post) => (
                <CabinetTile
                  key={post.id}
                  post={post}
                  onOpen={() => openPost(post)}
                />
              ))}
            </div>
          )
        ) : null}

        {tab === "channel" ? (
          <div className="rounded-[28px] border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Send className="h-4 w-4" />
              Подать заявку на добавление своего канала
            </div>

            <div className="text-sm leading-6 text-neutral-600">
              Вставь ссылку на Telegram-канал. Канал не публикуется автоматически —
              он должен пройти модерацию.
            </div>

            <input
              value={channelUrl}
              onChange={(event) => setChannelUrl(event.target.value)}
              placeholder="https://t.me/your_channel"
              className="mt-4 w-full rounded-full border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-neutral-950"
            />

            <button
              type="button"
              onClick={handleSubmitChannel}
              className="mt-4 inline-flex items-center rounded-full bg-neutral-950 px-4 py-2 text-sm text-white transition hover:bg-neutral-800"
            >
              Отправить заявку
            </button>
          </div>
        ) : null}

        {tab === "about" ? (
          <div className="rounded-[28px] border border-neutral-200 bg-white p-6 text-sm leading-7 text-neutral-700">
            margeleT — это слой дистрибуции актуального Telegram-контента.
            Контент показывается через нормализованную ingest-модель, а источником
            всегда остаётся оригинальный Telegram-канал.
          </div>
        ) : null}
      </div>
    </div>
  );
}