import type { ContentTag } from "./contracts.js";

const CATEGORY_ORDER: ContentTag[] = [
  "news",
  "politics",
  "war",
  "economy",
  "business",
  "finance",
  "crypto",
  "technology",
  "ai",
  "science",
  "space",
  "education",
  "history",
  "culture",
  "art",
  "design",
  "books",
  "cinema",
  "series",
  "music",
  "gaming",
  "memes",
  "humor",
  "sports",
  "mma",
  "travel",
  "food",
  "recipes",
  "health",
  "fitness",
  "psychology",
  "relationships",
  "fashion",
  "beauty",
  "photography",
  "nature",
  "animals",
  "people",
  "celebrities",
  "marketing",
  "startups",
  "jobs",
  "real_estate",
  "auto",
  "gadgets",
  "parenting",
  "telegram",
  "creativity",
  "other",
];

const CATEGORY_SET = new Set<string>(CATEGORY_ORDER);

const CHILD_TO_PARENT: Record<string, ContentTag> = {
  news_all: "news",
  news_world: "news",
  news_breaking: "news",
  news_regions: "news",
  news_incidents: "news",
  news_investigations: "news",
  politics_all: "politics",
  politics_world: "politics",
  politics_government: "politics",
  politics_elections: "politics",
  politics_conflicts: "politics",
  politics_opinion: "politics",
  war_all: "war",
  economy_all: "economy",
  economy_macro: "economy",
  economy_markets: "economy",
  economy_energy: "economy",
  business_all: "business",
  business_companies: "business",
  business_ecommerce: "business",
  finance_all: "finance",
  finance_banks: "finance",
  finance_invest: "finance",
  finance_trading: "finance",
  crypto_all: "crypto",
  crypto_btc: "crypto",
  crypto_ton: "crypto",
  technology_all: "technology",
  technology_software: "technology",
  technology_security: "technology",
  technology_reviews: "technology",
  ai_all: "ai",
  ai_tools: "ai",
  science_all: "science",
  education_all: "education",
  education_courses: "education",
  culture_all: "culture",
  cinema_all: "cinema",
  series_all: "series",
  gaming_all: "gaming",
  memes_all: "memes",
  humor_all: "humor",
  sports_all: "sports",
  fitness_all: "fitness",
  health_all: "health",
  health_medicine: "health",
  health_food: "health",
  travel_all: "travel",
  travel_countries: "travel",
  food_all: "food",
  food_products: "food",
  food_service: "food",
  food_service_places: "food",
  food_service_delivery: "food",
  recipes_all: "recipes",
  psychology_all: "psychology",
  fashion_all: "fashion",
  fashion_brands: "fashion",
  beauty_all: "beauty",
  nature_all: "nature",
  animals_all: "animals",
  people_all: "people",
  people_blogs: "people",
  marketing_all: "marketing",
  marketing_smm: "marketing",
  startups_all: "startups",
  jobs_all: "jobs",
  jobs_remote: "jobs",
  jobs_vacancies: "jobs",
  real_estate_all: "real_estate",
  real_estate_housing: "real_estate",
  real_estate_build: "real_estate",
  transport_auto: "auto",
  transport_moto: "auto",
  transport_other: "auto",
  electronics: "gadgets",
  electronics_all: "gadgets",
  electronics_reviews: "gadgets",
  telegram_all: "telegram",
  telegram_channels: "telegram",
  telegram_bots: "telegram",
  telegram_ton: "telegram",
  other_misc: "other",
  other_all: "other",
};

const TAG_ALIASES: Record<string, ContentTag> = {
  авто: "auto",
  машина: "auto",
  машины: "auto",
  автомобиль: "auto",
  автомобили: "auto",
  transport: "auto",
  car: "auto",
  cars: "auto",
  новости: "news",
  новость: "news",
  сми: "news",
  news: "news",
  политика: "politics",
  politics: "politics",
  война: "war",
  war: "war",
  экономика: "economy",
  economy: "economy",
  бизнес: "business",
  business: "business",
  финансы: "finance",
  finance: "finance",
  крипта: "crypto",
  криптовалюта: "crypto",
  crypto: "crypto",
  технологии: "technology",
  technology: "technology",
  tech: "technology",
  it: "technology",
  ии: "ai",
  нейросети: "ai",
  ai: "ai",
  наука: "science",
  science: "science",
  образование: "education",
  education: "education",
  культура: "culture",
  culture: "culture",
  кино: "cinema",
  фильмы: "cinema",
  cinema: "cinema",
  games: "gaming",
  gaming: "gaming",
  игры: "gaming",
  юмор: "humor",
  humor: "humor",
  спорт: "sports",
  sports: "sports",
  путешествия: "travel",
  travel: "travel",
  еда: "food",
  food: "food",
  рецепты: "recipes",
  recipes: "recipes",
  здоровье: "health",
  health: "health",
  фитнес: "fitness",
  fitness: "fitness",
  природа: "nature",
  nature: "nature",
  животные: "animals",
  animals: "animals",
  маркетинг: "marketing",
  marketing: "marketing",
  стартапы: "startups",
  startups: "startups",
  вакансии: "jobs",
  работа: "jobs",
  jobs: "jobs",
  недвижимость: "real_estate",
  realestate: "real_estate",
  real_estate: "real_estate",
  телеграм: "telegram",
  telegram: "telegram",
  другое: "other",
  разное: "other",
  other: "other",
};

