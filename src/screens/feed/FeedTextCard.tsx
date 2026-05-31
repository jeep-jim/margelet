import {
  ExternalLink,
  FileText,
  ImageIcon,
  Music4,
  Play,
} from "lucide-react";
import type { IngestedPost, Locale } from "../../types/app";
import {
  getAudioMedia,
  getFileMedia,
} from "./feed.utils";
import { PostAttentionChips } from "./PostAttentionChips";

function getMediaBadge(post: IngestedPost, locale: Locale) {
  const COPY = {
    us: {
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
    ua: {
      audio: "Аудіо",
      file: "Файл",
      media: "Медіа",
      hasMedia: "Є медіа",
    },
    in: {
      audio: "Audio",
      file: "File",
      media: "Media",
      hasMedia: "Has media",
    },
    ir: {
      audio: "صوت",
      file: "فایل",
      media: "رسانه",
      hasMedia: "دارای رسانه",
    },
    tr: {
      audio: "Ses",
      file: "Dosya",
      media: "Medya",
      hasMedia: "Medya var",
    },
    br: {
      audio: "Áudio",
      file: "Arquivo",
      media: "Mídia",
      hasMedia: "Tem mídia",
    },
    kz: {
      audio: "Аудио",
      file: "Файл",
      media: "Медиа",
      hasMedia: "Медиа бар",
    },
    uz: {
      audio: "Audio",
      file: "Fayl",
      media: "Media",
      hasMedia: "Media bor",
    },
    ae: {
      audio: "صوت",
      file: "ملف",
      media: "وسائط",
      hasMedia: "يحتوي على وسائط",
    },
    eg: {
      audio: "صوت",
      file: "ملف",
      media: "وسائط",
      hasMedia: "يحتوي على وسائط",
    },
    pk: {
      audio: "Audio",
      file: "File",
      media: "Media",
      hasMedia: "Has media",
    },
    id: {
      audio: "Audio",
      file: "File",
      media: "Media",
      hasMedia: "Ada media",
    },
    mx: {
      audio: "Audio",
      file: "Archivo",
      media: "Media",
      hasMedia: "Tiene media",
    },
    sa: {
      audio: "صوت",
      file: "ملف",
      media: "وسائط",
      hasMedia: "يحتوي على وسائط",
    },
    es: {
      audio: "Audio",
      file: "Archivo",
      media: "Media",
      hasMedia: "Tiene media",
    },
    it: {
      audio: "Audio",
      file: "File",
      media: "Media",
      hasMedia: "Con media",
    },
    fr: {
      audio: "Audio",
      file: "Fichier",
      media: "Média",
      hasMedia: "Avec média",
    },
    de: {
      audio: "Audio",
      file: "Datei",
      media: "Medien",
      hasMedia: "Mit Medien",
    },
    ar: {
      audio: "Audio",
      file: "Archivo",
      media: "Media",
      hasMedia: "Tiene media",
    },
    co: {
      audio: "Audio",
      file: "Archivo",
      media: "Media",
      hasMedia: "Tiene media",
    },
    za: {
      audio: "Audio",
      file: "File",
      media: "Media",
      hasMedia: "Has media",
    },
    ng: {
      audio: "Audio",
      file: "File",
      media: "Media",
      hasMedia: "Has media",
    },
    cn: {
      audio: "音频",
      file: "文件",
      media: "媒体",
      hasMedia: "有媒体",
    },
    my: {
      audio: "Audio",
      file: "Fail",
      media: "Media",
      hasMedia: "Ada media",
    },
  } as const;

  const copy = COPY[locale] ?? COPY.us;

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
    us: {
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
    ua: {
      telegramAudio: "Аудіо з Telegram",
      telegramFile: "Файл із Telegram",
      audioSingle: "1 аудіо",
      audioMany: "аудіо",
      fileSingle: "1 файл",
      fileMany: "файлів",
    },
    in: {
      telegramAudio: "Audio from Telegram",
      telegramFile: "File from Telegram",
      audioSingle: "1 audio",
      audioMany: "audio files",
      fileSingle: "1 file",
      fileMany: "files",
    },
    ir: {
      telegramAudio: "صدا از Telegram",
      telegramFile: "فایل از Telegram",
      audioSingle: "1 صدا",
      audioMany: "فایل صوتی",
      fileSingle: "1 فایل",
      fileMany: "فایل",
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
    br: {
      telegramAudio: "Áudio do Telegram",
      telegramFile: "Arquivo do Telegram",
      audioSingle: "1 áudio",
      audioMany: "áudios",
      fileSingle: "1 arquivo",
      fileMany: "arquivos",
    },
    kz: {
      telegramAudio: "Telegram-нан аудио",
      telegramFile: "Telegram-нан файл",
      audioSingle: "1 аудио",
      audioMany: "аудио файл",
      fileSingle: "1 файл",
      fileMany: "файл",
    },
    uz: {
      telegramAudio: "Telegram audiosi",
      telegramFile: "Telegram fayli",
      audioSingle: "1 audio",
      audioMany: "audio fayl",
      fileSingle: "1 fayl",
      fileMany: "fayl",
    },
    ae: {
      telegramAudio: "صوت من Telegram",
      telegramFile: "ملف من Telegram",
      audioSingle: "1 صوت",
      audioMany: "ملفات صوتية",
      fileSingle: "1 ملف",
      fileMany: "ملفات",
    },
    eg: {
      telegramAudio: "صوت من Telegram",
      telegramFile: "ملف من Telegram",
      audioSingle: "1 صوت",
      audioMany: "ملفات صوتية",
      fileSingle: "1 ملف",
      fileMany: "ملفات",
    },
    pk: {
      telegramAudio: "Audio from Telegram",
      telegramFile: "File from Telegram",
      audioSingle: "1 audio",
      audioMany: "audio files",
      fileSingle: "1 file",
      fileMany: "files",
    },
    id: {
      telegramAudio: "Audio dari Telegram",
      telegramFile: "File dari Telegram",
      audioSingle: "1 audio",
      audioMany: "audio",
      fileSingle: "1 file",
      fileMany: "file",
    },
    mx: {
      telegramAudio: "Audio de Telegram",
      telegramFile: "Archivo de Telegram",
      audioSingle: "1 audio",
      audioMany: "audios",
      fileSingle: "1 archivo",
      fileMany: "archivos",
    },
    sa: {
      telegramAudio: "صوت من Telegram",
      telegramFile: "ملف من Telegram",
      audioSingle: "1 صوت",
      audioMany: "ملفات صوتية",
      fileSingle: "1 ملف",
      fileMany: "ملفات",
    },
    es: {
      telegramAudio: "Audio de Telegram",
      telegramFile: "Archivo de Telegram",
      audioSingle: "1 audio",
      audioMany: "audios",
      fileSingle: "1 archivo",
      fileMany: "archivos",
    },
    de: {
      telegramAudio: "Audio aus Telegram",
      telegramFile: "Datei aus Telegram",
      audioSingle: "1 Audio",
      audioMany: "Audios",
      fileSingle: "1 Datei",
      fileMany: "Dateien",
    },
    ar: {
      telegramAudio: "Audio de Telegram",
      telegramFile: "Archivo de Telegram",
      audioSingle: "1 audio",
      audioMany: "audios",
      fileSingle: "1 archivo",
      fileMany: "archivos",
    },
    co: {
      telegramAudio: "Audio de Telegram",
      telegramFile: "Archivo de Telegram",
      audioSingle: "1 audio",
      audioMany: "audios",
      fileSingle: "1 archivo",
      fileMany: "archivos",
    },
    za: {
      telegramAudio: "Audio from Telegram",
      telegramFile: "File from Telegram",
      audioSingle: "1 audio",
      audioMany: "audio files",
      fileSingle: "1 file",
      fileMany: "files",
    },
    ng: {
      telegramAudio: "Audio from Telegram",
      telegramFile: "File from Telegram",
      audioSingle: "1 audio",
      audioMany: "audio files",
      fileSingle: "1 file",
      fileMany: "files",
    },
    cn: {
      telegramAudio: "来自 Telegram 的音频",
      telegramFile: "来自 Telegram 的文件",
      audioSingle: "1 个音频",
      audioMany: "个音频文件",
      fileSingle: "1 个文件",
      fileMany: "个文件",
    },
    my: {
      telegramAudio: "Audio dari Telegram",
      telegramFile: "Fail dari Telegram",
      audioSingle: "1 audio",
      audioMany: "fail audio",
      fileSingle: "1 fail",
      fileMany: "fail",
    },
  } as const;

  const copy = COPY[locale] ?? COPY.us;
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
  onOpen,
  searchQuery = "",
}: {
  locale: Locale;
  post: IngestedPost;
  liked: boolean;
  onToggleLike: () => void;
  onOpen: () => void;
  searchQuery?: string;
}) {
  const COPY = {
    us: { read: "Read" },
    ru: { read: "Читать" },
    ua: { read: "Читати" },
    in: { read: "पढ़ें" },
    ir: { read: "خواندن" },
    tr: { read: "Oku" },
    br: { read: "Ler" },
    kz: { read: "Оқу" },
    uz: { read: "O‘qish" },
    ae: { read: "قراءة" },
    eg: { read: "قراءة" },
    pk: { read: "پڑھیں" },
    id: { read: "Baca" },
    mx: { read: "Leer" },
    sa: { read: "قراءة" },
    es: { read: "Leer" },
    it: { read: "Leggi" },
    fr: { read: "Lire" },
    de: { read: "Lesen" },
    ar: { read: "Leer" },
    co: { read: "Leer" },
    za: { read: "Read" },
    ng: { read: "Read" },
    cn: { read: "阅读" },
    my: { read: "Baca" },
  } as const;

  const copy = COPY[locale] ?? COPY.us;
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
            <div
              className="margelet-telegram-content line-clamp-5 whitespace-pre-wrap break-words"
              translate="yes"
            >
              {linkifyText(displayText)}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <PostAttentionChips post={post} searchQuery={searchQuery} />
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-soft bg-surface-soft px-4 py-2 text-sm font-medium text-primary transition hover:bg-app"
        >
          <span>{copy.read}</span>
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}