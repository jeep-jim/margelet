import {
  ExternalLink,
  FileText,
  Heart,
  ImageIcon,
  Music4,
  Play,
} from "lucide-react";
import type { IngestedPost, Locale } from "../../types/app";
import {
  getAudioMedia,
  getFileMedia,
  getResolvedTag,
  getTagLabel,
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

    const href = part.startsWith("http") ? part : `https://${part}`;

    return (
      <a
        key={index}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="break-all text-[#5ea1ff] underline underline-offset-2"
        onClick={(event) => event.stopPropagation()}
      >
        {part}
      </a>
    );
  });
}

function AudioPreview({
  post,
  locale,
}: {
  post: IngestedPost;
  locale: Locale;
}) {
  const audioMedia = getAudioMedia(post);
  const fileMedia = getFileMedia(post);
  const hasPlayableAudio = audioMedia.length > 0;
  const hasFiles = fileMedia.length > 0;

  if (!hasPlayableAudio && !hasFiles) {
    return null;
  }

  const COPY = {
    en: {
      telegramAudio: "Audio from Telegram",
      telegramFile: "File from Telegram",
      audioSingle: "1 audio",
      audioMany: "audio files",
      fileSingle: "1 file",
      fileMany: "files",
    },
    ru: {
      telegramAudio: "Аудио из Telegram",
      telegramFile: "Файл из Telegram",
      audioSingle: "1 аудио",
      audioMany: "аудио",
      fileSingle: "1 файл",
      fileMany: "файлов",
    },
    de: {
      telegramAudio: "Audio aus Telegram",
      telegramFile: "Datei aus Telegram",
      audioSingle: "1 Audio",
      audioMany: "Audios",
      fileSingle: "1 Datei",
      fileMany: "Dateien",
    },
    es: {
      telegramAudio: "Audio de Telegram",
      telegramFile: "Archivo de Telegram",
      audioSingle: "1 audio",
      audioMany: "audios",
      fileSingle: "1 archivo",
      fileMany: "archivos",
    },
    tr: {
      telegramAudio: "Telegram sesi",
      telegramFile: "Telegram dosyası",
      audioSingle: "1 ses",
      audioMany: "ses dosyası",
      fileSingle: "1 dosya",
      fileMany: "dosya",
    },
    fr: {
      telegramAudio: "Audio Telegram",
      telegramFile: "Fichier Telegram",
      audioSingle: "1 audio",
      audioMany: "audios",
      fileSingle: "1 fichier",
      fileMany: "fichiers",
    },
    it: {
      telegramAudio: "Audio da Telegram",
      telegramFile: "File da Telegram",
      audioSingle: "1 audio",
      audioMany: "audio",
      fileSingle: "1 file",
      fileMany: "file",
    },
    "pt-br": {
      telegramAudio: "Áudio do Telegram",
      telegramFile: "Arquivo do Telegram",
      audioSingle: "1 áudio",
      audioMany: "áudios",
      fileSingle: "1 arquivo",
      fileMany: "arquivos",
    },
    id: {
      telegramAudio: "Audio dari Telegram",
      telegramFile: "File dari Telegram",
      audioSingle: "1 audio",
      audioMany: "audio",
      fileSingle: "1 file",
      fileMany: "file",
    },
    pl: {
      telegramAudio: "Audio z Telegrama",
      telegramFile: "Plik z Telegrama",
      audioSingle: "1 audio",
      audioMany: "plików audio",
      fileSingle: "1 plik",
      fileMany: "plików",
    },
  } as const;

  const copy = COPY[locale] ?? COPY.en;
  const total = hasPlayableAudio ? audioMedia.length : fileMedia.length;
  const title = hasPlayableAudio ? copy.telegramAudio : copy.telegramFile;
  const subtitle = hasPlayableAudio
    ? total > 1
      ? `${total} ${copy.audioMany}`
      : copy.audioSingle
    : total > 1
      ? `${total} ${copy.fileMany}`
      : copy.fileSingle;

  return (
    <div className="mb-4 rounded-3xl border border-soft bg-surface-soft p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-strong text-strong-foreground">
          {hasPlayableAudio ? (
            <Music4 className="h-5 w-5" />
          ) : (
            <FileText className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-primary">
            {title}
          </div>

          <div className="mt-1 text-sm text-secondary">{subtitle}</div>

          <div className="mt-3 flex items-center gap-2 text-secondary">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface shadow-sm ring-1 ring-[color:var(--border-soft)]">
              <Play className="ml-0.5 h-4 w-4 text-primary" />
            </div>

            <div className="h-2 flex-1 rounded-full bg-[color:var(--border-soft)]">
              <div
                className={`h-2 rounded-full ${
                  hasPlayableAudio ? "w-1/3 bg-strong" : "w-1/4 bg-surface-hover"
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
  onOpen,
}: {
  locale: Locale;
  post: IngestedPost;
  liked: boolean;
  onToggleLike: () => void;
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
      {mediaBadge ? (
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-soft bg-surface-soft px-3 py-1 text-[11px] font-medium text-secondary">
              {mediaBadge.icon}
              <span className="truncate">{mediaBadge.label}</span>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className="cursor-pointer"
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen();
          }
        }}
      >
        <AudioPreview post={post} locale={locale} />

        <div className="text-[15px] leading-6 text-primary">
          {displayText ? (
            <div className="line-clamp-5 whitespace-pre-wrap break-words">
              {linkifyText(displayText)}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 text-secondary">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleLike();
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition hover:bg-surface-soft"
          >
            <Heart
              className={`h-5 w-5 ${
                liked ? "fill-current text-primary" : "text-secondary"
              }`}
            />
          </button>

          <div className="pointer-events-none rounded-full border border-soft bg-surface-soft px-3 py-1 text-[11px] font-medium text-primary">
            {getTagLabel(getResolvedTag(post), locale)}
          </div>
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          className="inline-flex items-center gap-2 rounded-full border border-soft bg-surface-soft px-4 py-2 text-sm font-medium text-primary transition hover:bg-app"
        >
          <span>{copy.read}</span>
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
