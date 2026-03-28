import type { FeedOption, FeedMode } from "./feed.types";
import type { FeedTag } from "../../types/app";

export const MODE_OPTIONS: FeedOption<FeedMode>[] = [
  { value: "new", label: "Новое" },
  { value: "rising", label: "Взлетает" },
  { value: "trending", label: "Тренды" },
];

export const TAG_OPTIONS: FeedOption<FeedTag>[] = [
  { value: "all", label: "Все" },
  { value: "people", label: "Люди" },
  { value: "animals", label: "Животные" },
  { value: "news", label: "Новости" },
  { value: "business", label: "Бизнес" },
  { value: "creativity", label: "Творчество" },
  { value: "finance", label: "Финансы" },
  { value: "education", label: "Образование" },
  { value: "technology", label: "Технологии" },
  { value: "memes", label: "Мемы" },
  { value: "sports", label: "Спорт" },
  { value: "music", label: "Музыка" },
  { value: "travel", label: "Путешествия" },
  { value: "food", label: "Еда" },
  { value: "other", label: "Другое" },
];

export const ADMIN_TELEGRAM_IDS = new Set(["1372669404"]);

export const DRAG_SWITCH_DISTANCE = 88;
export const DRAG_SWITCH_VELOCITY = 430;
export const HORIZONTAL_SWIPE_DISTANCE = 48;
