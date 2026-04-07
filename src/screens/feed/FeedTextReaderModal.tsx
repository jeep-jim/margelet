import { AnimatePresence, motion } from "framer-motion";
import type { Locale } from "../../types/app";
import {
  ArrowLeft,
  Bell,
  ExternalLink,
  FileText,
  Heart,
  Music4,
  Send,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { IngestedPost } from "../../types/app";
import { FeedSourceAvatar } from "./FeedSourceHeader";
import { VerifiedBadge } from "../../components/shared/VerifiedBadge";
import { FeedCarousel } from "./FeedCarousel";
import {
  getAudioMedia,
  getFileMedia,
  normalizeMediaList,
} from "./feed.utils";

const SUB_KEY = "margelet_subscriptions";

const COPY = {
  en: {
    postFromTelegram: "Post from Telegram",
    enableNotifications: "Enable notifications",
    disableNotifications: "Disable notifications",
    audioFallback: "Audio",
    audioFromTelegram: "Audio from Telegram post",
    fileFallback: "File",
    fileFromTelegram: "Attachment from Telegram post",
    openFile: "Open file",
    musicAvailable: "Music is available in the original post",
    musicAvailableText:
      "We show the post card here. You can open the original track in Telegram.",
    openInTelegram: "Open in Telegram",
  },
  ru: {
    postFromTelegram: "Пост из Telegram",
    enableNotifications: "Включить уведомления",
    disableNotifications: "Отключить уведомления",
    audioFallback: "Аудио",
    audioFromTelegram: "Аудио из поста Telegram",
    fileFallback: "Файл",
    fileFromTelegram: "Вложение из поста Telegram",
    openFile: "Открыть файл",
    musicAvailable: "Музыка доступна в оригинальном посте",
    musicAvailableText:
      "Здесь показываем карточку поста. Оригинальный трек можно открыть в Telegram.",
    openInTelegram: "Открыть в Telegram",
  },
  de: {
    postFromTelegram: "Beitrag aus Telegram",
    enableNotifications: "Benachrichtigungen aktivieren",
    disableNotifications: "Benachrichtigungen deaktivieren",
    audioFallback: "Audio",
    audioFromTelegram: "Audio aus dem Telegram-Beitrag",
    fileFallback: "Datei",
    fileFromTelegram: "Anhang aus dem Telegram-Beitrag",
    openFile: "Datei öffnen",
    musicAvailable: "Musik ist im Originalbeitrag verfügbar",
    musicAvailableText:
      "Hier zeigen wir die Beitragskarte. Den Original-Track kannst du in Telegram öffnen.",
    openInTelegram: "In Telegram öffnen",
  },
  es: {
    postFromTelegram: "Publicación de Telegram",
    enableNotifications: "Activar notificaciones",
    disableNotifications: "Desactivar notificaciones",
    audioFallback: "Audio",
    audioFromTelegram: "Audio de la publicación de Telegram",
    fileFallback: "Archivo",
    fileFromTelegram: "Adjunto de la publicación de Telegram",
    openFile: "Abrir archivo",
    musicAvailable: "La música está disponible en la publicación original",
    musicAvailableText:
      "Aquí mostramos la tarjeta de la publicación. Puedes abrir la pista original en Telegram.",
    openInTelegram: "Abrir en Telegram",
  },
  tr: {
    postFromTelegram: "Telegram gönderisi",
    enableNotifications: "Bildirimleri aç",
    disableNotifications: "Bildirimleri kapat",
    audioFallback: "Ses",
    audioFromTelegram: "Telegram gönderisindeki ses",
    fileFallback: "Dosya",
    fileFromTelegram: "Telegram gönderisindeki ek",
    openFile: "Dosyayı aç",
    musicAvailable: "Müzik orijinal gönderide mevcut",
    musicAvailableText:
      "Burada gönderi kartını gösteriyoruz. Orijinal parçayı Telegram'da açabilirsin.",
    openInTelegram: "Telegram'da aç",
  },
  fr: {
    postFromTelegram: "Post Telegram",
    enableNotifications: "Activer les notifications",
    disableNotifications: "Désactiver les notifications",
    audioFallback: "Audio",
    audioFromTelegram: "Audio du post Telegram",
    fileFallback: "Fichier",
    fileFromTelegram: "Pièce jointe du post Telegram",
    openFile: "Ouvrir le fichier",
    musicAvailable: "La musique est disponible dans le post d’origine",
    musicAvailableText:
      "Nous affichons ici la carte du post. Tu peux ouvrir le morceau original dans Telegram.",
    openInTelegram: "Ouvrir dans Telegram",
  },
  it: {
    postFromTelegram: "Post da Telegram",
    enableNotifications: "Attiva notifiche",
    disableNotifications: "Disattiva notifiche",
    audioFallback: "Audio",
    audioFromTelegram: "Audio dal post Telegram",
    fileFallback: "File",
    fileFromTelegram: "Allegato dal post Telegram",
    openFile: "Apri file",
    musicAvailable: "La musica è disponibile nel post originale",
    musicAvailableText:
      "Qui mostriamo la scheda del post. Puoi aprire la traccia originale in Telegram.",
    openInTelegram: "Apri in Telegram",
  },
  "pt-br": {
    postFromTelegram: "Post do Telegram",
    enableNotifications: "Ativar notificações",
    disableNotifications: "Desativar notificações",
    audioFallback: "Áudio",
    audioFromTelegram: "Áudio do post do Telegram",
    fileFallback: "Arquivo",
    fileFromTelegram: "Anexo do post do Telegram",
    openFile: "Abrir arquivo",
    musicAvailable: "A música está disponível no post original",
    musicAvailableText:
      "Aqui mostramos o card do post. Você pode abrir a faixa original no Telegram.",
    openInTelegram: "Abrir no Telegram",
  },
  id: {
    postFromTelegram: "Postingan dari Telegram",
    enableNotifications: "Aktifkan notifikasi",
    disableNotifications: "Nonaktifkan notifikasi",
    audioFallback: "Audio",
    audioFromTelegram: "Audio dari post Telegram",
    fileFallback: "File",
    fileFromTelegram: "Lampiran dari post Telegram",
    openFile: "Buka file",
    musicAvailable: "Musik tersedia di post asli",
    musicAvailableText:
      "Di sini kami menampilkan kartu post. Trek asli bisa dibuka di Telegram.",
    openInTelegram: "Buka di Telegram",
  },
  pl: {
    postFromTelegram: "Post z Telegrama",
    enableNotifications: "Włącz powiadomienia",
    disableNotifications: "Wyłącz powiadomienia",
    audioFallback: "Audio",
    audioFromTelegram: "Audio z posta Telegram",
    fileFallback: "Plik",
    fileFromTelegram: "Załącznik z posta Telegram",
    openFile: "Otwórz plik",
    musicAvailable: "Muzyka jest dostępna w oryginalnym poście",
    musicAvailableText:
      "Tutaj pokazujemy kartę posta. Oryginalny utwór możesz otworzyć w Telegramie.",
    openInTelegram: "Otwórz w Telegramie",
  },
} as const;

function getSubs(): string[] {
  try {
    const raw = localStorage.getItem(SUB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toggleSub(handle: string) {
  const current = getSubs();
  const exists = current.includes(handle);

  const next = exists
    ? current.filter((h) => h !== handle)
    : [...current, handle];

  localStorage.setItem(SUB_KEY, JSON.stringify(next));
  return next;
}

function linkifyText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|t\.me\/[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    const isUrl = /^(https?:\/\/|www\.|t\.me\/)/i.test(part);

    if (!isUrl) {
      return <span key={index}>{part}</span>;
    }

    const href =
      part.startsWith("http")
        ? part
        : part.startsWith("t.me/")
        ? `https://${part}`
        : `https://${part}`;

    return (
      <a
        key={index}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="break-all text-[#2563eb] underline underline-offset-2"
        onClick={(event) => event.stopPropagation()}
      >
        {part}
      </a>
    );
  });
}

function RichTextBlock({ text }: { text: string }) {
  const paragraphs = useMemo(() => {
    return text
      .replace(/\r/g, "")
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);
  }, [text]);

  return (
    <div className="space-y-4 text-[16px] leading-7 text-neutral-900">
      {paragraphs.map((paragraph, index) => {
        const lines = paragraph.split("\n");

        return (
          <p key={index} className="whitespace-pre-wrap break-words">
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {linkifyText(line)}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function hasMusicLikeTag(post: IngestedPost) {
  const tag = String(post.tag || "").toLowerCase();
  const title = String(post.source.title || "").toLowerCase();
  const text = String(post.text || "").toLowerCase();

  return (
    tag === "music" ||
    title.includes("музык") ||
    title.includes("music") ||
    text.includes("трек") ||
    text.includes("track") ||
    text.includes("песня") ||
    text.includes("music")
  );
}

function AudioList({
  items,
  locale,
}: {
  items: Array<{
    id: string;
    url: string;
    fileName?: string | null;
  }>;
  locale: Locale;
}) {
  if (items.length === 0) return null;
  const copy = COPY[locale] ?? COPY.en;

  return (
    <div className="mb-4 space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id || `${item.url}-${index}`}
          className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4"
        >
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
              <Music4 className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-neutral-950">
                {item.fileName?.trim() || `${copy.audioFallback} ${index + 1}`}
              </div>

              <div className="mt-1 text-sm text-neutral-500">
                {copy.audioFromTelegram}
              </div>
            </div>
          </div>

          <audio
            src={item.url}
            controls
            preload="metadata"
            className="w-full"
          />
        </div>
      ))}
    </div>
  );
}

function FileList({
  items,
  locale,
}: {
  items: Array<{
    id: string;
    url: string;
    fileName?: string | null;
  }>;
  locale: Locale;
}) {
  if (items.length === 0) return null;
  const copy = COPY[locale] ?? COPY.en;

  return (
    <div className="mb-4 space-y-3">
      {items.map((item, index) => (
        <div
          key={item.id || `${item.url}-${index}`}
          className="rounded-3xl border border-neutral-200 bg-neutral-50 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
              <FileText className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-neutral-950">
                {item.fileName?.trim() || `${copy.fileFallback} ${index + 1}`}
              </div>

              <div className="mt-1 text-sm text-neutral-500">
                {copy.fileFromTelegram}
              </div>

              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium !text-white no-underline"
                style={{ color: "#ffffff" }}
              >
                <span style={{ color: "#ffffff" }}>{copy.openFile}</span>
                <ExternalLink
                  className="h-4 w-4"
                  style={{ color: "#ffffff" }}
                />
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MusicFallback({
  post,
  locale,
}: {
  post: IngestedPost;
  locale: Locale;
}) {
  if (!hasMusicLikeTag(post)) return null;
  const copy = COPY[locale] ?? COPY.en;

  return (
    <div className="mb-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
          <Music4 className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-neutral-950">
            {copy.musicAvailable}
          </div>

          <div className="mt-1 text-sm text-neutral-500">
            {copy.musicAvailableText}
          </div>

          <button
            type="button"
            onClick={() => {
              window.open(post.postUrl, "_blank", "noopener,noreferrer");
            }}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            <span>{copy.openInTelegram}</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function FeedTextReaderModal({
  post,
  locale,
  liked,
  onClose,
  onToggleLike,
  onToggleSave: _onToggleSave,
  onShare,
}: {
  post: IngestedPost | null;
  locale: Locale;
  liked: boolean;
  saved: boolean;
  onClose: () => void;
  onToggleLike: (id: number) => void;
  onToggleSave: (id: number) => void;
  onShare: (post: IngestedPost) => Promise<void>;
}) {
  const copy = COPY[locale] ?? COPY.en;
  const text = post?.text || "";
  const media = useMemo(() => (post ? normalizeMediaList(post) : []), [post]);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [subscribed, setSubscribed] = useState(false);

  const visualMedia = media.filter(
    (item) => item.kind === "image" || item.kind === "video"
  );

  const audioMedia = post ? getAudioMedia(post) : [];
  const fileMedia = post ? getFileMedia(post) : [];

  useEffect(() => {
    if (!post) return;
    setSubscribed(getSubs().includes(post.source.handle));
  }, [post]);

  useEffect(() => {
    if (!post) return;

    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = original;
    };
  }, [post]);

  return (
    <AnimatePresence>
      {post ? (
        <motion.div
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[92vh] w-full max-w-[570px] flex-col overflow-hidden rounded-t-[32px] bg-white"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-900"
                type="button"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="text-sm font-semibold text-neutral-900">
                {copy.postFromTelegram}
              </div>

              <button
                type="button"
                onClick={() => {
                  const next = toggleSub(post.source.handle);
                  setSubscribed(next.includes(post.source.handle));
                  window.dispatchEvent(new Event("storage"));
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-900"
                aria-label={
                  subscribed
                    ? copy.disableNotifications
                    : copy.enableNotifications
                }
                title={
                  subscribed
                    ? copy.disableNotifications
                    : copy.enableNotifications
                }
              >
                <Bell
                  className={`h-5 w-5 ${
                    subscribed
                      ? "fill-neutral-900 text-neutral-900"
                      : "text-neutral-900"
                  }`}
                />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-5 pt-4">
              <button
                type="button"
                onClick={() => window.location.assign(`/${post.source.handle}`)}
                className="mb-4 flex w-full min-w-0 items-start gap-3 overflow-hidden text-left"
              >
                <div className="shrink-0">
                  <FeedSourceAvatar post={post} />
                </div>

                <div className="min-w-0 flex-1 overflow-hidden pr-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div className="truncate text-[16px] font-semibold leading-tight text-neutral-950">
                      {post.source.title}
                    </div>
                    {post.source.verified ? (
                      <VerifiedBadge className="shrink-0 text-[#2AABEE]" />
                    ) : null}
                  </div>

                  <div className="mt-1 truncate text-sm text-neutral-500">
                    @{post.source.handle}
                  </div>
                </div>
              </button>

              {visualMedia.length > 0 ? (
                <div className="mb-4 overflow-hidden rounded-[24px]">
                  <FeedCarousel
                    items={visualMedia}
                    aspectClass="aspect-[4/5]"
                    activeIndex={Math.min(
                      mediaIndex,
                      Math.max(visualMedia.length - 1, 0)
                    )}
                    onChange={setMediaIndex}
                    controlsTone="dark"
                    fit="contain"
                    mode="adaptive"
                    maxMediaHeightClass="max-h-full"
                    backgroundClass="bg-transparent"
                    enableFullscreen
                  />
                </div>
              ) : null}

              <AudioList items={audioMedia} locale={locale} />
              <FileList items={fileMedia} locale={locale} />

              {audioMedia.length === 0 && fileMedia.length === 0 ? (
                <MusicFallback post={post} locale={locale} />
              ) : null}

              {text ? <RichTextBlock text={text} /> : null}
            </div>

            <div className="sticky bottom-0 border-t border-neutral-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-8 text-neutral-700">
                  <button type="button" onClick={() => onToggleLike(post.id)}>
                    <Heart
                      className={`h-5 w-5 ${
                        liked ? "fill-current text-neutral-950" : ""
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      void onShare(post);
                    }}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    window.open(post.postUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white"
                >
                  <span>{copy.openInTelegram}</span>
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}