type KeywordRule = {
  category: ContentTag;
  weight: number;
  patterns: RegExp[];
};

const RULES: KeywordRule[] = [
  { category: "auto", weight: 8, patterns: [/\b(auto|cars?|truck|pickup|ev|tesla|toyota|honda|bmw|mercedes|hyundai|kia|byd|geely|ram)\b/i, /авто|машин|автомоб|пикап|грузовик|электромоб|дтп|гибдд|дорог|трасс|водител|мото/i] },
  { category: "real_estate", weight: 8, patterns: [/ипотек|новостро|недвижим|квартир|жиль[её]|застрой|аренд|дом\s|дома\s|жк\b|real estate|mortgage|housing|apartment/i] },
  { category: "finance", weight: 7, patterns: [/банк|сбер|втб|тинькофф|ставк|инфляц|доллар|евро|рубл|курс|бирж|акци[ия]|инвест|дивиденд|finance|bank|stocks?|market/i] },
  { category: "crypto", weight: 8, patterns: [/bitcoin|btc|ethereum|eth|crypto|крипт|binance|ton\b|toncoin|usdt|blockchain|блокчейн|токен|airdrop|nft/i] },
  { category: "technology", weight: 7, patterns: [/iphone|android|apple|google|microsoft|windows|software|app\b|приложени|смартфон|гаджет|обновлен|браузер|vpn|технолог/i] },
  { category: "ai", weight: 9, patterns: [/openai|chatgpt|gpt|нейросет|искусственн| ии |\bai\b|llm|claude|gemini|midjourney|stable diffusion/i] },
  { category: "politics", weight: 7, patterns: [/президент|правительств|госдум|выбор|законопроект|санкци|минобороны|парламент|политик|trump|putin|biden|government|election/i] },
  { category: "war", weight: 8, patterns: [/войн|фронт|обстрел|ракет|дрон|бпла|армия|военн|атака|пво|эвакуац|war|missile|drone|attack/i] },
  { category: "business", weight: 6, patterns: [/бизнес|компан|продаж|выручк|прибыл|бренд|магазин|ритейл|маркетплейс|ozon|wildberries|amazon|business|company|retail/i] },
  { category: "marketing", weight: 7, patterns: [/маркетинг|реклам|smm|бренд|охват|аудитор|продвижен|таргет|pr\b|ads?\b|marketing/i] },
  { category: "startups", weight: 7, patterns: [/стартап|инвестиц|фаундер|венчур|раунд|pitch|startup|vc\b|founder/i] },
  { category: "jobs", weight: 7, patterns: [/ваканс|работ[аеуы]|удаленк|резюме|карьер|зарплат|собеседован|job|jobs|remote|career|hiring|vacancy/i] },
  { category: "news", weight: 5, patterns: [/срочно|новост|происшеств|инцидент|погиб|пожар|авари|объявил|сообщил|breaking|news|report/i] },
  { category: "education", weight: 6, patterns: [/курс|обучен|школ|университет|студент|урок|экзамен|егэ|education|course|study|school|university/i] },
  { category: "science", weight: 7, patterns: [/ученые|исследован|наука|открыт|лаборатор|science|research|study/i] },
  { category: "space", weight: 8, patterns: [/космос|ракета|спутник|spacex|nasa|starship|space|satellite/i] },
  { category: "health", weight: 6, patterns: [/здоров|врач|медицин|болезн|лекарств|симптом|клиник|health|medical|doctor|medicine/i] },
  { category: "fitness", weight: 6, patterns: [/фитнес|трениров|спортзал|похуд|белок|калори|fitness|workout|gym/i] },
  { category: "food", weight: 6, patterns: [/еда|ресторан|кафе|доставк|продукт|макдоналдс|вкусно|food|restaurant|delivery/i] },
  { category: "recipes", weight: 8, patterns: [/рецепт|ингредиент|готов|запека|варить|салат|торт|кухн|recipe|cooking/i] },
  { category: "travel", weight: 6, patterns: [/тур|путешеств|отел|рейс|аэропорт|виза|билет|страна|курорт|travel|hotel|flight|visa/i] },
  { category: "sports", weight: 7, patterns: [/футбол|матч|гол|лига|чемпионат|спорт|хоккей|теннис|football|sport|match|league/i] },
  { category: "gaming", weight: 7, patterns: [/игр|game|gaming|steam|xbox|playstation|nintendo|minecraft|roblox|pubg|gta/i] },
  { category: "cinema", weight: 7, patterns: [/кино|фильм|сериал|актер|режиссер|netflix|movie|film|series/i] },
  { category: "music", weight: 6, patterns: [/музык|песня|альбом|концерт|трек|music|song|album|concert/i] },
  { category: "culture", weight: 5, patterns: [/культур|театр|музей|выставк|литератур|culture|museum|theatre/i] },
  { category: "fashion", weight: 6, patterns: [/мода|одежд|стиль|бренд|fashion|style|clothes/i] },
  { category: "beauty", weight: 6, patterns: [/красот|макияж|косметик|beauty|makeup|cosmetic/i] },
  { category: "nature", weight: 6, patterns: [/природ|лес|погода|шторм|дожд|снег|эколог|nature|weather|storm|rain/i] },
  { category: "animals", weight: 7, patterns: [/животн|кот|кошка|собак|птиц|animal|cat|dog|bird/i] },
  { category: "telegram", weight: 8, patterns: [/telegram|телеграм|канал|бот|ton\b|павел дуров|дуров/i] },
  { category: "memes", weight: 6, patterns: [/мем|мемы|прикол|memes?|funny/i] },
  { category: "humor", weight: 5, patterns: [/юмор|смешн|шутк|анекдот|humou?r|joke/i] },
  { category: "parenting", weight: 6, patterns: [/дети|ребен|родител|мама|папа|школа|parenting|kids|children/i] },
  { category: "people", weight: 5, patterns: [/люди|блогер|интервью|персон|people|blogger|interview/i] },
  { category: "celebrities", weight: 6, patterns: [/звезд|селебрити|актер|певец|celebrity|celeb/i] },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/@[a-z0-9_]+/gi, " ");
}

