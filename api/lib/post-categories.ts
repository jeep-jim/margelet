import type { ContentTag } from "./contracts.js";

export type CategoryMatch = {
  tag: ContentTag;
  score: number;
};

const CATEGORY_ORDER: ContentTag[] = [
  "news", "news_breaking", "news_incidents", "news_regions", "news_world", "politics", "war",
  "economy", "business", "marketplaces", "finance", "crypto", "technology", "ai", "gadgets",
  "science", "space", "education", "culture", "cinema", "series", "music", "gaming", "memes", "humor",
  "sports", "fitness", "health", "travel", "food", "recipes", "food_service", "psychology", "relationships",
  "fashion", "beauty", "nature", "animals", "people", "celebrities", "marketing", "startups", "jobs",
  "real_estate", "auto", "telegram", "creativity", "other",
];

const CATEGORY_SET = new Set<string>([
  "news", "politics", "economy", "business", "marketplaces", "finance", "electronics", "technology", "science",
  "education", "culture", "gaming", "humor", "sports", "fitness", "health", "travel", "food", "food_service",
  "psychology", "fashion", "nature", "people", "marketing", "startups", "jobs", "real_estate", "auto",
  "telegram", "creativity", "other", "news_all", "news_world", "news_breaking", "news_regions", "news_incidents",
  "news_investigations", "news_good", "news_no_negative", "politics_all", "politics_world", "politics_government",
  "politics_elections", "politics_conflicts", "war", "politics_opinion", "politics_other", "economy_all",
  "economy_macro", "economy_markets", "economy_industry", "economy_energy", "economy_logistics", "economy_other",
  "business_all", "business_companies", "business_entrepreneurship", "business_ecommerce", "business_management",
  "business_cases", "business_other", "finance_all", "finance_banks", "finance_payment_systems", "finance_investing",
  "finance_trading", "finance_personal", "crypto", "finance_other", "electronics_home_appliances", "electronics_pc",
  "electronics_construction", "electronics_trends", "electronics_brands", "electronics_delivery", "electronics_reviews",
  "technology_all", "technology_software", "technology_dev", "technology_web", "internet", "gadgets", "ai",
  "technology_other", "science_all", "science_research", "science_discoveries", "science_medicine", "space", "science_other",
  "education_all", "education_courses", "education_languages", "education_self", "history", "books", "education_other",
  "culture_all", "art", "design", "photography", "cinema", "series", "music", "culture_other", "gaming_all",
  "gaming_mobile", "gaming_pc", "gaming_console", "gaming_esports", "gaming_other", "humor_all", "memes",
  "humor_ironical", "humor_satire", "humor_other", "sports_all", "sports_championships", "sports_matches",
  "sports_news", "sports_people", "sports_transfers", "sports_analytics", "sports_other", "fitness_all",
  "fitness_training", "fitness_nutrition", "fitness_body", "fitness_other", "health_all", "health_medicine",
  "health_research", "health_food", "health_advice", "health_other", "travel_all", "travel_rest", "travel_countries",
  "travel_routes", "travel_hotels", "travel_other", "food_all", "recipes", "food_products", "food_other",
  "food_service_places", "food_service_delivery", "food_service_products", "food_service_new", "food_service_jobs",
  "food_service_software", "food_service_reviews", "psychology_all", "psychology_self", "relationships",
  "parenting", "psychology_other", "fashion_all", "beauty", "fashion_style", "fashion_brands", "fashion_other",
  "nature_all", "animals", "nature_ecology", "nature_plants", "nature_other", "people_all", "people_blogs",
  "celebrities", "people_interviews", "people_other", "marketing_all", "marketing_smm", "marketing_ads",
  "marketing_brand", "marketing_other", "startups_all", "startups_cases", "startups_founders", "startups_invest",
  "startups_other", "jobs_all", "jobs_vacancies", "jobs_remote", "jobs_parttime", "jobs_career", "jobs_freelance",
  "jobs_resume", "jobs_interviews", "jobs_learning", "jobs_other", "real_estate_all", "real_estate_housing",
  "real_estate_invest", "real_estate_build", "real_estate_other", "transport_auto", "transport_moto", "transport_other",
  "transport_reviews", "transport_other2", "telegram_all", "telegram_channels", "telegram_bots", "telegram_ton",
  "telegram_updates", "telegram_other", "creativity_all", "creativity_handmade", "creativity_inspiration",
  "creativity_other", "other_all", "other_misc",
]);

