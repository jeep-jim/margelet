import { ChevronDown, X } from "lucide-react";
import type { FeedTag } from "../../types/app";
import { MODE_OPTIONS, TAG_OPTIONS } from "./feed.constants";
import type { FeedMode } from "./feed.types";
import { getTagLabel } from "./feed.utils";

export function FeedHeader({
  feedMode,
  setFeedMode,
  activeTag,
  setActiveTag,
  tagsOpen,
  setTagsOpen,
}: {
  feedMode: FeedMode;
  setFeedMode: React.Dispatch<React.SetStateAction<FeedMode>>;
  activeTag: FeedTag;
  setActiveTag: React.Dispatch<React.SetStateAction<FeedTag>>;
  tagsOpen: boolean;
  setTagsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-3">
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {MODE_OPTIONS.map((mode) => {
          const active = feedMode === mode.value;
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => setFeedMode(mode.value)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                active
                  ? "bg-neutral-950 text-white"
                  : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {mode.label}
            </button>
          );
        })}

        {activeTag !== "all" && (
          <button
            type="button"
            onClick={() => setActiveTag("all")}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-sm text-white"
          >
            <span>{getTagLabel(activeTag)}</span>
            <X className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setTagsOpen((v) => !v)}
          className={`inline-flex shrink-0 items-center justify-center rounded-full px-3 py-2 transition ${
            tagsOpen
              ? "bg-neutral-950 text-white"
              : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
          }`}
          aria-label="Открыть теги"
          title="Открыть теги"
        >
          <ChevronDown className={`h-4 w-4 transition ${tagsOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {tagsOpen ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {TAG_OPTIONS.filter((tag) => tag.value !== "all").map((tag) => {
            const active = activeTag === tag.value;
            return (
              <button
                key={tag.value}
                type="button"
                onClick={() => {
                  setActiveTag(tag.value);
                  setTagsOpen(false);
                }}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  active
                    ? "bg-neutral-950 text-white"
                    : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
