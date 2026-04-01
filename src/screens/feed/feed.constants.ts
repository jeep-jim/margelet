import type { FeedTag } from "../../types/app";
import type { FeedOption } from "./feed.types";

export const TAG_OPTIONS: FeedOption<FeedTag>[] = [
  { value: "all", label: "✨ Все темы" },

  { value: "news", label: "📰 Новости" },
  { value: "politics", label: "🏛 Политика" },
  { value: "war", label: "🪖 Война" },
  { value: "economy", label: "📈 Экономика" },
  { value: "business", label: "💼 Бизнес" },
  { value: "finance", label: "💰 Финансы" },
  { value: "crypto", label: "₿ Крипта" },

  { value: "technology", label: "💻 Технологии" },
  { value: "ai", label: "🤖 AI" },
  { value: "science", label: "🔬 Наука" },
  { value: "space", label: "🚀 Космос" },
  { value: "gadgets", label: "📱 Гаджеты" },
  { value: "telegram", label: "✈️ Telegram" },

  { value: "education", label: "📚 Образование" },
  { value: "history", label: "🏺 История" },
  { value: "culture", label: "🏛 Культура" },
  { value: "books", label: "📖 Книги" },

  { value: "art", label: "🎨 Арт" },
  { value: "design", label: "🧩 Дизайн" },
  { value: "creativity", label: "✨ Творчество" },
  { value: "photography", label: "📷 Фото" },

  { value: "cinema", label: "🎬 Кино" },
  { value: "series", label: "📺 Сериалы" },
  { value: "music", label: "🎵 Музыка" },
  { value: "gaming", label: "🎮 Игры" },

  { value: "memes", label: "😂 Мемы" },
  { value: "humor", label: "😄 Юмор" },

  { value: "sports", label: "⚽ Спорт" },
  { value: "mma", label: "🥊 MMA" },
  { value: "fitness", label: "🏋️ Фитнес" },
  { value: "health", label: "🩺 Здоровье" },

  { value: "travel", label: "✈️ Путешествия" },
  { value: "food", label: "🍔 Еда" },
  { value: "recipes", label: "🍳 Рецепты" },

  { value: "psychology", label: "🧠 Психология" },
  { value: "relationships", label: "❤️ Отношения" },
  { value: "parenting", label: "👶 Родительство" },

  { value: "fashion", label: "👗 Мода" },
  { value: "beauty", label: "💄 Красота" },

  { value: "nature", label: "🌿 Природа" },
  { value: "animals", label: "🐾 Животные" },
  { value: "people", label: "🧑 Люди" },
  { value: "celebrities", label: "⭐ Звёзды" },

  { value: "marketing", label: "📣 Маркетинг" },
  { value: "startups", label: "🛠 Стартапы" },
  { value: "jobs", label: "🧳 Работа" },
  { value: "real_estate", label: "🏠 Недвижимость" },
  { value: "auto", label: "🚗 Авто" },

  { value: "other", label: "🌀 Другое" },
];

export const ADMIN_TELEGRAM_IDS = new Set(["1372669404"]);

export const DRAG_SWITCH_DISTANCE = 88;
export const DRAG_SWITCH_VELOCITY = 430;
export const HORIZONTAL_SWIPE_DISTANCE = 48;

export const FEED_FILTER_TOGGLE_EVENT = "margelet-toggle-feed-filters";