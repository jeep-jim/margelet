import {
  ArrowLeft,
  Eye,
  Heart,
  Image as ImageIcon,
  MoreVertical,
  Play,
  ExternalLink,
} from "lucide-react";
import { VerifiedBadge } from "../components/shared/VerifiedBadge";
import type { ContentTag, Video } from "../types/app";

type Props = {
  locale: "ru" | "en";
  videos: Video[];
  sourceChannel: string | null;
  onBack: () => void;
  onOpenPost: (video: Video) => void;
};

const TAG_LABELS: Record<ContentTag, string> = {
  animals: "Животные",
  news: "Новости",
  business: "Бизнес",
  creativity: "Творчество",
  finance: "Финансы",
  education: "Образование",
  technology: "Технологии",
  memes: "Мемы",
  sports: "Спорт",
  music: "Музыка",
  travel: "Путешествия",
  food: "Еда",
  other: "Другое",
};

function getResolvedTag(video: Video): ContentTag {
  return video.tag || "other";
}

function getTagLabel(tag: ContentTag) {
  return TAG_LABELS[tag] || "Другое";
}

function StatInline({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2 text-neutral-700">
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function SourceTile({
  video,
  onOpen,
}: {
  video: Video;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-200"
    >
      {video.previewUrl ? (
        <img
          src={video.previewUrl}
          alt={video.title.ru}
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

      <div className="absolute inset-0 bg-black/10" />

      <div className="absolute inset-0 flex items-center justify-center opacity-70 transition group-hover:opacity-100">
        {video.mediaType === "video" ? (
          <Play className="h-7 w-7 text-white" />
        ) : (
          <ImageIcon className="h-7 w-7 text-white" />
        )}
      </div>

      <div className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white">
        {getTagLabel(getResolvedTag(video))}
      </div>
    </button>
  );
}

export function SourceScreen({
  locale,
  videos,
  sourceChannel,
  onBack,
  onOpenPost,
}: Props) {
  const sourcePosts = videos.filter((video) => video.channel === sourceChannel);
  const source = sourcePosts[0];

  if (!source) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-6 text-neutral-950">
        <div className="mx-auto max-w-[720px]">
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm font-medium text-neutral-700"
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

  const totalLikes = sourcePosts.reduce((sum, video) => sum + video.likes, 0);
  const totalViews = sourcePosts.reduce((sum, video) => {
    const parsed = Number(String(video.views).replace(/[^\d.]/g, ""));
    return sum + (Number.isNaN(parsed) ? 0 : parsed);
  }, 0);

  const totalVideos = sourcePosts.filter((post) => post.mediaType === "video").length;
  const totalImages = sourcePosts.filter((post) => post.mediaType === "image").length;

  const openTelegramSource = () => {
    if (!source.postUrl) return;
    window.open(source.postUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-6 text-neutral-950">
      <div className="mx-auto max-w-[720px]">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </button>

          <button className="rounded-full p-2 text-neutral-500">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        <section className="mb-6 overflow-hidden rounded-[28px] border border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-lg font-bold text-neutral-900">
              {source.avatar}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="truncate text-[28px] font-semibold leading-tight text-neutral-950">
                  {source.channel}
                </div>
                {source.channelVerified ? (
                  <VerifiedBadge className="shrink-0 text-[#2AABEE]" />
                ) : null}
              </div>
              <div className="truncate text-[16px] text-neutral-500">
                {source.handle}
              </div>
            </div>
          </div>

          <div className="mt-4 inline-flex rounded-full bg-neutral-100 px-3 py-1.5 text-sm text-neutral-700">
            {getTagLabel(getResolvedTag(source))}
          </div>

          <div className="mt-5 text-[15px] leading-7 text-neutral-700">
            Это источник Telegram-постов. Контент открывается в общей ленте
            MargeleT, а переход и внимание уходят в оригинальный Telegram.
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-5">
            <StatInline icon={Play} value={totalVideos} />
            <StatInline icon={ImageIcon} value={totalImages} />
            <StatInline icon={Eye} value={totalViews || source.views} />
            <StatInline icon={Heart} value={totalLikes} />
          </div>

          <div className="mt-5">
            <button
              onClick={openTelegramSource}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              <ExternalLink className="h-4 w-4" />
              Открыть в Telegram
            </button>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-sm text-neutral-500">
              Опубликовано {sourcePosts.length}
            </div>

            <div className="text-sm text-neutral-500">
              {source.title[locale]}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {sourcePosts.map((video) => (
              <SourceTile
                key={video.id}
                video={video}
                onOpen={() => onOpenPost(video)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}