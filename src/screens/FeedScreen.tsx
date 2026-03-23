import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronUp,
  Eye,
  Heart,
  MessageCircle,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Locale, TabId, Video } from "../types/app";
import { messages } from "../lib/i18n";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";

type Props = {
  locale: Locale;
  videos: Video[];
  onLike: (id: number) => void;
  onSkip: (id: number) => void;
  openPost: (video: Video) => void;
  setCurrent: (tab: TabId) => void;
};

function StatMini({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-black/35 px-3 py-2 text-white/95 backdrop-blur-md">
      <Icon className="h-4 w-4" />
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}

export function FeedScreen({
  locale,
  videos,
  onLike,
  onSkip,
  openPost,
  setCurrent,
}: Props) {
  const t = messages[locale];
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [cinema, setCinema] = useState(false);

  const current = videos[index % videos.length];

  const goNext = () => {
    setExpanded(false);
    setCinema(false);
    setIndex((v) => (v + 1) % videos.length);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0f] text-white">
      <div className={`absolute inset-0 bg-gradient-to-br ${current.bg} opacity-95`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_30%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.08),transparent_24%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[520px] flex-col px-3 pb-5 pt-24 sm:px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.985 }}
            transition={{ duration: 0.24 }}
            className="relative flex-1"
          >
            <div
              className={`relative flex min-h-[calc(100vh-120px)] flex-col overflow-hidden rounded-[32px] border border-white/12 bg-gradient-to-br ${current.bg} shadow-2xl`}
            >
              <div className="absolute inset-0 bg-black/18" />

              <div className="absolute inset-x-0 top-0 z-10 p-4">
                <div className="flex items-center justify-between">
                  <Badge className="rounded-full bg-black/35 px-3 py-2 text-white backdrop-blur-md">
                    <Sparkles className="mr-2 h-3.5 w-3.5" />
                    {t.feedBadge}
                  </Badge>

                  <Badge className="rounded-full bg-black/35 px-3 py-2 text-white backdrop-blur-md">
                    {current.duration}
                  </Badge>
                </div>
              </div>

              <button
                onClick={() => setCinema(true)}
                className="absolute inset-0 z-0 flex items-center justify-center"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/15 backdrop-blur-md transition hover:scale-105">
                  <Play className="ml-1 h-9 w-9" />
                </div>
              </button>

              <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3 sm:right-4">
                <button
                  onClick={() => {
                    onLike(current.id);
                    goNext();
                  }}
                  className="flex h-13 w-13 items-center justify-center rounded-full border border-white/12 bg-black/35 text-white backdrop-blur-xl transition hover:scale-105"
                >
                  <Heart className="h-6 w-6" />
                </button>

                <button
                  onClick={() => {
                    onSkip(current.id);
                    goNext();
                  }}
                  className="flex h-13 w-13 items-center justify-center rounded-full border border-white/12 bg-black/35 text-white backdrop-blur-xl transition hover:scale-105"
                >
                  <X className="h-6 w-6" />
                </button>

                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="flex h-13 w-13 items-center justify-center rounded-full border border-white/12 bg-black/35 text-white backdrop-blur-xl transition hover:scale-105"
                >
                  <ChevronUp
                    className={`h-6 w-6 transition ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
              </div>

              <div className="mt-auto p-3 sm:p-4">
                <div className="rounded-[28px] border border-white/12 bg-black/38 p-4 backdrop-blur-xl">
                  <button
                    onClick={() => setCurrent("creator")}
                    className="mb-3 flex w-full items-center gap-3 text-left"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                      {current.avatar}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold leading-tight">
                        {current.channel}
                      </div>
                      <div className="truncate text-sm text-white/65">
                        {current.handle}
                      </div>
                    </div>
                  </button>

                  <div className="mb-3">
                    <div className="line-clamp-2 text-xl font-semibold leading-tight sm:text-2xl">
                      {current.title[locale]}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatMini icon={Eye} value={current.views} />
                    <StatMini icon={Heart} value={current.likes} />
                    <StatMini icon={MessageCircle} value={current.comments} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

          <AnimatePresence>
            {expanded && (
              <>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setExpanded(false)}
                  className="fixed inset-0 z-20 bg-black/45 backdrop-blur-[2px]"
                />

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 18 }}
                  className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[520px] p-3 sm:p-4"
                >
                  <div className="rounded-[28px] border border-white/10 bg-[#0f1017]/96 p-4 text-white shadow-2xl backdrop-blur-2xl">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                          {current.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{current.channel}</div>
                          <div className="truncate text-sm text-white/55">{current.handle}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => setExpanded(false)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className={`mb-4 aspect-video rounded-2xl bg-gradient-to-br ${current.bg} p-3`}>
                      <div className="flex h-full items-center justify-center rounded-xl border border-white/15 bg-black/15 px-4 text-center text-sm text-white/85">
                        {t.embeddedBlock}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => openPost(current)} className="rounded-2xl">
                        {t.openPost}
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => setCurrent("creator")}
                      >
                        {t.goToChannel}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
      </div>

      <AnimatePresence>
        {cinema && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setCinema(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative aspect-[9/16] w-full max-w-[430px] overflow-hidden rounded-[30px] border border-white/15 bg-gradient-to-br ${current.bg} shadow-2xl`}
            >
              <button
                onClick={() => setCinema(false)}
                className="absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-black/40 p-2 text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="absolute inset-0 bg-black/16" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full border border-white/20 bg-white/15 p-6 backdrop-blur-xl">
                  <Play className="h-10 w-10 text-white" />
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="rounded-[24px] border border-white/12 bg-black/40 p-4 backdrop-blur-xl">
                  <div className="line-clamp-2 text-lg font-semibold">
                    {current.title[locale]}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}