import {
  ArrowRightLeft,
  Link as LinkIcon,
  Plus,
  CheckCircle2,
  AlertCircle,
  Globe,
  Image as ImageIcon,
  Video,
  ChevronDown,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ContentTag, Locale, MediaType } from "../types/app";
import { Input } from "../components/ui/Input";
import { fetchTelegramPreview, normalizeTelegramUrl } from "../lib/telegram";

const TELEGRAM_BOT_ID = "8298054487";
const TG_STORAGE_KEY = "margelet_tg_user";

const TAG_OPTIONS: { value: ContentTag; label: string }[] = [
  { value: "people", label: "Люди" },
  { value: "animals", label: "Животные" },
  { value: "news", label: "Новости" },
  { value: "business", label: "Бизнес" },
  { value: "creativity", label: "Творчество" },
  { value: "finance", label: "Финансы" },
  { value: "education", label: "Образование" },
  { value: "technology", label: "Технологии" },
  { value: "memes", label: "Мемы" },
  { value: "sports", label: "Спорт" },
  { value: "music", label: "Музыка" },
  { value: "travel", label: "Путешествия" },
  { value: "food", label: "Еда" },
  { value: "other", label: "Другое" },
];

function getTelegramAuthUrl() {
  const origin = window.location.origin;
  return `https://oauth.telegram.org/auth?bot_id=${TELEGRAM_BOT_ID}&origin=${origin}&request_access=write`;
}

type Props = {
  locale: Locale;
  onAdd: (payload: {
    url: string;
    title: string;
    caption?: string;
    channel: string;
    avatar?: string | null;
    tag: ContentTag;
    previewUrl?: string | null;
    mediaType?: MediaType;
    videoUrl?: string | null;
    channelVerified?: boolean;
  }) => Promise<void>;
};

type TgUser = {
  id: string;
  first_name: string;
  username?: string;
  photo_url?: string;
};

type ParsedTelegramPost = {
  channel: string;
  postId: string;
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

function parseTelegramPostUrl(raw: string): ParsedTelegramPost | null {
  const value = raw.trim();

  if (!value) return null;

  try {
    const normalized = normalizeTelegramUrl(value);

    if (!normalized) return null;

    const url = new URL(normalized);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname !== "t.me" && hostname !== "telegram.me") return null;

    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.length !== 2) return null;

    const [channel, postId] = parts;

    if (!/^[A-Za-z0-9_]{4,}$/.test(channel)) return null;
    if (!/^\d+$/.test(postId)) return null;

    return { channel, postId };
  } catch {
    return null;
  }
}

function getTagLabel(tag: ContentTag) {
  return TAG_OPTIONS.find((item) => item.value === tag)?.label || "Другое";
}

function asCleanUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function isLikelyAvatarUrl(value: string | null | undefined) {
  if (!value) return false;

  const lower = value.toLowerCase();

  return (
    lower.includes("/userpic/") ||
    lower.includes("userpic") ||
    lower.includes("profile_photo") ||
    lower.includes("channel_photo") ||
    lower.includes("avatar") ||
    lower.includes("tgme_page_photo") ||
    lower.includes("telegram.org/file/") && lower.includes("photo")
  );
}

