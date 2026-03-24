import { ArrowRightLeft, Link as LinkIcon, Plus } from "lucide-react";
import { useState } from "react";
import type { Locale } from "../types/app";
import { Input } from "../components/ui/Input";

type Props = {
  locale: Locale;
  onAdd: (payload: {
    url: string;
    title: string;
    channel: string;
  }) => void;
};

function AuthBlock() {
  return (
    <div className="mt-6">
      {/* текст */}
      <div className="mb-4 text-lg font-semibold text-neutral-950">
        Чтобы начать — авторизуйтесь
      </div>

      {/* СИНЯЯ КНОПКА = LOGIN */}
      <button className="flex w-full items-center justify-center gap-4 rounded-full bg-[#4da3ff] px-6 py-4 text-white transition hover:bg-[#3b92ea]">
        <span className="text-lg font-semibold">margeleT</span>
        <ArrowRightLeft className="h-5 w-5" />
        <span className="text-lg font-semibold">Telegram</span>
      </button>
    </div>
  );
}

export function AddScreen({ onAdd }: Props) {
  const [url, setUrl] = useState("");

  const isAuthorized = false;

  const handleSubmit = () => {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    onAdd({
      url: cleanUrl,
      title: "",
      channel: "",
    });

    setUrl("");
  };

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-20 text-neutral-950">
      <div className="mx-auto max-w-[720px]">
        {/* только один заголовок */}
        <div className="text-[28px] font-semibold tracking-tight">
          Добавить видео
        </div>

        {!isAuthorized ? (
          <AuthBlock />
        ) : (
          <div className="mt-6">
            <div className="mb-3 text-sm text-neutral-500">
              Вставь ссылку на Telegram-пост
            </div>

            <div className="relative">
              <LinkIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://t.me/channel/123"
                className="h-14 rounded-2xl border-neutral-200 bg-neutral-100 pl-11 pr-4 text-[15px] text-neutral-950"
              />
            </div>

            <button
              onClick={handleSubmit}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              <Plus className="h-4 w-4" />
              Добавить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}