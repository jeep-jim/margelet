import {
  ArrowLeft,
  Image as ImageIcon,
  MoreVertical,
  Play,
  ExternalLink,
} from "lucide-react";
import { VerifiedBadge } from "../components/shared/VerifiedBadge";
import type { ContentTag, IngestedPost } from "../types/app";

type Props = {
  locale: "ru" | "en";
  posts: IngestedPost[];
  sourceHandle: string | null;
  onBack: () => void;
  onOpenPost: (post: IngestedPost) => void;
};

const TAG_LABELS: Record<ContentTag, string> = {
  news: "📰 Новости",
  politics: "🏛 Политика",
  war: "🪖 Война",
  economy: "📈 Экономика",
  business: "💼 Бизнес",
  creativity: "🎭 Творчество",
  finance: "💰 Финансы",
  crypto: "₿ Крипта",
  technology: "💻 Технологии",
  ai: "🤖 AI",
  science: "🔬 Наука",
  space: "🚀 Космос",
  education: "📚 Образование",
  history: "🏺 История",
  culture: "🏛 Культура",
  art: "🎨 Арт",
  design: "🧩 Дизайн",
  books: "📖 Книги",
  cinema: "🎬 Кино",
  series: "📺 Сериалы",
  music: "🎵 Музыка",
  gaming: "🎮 Игры",
  memes: "😂 Мемы",
  humor: "😄 Юмор",
  sports: "⚽ Спорт",
  mma: "🥊 MMA",
  travel: "✈️ Путешествия",
  food: "🍔 Еда",
  recipes: "🍳 Рецепты",
  health: "🩺 Здоровье",
  fitness: "🏋️ Фитнес",
  psychology: "🧠 Психология",
  relationships: "❤️ Отношения",
  fashion: "👗 Мода",
  beauty: "💄 Красота",
  photography: "📷 Фото",
  nature: "🌿 Природа",
  animals: "🐾 Животные",
  people: "🧑 Люди",
  celebrities: "⭐ Звёзды",
  marketing: "📣 Маркетинг",
  startups: "🛠 Стартапы",
  jobs: "🧳 Работа",
  real_estate: "🏠 Недвижимость",
  auto: "🚗 Авто",
  gadgets: "📱 Гаджеты",
  parenting: "👶 Родительство",
  telegram: "✈️ Telegram",
  other: "🌀 Другое",
};

function getTagLabel(tag: ContentTag) {
  return TAG_LABELS[tag] || "🌀 Другое";
}

function getPreview(post: IngestedPost) {
  return (
    post.media.find((item) => item.kind === "image")?.url ||
    post.media.find((item) => item.kind === "video")?.poster ||
    null
  );
}

function SourceTile({
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
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-200"
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

      <div className="absolute inset-0 bg-black/10" />

      <div className="absolute inset-0 flex items-center justify-center opacity-70 transition group-hover:opacity-100">
        {post.contentType === "video" ? (
          <Play className="h-7 w-7 text-white" />
        ) : (
          <ImageIcon className="h-7 w-7 text-white" />
        )}
      </div>

      <div className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white">
        {getTagLabel(post.tag)}
      </div>
    </button>
  );
}

export function SourceScreen({
  locale: _locale,
  posts,
  sourceHandle,
  onBack,
  onOpenPost,
}: Props) {
  const sourcePosts = posts.filter((post) => post.source.handle === sourceHandle);
  const source = sourcePosts[0];

  if (!source) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-6 text-neutral-950">
        <div className="mx-auto max-w-[720px]">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm font-medium text-neutral-700"
              type="button"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </button>
          </div>

          <div className="text-lg font-semibold">Источник не найден</div>
        </div>
      </div>
    );
  }

  const totalMedia = sourcePosts.filter((post) => post.media.length > 0).length;
  const totalVideos = sourcePosts.filter((post) => post.contentType === "video").length;

  const openTelegramSource = () => {
    window.open(`https://t.me/${source.source.handle}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-6 text-neutral-950">
      <div className="mx-auto max-w-[720px]">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-neutral-700"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </button>

          <button className="rounded-full p-2 text-neutral-500" type="button">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        <section className="mb-6 overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-lg font-bold text-neutral-900">
              {source.source.avatar ? (
                <img
                  src={source.source.avatar}
                  alt={source.source.title}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                String(source.source.title || "TG").slice(0, 2).toUpperCase()
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-[28px] font-semibold leading-tight text-neutral-950">
                  {source.source.title}
                </div>
                {source.source.verified ? (
                  <VerifiedBadge className="shrink-0 text-[#2AABEE]" />
                ) : null}
              </div>
              <div className="truncate text-[16px] text-neutral-500">
                @{source.source.handle}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-neutral-50 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                Посты
              </div>
              <div className="mt-2 text-2xl font-semibold">{sourcePosts.length}</div>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                Видео
              </div>
              <div className="mt-2 text-2xl font-semibold">{totalVideos}</div>
            </div>

            <div className="rounded-2xl bg-neutral-50 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                Медиа
              </div>
              <div className="mt-2 text-2xl font-semibold">{totalMedia}</div>
            </div>
          </div>

          <button
            onClick={openTelegramSource}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white"
            type="button"
          >
            <span>Открыть канал</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </section>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sourcePosts.map((post) => (
            <SourceTile
              key={post.id}
              post={post}
              onOpen={() => onOpenPost(post)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}