import { useMemo } from "react";
import { messages } from "../lib/i18n";
import type { Locale, Video } from "../types/app";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

type Props = {
  locale: Locale;
  videos: Video[];
  openPost: (video: Video) => void;
};

export function CreatorScreen({ locale, videos, openPost }: Props) {
  const t = messages[locale];
  const totalLikes = useMemo(() => videos.reduce((s, v) => s + v.likes, 0), [videos]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 pb-10 pt-28 text-white">
      <div className="mx-auto max-w-6xl space-y-5">
        <Card className="rounded-[34px] border-white/10 bg-gradient-to-br from-white/8 to-white/4 text-white backdrop-blur-2xl">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl font-bold text-black">
                  ML
                </div>
                <div>
                  <div className="text-2xl font-semibold">Motion Lab</div>
                  <div className="text-white/60">@motionlab</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge className="rounded-full border-0 bg-white px-3 py-1 text-black">
                  {t.creatorProfile}
                </Badge>
                <Badge className="rounded-full border border-white/12 bg-white/5 px-3 py-1 text-white">
                  {t.publicSource}
                </Badge>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Card className="rounded-[24px] border-white/10 bg-black/20 text-white">
                <CardContent className="p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    {t.videos}
                  </div>
                  <div className="mt-2 text-2xl font-semibold">{videos.length}</div>
                </CardContent>
              </Card>

              <Card className="rounded-[24px] border-white/10 bg-black/20 text-white">
                <CardContent className="p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    {t.totalLikes}
                  </div>
                  <div className="mt-2 text-2xl font-semibold">{totalLikes.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="rounded-[24px] border-white/10 bg-black/20 text-white">
                <CardContent className="p-4">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">
                    {t.growthSignal}
                  </div>
                  <div className="mt-2 text-2xl font-semibold">+18%</div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {videos.map((video) => (
            <Card
              key={video.id}
              className="overflow-hidden rounded-[30px] border-white/10 bg-white/5 text-white backdrop-blur-2xl"
            >
              <div className={`aspect-[4/5] bg-gradient-to-br ${video.bg} p-4`}>
                <div className="flex h-full items-end rounded-[24px] border border-white/15 bg-black/10 p-4">
                  <div>
                    <Badge className="mb-2 rounded-full border-0 bg-black/35 px-3 py-1 text-white">
                      {video.duration}
                    </Badge>
                    <div className="text-xl font-semibold leading-tight">
                      {video.title[locale]}
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="mb-3 text-sm text-white/65">{video.caption[locale]}</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/55">
                    {video.views} {locale === "ru" ? "просмотров" : "views"}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => openPost(video)}>
                    {t.watchSource}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}