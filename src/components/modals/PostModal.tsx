import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ExternalLink, Play } from "lucide-react";
import { messages } from "../../lib/i18n";
import type { Locale, Video } from "../../types/app";
import { Button } from "../ui/Button";

type Props = {
  video: Video | null;
  locale: Locale;
  onClose: () => void;
};

export function PostModal({ video, locale, onClose }: Props) {
  const t = messages[locale];

  if (!video) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 16, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 16, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.22 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-3xl overflow-hidden rounded-[34px] border border-white/10 bg-[#0f1017] text-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/80 hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div>
                <div className="text-sm text-white/50">{t.sourcePost}</div>
                <div className="font-semibold">{t.postView}</div>
              </div>
            </div>
            <Button className="rounded-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              {t.openInTelegram}
            </Button>
          </div>

          <div className="grid gap-0 lg:grid-cols-[1fr_0.9fr]">
            <div className={`min-h-[320px] bg-gradient-to-br ${video.bg} p-5`}>
              <div className="flex h-full min-h-[320px] items-center justify-center rounded-[28px] border border-white/15 bg-black/12">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-xl">
                    <Play className="ml-1 h-9 w-9" />
                  </div>
                  <div className="text-lg font-semibold">{t.focusView}</div>
                  <div className="mt-2 text-sm text-white/75">{t.focusText}</div>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                  {video.avatar}
                </div>
                <div>
                  <div className="font-semibold">{video.channel}</div>
                  <div className="text-sm text-white/55">{video.handle}</div>
                </div>
              </div>

              <div className="text-2xl font-semibold leading-tight">{video.title[locale]}</div>
              <div className="mt-3 text-sm leading-6 text-white/72">{video.caption[locale]}</div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-white/45">
                    {t.viewsFull}
                  </div>
                  <div className="mt-1 font-semibold">{video.views}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-white/45">
                    {t.likesFull}
                  </div>
                  <div className="mt-1 font-semibold">{video.likes}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-white/45">
                    {t.language}
                  </div>
                  <div className="mt-1 font-semibold">{video.lang}</div>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-white/45">
                  {t.postUrl}
                </div>
                <div className="break-all text-sm text-white/70">{video.postUrl}</div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}