import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  MessageCircle,
  MoreVertical,
  Play,
  VolumeX,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Locale, Video } from "../types/app";

type Props = {
  locale: Locale;
  videos: Video[];
  onLike: (id: number) => void;
  openSource: (channel: string) => void;
};

function SourceHeader({
  video,
  compact = false,
  onOpenCreator,
}: {
  video: Video;
  compact?: boolean;
  onOpenCreator: () => void;
}) {
  return (
    <button
      onClick={onOpenCreator}
      className={`flex items-center gap-3 text-left ${compact ? "" : "px-4 pt-4 pb-3"}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-bold text-neutral-900">
        {video.avatar}
      </div>

      <div className="min-w-0">
        <div className="truncate text-[18px] font-semibold leading-tight text-neutral-950">
          {video.channel}
        </div>
        <div className="truncate text-sm text-neutral-500">{video.handle}</div>
      </div>
    </button>
  );
}

function FeedMetric({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2 text-neutral-950">
      <Icon className="h-5 w-5" />
      <span className="text-[15px] font-medium">{value}</span>
    </div>
  );
}

function FeedCard({
  video,
  locale,
  onOpen,
  onOpenCreator,
}: {
  video: Video;
  locale: Locale;
  onOpen: () => void;
  onOpenCreator: () => void;
}) {
  return (
    <article className="overflow-hidden border-b border-neutral-200 bg-white">
      <div className="flex items-center justify-between px-4 pt-4">
        <SourceHeader video={video} compact onOpenCreator={onOpenCreator} />
        <button className="rounded-full p-2 text-neutral-700">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      <button onClick={onOpen} className="relative mt-3 block w-full bg-neutral-100">
        <div className="relative aspect-[9/13] w-full overflow-hidden bg-neutral-200 sm:aspect-[9/12]">
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#d4d4d8_0%,#e5e7eb_100%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/10 backdrop-blur-sm">
              <Play className="ml-1 h-8 w-8 text-neutral-900" />
            </div>
          </div>
        </div>
      </button>

      <div className="px-4 py-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <FeedMetric icon={Heart} value={video.likes} />
            <FeedMetric icon={MessageCircle} value={video.comments} />
          </div>

          <button className="rounded-full p-1 text-neutral-900">
            <Bookmark className="h-6 w-6" />
          </button>
        </div>

        <div className="truncate text-[15px] leading-6 text-neutral-900">
          {video.title[locale]}
        </div>
      </div>
    </article>
  );
}

function ViewerMetric({
  icon: Icon,
  value,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-white"
    >
      <Icon className="h-8 w-8" />
      <span className="text-sm font-medium">{value}</span>
    </button>
  );
}

export function FeedScreen({ locale, videos, onLike, openSource }: Props) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [expandedCaption, setExpandedCaption] = useState(false);

  const activeVideo = useMemo(() => {
    if (viewerIndex === null) return null;
    return videos[viewerIndex] ?? null;
  }, [viewerIndex, videos]);

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setExpandedCaption(false);
  };

  const closeViewer = () => {
    setViewerIndex(null);
    setExpandedCaption(false);
  };

  const nextViewer = () => {
    if (viewerIndex === null) return;
    setViewerIndex((viewerIndex + 1) % videos.length);
    setExpandedCaption(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 pt-20 text-neutral-950">
      <div className="mx-auto w-full max-w-[720px]">
        {videos.map((video, index) => (
          <FeedCard
            key={video.id}
            video={video}
            locale={locale}
            onOpen={() => openViewer(index)}
            onOpenCreator={() => openSource(video.channel)}
          />
        ))}
      </div>

      <AnimatePresence>
        {activeVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
          >
            <div className="relative h-full w-full overflow-hidden">
              <div className="absolute inset-0 bg-neutral-950" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-full w-full max-w-[520px] bg-black">
                  <div className="relative h-full w-full overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,#111827_0%,#1f2937_100%)]" />

                    <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
                      <button
                        onClick={closeViewer}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
                      >
                        <ArrowLeft className="h-6 w-6" />
                      </button>

                      <button className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm">
                        <VolumeX className="h-5 w-5" />
                      </button>
                    </div>

                    <button onClick={nextViewer} className="absolute inset-0 block h-full w-full">
                      <span className="sr-only">Next video</span>
                    </button>

                    <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-6">
                      <ViewerMetric
                        icon={Heart}
                        value={activeVideo.likes}
                        onClick={() => onLike(activeVideo.id)}
                      />
                      <ViewerMetric icon={MessageCircle} value={activeVideo.comments} />
                      <ViewerMetric icon={Bookmark} value={20} />
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-8 pt-20 text-white">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openSource(activeVideo.channel);
                        }}
                        className="mb-3 flex items-center gap-3 text-left"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                          {activeVideo.avatar}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-xl font-semibold">
                            {activeVideo.channel}
                          </div>
                          <div className="truncate text-sm text-white/75">
                            {activeVideo.handle}
                          </div>
                        </div>
                      </button>

                      <div
                        className={`max-w-[82%] text-[16px] leading-6 text-white/95 ${
                          expandedCaption ? "" : "line-clamp-2"
                        }`}
                      >
                        {activeVideo.title[locale]}
                      </div>

                      {activeVideo.title[locale].length > 60 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCaption((v) => !v);
                          }}
                          className="mt-1 text-sm font-medium text-white/75"
                        >
                          {expandedCaption ? "свернуть" : "ещё"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}