import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronUp,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { messages } from "../lib/i18n";
import type { Locale, TabId, Video } from "../types/app";
import { StatPill } from "../components/shared/StatPill";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

type Props = {
  locale: Locale;
  videos: Video[];
  onLike: (id: number) => void;
  onSkip: (id: number) => void;
  openPost: (video: Video) => void;
  setCurrent: (tab: TabId) => void;
};

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0a0f] text-white">
      <div className={`absolute inset-0 bg-gradient-to-br ${current.bg} opacity-90`} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.20),transparent_35%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.10),transparent_25%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-6 pt-24 lg:flex-row lg:items-center lg:justify-center">
        <div className="mx-auto flex w-full max-w-[420px] flex-col gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 28, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -28, scale: 0.98 }}
              transition={{ duration: 0.28 }}
              className="relative"
            >
              <div
                className={`relative aspect-[9/16] overflow-hidden rounded-[34px] border border-white/15 bg-gradient-to-br ${current.bg} shadow-2xl`}
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-x-0 top-0 p-4">
                  <div className="flex items-center justify-between">
                    <Badge className="rounded-full border-0 bg-black/40 px-3 py-1 text-white backdrop-blur-md">
                      <Sparkles className="mr-1 h-3.5 w-3.5" />
                      {t.feedBadge}
                    </Badge>
                    <Badge className="rounded-full border-0 bg-black/40 px-3 py-1 text-white backdrop-blur-md">
                      {current.duration}
                    </Badge>
                  </div>
                </div>

                <button
                  onClick={() => setCinema(true)}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/15 backdrop-blur-md transition hover:scale-105">
                    <Play className="ml-1 h-9 w-9" />
                  </div>
                </button>

                <div className="absolute inset-x-0 bottom-0 p-4">
                  <div className="rounded-[28px] border border-white/12 bg-black/35 p-4 backdrop-blur-xl">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <button
                        onClick={() => setCurrent("creator")}
                        className="flex items-center gap-3 text-left"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                          {current.avatar}
                        </div>
                        <div>
                          <div className="font-semibold leading-tight">{current.channel}</div>
                          <div className="text-sm text-white/65">{current.handle}</div>
                        </div>
                      </button>
                      <Button size="sm" className="rounded-full">
                        {t.openChannel}
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <div className="text-base font-semibold leading-snug">
                        {current.title[locale]}
                      </div>
                      <div className="line-clamp-2 text-sm text-white/75">
                        {current.caption[locale]}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StatPill icon={Eye} value={current.views} label={t.viewsShort} />
                        <StatPill icon={Heart} value={current.likes} label={t.likesShort} />
                        <StatPill
                          icon={MessageCircle}
                          value={current.comments}
                          label={t.commentsShort}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-1/2 right-4 flex translate-y-1/2 flex-col gap-3">
                  <button
                    onClick={() => {
                      onLike(current.id);
                      goNext();
                    }}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/35 backdrop-blur-xl transition hover:scale-105"
                  >
                    <Heart className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => {
                      onSkip(current.id);
                      goNext();
                    }}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/35 backdrop-blur-xl transition hover:scale-105"
                  >
                    <X className="h-6 w-6" />
                  </button>
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-black/35 backdrop-blur-xl transition hover:scale-105"
                  >
                    <ChevronUp
                      className={`h-6 w-6 transition ${expanded ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-3">
            <Card className="rounded-[28px] border-white/10 bg-white/5 text-white backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="mb-1 text-xs uppercase tracking-[0.22em] text-white/50">
                  {t.mvpLogicTitle}
                </div>
                <div className="text-sm text-white/80">{t.mvpLogicText}</div>
              </CardContent>
            </Card>
            <Card className="rounded-[28px] border-white/10 bg-white/5 text-white backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="mb-1 text-xs uppercase tracking-[0.22em] text-white/50">
                  {t.sourceModelTitle}
                </div>
                <div className="text-sm text-white/80">{t.sourceModelText}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="mx-auto w-full max-w-[420px]"
            >
              <Card className="rounded-[34px] border-white/10 bg-black/35 text-white backdrop-blur-2xl">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.22em] text-white/45">
                        {t.previewTitle}
                      </div>
                      <div className="text-lg font-semibold">{t.previewSubtitle}</div>
                    </div>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => openPost(current)}
                      className="rounded-full border-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-bold text-black">
                        {current.avatar}
                      </div>
                      <div>
                        <div className="font-medium">{current.channel}</div>
                        <div className="text-sm text-white/60">{t.originalPost}</div>
                      </div>
                    </div>

                    <div className={`mb-4 aspect-video rounded-2xl bg-gradient-to-br ${current.bg} p-4`}>
                      <div className="flex h-full items-center justify-center rounded-xl border border-white/15 bg-black/15 text-center text-white/90">
                        {t.embeddedBlock}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-white/75">
                      <div>{current.caption[locale]}</div>
                      <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-white/65">
                        {current.postUrl}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Button onClick={() => openPost(current)} className="rounded-2xl">
                      {t.openPost}
                    </Button>
                    <Button variant="outline" className="rounded-2xl">
                      {t.goToChannel}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {cinema && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
            onClick={() => setCinema(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative aspect-[9/16] w-full max-w-[420px] overflow-hidden rounded-[34px] border border-white/15 bg-gradient-to-br ${current.bg} shadow-2xl`}
            >
              <button
                onClick={() => setCinema(false)}
                className="absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-black/40 p-2 text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute inset-0 bg-black/18" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full border border-white/20 bg-white/15 p-6 backdrop-blur-xl">
                  <Play className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="rounded-[24px] border border-white/12 bg-black/40 p-4 backdrop-blur-xl">
                  <div className="text-lg font-semibold">{current.title[locale]}</div>
                  <div className="mt-1 text-sm text-white/70">{t.cinemaHint}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}