const PARENT_BY_CHILD: Record<string, ContentTag> = {
  news_all: "news", news_world: "news", news_breaking: "news", news_regions: "news", news_incidents: "news", news_investigations: "news", news_good: "news", news_no_negative: "news",
  politics_all: "politics", politics_world: "politics", politics_government: "politics", politics_elections: "politics", politics_conflicts: "politics", politics_opinion: "politics", politics_other: "politics", war: "politics",
  economy_all: "economy", economy_macro: "economy", economy_markets: "economy", economy_industry: "economy", economy_energy: "economy", economy_logistics: "economy", economy_other: "economy",
  business_all: "business", business_companies: "business", business_entrepreneurship: "business", business_ecommerce: "business", business_management: "business", business_cases: "business", business_other: "business",
  finance_all: "finance", finance_banks: "finance", finance_payment_systems: "finance", finance_investing: "finance", finance_trading: "finance", finance_personal: "finance", crypto: "finance", finance_other: "finance",
  electronics_home_appliances: "electronics", electronics_pc: "electronics", electronics_construction: "electronics", electronics_trends: "electronics", electronics_brands: "electronics", electronics_delivery: "electronics", electronics_reviews: "electronics",
  technology_all: "technology", technology_software: "technology", technology_dev: "technology", technology_web: "technology", internet: "technology", gadgets: "technology", ai: "technology", technology_other: "technology",
  science_all: "science", science_research: "science", science_discoveries: "science", science_medicine: "science", space: "science", science_other: "science",
  education_all: "education", education_courses: "education", education_languages: "education", education_self: "education", history: "education", books: "education", education_other: "education",
  culture_all: "culture", art: "culture", design: "culture", photography: "culture", cinema: "culture", series: "culture", music: "culture", culture_other: "culture",
  gaming_all: "gaming", gaming_mobile: "gaming", gaming_pc: "gaming", gaming_console: "gaming", gaming_esports: "gaming", gaming_other: "gaming",
  humor_all: "humor", memes: "humor", humor_ironical: "humor", humor_satire: "humor", humor_other: "humor",
  sports_all: "sports", sports_championships: "sports", sports_matches: "sports", sports_news: "sports", sports_people: "sports", sports_transfers: "sports", sports_analytics: "sports", sports_other: "sports",
  fitness_all: "fitness", fitness_training: "fitness", fitness_nutrition: "fitness", fitness_body: "fitness", fitness_other: "fitness",
  health_all: "health", health_medicine: "health", health_research: "health", health_food: "health", health_advice: "health", health_other: "health",
  travel_all: "travel", travel_rest: "travel", travel_countries: "travel", travel_routes: "travel", travel_hotels: "travel", travel_other: "travel",
  food_all: "food", recipes: "food", food_products: "food", food_other: "food",
  food_service_places: "food_service", food_service_delivery: "food_service", food_service_products: "food_service", food_service_new: "food_service", food_service_jobs: "food_service", food_service_software: "food_service", food_service_reviews: "food_service",
  psychology_all: "psychology", psychology_self: "psychology", relationships: "psychology", parenting: "psychology", psychology_other: "psychology",
  fashion_all: "fashion", beauty: "fashion", fashion_style: "fashion", fashion_brands: "fashion", fashion_other: "fashion",
  nature_all: "nature", animals: "nature", nature_ecology: "nature", nature_plants: "nature", nature_other: "nature",
  people_all: "people", people_blogs: "people", celebrities: "people", people_interviews: "people", people_other: "people",
  marketing_all: "marketing", marketing_smm: "marketing", marketing_ads: "marketing", marketing_brand: "marketing", marketing_other: "marketing",
  startups_all: "startups", startups_cases: "startups", startups_founders: "startups", startups_invest: "startups", startups_other: "startups",
  jobs_all: "jobs", jobs_vacancies: "jobs", jobs_remote: "jobs", jobs_parttime: "jobs", jobs_career: "jobs", jobs_freelance: "jobs", jobs_resume: "jobs", jobs_interviews: "jobs", jobs_learning: "jobs", jobs_other: "jobs",
  real_estate_all: "real_estate", real_estate_housing: "real_estate", real_estate_invest: "real_estate", real_estate_build: "real_estate", real_estate_other: "real_estate",
  transport_auto: "auto", transport_moto: "auto", transport_reviews: "auto", transport_other: "auto", transport_other2: "auto",
  telegram_all: "telegram", telegram_channels: "telegram", telegram_bots: "telegram", telegram_ton: "telegram", telegram_updates: "telegram", telegram_other: "telegram",
  creativity_all: "creativity", creativity_handmade: "creativity", creativity_inspiration: "creativity", creativity_other: "creativity",
  other_all: "other", other_misc: "other",
};

