import { X } from "lucide-react";
import { useEffect } from "react";
import type { Theme } from "../../lib/theme";
import type { ScreenCopy } from "./creator.types";

export function CreatorManifestModal({
  copy,
  open,
  onClose,
  theme,
}: {
  copy: ScreenCopy;
  open: boolean;
  onClose: () => void;
  theme: Theme;
}) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isDark = theme === "dark";

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-5"
      onClick={onClose}
    >
      <div
        className={`relative flex h-[100dvh] w-full max-w-[760px] flex-col overflow-hidden rounded-none border sm:h-[min(92dvh,900px)] sm:rounded-[32px] ${
          isDark
            ? "border-[#2a2355] bg-[#0d1020] text-[#f5f7ff]"
            : "border-[#e9dcff] bg-[#f8f5ff] text-[#3e3657]"
        }`}
        style={{
          paddingTop: "var(--safe-area-top)",
          paddingBottom: "var(--safe-area-bottom)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between border-b px-5 py-4 sm:px-7 ${
            isDark ? "border-[#2a2355]" : "border-[#eadcff]"
          }`}
        >
          <div className="min-w-0">
            <div
              className={`truncate text-[22px] font-semibold leading-tight ${
                isDark ? "text-white" : "text-[#111827]"
              }`}
            >
              {copy.manifestTitle}
            </div>
            <div
              className={`mt-1 text-sm ${
                isDark ? "text-[#b7bdd7]" : "text-[#6b7280]"
              }`}
            >
              {copy.manifestSubtitle}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={copy.manifestClose}
            className={`ml-4 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${
              isDark
                ? "border-[#2a2355] bg-[#151936] text-white hover:bg-[#1a2043]"
                : "border-[#eadcff] bg-white text-[#111827] hover:bg-[#f3e8ff]"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="theme-scrollbar flex-1 overflow-y-auto px-5 pb-8 pt-6 sm:px-7">
          <div className="mx-auto max-w-[640px]">
            <div
              className={`overflow-hidden rounded-[28px] border ${
                isDark
                  ? "border-[#2a2355] bg-[#11162d]"
                  : "border-[#eadcff] bg-white"
              }`}
            >
              <img
                src="/manifest-hero.webp"
                alt="margeleT manifesto"
                className="h-auto w-full object-cover"
              />
            </div>

            <div
              className={`mt-6 space-y-5 text-[15px] leading-7 ${
                isDark ? "text-[#d7ddf4]" : "text-[#4b5563]"
              }`}
            >
              <p>{copy.manifestIntro1}</p>
              <p>{copy.manifestIntro2}</p>
              <p>{copy.manifestIntro3}</p>
              <p>{copy.manifestIntro4}</p>

              <div className="space-y-3">
                <p
                  className={`text-[18px] font-semibold ${
                    isDark ? "text-white" : "text-[#111827]"
                  }`}
                >
                  {copy.manifestBulletsTitle}
                </p>

                <ul className="space-y-2 pl-5">
                  <li>{copy.manifestBullet1}</li>
                  <li>{copy.manifestBullet2}</li>
                  <li>{copy.manifestBullet3}</li>
                  <li>{copy.manifestBullet4}</li>
                  <li>{copy.manifestBullet5}</li>
                </ul>
              </div>

              <div className="space-y-4">
                <p>{copy.manifestOutro1}</p>
                <p>{copy.manifestOutro2}</p>
                <p>{copy.manifestOutro3}</p>
                <p>{copy.manifestOutro4}</p>
                <p>{copy.manifestOutro5}</p>
                <p>{copy.manifestOutro6}</p>
                <p>{copy.manifestOutro7}</p>
                <p>{copy.manifestOutro8}</p>
              </div>

              <div
                className={`pt-2 text-xl font-semibold ${
                  isDark ? "text-white" : "text-[#111827]"
                }`}
              >
                {copy.manifestOutro9}
              </div>
            </div>

            <div className="mt-8 flex justify-center sm:hidden">
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex min-h-[48px] items-center rounded-full px-6 py-3 text-sm font-medium transition ${
                  isDark
                    ? "border border-[#7244d4] bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white hover:opacity-95"
                    : "border border-[#d8b4fe] bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white hover:opacity-95"
                }`}
              >
                {copy.manifestClose}
              </button>
            </div>
          </div>

          <div className="mt-8 hidden justify-center sm:flex">
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex min-h-[48px] items-center rounded-full px-6 py-3 text-sm font-medium transition ${
                isDark
                  ? "border border-[#7244d4] bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white hover:opacity-95"
                  : "border border-[#d8b4fe] bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white hover:opacity-95"
              }`}
            >
              {copy.manifestClose}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}