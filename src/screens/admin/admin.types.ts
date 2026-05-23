import type { ContentTag } from "../../types/app";
import type { CountryCode } from "../../../api/lib/contracts";

export type AdminTabId =
  | "posts"
  | "sources"
  | "bulk_import"
  | "access"
  | "analytics";

export type TrustedSourceStatus = "active" | "paused";

export type TrustedSource = {
  id: string;
  countryCode: CountryCode;
  handle: string;
  title: string;
  avatarUrl: string | null;
  avatarOverride?: string | null;
  verified?: boolean;

  // legacy single-tag support
  defaultTag: ContentTag;

  // new multi-tag support
  tags: ContentTag[];

  status: TrustedSourceStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  lastCheckedAt: string | null;
  lastImportedAt: string | null;
  lastSeenPostId: number | null;
  importedPostsCount: number;
};