const TAG_ALIASES: Record<string, ContentTag> = {
  авто: "transport_auto", машина: "transport_auto", машины: "transport_auto", автомобиль: "transport_auto", автомобили: "transport_auto", transport: "transport_auto", car: "transport_auto", cars: "transport_auto",
  новости: "news_all", новость: "news_all", сми: "news_all", news: "news_all", breaking: "news_breaking",
  политика: "politics_all", politics: "politics_all", война: "war", war: "war",
  экономика: "economy_all", economy: "economy_all", бизнес: "business_all", business: "business_all",
  финансы: "finance_all", finance: "finance_all", крипта: "crypto", криптовалюта: "crypto", crypto: "crypto",
  технологии: "technology_all", technology: "technology_all", tech: "technology_all", it: "technology_software",
  ии: "ai", нейросети: "ai", ai: "ai", gadgets: "gadgets", гаджеты: "gadgets",
  наука: "science_all", science: "science_all", образование: "education_all", education: "education_all",
  культура: "culture_all", culture: "culture_all", кино: "cinema", фильмы: "cinema", cinema: "cinema", games: "gaming_all", gaming: "gaming_all", игры: "gaming_all",
  юмор: "humor_all", humor: "humor_all", спорт: "sports_all", sports: "sports_all",
  путешествия: "travel_all", travel: "travel_all", еда: "food_all", food: "food_all", рецепты: "recipes", recipes: "recipes",
  здоровье: "health_all", health: "health_all", фитнес: "fitness_all", fitness: "fitness_all", природа: "nature_all", nature: "nature_all", животные: "animals", animals: "animals",
  маркетинг: "marketing_all", marketing: "marketing_all", стартапы: "startups_all", startups: "startups_all", вакансии: "jobs_vacancies", работа: "jobs_all", jobs: "jobs_all",
  недвижимость: "real_estate_all", realestate: "real_estate_all", real_estate: "real_estate_all", телеграм: "telegram_all", telegram: "telegram_all", другое: "other", разное: "other", other: "other",
};

type KeywordRule = {
  category: ContentTag;
  weight: number;
  patterns: RegExp[];
};

