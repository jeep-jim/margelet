import type { SiteLocale } from "./locales";

export type TagLabelMap = Record<SiteLocale, string>;

export type SiteTag = {
  value: string;
  emoji: string;
  labels: TagLabelMap;
};

export type SiteTagGroup = SiteTag & {
  children: SiteTag[];
};

function labels(ru: string, en?: string): TagLabelMap {
  const fallback = (en || ru).trim();

  return {
    ru,
    en: fallback,
    de: fallback,
    es: fallback,
    tr: fallback,
    fr: fallback,
    it: fallback,
    "pt-br": fallback,
    id: fallback,
    pl: fallback,
  };
}

function tag(value: string, emoji: string, ru: string, en?: string): SiteTag {
  return {
    value,
    emoji,
    labels: labels(ru, en),
  };
}

/**
 * Текущий плоский список.
 * Его сохраняем совместимым, чтобы не ломать существующий UI прямо сейчас.
 * Позже UI переведём на SITE_TAG_GROUPS.
 */
export const SITE_TAGS: SiteTag[] = [
  tag("other", "☝️", "Другое", "Other"),
  tag("news", "📰", "Новости", "News"),
  tag("politics", "🏛️", "Политика", "Politics"),
  tag("war", "🎖️", "Война", "War"),
  tag("economy", "📈", "Экономика", "Economy"),
  tag("business", "💼", "Бизнес", "Business"),
  tag("finance", "💰", "Финансы", "Finance"),
  tag("crypto", "₿", "Крипта", "Crypto"),
  tag("technology", "💻", "Технологии", "Technology"),
  tag("ai", "🤖", "AI", "AI"),
  tag("science", "🔬", "Наука", "Science"),
  tag("space", "🚀", "Космос", "Space"),
  tag("education", "📚", "Образование", "Education"),
  tag("history", "🏺", "История", "History"),
  tag("culture", "🎭", "Культура", "Culture"),
  tag("books", "📖", "Книги", "Books"),
  tag("art", "🎨", "Арт", "Art"),
  tag("design", "🧩", "Дизайн", "Design"),
  tag("photography", "📷", "Фото", "Photography"),
  tag("cinema", "🎬", "Кино", "Cinema"),
  tag("series", "📺", "Сериалы", "Series"),
  tag("music", "🎵", "Музыка", "Music"),
  tag("gaming", "🎮", "Игры", "Gaming"),
  tag("memes", "😂", "Мемы", "Memes"),
  tag("humor", "🤣", "Юмор", "Humor"),
  tag("sports", "⚽", "Спорт", "Sports"),
  tag("mma", "🥊", "MMA", "MMA"),
  tag("fitness", "🏋️", "Фитнес", "Fitness"),
  tag("health", "🩺", "Здоровье", "Health"),
  tag("travel", "🧳", "Путешествия", "Travel"),
  tag("food", "🍔", "Еда", "Food"),
  tag("recipes", "🍳", "Рецепты", "Recipes"),
  tag("psychology", "🧠", "Психология", "Psychology"),
  tag("relationships", "❤️", "Отношения", "Relationships"),
  tag("parenting", "👨‍👩‍👦", "Родительство", "Parenting"),
  tag("fashion", "👗", "Мода", "Fashion"),
  tag("beauty", "💄", "Красота", "Beauty"),
  tag("nature", "🌿", "Природа", "Nature"),
  tag("animals", "🐾", "Животные", "Animals"),
  tag("people", "🧑", "Люди", "People"),
  tag("celebrities", "⭐", "Звёзды", "Celebrities"),
  tag("marketing", "📣", "Маркетинг", "Marketing"),
  tag("startups", "🧪", "Стартапы", "Startups"),
  tag("jobs", "🛠️", "Работа", "Work"),
  tag("real_estate", "🏠", "Недвижимость", "Real Estate"),
  tag("auto", "🚙", "Авто", "Auto"),
  tag("gadgets", "📱", "Гаджеты", "Gadgets"),
  tag("telegram", "✈️", "Telegram", "Telegram"),
  tag("creativity", "✨", "Творчество", "Creativity"),
];

/**
 * Новая структура taxonomy v2.
 * Её мы будем подключать в UI следующим этапом:
 * - родительские теги
 * - раскрывающиеся подтеги
 * - родитель + подтеги в карточке
 */
