import { LogOut } from "lucide-react";
import { VerifiedBadge } from "../../components/shared/VerifiedBadge";
import type { ScreenCopy, TgUser } from "./creator.types";

export function CreatorProfileBlock({
  user,
  copy,
  onLogout,
}: {
  user: TgUser;
  copy: ScreenCopy;
  onLogout: () => void;
}) {
  return (
    <div className="bg-surface text-primary shadow-soft overflow-hidden rounded-[32px] border border-soft">
      <div className="px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-surface-soft">
            {user.photo_url ? (
              <img
                src={user.photo_url}
                alt={user.first_name}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="truncate text-lg font-semibold">
                {user.first_name}
              </div>
              <VerifiedBadge className="shrink-0 text-[#2AABEE]" />
            </div>

            <div className="text-secondary truncate text-sm">
              {user.username ? `@${user.username}` : copy.telegramUserFallback}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="bg-success-soft text-success inline-flex min-h-[32px] items-center rounded-full px-3 py-1 text-xs font-medium">
            {copy.connectedToTelegram}
          </div>

          <button
            onClick={onLogout}
            className="text-secondary bg-surface-hover inline-flex items-center gap-2 rounded-full border border-soft px-3 py-1.5 text-xs font-medium transition"
            type="button"
          >
            <LogOut className="h-3.5 w-3.5" />
            {copy.logout}
          </button>
        </div>
      </div>
    </div>
  );
}