const RULES: KeywordRule[] = [
  { category: "transport_auto", weight: 10, patterns: [/\b(auto|cars?|truck|pickup|vehicle|tesla|toyota|honda|bmw|mercedes|hyundai|kia|byd|geely|ram)\b/i, /авто|машин|автомоб|пикап|грузовик|электромоб|дтп|гибдд|дорог|трасс|водител|мото/i] },
  { category: "transport_reviews", weight: 9, patterns: [/тест[-\s]?драйв|обзор авто|характеристик|расход топлива|лошадиных сил|test drive|car review/i] },
  { category: "real_estate_housing", weight: 9, patterns: [/ипотек|новостро|недвижим|квартир|жиль[её]|застрой|аренд|дом\s|дома\s|жк\b|real estate|mortgage|housing|apartment/i] },
  { category: "finance_banks", weight: 8, patterns: [/банк|сбер|втб|тинькофф|кредит|вклад|карта|bank|loan|deposit/i] },
  { category: "finance_investing", weight: 8, patterns: [/акци[ия]|облигац|дивиденд|портфел|инвест|stocks?|shares?|dividend|invest/i] },
  { category: "finance_trading", weight: 8, patterns: [/трейд|бирж|фьючерс|маржин|лонг|шорт|курс|trading|exchange|market/i] },
  { category: "crypto", weight: 10, patterns: [/bitcoin|btc|ethereum|eth|crypto|крипт|binance|ton\b|toncoin|usdt|blockchain|блокчейн|токен|airdrop|nft|wallet/i] },
  { category: "technology_software", weight: 8, patterns: [/software|app\b|приложени|windows|linux|ios|android|браузер|vpn|код|разработ|github|api\b/i] },
  { category: "gadgets", weight: 9, patterns: [/iphone|ipad|смартфон|гаджет|ноутбук|процессор|чип|камера|apple|samsung|xiaomi|huawei|device|laptop/i] },
  { category: "ai", weight: 11, patterns: [/openai|chatgpt|gpt|нейросет|искусственн| ии |\bai\b|llm|claude|gemini|midjourney|stable diffusion/i] },
  { category: "politics_government", weight: 8, patterns: [/президент|правительств|госдум|депутат|губернатор|министерств|парламент|government|minister|parliament/i] },
  { category: "politics_elections", weight: 8, patterns: [/выбор|голосован|избират|election|vote|voting/i] },
  { category: "politics_conflicts", weight: 8, patterns: [/санкци|конфликт|протест|митинг|conflict|sanction|protest/i] },
  { category: "war", weight: 11, patterns: [/войн|фронт|обстрел|ракет|дрон|бпла|армия|военн|атака|пво|эвакуац|сво\b|war|missile|drone|attack|air defense/i] },
  { category: "business_companies", weight: 7, patterns: [/компан|выручк|прибыл|бренд|ритейл|company|revenue|profit|retail/i] },
  { category: "business_ecommerce", weight: 8, patterns: [/маркетплейс|e-?commerce|ozon|wildberries|amazon|aliexpress|онлайн[-\s]?магазин/i] },
  { category: "marketing_smm", weight: 8, patterns: [/smm|охват|аудитор|продвижен|таргет|контент[-\s]?план|social media/i] },
  { category: "marketing_ads", weight: 8, patterns: [/реклам|баннер|креатив|cpa\b|cpc\b|ads?\b|advertis/i] },
  { category: "startups_founders", weight: 8, patterns: [/стартап|фаундер|founder|startup/i] },
  { category: "startups_invest", weight: 8, patterns: [/венчур|раунд|seed|series a|pitch|vc\b|venture/i] },
  { category: "jobs_vacancies", weight: 8, patterns: [/ваканс|hiring|vacancy|job opening/i] },
  { category: "jobs_remote", weight: 8, patterns: [/удаленк|remote|work from home|дистанцион/i] },
  { category: "jobs_career", weight: 7, patterns: [/карьер|резюме|собеседован|зарплат|career|resume|interview|salary/i] },
  { category: "news_breaking", weight: 8, patterns: [/срочно|молния|breaking|just in|urgent/i] },
  { category: "news_incidents", weight: 8, patterns: [/происшеств|инцидент|погиб|пожар|авари|дтп|взрыв|нападен|incident|accident|fire|explosion/i] },
  { category: "news_regions", weight: 7, patterns: [/област|район|город|регион|москв|петербург|ростов|краснодар|казань|region|city/i] },
  { category: "education_courses", weight: 8, patterns: [/курс|обучен|урок|вебинар|education|course|lesson|webinar/i] },
  { category: "education_all", weight: 7, patterns: [/школ|университет|студент|экзамен|егэ|study|school|university|exam/i] },
  { category: "science_research", weight: 8, patterns: [/ученые|исследован|наука|лаборатор|science|research|study|scientists/i] },
  { category: "science_discoveries", weight: 8, patterns: [/открыт|discover|breakthrough/i] },
  { category: "space", weight: 10, patterns: [/космос|ракета|спутник|spacex|nasa|starship|space|satellite|orbit/i] },
  { category: "health_medicine", weight: 8, patterns: [/врач|медицин|болезн|лекарств|симптом|клиник|medical|doctor|medicine|clinic/i] },
  { category: "health_food", weight: 7, patterns: [/диет|питани|нутрици|калори|nutrition|diet|healthy food/i] },
  { category: "fitness_training", weight: 8, patterns: [/трениров|спортзал|упражнен|workout|gym|training/i] },
  { category: "fitness_nutrition", weight: 7, patterns: [/белок|протеин|похуд|protein|calorie|weight loss/i] },
  { category: "food_service_places", weight: 8, patterns: [/ресторан|кафе|бар\b|кофейн|restaurant|cafe|coffee shop/i] },
  { category: "food_service_delivery", weight: 8, patterns: [/доставк[аи]|delivery|курьер|самокат|яндекс еда/i] },
  { category: "food_products", weight: 7, patterns: [/продукт|магазин|макдоналдс|бургер|еда|food|products|grocery/i] },
  { category: "recipes", weight: 10, patterns: [/рецепт|ингредиент|готов|запека|варить|салат|торт|кухн|recipe|cooking|cook/i] },
  { category: "travel_routes", weight: 8, patterns: [/маршрут|рейс|билет|поезд|самолет|flight|ticket|route/i] },
  { category: "travel_hotels", weight: 8, patterns: [/отел|гостиниц|hotel|booking/i] },
  { category: "travel_countries", weight: 7, patterns: [/виза|границ|страна|тур|путешеств|курорт|travel|visa|resort/i] },
  { category: "sports_matches", weight: 8, patterns: [/матч|гол|счет|побед|match|score|goal/i] },
  { category: "sports_news", weight: 7, patterns: [/футбол|хоккей|теннис|баскетбол|спорт|football|sport|league/i] },
  { category: "sports_transfers", weight: 8, patterns: [/трансфер|контракт|перешел|transfer|contract/i] },
  { category: "gaming_mobile", weight: 8, patterns: [/mobile game|pubg mobile|genshin|хонкай|clash royale/i] },
  { category: "gaming_pc", weight: 8, patterns: [/steam|pc game|dota|cs2|minecraft|roblox|gta/i] },
  { category: "gaming_console", weight: 8, patterns: [/playstation|xbox|nintendo|console/i] },
  { category: "cinema", weight: 8, patterns: [/кино|фильм|актер|режиссер|movie|film|actor|director/i] },
  { category: "series", weight: 8, patterns: [/сериал|netflix|episode|season|series/i] },
  { category: "music", weight: 7, patterns: [/музык|песня|альбом|концерт|трек|music|song|album|concert/i] },
  { category: "art", weight: 7, patterns: [/искусств|картина|галере|artist|painting|gallery/i] },
  { category: "design", weight: 7, patterns: [/дизайн|интерьер|ui\b|ux\b|design|interior/i] },
  { category: "books", weight: 7, patterns: [/книг|роман|литератур|book|novel|reading/i] },
  { category: "fashion_style", weight: 7, patterns: [/мода|одежд|стиль|fashion|style|clothes/i] },
  { category: "fashion_brands", weight: 7, patterns: [/бренд|коллекц|brand|collection/i] },
  { category: "beauty", weight: 8, patterns: [/красот|макияж|косметик|beauty|makeup|cosmetic/i] },
  { category: "nature_ecology", weight: 8, patterns: [/эколог|загрязн|климат|ecology|climate|pollution/i] },
  { category: "nature_all", weight: 6, patterns: [/природ|лес|погода|шторм|дожд|снег|weather|storm|rain|snow/i] },
  { category: "animals", weight: 8, patterns: [/животн|кот|кошка|собак|птиц|animal|cat|dog|bird/i] },
  { category: "telegram_channels", weight: 7, patterns: [/telegram channel|телеграм[-\s]?канал|подписывайтесь|канал/i] },
  { category: "telegram_bots", weight: 8, patterns: [/бот\b|bot\b/i] },
  { category: "telegram_ton", weight: 8, patterns: [/ton\b|toncoin|gram|notcoin/i] },
  { category: "memes", weight: 8, patterns: [/мем|мемы|прикол|memes?|funny/i] },
  { category: "humor_ironical", weight: 7, patterns: [/ирони|сарказм|лол|кек|joke|satire|сарказ/i] },
  { category: "psychology_self", weight: 7, patterns: [/самооцен|мотивац|привычк|осознан|self help|mindset/i] },
  { category: "relationships", weight: 8, patterns: [/отношен|любов|свадьб|развод|relationship|love|dating|marriage/i] },
  { category: "parenting", weight: 8, patterns: [/дети|ребен|родител|мама|папа|parenting|kids|children/i] },
  { category: "people_blogs", weight: 6, patterns: [/блогер|личн|история|дневник|blogger|personal story/i] },
  { category: "celebrities", weight: 8, patterns: [/звезд|селебрити|актер|певец|celebrity|celeb/i] },
  { category: "creativity_handmade", weight: 7, patterns: [/handmade|своими руками|поделк|мастер[-\s]?класс|craft/i] },
  { category: "creativity_inspiration", weight: 6, patterns: [/вдохнов|иде[яи]|inspiration|creative/i] },

  // Marketplace / retail / e-commerce: keep marketplace signals away from generic business.
  { category: "marketplaces", weight: 11, patterns: [/маркетплейс|marketplace|wildberries|вайлдберриз|ozon|озон|aliexpress|алиэкспресс|amazon|seller|селлер|продавец на маркетплейсе|карточк[аи] товар|sku\b|wb\b/i, /电商|市场平台|亚马逊|速卖通|卖家/i] },
  { category: "business_entrepreneurship", weight: 8, patterns: [/предпринимател|самозанят|малый бизнес|бизнес идея|бизнес[-\s]?иде|entrepreneur|small business|founder/i] },
  { category: "business_management", weight: 8, patterns: [/управлен|менеджмент|операционк|команд[аы]|найм|руководител|management|operations|team management/i] },
  { category: "business_cases", weight: 7, patterns: [/кейс|разбор бизнеса|история успеха|business case|case study/i] },

  // Electronics is separate from software/AI. These rules revive zero electronics chips.
  { category: "electronics_pc", weight: 10, patterns: [/пк\b|компьютер|материнск|видеокарт|процессор|ssd\b|hdd\b|монитор|клавиатур|мыш[ьк]|rtx\b|geforce|radeon|intel|amd\b|pc\b|computer|gpu\b|cpu\b/i, /电脑|显卡|处理器|显示器|键盘/i] },
  { category: "electronics_home_appliances", weight: 9, patterns: [/холодильник|стиральн|пылесос|чайник|кофемашин|духовк|микроволнов|робот[-\s]?пылесос|бытов[аяые]|appliance|vacuum|fridge|washing machine/i, /家电|冰箱|洗衣机|吸尘器/i] },
  { category: "electronics_brands", weight: 8, patterns: [/samsung|xiaomi|huawei|honor|realme|lenovo|asus|acer|dyson|lg\b|sony|bosh|bosch|philips/i] },
  { category: "electronics_reviews", weight: 8, patterns: [/обзор|распаковк|сравнен|тестир|review|hands[-\s]?on|unboxing|benchmark/i] },
  { category: "electronics_trends", weight: 7, patterns: [/новинк[аи]|анонс|презентац|тренд|выставк[аи]|ces\b|ifa\b|new device|launch/i] },

  // Health and medicine: split broad health into useful subcategories.
  { category: "health_research", weight: 9, patterns: [/исследован|клиническ|ученые выяснили|испыта[нт]|research|clinical trial|study shows|scientists found/i, /研究|临床|科学家发现/i] },
  { category: "health_advice", weight: 8, patterns: [/как лечить|профилактик|совет врача|рекомендац|симптом|давлени|сон|стресс|иммунитет|health tips|prevention|symptoms/i, /症状|预防|健康建议/i] },
  { category: "health_medicine", weight: 10, patterns: [/больниц|поликлиник|скорая|пациент|операц|диагноз|вакцин|лекарств|таблетк|онколог|инфаркт|инсульт|hospital|patient|diagnosis|vaccine|drug|medicine/i, /医院|患者|疫苗|药物/i] },

  // Food / HoReCa split. Recipes must win over generic food words.
  { category: "food_service_reviews", weight: 8, patterns: [/отзыв.*ресторан|обзор.*кафе|куда сходить|место для завтрака|restaurant review|cafe review/i] },
  { category: "food_service_new", weight: 8, patterns: [/открыл[ис]?|новое кафе|новый ресторан|запуск.*доставк|new restaurant|new cafe|opening/i] },
  { category: "food_service_products", weight: 8, patterns: [/меню|блюдо дня|ланч|завтрак|обед|ужин|кофе|бургер|пицца|суши|шаурм|menu|lunch|dinner|coffee|burger|pizza|sushi/i, /菜单|咖啡|披萨|寿司/i] },
  { category: "recipes", weight: 12, patterns: [/ингредиент|ложк|стакан|грамм|нареж|смеша|добавь|обжар|выпека|духовк|сковород|рецепт|готовим|recipe|ingredients|bake|fry|boil/i, /食谱|配料|烘烤|煎/i] },
  { category: "food_products", weight: 8, patterns: [/продукт|молоко|сыр|мясо|куриц|рыб[ауы]|овощ|фрукт|хлеб|сахар|магазин продуктов|grocery|milk|cheese|meat|chicken|fish|fruit|vegetable/i, /食品|牛奶|奶酪|水果|蔬菜/i] },

  // Transport details beyond generic auto.
  { category: "transport_moto", weight: 10, patterns: [/мотоцикл|байк|скутер|мопед|мото\b|motorcycle|bike|scooter/i] },
  { category: "transport_other", weight: 8, patterns: [/поезд|метро|автобус|трамва|такси|самокат|велосипед|аэропорт|рейс|train|subway|bus|tram|taxi|airport|flight/i, /火车|地铁|公交|出租车|机场/i] },
  { category: "transport_reviews", weight: 10, patterns: [/тест[-\s]?драйв|краш[-\s]?тест|расход топлива|л\.?с\.?|лошадиных сил|комплектац|автообзор|test drive|crash test|fuel consumption|horsepower/i] },

  // Improve underfilled culture/people buckets.
  { category: "people_interviews", weight: 8, patterns: [/интервью|подкаст с|разговор с|interview|podcast/i] },
  { category: "photography", weight: 8, patterns: [/фото|фотограф|снимок|камера|photo|photography|shot/i] },
  { category: "gaming_esports", weight: 9, patterns: [/киберспорт|турнир|esports|tournament|major\b|championship/i] },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/@[a-z0-9_]+/gi, " ")
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, " ");
}

