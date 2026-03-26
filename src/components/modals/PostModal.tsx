import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Bookmark,
  Heart,
  Image as ImageIcon,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { VerifiedBadge } from "../shared/VerifiedBadge";
import type { Locale, Video } from "../../types/app";

type Props = {
  video: Video | null;
  locale: Locale;
  likedPostIds: number[];
  savedPostIds: number[];
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onClose: () => void;
};

function ViewerMetric({
  icon: Icon,
  value,
  active = false,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-white"
      type="button"
    >
      <Icon className={`h-7 w-7 ${active ? "fill-current text-white" : "text-white"}`} />
      <span className="text-sm font-medium">{value}</span>
    </button>
  );
}

export function PostModal({
  video,
  locale,
  likedPostIds,
  savedPostIds,
  onToggleLike,
  onToggleSave,
  onClose,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setExpanded(false);
    setIsMuted(true);
    setIsPlaying(true);
  }, [video?.id]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted, video?.id]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    if (isPlaying) {
      void node.play().catch(() => {});
    } else {
      node.pause();
    }
  }, [isPlaying, video?.id]);

  if (!video) return null;

  const text = video.title[locale];
  const isLong = text.length > 70;
  const liked = likedPostIds.includes(video.id);
  const saved = savedPostIds.includes(video.id);
  const saveCount = saved ? 1 : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        <div className="relative h-full w-full overflow-hidden">
          {video.mediaType === "video" && video.videoUrl ? (
            <video
              ref={videoRef}
              src={video.videoUrl}
              poster={video.previewUrl || undefined}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              loop
              playsInline
              muted={isMuted}
            />
          ) : video.previewUrl ? (
            <img
              src={video.previewUrl}
              alt={video.title[locale]}
              className="absolute inset-0 h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className={`absolute inset-0 bg-gradient-to-br ${
                video.bg || "from-neutral-800 to-neutral-700"
              }`}
            />
          )}

          <div className="absolute inset-0 bg-black/20" />

          <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>

            {video.mediaType === "video" && video.videoUrl ? (
              <button
                onClick={() => setIsMuted((v) => !v)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="absolute inset-0 flex items-center justify-center">
            {video.mediaType === "video" && video.videoUrl ? (
              <button
                onClick={() => setIsPlaying((v) => !v)}
                className="flex h-24 w-24 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm"
              >
                {isPlaying ? (
                  <Pause className="h-12 w-12 text-white" />
                ) : (
                  <Play className="ml-1 h-12 w-12 text-white" />
                )}
              </button>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-black/15 backdrop-blur-sm">
                {video.mediaType === "video" ? (
                  <Play className="ml-1 h-12 w-12 text-white" />
                ) : (
                  <ImageIcon className="h-12 w-12 text-white" />
                )}
              </div>
            )}
          </div>

          <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-6">
            <ViewerMetric
              icon={Heart}
              value={video.likes}
              active={liked}
              onClick={() => onToggleLike(video.id)}
            />
            <ViewerMetric
              icon={Bookmark}
              value={saveCount}
              active={saved}
              onClick={() => onToggleSave(video.id)}
            />
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-4 pb-8 pt-20 text-white">
            <div className="mb-3 flex items-center gap-3 text-left">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                {video.avatar}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="truncate text-xl font-semibold">
                    {video.channel}
                  </div>
                  {video.channelVerified ? (
                    <VerifiedBadge className="shrink-0 text-[#2AABEE]" size={12} />
                  ) : null}
                </div>
                <div className="truncate text-sm text-white/75">
                  {video.handle}
                </div>
              </div>
            </div>

            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/70">
              <span>{video.mediaType}</span>
              {video.tag ? (
                <>
                  <span>•</span>
                  <span>{video.tag}</span>
                </>
              ) : null}
              {video.mediaType === "video" && video.duration ? (
                <>
                  <span>•</span>
                  <span>{video.duration}</span>
                </>
              ) : null}
            </div>

            <div
              className={`max-w-[82%] text-[16px] leading-6 text-white/95 ${
                expanded ? "" : "line-clamp-2"
              }`}
            >
              {text}
            </div>

            {video.caption?.[locale] ? (
              <div className="mt-2 max-w-[82%] text-sm leading-6 text-white/75">
                {video.caption[locale]}
              </div>
            ) : null}

            {isLong ? (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 text-sm font-medium text-white/75"
              >
                {expanded ? "свернуть" : "ещё"}
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}