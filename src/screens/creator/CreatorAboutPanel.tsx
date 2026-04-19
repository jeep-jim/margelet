import type { ScreenCopy } from "./creator.types";

export function CreatorAboutPanel({ copy }: { copy: ScreenCopy }) {
  return (
    <div className="bg-surface text-secondary rounded-[28px] border border-soft p-6 text-sm leading-7">
      {copy.aboutText}
    </div>
  );
}
