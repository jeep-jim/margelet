import {
  ExternalLink,
  Heart,
  ImageIcon,
  Music4,
  FileText,
  Send,
  Play,
} from "lucide-react";
import type { IngestedPost, Locale } from "../../types/app";
import {
  getResolvedTag,
  getTagLabel,
  getAudioMedia,
  getFileMedia,
} from "./feed.utils";

function getMediaBadge(post: IngestedPost, locale: Locale) {
  const COPY = {
    en: {
      audio: "Audio",
      file: "File",
      media: "Media",
      hasMedia: "Has media",
    },
    ru: {
      audio: "Аудио",
      file: "Файл",
      media: "Медиа",
      hasMedia: "Есть медиа",
    },
    de: {
      audio: "Audio",
      file: "Datei",
      media: "Medien",
      hasMedia: "Mit Medien",
    },
    es: {
      audio: "Audio",
      file: "Archivo",
      media: "Media",
      hasMedia: "Tiene media",
    },
    tr: {
      audio: "Ses",
      file: "Dosya",
      media: "Medya",
      hasMedia: "Medya var",
    },
    fr: {
      audio: "Audio",
      file: "Fichier",
      media: "Média",
      hasMedia: "Avec média",
    },
    it: {
      audio: "Audio",
      file: "File",
      media: "Media",
      hasMedia: "Con media",
    },
    "pt-br": {
      audio: "Áudio",
      file: "Arquivo",
      media: "Mídia",
      hasMedia: "Tem mídia",
    },
    id: {
      audio: "Audio",
      file: "File",
      media: "Media",
      hasMedia: "Ada media",
    },
    pl: {
      audio: "Audio",
      file: "Plik",
      media: "Media",
      hasMedia: "Ma media",
    },
  } as const;

  const copy = COPY[locale] ?? COPY.en;

  if (post.contentType === "audio") {
    return { icon: <Music4 className="h-3.5 w-3.5" />, label: copy.audio };
  }

  if (post.contentType === "file") {
    return { icon: <FileText className="h-3.5 w-3.5" />, label: copy.file };
  }

  if (
    post.contentType === "image" ||
    post.contentType === "gif" ||
    post.contentType === "gallery" ||
    post.contentType === "mixed"
  ) {
    return { icon: <ImageIcon className="h-3.5 w-3.5" />, label: copy.media };
  }

  if (post.hasMediaInOriginal) {
    return { icon: <ImageIcon className="h-3.5 w-3.5" />, label: copy.hasMedia };
  }

  return null;
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

function AudioPreview({
  post,
  locale,
}: {
  post: IngestedPost;
  locale: Locale;
}) {
  const audioItems = getAudioMedia(post);
  const fileItems = getFileMedia(post);
  const isMusicLike = hasMusicLikeTag(post);

  if (audioItems.length === 0 && fileItems.length === 0 && !isMusicLike) {
    return null;
  }

  const COPY = {
    en: {
      telegramMusic: "Music from Telegram post",
      telegramFile: "File from Telegram post",
      audioSingle: "Audio from Telegram post",
      audioMany: "audio / attachments in post",
      fileSingle: "Attachment from Telegram post",
      fileMany: "attachments in post",
      musicAvailable: "Music is available in the original Telegram post",
    },
    ru: {
      telegramMusic: "Музыка из поста Telegram",
      telegramFile: "Файл из поста Telegram",
      audioSingle: "Аудио из поста Telegram",
      audioMany: "аудио / вложения в посте",
      fileSingle: "Вложение из поста Telegram",
      fileMany: "вложения в посте",
      musicAvailable: "Музыка доступна в оригинальном Telegram-посте",
    },
    de: {
      telegramMusic: "Musik aus dem Telegram-Post",
      telegramFile: "Datei aus dem Telegram-Post",
      audioSingle: "Audio aus dem Telegram-Post",
      audioMany: "Audio / Anhänge im Beitrag",
      fileSingle: "Anhang aus dem Telegram-Post",
      fileMany: "Anhänge im Beitrag",
      musicAvailable: "Musik ist im originalen Telegram-Post verfügbar",
    },
    es: {
      telegramMusic: "Música del post de Telegram",
      telegramFile: "Archivo del post de Telegram",
      audioSingle: "Audio del post de Telegram",
      audioMany: "audios / archivos adjuntos en el post",
      fileSingle: "Adjunto del post de Telegram",
      fileMany: "archivos adjuntos en el post",
      musicAvailable: "La música está disponible en el post original de Telegram",
    },
    tr: {
      telegramMusic: "Telegram gönderisindeki müzik",
      telegramFile: "Telegram gönderisindeki dosya",
      audioSingle: "Telegram gönderisindeki ses",
      audioMany: "gönderide ses / ek",
      fileSingle: "Telegram gönderisindeki ek",
      fileMany: "gönderide ekler",
      musicAvailable: "Müzik orijinal Telegram gönderisinde mevcut",
    },
    fr: {
      telegramMusic: "Musique du post Telegram",
      telegramFile: "Fichier du post Telegram",
      audioSingle: "Audio du post Telegram",
      audioMany: "audios / pièces jointes dans le post",
      fileSingle: "Pièce jointe du post Telegram",
      fileMany: "pièces jointes dans le post",
      musicAvailable: "La musique est disponible dans le post Telegram d’origine",
    },
    it: {
      telegramMusic: "Musica dal post Telegram",
      telegramFile: "File dal post Telegram",
      audioSingle: "Audio dal post Telegram",
      audioMany: "audio / allegati nel post",
      fileSingle: "Allegato dal post Telegram",
      fileMany: "allegati nel post",
      musicAvailable: "La musica è disponibile nel post Telegram originale",
    },
    "pt-br": {
      telegramMusic: "Música do post do Telegram",
      telegramFile: "Arquivo do post do Telegram",
      audioSingle: "Áudio do post do Telegram",
      audioMany: "áudios / anexos no post",
      fileSingle: "Anexo do post do Telegram",
      fileMany: "anexos no post",
      musicAvailable: "A música está disponível no post original do Telegram",
    },
    id: {
      telegramMusic: "Musik dari post Telegram",
      telegramFile: "File dari post Telegram",
      audioSingle: "Audio dari post Telegram",
      audioMany: "audio / lampiran di post",
      fileSingle: "Lampiran dari post Telegram",
      fileMany: "lampiran di post",
      musicAvailable: "Musik tersedia di post Telegram asli",
    },
    pl: {
      telegramMusic: "Muzyka z posta Telegram",
      telegramFile: "Plik z posta Telegram",
      audioSingle: "Audio z posta Telegram",
      audioMany: "audio / załączniki w poście",
      fileSingle: "Załącznik z posta Telegram",
      fileMany: "załączniki w poście",
      musicAvailable: "Muzyka jest dostępna w oryginalnym poście Telegram",
    },
  } as const;

  const copy = COPY[locale] ?? COPY.en;

  const total = audioItems.length + fileItems.length;
  const primaryAudio = audioItems[0];
  const primaryFile = fileItems[0];
  const hasPlayableAudio = audioItems.length > 0;

  const title =
    primaryAudio?.fileName?.trim() ||
    primaryFile?.fileName?.trim() ||
    (isMusicLike ? copy.telegramMusic : copy.telegramFile);

  const subtitle =
    hasPlayableAudio
      ? total > 1
        ? `${total} ${copy.audioMany}`
        : copy.audioSingle
      : total > 0
        ? total > 1
          ? `${total} ${copy.fileMany}`
          : copy.fileSingle
        : copy.musicAvailable;

  return (
    <div className="mb-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white">
          {hasPlayableAudio || isMusicLike ? (
            <Music4 className="h-5 w-5" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-neutral-950">
            {title}
          </div>

          <div className="mt-1 text-sm text-neutral-500">{subtitle}</div>

          <div className="mt-3 flex items-center gap-2 text-neutral-700">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-neutral-200">
              <Play className="ml-0.5 h-4 w-4" />
            </div>

            <div className="h-2 flex-1 rounded-full bg-neutral-200">
              <div
                className={`h-2 rounded-full ${
                  hasPlayableAudio ? "w-1/3 bg-neutral-900" : "w-1/4 bg-neutral-400"
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeedTextCard({
  locale,
  post,
  liked,
  onToggleLike,
  onShare,
  onOpen,
}: {
  locale: Locale;
  post: IngestedPost;
  liked: boolean;
  onToggleLike: () => void;
  onShare: () => void;
  onOpen: () => void;
}) {
  const COPY = {
    en: { read: "Read" },
    ru: { read: "Читать" },
    de: { read: "Lesen" },
    es: { read: "Leer" },
    tr: { read: "Oku" },
    fr: { read: "Lire" },
    it: { read: "Leggi" },
    "pt-br": { read: "Ler" },
    id: { read: "Baca" },
    pl: { read: "Czytaj" },
  } as const;

  const copy = COPY[locale] ?? COPY.en;

  const displayText = (post.text || "").trim();
  const mediaBadge = getMediaBadge(post, locale);

  return (
    <div className="px-4 pb-4 pt-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600">
            {getTagLabel(getResolvedTag(post), locale)}
          </div>

          {mediaBadge ? (
            <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-medium text-neutral-600">
              {mediaBadge.icon}
              <span className="truncate">{mediaBadge.label}</span>
            </div>
          ) : null}
        </div>
      </div>

      <AudioPreview post={post} locale={locale} />

      <div className="text-[15px] leading-6 text-neutral-900">
        {displayText ? (
          <div className="line-clamp-5 whitespace-pre-wrap break-words">
            {linkifyText(displayText)}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-8 text-neutral-700">
            <button type="button" onClick={onToggleLike}>
              <Heart
                className={`h-5 w-5 ${
                  liked ? "fill-neutral-950 text-neutral-950" : "text-neutral-700"
                }`}
              />
            </button>

            <button type="button" onClick={onShare}>
              <Send className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-800"
          >
            <span>{copy.read}</span>
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}