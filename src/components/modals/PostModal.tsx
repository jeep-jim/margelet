import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Bookmark, Heart, MessageCircle, VolumeX } from "lucide-react";
import type { Locale, Video } from "../../types/app";

type Props = {
  video: Video | null;
  locale: Locale;
  onClose: () => void;
};

function ViewerMetric({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
}) {
  return (
    <button className="flex flex-col items-center gap-1 text-white">
      <Icon className="h-8 w-8" />
      <span className="text-sm font-medium">{value}</span>
    </button>
  );
}

export function PostModal({ video, locale, onClose }: Props) {
  if (!video) return null;

  return (
    <AnimatePresence>
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
                    onClick={onClose}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>

                  <button className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm">
                    <VolumeX className="h-5 w-5" />
                  </button>
                </div>

                <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-6">
                  <ViewerMetric icon={Heart} value={video.likes} />
                  <ViewerMetric icon={MessageCircle} value={video.comments} />
                  <ViewerMetric icon={Bookmark} value={20} />
                </div>

                <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-8 pt-20 text-white">
                  <div className="mb-3 flex items-center gap-3 text-left">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                      {video.avatar}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-xl font-semibold">
                        {video.channel}
                      </div>
                      <div className="truncate text-sm text-white/75">
                        {video.handle}
                      </div>
                    </div>
                  </div>

                  <div className="max-w-[82%] line-clamp-2 text-[16px] leading-6 text-white/95">
                    {video.title[locale]}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}