function normalizeTagText(value: string) {
  return normalizeText(value)
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, " ")
    .replace(/[^a-zа-я0-9_]+/gi, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeContentTag(value: unknown): ContentTag | null {
  if (typeof value !== "string") return null;
  const normalized = normalizeTagText(value);
  if (!normalized) return null;

  const childParent = CHILD_TO_PARENT[normalized];
  if (childParent) return childParent;

  const alias = TAG_ALIASES[normalized];
  if (alias) return alias;

  if (CATEGORY_SET.has(normalized)) return normalized as ContentTag;

  return null;
}

function collectSourceTags(value: unknown, out: Set<ContentTag>) {
  if (!value) return;
  if (typeof value === "string") {
    const tag = normalizeContentTag(value);
    if (tag) out.add(tag);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectSourceTags(item, out);
    return;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    collectSourceTags(record.id, out);
    collectSourceTags(record.slug, out);
    collectSourceTags(record.tag, out);
    collectSourceTags(record.value, out);
    collectSourceTags(record.category, out);
  }
}

function addScore(scores: Map<ContentTag, number>, category: ContentTag, value: number) {
  scores.set(category, (scores.get(category) || 0) + value);
}

function sortedScores(scores: Map<ContentTag, number>) {
  return [...scores.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0]);
  });
}

export function inferPostCategories(params: {
  text?: string | null;
  title?: string | null;
  sourceTitle?: string | null;
  sourceTags?: unknown;
  sourceDefaultTag?: unknown;
  maxTags?: number;
}): ContentTag[] {
  const sourceTags = new Set<ContentTag>();
  collectSourceTags(params.sourceTags, sourceTags);
  collectSourceTags(params.sourceDefaultTag, sourceTags);

  const text = normalizeText(
    [params.title, params.text, params.sourceTitle]
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .join("\n"),
  );

  const scores = new Map<ContentTag, number>();

  for (const tag of sourceTags) {
    if (tag !== "other") addScore(scores, tag, 2);
  }

  for (const rule of RULES) {
    let matched = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) matched += 1;
    }
    if (matched > 0) addScore(scores, rule.category, rule.weight * matched);
  }

  const direct = sortedScores(scores)
    .filter(([category, score]) => category !== "other" && score >= 5)
    .map(([category]) => category);

  const sourceFallback = [...sourceTags].filter((tag) => tag !== "other");
  const merged = [...direct, ...sourceFallback];
  const unique = Array.from(new Set(merged));

  if (unique.length > 0) return unique.slice(0, params.maxTags || 4);

  const weak = sortedScores(scores)
    .filter(([category]) => category !== "other")
    .map(([category]) => category);
  if (weak.length > 0) return weak.slice(0, params.maxTags || 4);

  return ["other"];
}
