import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Bookmark, Heart, MessageCircle, VolumeX } from "lucide-react";
import { useState } from "react";
import type { Locale, Video } from "../../types/app";

type Props = {
  video: Video | null;
  locale: Locale;
  onClose: () => void;
};

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
      <Icon className="h-7 w-7" />
      <span className="text-sm font-medium">{value}</span>
    </button>
  );
}

export function PostModal({ video, locale, onClose }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!video) return null;

  const text = video.title[locale];
  const isLong = text.length > 70;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        <div className="relative h-full w-full overflow-hidden">
          {/* video area */}
          <div className="absolute inset-0 bg-neutral-950" />

          {/* пока placeholder под реальное видео */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#111827_0%,#1f2937_100%)]" />

          {/* top controls */}
          <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>

            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm">
              <VolumeX className="h-5 w-5" />
            </button>
          </div>

          {/* right actions */}
          <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-6">
            <ViewerMetric icon={Heart} value={video.likes} />
            <ViewerMetric icon={MessageCircle} value={video.comments} />
            <ViewerMetric icon={Bookmark} value={20} />
          </div>

          {/* bottom content */}
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-8 pt-20 text-white">
            <button className="mb-3 flex items-center gap-3 text-left">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                {video.avatar}
              </div>

              <div className="min-w-0">
                <div className="truncate text-lg font-semibold">
                  {video.channel}
                </div>
                <div className="truncate text-sm text-white/75">
                  {video.handle}
                </div>
              </div>
            </button>

            <div
              className={`max-w-[82%] text-[16px] leading-6 text-white/95 ${
                expanded ? "" : "line-clamp-2"
              }`}
            >
              {text}
            </div>

            {isLong && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 text-sm font-medium text-white/75"
              >
                {expanded ? "свернуть" : "ещё"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}