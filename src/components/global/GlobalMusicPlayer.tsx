import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

type GlobalTrack = {
  title: string;
  sourceTitle: string;
  postUrl?: string;
  audioUrl: string;
};

const STORAGE_KEY = 'margelet_global_music_track_v1';
const EVENT_NAME = 'margelet:play-track';

function readTrack(): GlobalTrack | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GlobalTrack;
    return parsed?.audioUrl ? parsed : null;
  } catch {
    return null;
  }
}

function writeTrack(track: GlobalTrack | null) {
  try {
    if (!track) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(track));
  } catch {
    // ignored
  }
}

export function GlobalMusicPlayer() {
  const [track, setTrack] = useState<GlobalTrack | null>(() => readTrack());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onPlay = (event: Event) => {
      const detail = (event as CustomEvent<GlobalTrack>).detail;
      if (!detail?.audioUrl) return;
      setTrack(detail);
      setCollapsed(false);
      writeTrack(detail);
    };
    const onStorage = () => setTrack(readTrack());
    window.addEventListener(EVENT_NAME, onPlay as EventListener);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, onPlay as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  if (!track) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(84px+env(safe-area-inset-bottom))] z-[1200] mx-auto w-full max-w-[980px] px-3 sm:px-6 pointer-events-none">
      <div className="pointer-events-auto rounded-[24px] border border-white/12 bg-[#101d2b]/96 p-3 text-white shadow-[0_18px_70px_rgba(0,0,0,.35)]">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setCollapsed((prev) => !prev)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#4b8ed8] text-white">
            {collapsed ? '🎵' : '—'}
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-black">{track.title}</div>
            <div className="truncate text-xs text-white/46">{track.sourceTitle}</div>
          </div>
          <button type="button" onClick={() => { setTrack(null); writeTrack(null); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
        <audio src={track.audioUrl} controls autoPlay className={`mt-3 w-full ${collapsed ? 'sr-only' : ''}`} />
      </div>
    </div>
  );
}

export function playGlobalTrack(track: GlobalTrack) {
  if (typeof window === 'undefined') return;
  writeTrack(track);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: track }));
}
