import { Send } from "lucide-react";
import type { ScreenCopy } from "./creator.types";

export function CreatorChannelPanel({
  copy,
  channelUrl,
  onChangeChannelUrl,
  onSubmitChannel,
}: {
  copy: ScreenCopy;
  channelUrl: string;
  onChangeChannelUrl: (value: string) => void;
  onSubmitChannel: () => void;
}) {
  return (
    <div className="bg-surface rounded-[28px] border border-soft p-6">
      <div className="text-primary mb-3 flex items-center gap-2 text-sm font-semibold">
        <Send className="h-4 w-4" />
        {copy.channelTitle}
      </div>

      <div className="text-secondary text-sm leading-6">{copy.channelText}</div>

      <input
        value={channelUrl}
        onChange={(event) => onChangeChannelUrl(event.target.value)}
        placeholder={copy.channelPlaceholder}
        className="bg-surface text-primary focus-border-strong mt-4 w-full rounded-full border border-soft px-4 py-3 text-sm outline-none transition"
      />

      <button
        type="button"
        onClick={onSubmitChannel}
        className="bg-strong text-strong-foreground bg-strong-hover mt-4 inline-flex items-center rounded-full px-4 py-2 text-sm transition"
      >
        {copy.channelButton}
      </button>
    </div>
  );
}
