import { ArrowLeft } from "lucide-react";
import type { Locale, Video } from "../types/app";

type Props = {
  locale: Locale;
  videos: Video[];
  sourceChannel: string | null;
  onBack: () => void;
  onOpenPost: (video: Video) => void;
};

function SourceVideoRow({
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
      <div className="h-18 w-18 shrink-0 overflow-hidden rounded-xl bg-neutral-200" />

      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold text-neutral-950">
          {video.channel}
        </div>
        <div className="mt-1 line-clamp-2 text-sm leading-5 text-neutral-600">
          {video.title[locale]}
        </div>
        <div className="mt-2 text-xs text-neutral-400">{video.views} просмотров</div>
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
  const sourceVideos = videos.filter((video) => video.channel === sourceChannel);
  const source = sourceVideos[0];

  if (!source) {
    return (
      <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-20 text-neutral-950">
        <div className="mx-auto max-w-[720px]">
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-sm text-neutral-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </button>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="text-lg font-semibold">Источник не найден</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-20 text-neutral-950">
      <div className="mx-auto max-w-[720px]">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-sm text-neutral-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </button>

        <div className="mb-5 rounded-3xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200 text-lg font-bold text-neutral-900">
              {source.avatar}
            </div>

            <div className="min-w-0">
              <div className="truncate text-2xl font-semibold">{source.channel}</div>
              <div className="truncate text-neutral-500">{source.handle}</div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">
                Видео
              </div>
              <div className="mt-2 text-2xl font-semibold">{sourceVideos.length}</div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">
                Просмотры
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {sourceVideos[0]?.views ?? "0"}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">
                Лайки
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {sourceVideos.reduce((sum, v) => sum + v.likes, 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {sourceVideos.map((video) => (
            <SourceVideoRow
              key={video.id}
              video={video}
              locale={locale}
              onOpen={() => onOpenPost(video)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}