export const SITE_TAG_GROUPS: SiteTagGroup[] = [
  {
    ...tag("news", "📰", "Новости", "News"),
    children: [
      tag("news_all", "📰", "Все", "All"),
      tag("news_world", "🌍", "Мир", "World"),
      tag("news_breaking", "⚡", "Срочно", "Breaking"),
      tag("news_regions", "🗺️", "Регионы и страны", "Regions & Countries"),
      tag("news_incidents", "🚨", "Происшествия", "Incidents"),
      tag("news_investigations", "🕵️", "Расследования", "Investigations"),
      tag("news_good", "💛", "Добрые", "Good News"),
      tag("news_no_negative", "🕊️", "Без негатива", "No Negative"),
    ],
  },
  {
    ...tag("politics", "🏛️", "Политика", "Politics"),
    children: [
      tag("politics_all", "🏛️", "Все", "All"),
      tag("politics_world", "🌍", "Мировая", "World Politics"),
      tag("politics_government", "🏢", "Власть", "Government"),
      tag("politics_elections", "🗳️", "Выборы", "Elections"),
      tag("politics_conflicts", "⚔️", "Конфликты", "Conflicts"),
      tag("war", "🎖️", "Война", "War"),
      tag("politics_opinion", "🧠", "Мнения", "Opinion"),
      tag("politics_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("economy", "📈", "Экономика", "Economy"),
    children: [
      tag("economy_all", "📈", "Все", "All"),
      tag("economy_macro", "🌐", "Макроэкономика", "Macroeconomy"),
      tag("economy_markets", "📊", "Рынки", "Markets"),
      tag("economy_industry", "🏭", "Промышленность", "Industry"),
      tag("economy_energy", "⚡", "Энергетика", "Energy"),
      tag("economy_logistics", "🚚", "Логистика", "Logistics"),
      tag("economy_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("business", "💼", "Бизнес", "Business"),
    children: [
      tag("business_all", "💼", "Все", "All"),
      tag("business_companies", "🏢", "Компании", "Companies"),
      tag("business_entrepreneurship", "🧑‍💼", "Предпринимательство", "Entrepreneurship"),
      tag("business_ecommerce", "🛒", "E-commerce", "E-commerce"),
      tag("business_management", "📋", "Управление", "Management"),
      tag("business_cases", "📚", "Кейсы", "Cases"),
      tag("business_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("finance", "💰", "Финансы", "Finance"),
    children: [
      tag("finance_all", "💰", "Все", "All"),
      tag("finance_banks", "🏦", "Банки", "Banks"),
      tag("finance_investing", "📈", "Инвестиции", "Investing"),
      tag("finance_trading", "📉", "Трейдинг", "Trading"),
      tag("finance_personal", "💳", "Личные финансы", "Personal Finance"),
      tag("crypto", "₿", "Крипта", "Crypto"),
      tag("finance_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("technology", "💻", "Технологии", "Technology"),
    children: [
      tag("technology_all", "💻", "Все", "All"),
      tag("technology_software", "🖥️", "Софт", "Software"),
      tag("technology_dev", "🧑‍💻", "Разработка", "Development"),
      tag("technology_web", "🌐", "Сайты и приложения", "Web & Apps"),
      tag("internet", "🌍", "Интернет", "Internet"),
      tag("gadgets", "📱", "Гаджеты", "Gadgets"),
      tag("ai", "🤖", "AI", "AI"),
      tag("technology_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("science", "🔬", "Наука", "Science"),
    children: [
      tag("science_all", "🔬", "Все", "All"),
      tag("science_research", "🧪", "Исследования", "Research"),
      tag("science_discoveries", "✨", "Открытия", "Discoveries"),
      tag("science_medicine", "🩺", "Медицина", "Medicine"),
      tag("space", "🚀", "Космос", "Space"),
      tag("science_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("education", "📚", "Образование", "Education"),
    children: [
      tag("education_all", "📚", "Все", "All"),
      tag("education_courses", "🎓", "Курсы", "Courses"),
      tag("education_languages", "🗣️", "Языки", "Languages"),
      tag("education_self", "📘", "Саморазвитие", "Self-development"),
      tag("history", "🏺", "История", "History"),
      tag("books", "📖", "Книги", "Books"),
      tag("education_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("culture", "🎭", "Культура", "Culture"),
    children: [
      tag("culture_all", "🎭", "Все", "All"),
      tag("art", "🎨", "Арт", "Art"),
      tag("design", "🧩", "Дизайн", "Design"),
      tag("photography", "📷", "Фото", "Photography"),
      tag("cinema", "🎬", "Кино", "Cinema"),
      tag("series", "📺", "Сериалы", "Series"),
      tag("music", "🎵", "Музыка", "Music"),
      tag("culture_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("gaming", "🎮", "Игры", "Gaming"),
    children: [
      tag("gaming_all", "🎮", "Все", "All"),
      tag("gaming_mobile", "📱", "Мобильные", "Mobile Games"),
      tag("gaming_pc", "🖥️", "PC", "PC"),
      tag("gaming_console", "🕹️", "Консоли", "Console"),
      tag("gaming_esports", "🏆", "Киберспорт", "Esports"),
      tag("gaming_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("humor", "😁", "Юмор", "Humor"),
    children: [
      tag("humor_all", "🤣", "Все", "All"),
      tag("memes", "😂", "Мемы", "Memes"),
      tag("humor_ironical", "😏", "Ирония", "Irony"),
      tag("humor_satire", "🎭", "Сатира", "Satire"),
      tag("humor_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("sports", "⚽", "Спорт", "Sports"),
    children: [
      tag("sports_all", "⚽", "Все", "All"),
      tag("sports_championships", "🏆", "Чемпионаты", "Championships"),
      tag("sports_matches", "🎯", "Матчи", "Matches"),
      tag("sports_news", "📰", "Новости", "Sports News"),
      tag("sports_people", "🧑", "Люди", "People"),
      tag("sports_transfers", "🔁", "Трансферы", "Transfers"),
      tag("sports_analytics", "📊", "Аналитика", "Analytics"),
      tag("sports_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("fitness", "🏋️", "Фитнес", "Fitness"),
    children: [
      tag("fitness_all", "🏋️", "Все", "All"),
      tag("fitness_training", "💪", "Тренировки", "Training"),
      tag("fitness_nutrition", "🥗", "Питание", "Nutrition"),
      tag("fitness_body", "🧍", "Форма тела", "Body Shape"),
      tag("fitness_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("health", "🩺", "Здоровье", "Health"),
    children: [
      tag("health_all", "🩺", "Все", "All"),
      tag("health_medicine", "💊", "Медицина", "Medicine"),
      tag("health_research", "🔬", "Исследования", "Research"),
      tag("health_food", "🥗", "Питание", "Nutrition"),
      tag("health_advice", "🧠", "Советы", "Advice"),
      tag("health_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("travel", "🧳", "Путешествия", "Travel"),
    children: [
      tag("travel_all", "🧳", "Все", "All"),
      tag("travel_rest", "🏖️", "Отдых", "Vacation"),
      tag("travel_countries", "🌍", "Страны", "Countries"),
      tag("travel_routes", "🗺️", "Маршруты", "Routes"),
      tag("travel_hotels", "🏨", "Отели", "Hotels"),
      tag("travel_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("food", "🍕", "Еда", "Food"),
    children: [
      tag("food_all", "🍔", "Все", "All"),
      tag("recipes", "🍳", "Рецепты", "Recipes"),
      tag("food_places", "🍽️", "Заведения", "Places"),
      tag("food_products", "🛒", "Продукты", "Products"),
      tag("food_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("psychology", "🧠", "Психология", "Psychology"),
    children: [
      tag("psychology_all", "🧠", "Все", "All"),
      tag("psychology_self", "🪞", "Самопознание", "Self-awareness"),
      tag("relationships", "❤️", "Отношения", "Relationships"),
      tag("parenting", "👨‍👩‍👦", "Родительство", "Parenting"),
      tag("psychology_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("fashion", "👗", "Мода", "Fashion"),
    children: [
      tag("fashion_all", "👗", "Все", "All"),
      tag("beauty", "💄", "Красота", "Beauty"),
      tag("fashion_style", "✨", "Стиль", "Style"),
      tag("fashion_brands", "👜", "Бренды", "Brands"),
      tag("fashion_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("nature", "🌿", "Природа", "Nature"),
    children: [
      tag("nature_all", "🌿", "Все", "All"),
      tag("animals", "🐾", "Животные", "Animals"),
      tag("nature_ecology", "♻️", "Экология", "Ecology"),
      tag("nature_plants", "🌱", "Растения", "Plants"),
      tag("nature_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("people", "🧑", "Люди", "People"),
    children: [
      tag("people_all", "🧑", "Все", "All"),
      tag("people_blogs", "✍️", "Блоги", "Blogs"),
      tag("celebrities", "⭐", "Звёзды", "Celebrities"),
      tag("people_interviews", "🎤", "Интервью", "Interviews"),
      tag("people_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("marketing", "📣", "Маркетинг", "Marketing"),
    children: [
      tag("marketing_all", "📣", "Все", "All"),
      tag("marketing_smm", "📱", "SMM", "SMM"),
      tag("marketing_ads", "📢", "Реклама", "Advertising"),
      tag("marketing_brand", "🏷️", "Брендинг", "Branding"),
      tag("marketing_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("startups", "🧪", "Стартапы", "Startups"),
    children: [
      tag("startups_all", "🧪", "Все", "All"),
      tag("startups_cases", "📚", "Кейсы", "Cases"),
      tag("startups_founders", "🧑‍💼", "Фаундеры", "Founders"),
      tag("startups_invest", "💸", "Инвестиции", "Investment"),
      tag("startups_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("jobs", "🛠️", "Работа", "Work"),
    children: [
      tag("jobs_all", "🛠️", "Все", "All"),
      tag("jobs_vacancies", "📄", "Вакансии", "Vacancies"),
      tag("jobs_remote", "🏠", "Удалёнка", "Remote"),
      tag("jobs_parttime", "⏰", "Подработка", "Part-time"),
      tag("jobs_career", "📈", "Карьера", "Career"),
      tag("jobs_freelance", "💻", "Фриланс", "Freelance"),
      tag("jobs_resume", "📝", "Резюме", "Resume"),
      tag("jobs_interviews", "🎤", "Интервью", "Interviews"),
      tag("jobs_learning", "🎓", "Обучение профессии", "Job Learning"),
      tag("jobs_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("real_estate", "🏠", "Недвижимость", "Real Estate"),
    children: [
      tag("real_estate_all", "🏠", "Все", "All"),
      tag("real_estate_housing", "🏡", "Жильё", "Housing"),
      tag("real_estate_invest", "💼", "Инвестиции", "Investment"),
      tag("real_estate_build", "🧱", "Стройка и материалы", "Construction"),
      tag("real_estate_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("auto", "🚙", "Транспорт", "Transport"),
    children: [
      tag("auto", "🚗", "Авто", "Auto"),
      tag("transport_moto", "🏍️", "Мото", "Moto"),
      tag("transport_other", "🚚", "Другой транспорт", "Other Transport"),
      tag("transport_reviews", "🧾", "Обзоры", "Reviews"),
      tag("transport_other2", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("telegram", "✈️", "Telegram", "Telegram"),
    children: [
      tag("telegram_all", "✈️", "Все", "All"),
      tag("telegram_channels", "📣", "Каналы", "Channels"),
      tag("telegram_bots", "🤖", "Боты", "Bots"),
      tag("telegram_ton", "💎", "TON", "TON"),
      tag("telegram_updates", "🆕", "Обновления", "Updates"),
      tag("telegram_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("creativity", "✨", "Творчество", "Creativity"),
    children: [
      tag("creativity_all", "✨", "Все", "All"),
      tag("creativity_handmade", "🪡", "Handmade", "Handmade"),
      tag("creativity_inspiration", "💡", "Вдохновение", "Inspiration"),
      tag("creativity_other", "☝️", "Другое", "Other"),
    ],
  },
  {
    ...tag("other", "☝️", "Другое", "Other"),
    children: [
      tag("other_all", "☝️", "Все", "All"),
      tag("other_misc", "📦", "Разное", "Misc"),
    ],
  },
];

const ALL_TAGS_MAP = new Map<string, SiteTag>();

for (const current of SITE_TAGS) {
  ALL_TAGS_MAP.set(current.value, current);
}

for (const group of SITE_TAG_GROUPS) {
  ALL_TAGS_MAP.set(group.value, {
    value: group.value,
    emoji: group.emoji,
    labels: group.labels,
  });

  for (const child of group.children) {
    if (!ALL_TAGS_MAP.has(child.value)) {
      ALL_TAGS_MAP.set(child.value, child);
    }
  }
}

export const ALL_SITE_TAGS: SiteTag[] = Array.from(ALL_TAGS_MAP.values());
export const SITE_TAG_VALUES = ALL_SITE_TAGS.map((tag) => tag.value);

export function getTagLabel(tag: SiteTag, locale: SiteLocale) {
  return `${tag.emoji} ${tag.labels[locale] ?? tag.labels.en}`;
}

export function findTagByValue(value: string) {
  return ALL_TAGS_MAP.get(value);
}

export function findTagGroupByValue(value: string) {
  return SITE_TAG_GROUPS.find((group) => group.value === value);
}

export function findTagGroupByChildValue(value: string) {
  return SITE_TAG_GROUPS.find((group) =>
    group.children.some((child) => child.value === value)
  );
}

export function getTagChildren(parentValue: string) {
  return findTagGroupByValue(parentValue)?.children ?? [];
}

export function isParentTagValue(value: string) {
  return SITE_TAG_GROUPS.some((group) => group.value === value);
}

export function isChildTagValue(value: string) {
  return SITE_TAG_GROUPS.some((group) =>
    group.children.some((child) => child.value === value)
  );
}