function normalizeTagText(value: string) {
  return normalizeText(value)
    .replace(/[^a-zа-я0-9_]+/gi, "_")
    .replace(/^_+|_+$/g, "");
}

export function getParentContentTag(tag: ContentTag): ContentTag | null {
  return PARENT_BY_CHILD[tag] || null;
}

export function normalizeContentTag(value: unknown): ContentTag | null {
  if (typeof value !== "string") return null;
  const normalized = normalizeTagText(value);
  if (!normalized) return null;

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
  if (category === "other" || category === "other_misc" || category === "other_all") return;
  scores.set(category, (scores.get(category) || 0) + value);
}

function getCategoryOrderIndex(tag: ContentTag) {
  const index = CATEGORY_ORDER.indexOf(tag);
  return index >= 0 ? index : CATEGORY_ORDER.length;
}

function sortedScores(scores: Map<ContentTag, number>): CategoryMatch[] {
  return [...scores.entries()]
    .map(([tag, score]) => ({ tag, score }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return getCategoryOrderIndex(a.tag) - getCategoryOrderIndex(b.tag);
    });
}

function addParentTags(tags: ContentTag[]) {
  const out: ContentTag[] = [];
  const seen = new Set<string>();
  for (const tag of tags) {
    if (!seen.has(tag)) {
      out.push(tag);
      seen.add(tag);
    }
    const parent = getParentContentTag(tag);
    if (parent && !seen.has(parent)) {
      out.push(parent);
      seen.add(parent);
    }
  }
  return out;
}