function AuthBlock() {
  return (
    <div className="mt-6 overflow-hidden rounded-[32px] bg-[#4da3ff] text-white">
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
            Авторизуйтесь, чтобы публиковать Telegram-посты в общей ленте
            MargeleT.
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

        <div className="hidden md:block">
          <div className="rounded-[28px] border border-white/20 bg-white/10 p-4 backdrop-blur-md">
            <div className="space-y-3 text-sm text-white/90">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span>Видео-посты</span>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span>Посты с картинкой</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>Только публичные ссылки</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RuleItem({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
      <span>{text}</span>
    </div>
  );
}

export function AddScreen({ onAdd }: Props) {
  const [url, setUrl] = useState("");
  const [user, setUser] = useState<TgUser | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedTag, setSelectedTag] = useState<ContentTag | null>(null);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const syncUser = () => {
      setUser(readTelegramUserFromStorage());
    };

    syncUser();

    window.addEventListener("focus", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("focus", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  const isAuthorized = !!user;

  const parsedPost = useMemo(() => parseTelegramPostUrl(url), [url]);

  const validationMessage = useMemo(() => {
    if (!url.trim()) return "";
    if (parsedPost) return "";
    return "Нужна публичная ссылка вида t.me/channel/123. Приватные, invite и кривые ссылки пока не принимаем.";
  }, [parsedPost, url]);

  const clearMessages = () => {
    if (submitError) setSubmitError("");
    if (successMessage) setSuccessMessage("");
  };

  const handleSubmit = async () => {
    const cleanUrl = url.trim();

    setSubmitError("");
    setSuccessMessage("");

    if (!cleanUrl) {
      setSubmitError("Вставь ссылку на Telegram-пост.");
      return;
    }

    if (!parsedPost) {
      setSubmitError(
        "Сейчас можно добавить только публичный Telegram-пост вида t.me/channel/123."
      );
      return;
    }

    if (!selectedTag) {
      setSubmitError("Выберите тег для поста.");
      return;
    }

    try {
      setIsSubmitting(true);

      const normalized = normalizeTelegramUrl(cleanUrl);

      if (!normalized) {
        setSubmitError("Не удалось распознать ссылку на Telegram-пост.");
        return;
      }

      const preview = await fetchTelegramPreview(normalized);

      const rawAvatar = asCleanUrl(preview?.avatar);
      const rawImage = asCleanUrl(preview?.image);
      const rawPoster = asCleanUrl((preview as any)?.poster);
      const rawVideo = asCleanUrl(preview?.video);

      const finalAvatar =
        rawAvatar ||
        (isLikelyAvatarUrl(rawImage) ? rawImage : null) ||
        (isLikelyAvatarUrl(rawPoster) ? rawPoster : null);

      const finalPreviewImage =
        rawImage && !isLikelyAvatarUrl(rawImage)
          ? rawImage
          : rawPoster && !isLikelyAvatarUrl(rawPoster)
            ? rawPoster
            : null;

      const mediaType: MediaType | undefined = rawVideo
        ? "video"
        : finalPreviewImage
          ? "image"
          : undefined;

      const cleanCaption =
        typeof preview?.caption === "string"
          ? preview.caption.trim()
          : "";

      const cleanTitle =
        typeof preview?.title === "string" && preview.title.trim()
          ? preview.title.trim()
          : parsedPost.channel;

      await onAdd({
        url: normalized,
        title: cleanTitle,
        caption: cleanCaption,
        channel: parsedPost.channel,
        avatar: finalAvatar,
        tag: selectedTag,
        previewUrl: finalPreviewImage,
        mediaType,
        videoUrl: rawVideo,
        channelVerified: !!preview?.verified,
      });

      setSuccessMessage("Пост добавлен в ленту.");
      setUrl("");
      setSelectedTag(null);
      setTagsOpen(false);
    } catch (error) {
      console.error(error);
      setSubmitError("Не удалось сохранить пост в общую ленту.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-20 text-neutral-950">
      <div className="mx-auto max-w-[720px]">
        <div className="text-[28px] font-semibold tracking-tight">
          Добавить пост
        </div>

        {!isAuthorized ? (
          <AuthBlock />
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-5">
              <div className="mb-2 text-sm font-medium text-neutral-500">
                Публичная ссылка на Telegram-пост
              </div>

              <div className="relative">
                <LinkIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <Input
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    clearMessages();
                  }}
                  placeholder="https://t.me/channel/123"
                  className="h-14 rounded-2xl border-neutral-200 bg-neutral-100 pl-11 pr-4 text-[15px] text-neutral-950"
                />
              </div>

              {parsedPost && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    Ссылка выглядит валидно: @{parsedPost.channel}, пост {parsedPost.postId}
                  </span>
                </div>
              )}

              {!parsedPost && validationMessage && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{validationMessage}</span>
                </div>
              )}

              <div className="mt-4">
                <div className="mb-2 text-sm font-medium text-neutral-500">
                  Категория
                </div>

                {!selectedTag ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTagsOpen((v) => !v);
                      clearMessages();
                    }}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                      tagsOpen
                        ? "bg-neutral-950 text-white"
                        : "border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    <span>Выберите тег</span>
                    <ChevronDown
                      className={`h-4 w-4 transition ${tagsOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTag(null);
                      clearMessages();
                    }}
                    className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-sm text-white"
                  >
                    <span>{getTagLabel(selectedTag)}</span>
                    <X className="h-4 w-4" />
                  </button>
                )}

                {tagsOpen && !selectedTag && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {TAG_OPTIONS.map((tag) => (
                      <button
                        key={tag.value}
                        type="button"
                        onClick={() => {
                          setSelectedTag(tag.value);
                          setTagsOpen(false);
                          clearMessages();
                        }}
                        className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100"
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {submitError && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {successMessage && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
              >
                <Plus className="h-4 w-4" />
                {isSubmitting ? "Публикуем..." : "Добавить в ленту"}
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <RuleItem
                icon={Video}
                text="Можно добавлять Telegram-посты с видео."
              />
              <RuleItem
                icon={ImageIcon}
                text="Можно добавлять Telegram-посты с картинкой."
              />
              <RuleItem
                icon={Globe}
                text="Сейчас принимаем только публичные ссылки, чтобы источник был доступен всем."
              />
              <RuleItem
                icon={ArrowRightLeft}
                text="MargeleT ведёт в Telegram-источник и даёт посту вторую жизнь в общей ленте."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}