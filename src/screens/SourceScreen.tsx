import { ArrowLeft, ExternalLink, MoreVertical } from "lucide-react";
import type { Locale, Video } from "../types/app";

type Props = {
  locale: Locale;
  videos: Video[];
  sourceChannel: string | null;
  onBack: () => void;
  onOpenPost: (video: Video) => void;
};

function SourceVideoCard({
  video,
  locale,
  onOpen,
}: {
  video: Video;
  locale: Locale;
  onOpen: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
      <button onClick={onOpen} className="block w-full text-left">
        <div className="relative aspect-[9/12] w-full overflow-hidden bg-neutral-200">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#d4d4d8_0%,#e5e7eb_100%)]" />

          <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
            {video.duration}
          </div>
        </div>

        <div className="p-4">
          <div className="mb-2 line-clamp-2 text-[16px] font-semibold leading-6 text-neutral-950">
            {video.title[locale]}
          </div>

          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span>{video.views} просмотров</span>
            <span>{video.likes} лайков</span>
          </div>
        </div>
      </button>
    </article>
  );
}

export function SourceScreen({
  locale,
  videos,
  sourceChannel,
  onBack,
  onOpenPost,
}: Props) {
  const sourceVideos = videos.filter((video) => video.channel === sourceChannel);
  const source = sourceVideos[0];

  if (!source) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-20 text-neutral-950">
        <div className="mx-auto max-w-[720px]">
          <button
            onClick={onBack}
            className="mb-5 flex items-center gap-2 text-sm font-medium text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </button>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5">
            <div className="text-lg font-semibold">Источник не найден</div>
          </div>
        </div>
      </div>
    );
  }

  const totalLikes = sourceVideos.reduce((sum, video) => sum + video.likes, 0);

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-20 text-neutral-950">
      <div className="mx-auto max-w-[720px]">
        <button
          onClick={onBack}
          className="mb-5 flex items-center gap-2 text-sm font-medium text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </button>

        <section className="mb-6 rounded-3xl border border-neutral-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-lg font-bold text-neutral-900">
                {source.avatar}
              </div>

              <div className="min-w-0">
                <div className="truncate text-2xl font-semibold text-neutral-950">
                  {source.channel}
                </div>
                <div className="truncate text-neutral-500">{source.handle}</div>
              </div>
            </div>

            <button className="rounded-full p-2 text-neutral-500">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                Видео
              </div>
              <div className="mt-2 text-2xl font-semibold text-neutral-950">
                {sourceVideos.length}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                Просмотры
              </div>
              <div className="mt-2 text-2xl font-semibold text-neutral-950">
                {source.views}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-neutral-400">
                Лайки
              </div>
              <div className="mt-2 text-2xl font-semibold text-neutral-950">
                {totalLikes}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800">
              <ExternalLink className="h-4 w-4" />
              Открыть в Telegram
            </button>
          </div>
        </section>

        <section>
          <div className="mb-4 text-lg font-semibold text-neutral-950">Видео источника</div>

          <div className="grid gap-4 sm:grid-cols-2">
            {sourceVideos.map((video) => (
              <SourceVideoCard
                key={video.id}
                video={video}
                locale={locale}
                onOpen={() => onOpenPost(video)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}