import { AnimatePresence, motion } from "framer-motion";
import type { Locale, IngestedPost } from "../../types/app";
import { ArrowLeft, Bell, ExternalLink, FileText, Music4, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FeedSourceAvatar } from "./FeedSourceHeader";
import { VerifiedBadge } from "../../components/shared/VerifiedBadge";
import { FeedCarousel } from "./FeedCarousel";
import { getAudioMedia, getFileMedia, normalizeMediaList } from "./feed.utils";

const SUB_KEY = "margelet_subscriptions";
const FEED_MUTE_KEY = "margelet_feed_muted";

function getSubs(): string[] {
  try {
    const raw = localStorage.getItem(SUB_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function toggleSub(handle: string) {
  const current = getSubs();
  const exists = current.includes(handle);
  const next = exists ? current.filter((h) => h !== handle) : [...current, handle];
  localStorage.setItem(SUB_KEY, JSON.stringify(next));
  return next;
}
function readMuted() {
  try { return localStorage.getItem(FEED_MUTE_KEY) !== "0"; } catch { return false; }
}
function saveMuted(next: boolean) {
  try { localStorage.setItem(FEED_MUTE_KEY, next ? "1" : "0"); } catch {}
}

export function FeedTextReaderModal({
  locale,
  post,
  isMuted = false,
  setIsMuted = () => undefined,
  viewerMediaIndex = 0,
  setViewerMediaIndex = () => undefined,
  openSource = () => undefined,
  onClose,
}: {
  locale: Locale;
  post: IngestedPost | null;
  liked?: boolean;
  isMuted?: boolean;
  setIsMuted?: React.Dispatch<React.SetStateAction<boolean>>;
  onToggleSave?: (id: number) => void;
  savedPostIds?: number[];
  onHidePost?: (id: number) => void;
  onDeletePost?: (id: number) => Promise<void>;
  currentTelegramUserId?: string | null;
  openSource?: (handle: string) => void;
  onClose: () => void;
  saved?: boolean;
  viewerMediaIndex?: number;
  setViewerMediaIndex?: React.Dispatch<React.SetStateAction<number>>;
}) {
  const copy = locale === "ru"
    ? { open: "Открыть в Telegram", on: "Включить уведомления", off: "Отключить уведомления", mute: "Выключить звук", unmute: "Включить звук", file: "Открыть файл" }
    : { open: "Open in Telegram", on: "Enable notifications", off: "Disable notifications", mute: "Mute", unmute: "Unmute", file: "Open file" };

  const [subscribed, setSubscribed] = useState(false);
  const media = useMemo(() => (post ? normalizeMediaList(post) : []), [post]);
  const audio = useMemo(() => (post ? getAudioMedia(post) : []), [post]);
  const files = useMemo(() => (post ? getFileMedia(post) : []), [post]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => setIsMuted(readMuted()), [setIsMuted]);
  useEffect(() => {
    if (!post) return;
    setSubscribed(getSubs().includes(post.source.handle));
  }, [post]);

  if (!post) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="mx-auto flex min-h-full max-w-[570px] flex-col bg-app text-primary">
          <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
            <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-soft">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = toggleSub(post.source.handle);
                  setSubscribed(next.includes(post.source.handle));
                  window.dispatchEvent(new Event("storage"));
                }}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-soft"
              >
                <Bell className={`h-5 w-5 ${subscribed ? "fill-current" : ""}`} />
              </button>
              <button type="button" onClick={() => { const next = !isMuted; setIsMuted(next); saveMuted(next); }} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-soft">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="px-4">
            <button type="button" onClick={() => openSource(post.source.handle)} className="flex min-w-0 items-center gap-3 text-left">
              <FeedSourceAvatar post={post} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate text-[18px] font-semibold">{post.source.title}</div>
                  {post.source.verified ? <VerifiedBadge className="h-4 w-4 shrink-0 text-[#2AABEE]" /> : null}
                </div>
                <div className="text-sm text-secondary">@{post.source.handle}</div>
              </div>
            </button>
          </div>

          {media.length > 0 ? (
            <div className="mt-4 px-4">
              <FeedCarousel
                items={media}
                aspectClass="aspect-[4/5]"
                activeIndex={viewerMediaIndex}
                onChange={setViewerMediaIndex}
                mediaActive
                muted={isMuted}
                videoRef={videoRef}
                fit="contain"
                nativeVideoControls
              />
            </div>
          ) : null}

          <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4">
            {post.text ? <div className="whitespace-pre-wrap text-[15px] leading-6 text-primary">{post.text}</div> : null}

            {audio.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-soft bg-surface p-4 text-sm text-secondary">
                <div className="mb-2 flex items-center gap-2 text-primary"><Music4 className="h-4 w-4" /> Audio</div>
                <button type="button" onClick={() => window.open(post.postUrl, "_blank", "noopener,noreferrer")} className="inline-flex items-center gap-2 rounded-full bg-surface-soft px-4 py-2 text-primary">
                  <ExternalLink className="h-4 w-4" /> {copy.open}
                </button>
              </div>
            ) : null}

            {files.length > 0 ? (
              <div className="mt-4 space-y-2">
                {files.map((file) => (
                  <button key={file.id} type="button" onClick={() => window.open(file.url, "_blank", "noopener,noreferrer")} className="flex w-full items-center gap-3 rounded-2xl border border-soft bg-surface p-4 text-left text-primary">
                    <FileText className="h-4 w-4" />
                    <span className="truncate">{file.fileName || copy.file}</span>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="mt-4 flex items-center gap-3">
              <button type="button" onClick={() => window.open(post.postUrl, "_blank", "noopener,noreferrer")} className="inline-flex items-center gap-2 rounded-full bg-surface-soft px-4 py-2 text-primary">
                <ExternalLink className="h-4 w-4" /> {copy.open}
              </button>
              <div className="rounded-full border border-soft bg-surface-soft px-3 py-1 text-[11px] font-medium text-primary">
                {subscribed ? copy.off : copy.on}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
