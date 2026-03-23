import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, LayoutGrid, Link2, Plus } from "lucide-react";
import { useState } from "react";
import { messages } from "../lib/i18n";
import type { Locale } from "../types/app";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";

type Props = {
  locale: Locale;
  onAdd: (data: { url: string; title: string; channel: string }) => void;
};

export function AddScreen({ locale, onAdd }: Props) {
  const t = messages[locale];

  const [url, setUrl] = useState("https://t.me/motionlab/482");
  const [title, setTitle] = useState(
    locale === "ru" ? "Быстрая типографика с энергией" : "Fast typography energy"
  );
  const [channel, setChannel] = useState("Motion Lab");
  const [saved, setSaved] = useState(false);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onAdd({ url, title, channel });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 pb-10 pt-28 text-white">
      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[34px] border-white/10 bg-white/5 text-white backdrop-blur-2xl">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6">
              <div className="mb-2 text-xs uppercase tracking-[0.24em] text-white/45">
                {t.addEyebrow}
              </div>
              <div className="text-3xl font-semibold tracking-tight">{t.addTitle}</div>
              <div className="mt-2 max-w-2xl text-white/70">{t.addText}</div>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-white/65">{t.postUrl}</label>
                <div className="relative">
                  <Link2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-14 rounded-2xl pl-11 text-white placeholder:text-white/25"
                    placeholder="https://t.me/channel/123"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm text-white/65">{t.videoTitle}</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-14 rounded-2xl text-white placeholder:text-white/25"
                    placeholder={t.videoTitlePlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-white/65">{t.channelAuthor}</label>
                  <Input
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="h-14 rounded-2xl text-white placeholder:text-white/25"
                    placeholder={t.channelPlaceholder}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button className="h-12 rounded-2xl px-5">
                  <Plus className="mr-2 h-4 w-4" />
                  {t.addButton}
                </Button>

                <AnimatePresence>
                  {saved && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
                    >
                      <Check className="h-4 w-4" />
                      {t.addedSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-[34px] border-white/10 bg-white/5 text-white backdrop-blur-2xl">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-white/55" />
                <div className="text-sm font-medium">{t.checksTitle}</div>
              </div>
              <div className="space-y-3 text-sm text-white/75">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  {t.check1}
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  {t.check2}
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  {t.check3}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[34px] border-white/10 bg-gradient-to-br from-white/10 to-white/5 text-white backdrop-blur-2xl">
            <CardContent className="p-6">
              <div className="mb-2 text-xs uppercase tracking-[0.22em] text-white/45">
                {t.futureLabel}
              </div>
              <div className="text-xl font-semibold">{t.futureTitle}</div>
              <div className="mt-2 text-sm text-white/70">{t.futureText}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}