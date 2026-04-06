import type { ContentTag } from "../../types/app";
import type { CountryCode } from "./admin.countries";

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
  defaultTag: ContentTag;
  status: TrustedSourceStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  lastCheckedAt: string | null;
  lastImportedAt: string | null;
  lastSeenPostId: number | null;
  importedPostsCount: number;
};