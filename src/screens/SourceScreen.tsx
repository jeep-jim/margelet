import { ArrowLeft, Eye, Heart, MoreVertical, Play } from "lucide-react";
import type { Video } from "../types/app";

type Props = {
  locale: "ru" | "en";
  videos: Video[];
  sourceChannel: string | null;
  onBack: () => void;
  onOpenPost: (video: Video) => void;
};

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

function SourceTile({ onOpen }: { onOpen: () => void }) {
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

export function SourceScreen({
  videos,
  sourceChannel,
  onBack,
  onOpenPost,
}: Props) {
  const sourceVideos = videos.filter((video) => video.channel === sourceChannel);
  const source = sourceVideos[0];

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

  const totalLikes = sourceVideos.reduce((sum, video) => sum + video.likes, 0);

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

        <section className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-lg font-bold text-neutral-900">
              {source.avatar}
            </div>

            <div className="min-w-0">
              <div className="truncate text-[28px] font-semibold leading-tight text-neutral-950">
                {source.channel}
              </div>
              <div className="truncate text-[16px] text-neutral-500">{source.handle}</div>
            </div>
          </div>

          <div className="mt-5 h-px w-full bg-neutral-300" />

          <div className="mt-4 flex flex-wrap items-center gap-5">
            <StatInline icon={Play} value={sourceVideos.length} />
            <StatInline icon={Eye} value={source.views} />
            <StatInline icon={Heart} value={totalLikes} />
          </div>

          <div className="mt-5 h-px w-full bg-neutral-300" />
        </section>

        <section>
            <div className="mb-4 text-sm text-neutral-500">
            Опубликовано {sourceVideos.length}
            </div>

          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {sourceVideos.map((video) => (
              <SourceTile key={video.id} onOpen={() => onOpenPost(video)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}