function isWeakParentOnlyMatch(match: CategoryMatch) {
  return Boolean(PARENT_BY_CHILD[`${match.tag}_all`]);
}

function keepBestCategoryPerParent(matches: CategoryMatch[]) {
  const byParent = new Map<string, CategoryMatch>();

  for (const match of matches) {
    const parent = getParentContentTag(match.tag) || match.tag;
    const current = byParent.get(parent);

    if (!current) {
      byParent.set(parent, match);
      continue;
    }

    const currentIsParent = current.tag === parent || isWeakParentOnlyMatch(current);
    const nextIsParent = match.tag === parent || isWeakParentOnlyMatch(match);

    if (
      match.score > current.score ||
      (match.score === current.score && currentIsParent && !nextIsParent) ||
      (match.score === current.score && getCategoryOrderIndex(match.tag) < getCategoryOrderIndex(current.tag))
    ) {
      byParent.set(parent, match);
    }
  }

  return sortedScores(new Map([...byParent.values()].map((item) => [item.tag, item.score])));
}

function getDistinctParentCount(matches: CategoryMatch[]) {
  return new Set(matches.map((item) => getParentContentTag(item.tag) || item.tag)).size;
}

export function inferPostCategoryMatches(params: {
  text?: string | null;
  title?: string | null;
  sourceTitle?: string | null;
  sourceTags?: unknown;
  sourceDefaultTag?: unknown;
  maxTags?: number;
}): CategoryMatch[] {
  const text = normalizeText(
    [params.title, params.text]
      .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      .join("\n"),
  );

  const scores = new Map<ContentTag, number>();

  for (const rule of RULES) {
    let matched = 0;
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) matched += 1;
    }
    if (matched > 0) addScore(scores, rule.category, rule.weight * matched);
  }

  const direct = keepBestCategoryPerParent(
    sortedScores(scores).filter((item) => item.score >= 7),
  );
  const maxTags = Math.max(1, params.maxTags || 4);

  if (direct.length > 0) {
    const topScore = direct[0].score;
    const strong = direct.filter((item) => item.score >= Math.max(9, topScore * 0.62));
    const nearTop = direct.filter((item) => item.score >= Math.max(8, topScore - 2));

    // If a post looks equally about too many unrelated things, it is usually
    // an ad digest, a link dump, or generic news noise. Do not poison categories.
    if (getDistinctParentCount(nearTop) > 4) return [{ tag: "other", score: 1 }];

    const selected = strong.slice(0, maxTags);
    return selected.length ? selected : [direct[0]];
  }

  const sourceFallback = new Set<ContentTag>();
  collectSourceTags(params.sourceTags, sourceFallback);
  collectSourceTags(params.sourceDefaultTag, sourceFallback);
  const fallbackTags = [...sourceFallback].filter(
    (tag) => tag !== "other" && tag !== "other_all" && tag !== "other_misc",
  );

  if (fallbackTags.length === 1) return [{ tag: fallbackTags[0], score: 2 }];
  if (fallbackTags.length > 1 && fallbackTags.length <= 3) {
    return fallbackTags.slice(0, maxTags).map((tag) => ({ tag, score: 2 }));
  }

  return [{ tag: "other", score: 1 }];
}

export function inferPostCategories(params: {
  text?: string | null;
  title?: string | null;
  sourceTitle?: string | null;
  sourceTags?: unknown;
  sourceDefaultTag?: unknown;
  maxTags?: number;
}): ContentTag[] {
  const matches = inferPostCategoryMatches(params);
  const directTags = matches
    .filter((item) => item.tag !== "other")
    .map((item) => item.tag);

  if (!directTags.length) return ["other"];

  const withParents = addParentTags(directTags);
  return withParents.slice(0, params.maxTags || 6);
}
