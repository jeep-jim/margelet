import type { FeedTag } from "../../types/app";
import type { FeedOption } from "./feed.types";

export const TAG_OPTIONS: FeedOption<FeedTag>[] = [
  { value: "all" },

  { value: "news" },
  { value: "politics" },
  { value: "war" },
  { value: "economy" },
  { value: "business" },
  { value: "finance" },
  { value: "crypto" },

  { value: "technology" },
  { value: "ai" },
  { value: "science" },
  { value: "space" },
  { value: "gadgets" },
  { value: "telegram" },

  { value: "education" },
  { value: "history" },
  { value: "culture" },
  { value: "books" },

  { value: "art" },
  { value: "design" },
  { value: "photography" },

  { value: "cinema" },
  { value: "series" },
  { value: "music" },
  { value: "gaming" },

  { value: "memes" },
  { value: "humor" },

  { value: "sports" },
  { value: "mma" },
  { value: "fitness" },
  { value: "health" },

  { value: "travel" },
  { value: "food" },
  { value: "recipes" },

  { value: "psychology" },
  { value: "relationships" },
  { value: "parenting" },

  { value: "fashion" },
  { value: "beauty" },

  { value: "nature" },
  { value: "animals" },
  { value: "people" },
  { value: "celebrities" },

  { value: "marketing" },
  { value: "startups" },
  { value: "jobs" },
  { value: "real_estate" },
  { value: "auto" },

  { value: "other" },
];

export const ADMIN_TELEGRAM_IDS = new Set(["1372669404"]);

export const DRAG_SWITCH_DISTANCE = 88;
export const DRAG_SWITCH_VELOCITY = 430;
export const HORIZONTAL_SWIPE_DISTANCE = 48;

export const FEED_FILTER_TOGGLE_EVENT = "margelet-toggle-feed-filters";
export const FEED_FILTER_STATE_EVENT = "margelet-feed-filter-state";