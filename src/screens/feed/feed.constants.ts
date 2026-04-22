import type { FeedTag } from "../../types/app";
import type { FeedOption } from "./feed.types";

export const TAG_OPTIONS: FeedOption<FeedTag>[] = [
  { value: "all" },

  { value: "news" },
  { value: "politics" },
  { value: "economy" },
  { value: "business" },
  { value: "finance" },

  { value: "technology" },
  { value: "science" },
  { value: "education" },
  { value: "culture" },

  { value: "gaming" },
  { value: "humor" },
  { value: "sports" },

  { value: "health" },
  { value: "travel" },
  { value: "food" },
  { value: "psychology" },
  { value: "fashion" },

  { value: "nature" },
  { value: "people" },

  { value: "marketing" },
  { value: "startups" },
  { value: "jobs" },
  { value: "real_estate" },
  { value: "auto" },

  { value: "telegram" },
  { value: "creativity" },
  { value: "other" },
];

export const ADMIN_TELEGRAM_IDS = new Set(["1372669404"]);

export const DRAG_SWITCH_DISTANCE = 88;
export const DRAG_SWITCH_VELOCITY = 430;
export const HORIZONTAL_SWIPE_DISTANCE = 48;

export const FEED_FILTER_TOGGLE_EVENT = "margelet-toggle-feed-filters";
export const FEED_FILTER_STATE_EVENT = "margelet-feed-filter-state";