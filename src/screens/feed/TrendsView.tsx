import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  Eye,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SITE_TAG_GROUPS, getTagLabel, type SiteTagGroup } from "../../lib/tags";
import type { Locale } from "../../types/app";

type TrendSource = {
  id?: string;
  title: string;
  username?: string;
  avatarUrl?: string;
  mentions: number;
};

type TrendCountry = {
  code: string;
  mentions: number;
};

type TrendItem = {
  word?: string;
  topic?: string;
  mentions: number;
  momentum?: number;
  change: string;
  sourceCount?: number;
  countries?: TrendCountry[];
  topSources?: TrendSource[];
  category?: string;
};

type TrendCategory = {
  value: string;
  emoji: string;
  label: string;
};

function stripCategoryEmoji(label: string) {
  return label.replace(/^[^\p{L}\p{N}]+/u, "").trim() || label;
}

const FOLLOWED_TOPICS_STORAGE_KEY = "margelet_followed_attention_topics_v1";

const FEATURED_CATEGORY_VALUES = [
  "all",
  "news",
  "politics",
  "economy",
  "business",
  "finance",
  "technology",
  "science",
  "education",
  "culture",
  "gaming",
  "sports",
  "health",
  "travel",
  "food",
  "auto",
  "nature",
  "marketing",
  "startups",
];

type TrendsCopy = {
  all: string;
  back: string;
  loading: string;
  searchPlaceholder: string;
  clearSearch: string;
  more: string;
  hide: string;
  myTopics: string;
  unsubscribeTopicTitle: string;
  discussingNow: string;
  today: string;
  mentions: string;
  sources: string;
  telegramAttention: string;
  now: string;
  followTopic: string;
  unfollowTopic: string;
  whyGrows: string;
  whyFalls: string;
  whyLineSources: string;
  whyLineActivityUp: string;
  whyLineActivityDown: string;
  whyLineRelated: string;
  whoFormsAttention: string;
  noSignals: string;
  fullAccess: string;
  follow: string;
  unsubscribe: string;
  explore: string;
};

const TRENDS_COPY: Record<Locale, TrendsCopy> = {
  ru: {
    all: "Все",
    back: "Назад",
    loading: "Загружаю сигналы Telegram...",
    searchPlaceholder: "Поиск по теме, бренду, событию...",
    clearSearch: "Очистить",
    more: "Ещё",
    hide: "Скрыть",
    myTopics: "Мои темы",
    unsubscribeTopicTitle: "Отписаться от темы",
    discussingNow: "Что обсуждают сейчас",
    today: "сегодня",
    mentions: "упоминаний",
    sources: "источников",
    telegramAttention: "Telegram Attention",
    now: "сейчас",
    followTopic: "Следить за темой",
    unfollowTopic: "Отписаться от темы",
    whyGrows: "Почему тема растёт",
    whyFalls: "Почему тема угасает",
    whyLineSources: "тему одновременно подхватили {count} источников;",
    whyLineActivityUp: "последние публикации дают ускорение внимания;",
    whyLineActivityDown: "последние публикации дают затухание внимания;",
    whyLineRelated: "рядом с темой чаще всего встречаются: {chips}.",
    whoFormsAttention: "Кто формирует внимание",
    noSignals: "По этому запросу пока нет сигналов.",
    fullAccess: "Полный доступ к индексу внимания",
    follow: "Следить",
    unsubscribe: "✓ Отписаться",
    explore: "Исследовать",
  },
  ua: {
    all: "Усе",
    back: "Назад",
    loading: "Завантажую сигнали Telegram...",
    searchPlaceholder: "Пошук за темою, брендом, подією...",
    clearSearch: "Очистити",
    more: "Ще",
    hide: "Сховати",
    myTopics: "Мої теми",
    unsubscribeTopicTitle: "Відписатися від теми",
    discussingNow: "Що обговорюють зараз",
    today: "сьогодні",
    mentions: "згадок",
    sources: "джерел",
    telegramAttention: "Telegram Attention",
    now: "зараз",
    followTopic: "Стежити за темою",
    unfollowTopic: "Відписатися від теми",
    whyGrows: "Чому тема зростає",
    whyFalls: "Чому тема згасає",
    whyLineSources: "тему одночасно підхопили {count} джерел;",
    whyLineActivityUp: "останні публікації прискорюють увагу;",
    whyLineActivityDown: "останні публікації дають згасання уваги;",
    whyLineRelated: "поруч із темою найчастіше зустрічаються: {chips}.",
    whoFormsAttention: "Хто формує увагу",
    noSignals: "За цим запитом поки немає сигналів.",
    fullAccess: "Повний доступ до індексу уваги",
    follow: "Стежити",
    unsubscribe: "✓ Відписатися",
    explore: "Дослідити",
  },
  us: {
    all: "All",
    back: "Back",
    loading: "Loading Telegram signals...",
    searchPlaceholder: "Search by topic, brand, event...",
    clearSearch: "Clear",
    more: "More",
    hide: "Hide",
    myTopics: "My topics",
    unsubscribeTopicTitle: "Unfollow topic",
    discussingNow: "What Telegram is discussing now",
    today: "today",
    mentions: "mentions",
    sources: "sources",
    telegramAttention: "Telegram Attention",
    now: "now",
    followTopic: "Follow this topic",
    unfollowTopic: "Unfollow this topic",
    whyGrows: "Why this topic is growing",
    whyFalls: "Why this topic is fading",
    whyLineSources: "the topic was picked up by {count} sources at once;",
    whyLineActivityUp: "latest posts are accelerating attention;",
    whyLineActivityDown: "latest posts are cooling attention down;",
    whyLineRelated: "most often appears near: {chips}.",
    whoFormsAttention: "Who shapes attention",
    noSignals: "No signals for this query yet.",
    fullAccess: "Full access to the attention index",
    follow: "Follow",
    unsubscribe: "✓ Unfollow",
    explore: "Explore",
  },
  in: {
    all: "सभी",
    back: "वापस",
    loading: "Telegram संकेत लोड हो रहे हैं...",
    searchPlaceholder: "विषय, ब्रांड, घटना से खोजें...",
    clearSearch: "साफ़ करें",
    more: "और",
    hide: "छुपाएँ",
    myTopics: "मेरे विषय",
    unsubscribeTopicTitle: "विषय अनफॉलो करें",
    discussingNow: "अभी Telegram में क्या चर्चा है",
    today: "आज",
    mentions: "उल्लेख",
    sources: "स्रोत",
    telegramAttention: "Telegram Attention",
    now: "अभी",
    followTopic: "विषय को फॉलो करें",
    unfollowTopic: "विषय अनफॉलो करें",
    whyGrows: "यह विषय क्यों बढ़ रहा है",
    whyFalls: "यह विषय क्यों धीमा हो रहा है",
    whyLineSources: "इस विषय को एक साथ {count} स्रोतों ने उठाया;",
    whyLineActivityUp: "नए पोस्ट ध्यान को तेज़ कर रहे हैं;",
    whyLineActivityDown: "नए पोस्ट ध्यान को धीमा कर रहे हैं;",
    whyLineRelated: "इस विषय के साथ अक्सर दिखता है: {chips}.",
    whoFormsAttention: "ध्यान कौन बना रहा है",
    noSignals: "इस खोज के लिए अभी कोई संकेत नहीं.",
    fullAccess: "attention index का पूरा access",
    follow: "Follow",
    unsubscribe: "✓ Unfollow",
    explore: "Explore",
  },
  ir: {
    all: "همه",
    back: "بازگشت",
    loading: "در حال بارگذاری سیگنال‌های Telegram...",
    searchPlaceholder: "جستجو بر اساس موضوع، برند، رویداد...",
    clearSearch: "پاک کردن",
    more: "بیشتر",
    hide: "پنهان",
    myTopics: "موضوعات من",
    unsubscribeTopicTitle: "لغو دنبال‌کردن موضوع",
    discussingNow: "اکنون در Telegram چه چیزی بحث می‌شود",
    today: "امروز",
    mentions: "اشاره",
    sources: "منبع",
    telegramAttention: "Telegram Attention",
    now: "اکنون",
    followTopic: "دنبال‌کردن موضوع",
    unfollowTopic: "لغو دنبال‌کردن موضوع",
    whyGrows: "چرا این موضوع رشد می‌کند",
    whyFalls: "چرا این موضوع افت می‌کند",
    whyLineSources: "این موضوع هم‌زمان توسط {count} منبع مطرح شد؛",
    whyLineActivityUp: "پست‌های جدید توجه را سرعت می‌دهند؛",
    whyLineActivityDown: "پست‌های جدید توجه را کم‌رنگ می‌کنند؛",
    whyLineRelated: "بیشتر کنار این موارد دیده می‌شود: {chips}.",
    whoFormsAttention: "چه کسی توجه را شکل می‌دهد",
    noSignals: "برای این جستجو هنوز سیگنالی نیست.",
    fullAccess: "دسترسی کامل به شاخص توجه",
    follow: "دنبال‌کردن",
    unsubscribe: "✓ لغو",
    explore: "بررسی",
  },
  tr: {
    all: "Tümü",
    back: "Geri",
    loading: "Telegram sinyalleri yükleniyor...",
    searchPlaceholder: "Konu, marka, olay ara...",
    clearSearch: "Temizle",
    more: "Daha",
    hide: "Gizle",
    myTopics: "Konularım",
    unsubscribeTopicTitle: "Konuyu takipten çıkar",
    discussingNow: "Telegram şu anda ne konuşuyor",
    today: "bugün",
    mentions: "bahsetme",
    sources: "kaynak",
    telegramAttention: "Telegram Attention",
    now: "şimdi",
    followTopic: "Konuyu takip et",
    unfollowTopic: "Konuyu takipten çıkar",
    whyGrows: "Konu neden büyüyor",
    whyFalls: "Konu neden sönüyor",
    whyLineSources: "konu aynı anda {count} kaynak tarafından yakalandı;",
    whyLineActivityUp: "son paylaşımlar dikkati hızlandırıyor;",
    whyLineActivityDown: "son paylaşımlar dikkati azaltıyor;",
    whyLineRelated: "en sık yanında görülenler: {chips}.",
    whoFormsAttention: "Dikkati kim oluşturuyor",
    noSignals: "Bu sorgu için henüz sinyal yok.",
    fullAccess: "Dikkat indeksine tam erişim",
    follow: "Takip et",
    unsubscribe: "✓ Bırak",
    explore: "İncele",
  },
  br: {
    all: "Todos",
    back: "Voltar",
    loading: "Carregando sinais do Telegram...",
    searchPlaceholder: "Buscar por tema, marca, evento...",
    clearSearch: "Limpar",
    more: "Mais",
    hide: "Ocultar",
    myTopics: "Meus temas",
    unsubscribeTopicTitle: "Deixar de seguir tema",
    discussingNow: "O que o Telegram discute agora",
    today: "hoje",
    mentions: "menções",
    sources: "fontes",
    telegramAttention: "Telegram Attention",
    now: "agora",
    followTopic: "Seguir tema",
    unfollowTopic: "Deixar de seguir tema",
    whyGrows: "Por que o tema cresce",
    whyFalls: "Por que o tema esfria",
    whyLineSources: "o tema foi captado por {count} fontes ao mesmo tempo;",
    whyLineActivityUp: "as publicações recentes aceleram a atenção;",
    whyLineActivityDown: "as publicações recentes reduzem a atenção;",
    whyLineRelated: "aparece com mais frequência perto de: {chips}.",
    whoFormsAttention: "Quem forma a atenção",
    noSignals: "Ainda não há sinais para esta busca.",
    fullAccess: "Acesso total ao índice de atenção",
    follow: "Seguir",
    unsubscribe: "✓ Deixar",
    explore: "Explorar",
  },
  kz: {
    all: "Барлығы",
    back: "Артқа",
    loading: "Telegram сигналдары жүктелуде...",
    searchPlaceholder: "Тақырып, бренд, оқиға бойынша іздеу...",
    clearSearch: "Тазарту",
    more: "Тағы",
    hide: "Жасыру",
    myTopics: "Менің тақырыптарым",
    unsubscribeTopicTitle: "Тақырыптан бас тарту",
    discussingNow: "Telegram қазір нені талқылап жатыр",
    today: "бүгін",
    mentions: "аталым",
    sources: "дереккөз",
    telegramAttention: "Telegram Attention",
    now: "қазір",
    followTopic: "Тақырыпты бақылау",
    unfollowTopic: "Тақырыптан бас тарту",
    whyGrows: "Неге тақырып өсіп жатыр",
    whyFalls: "Неге тақырып бәсеңдеп жатыр",
    whyLineSources: "тақырыпты бір уақытта {count} дереккөз көтерді;",
    whyLineActivityUp: "соңғы жарияланымдар назарды күшейтеді;",
    whyLineActivityDown: "соңғы жарияланымдар назарды бәсеңдетеді;",
    whyLineRelated: "жиі бірге кездеседі: {chips}.",
    whoFormsAttention: "Назарды кім қалыптастырады",
    noSignals: "Бұл сұрау бойынша әзірге сигнал жоқ.",
    fullAccess: "Назар индексіне толық қолжетімділік",
    follow: "Бақылау",
    unsubscribe: "✓ Бас тарту",
    explore: "Зерттеу",
  },
  uz: {
    all: "Hammasi",
    back: "Orqaga",
    loading: "Telegram signallari yuklanmoqda...",
    searchPlaceholder: "Mavzu, brend, voqea bo‘yicha qidirish...",
    clearSearch: "Tozalash",
    more: "Yana",
    hide: "Yashirish",
    myTopics: "Mavzularim",
    unsubscribeTopicTitle: "Mavzudan chiqish",
    discussingNow: "Telegram hozir nimani muhokama qilmoqda",
    today: "bugun",
    mentions: "eslatma",
    sources: "manba",
    telegramAttention: "Telegram Attention",
    now: "hozir",
    followTopic: "Mavzuni kuzatish",
    unfollowTopic: "Mavzudan chiqish",
    whyGrows: "Nega mavzu o‘smoqda",
    whyFalls: "Nega mavzu pasaymoqda",
    whyLineSources: "mavzuni bir vaqtda {count} manba ko‘tardi;",
    whyLineActivityUp: "so‘nggi postlar e’tiborni tezlatmoqda;",
    whyLineActivityDown: "so‘nggi postlar e’tiborni pasaytirmoqda;",
    whyLineRelated: "ko‘pincha yonida uchraydi: {chips}.",
    whoFormsAttention: "E’tiborni kim shakllantiradi",
    noSignals: "Bu so‘rov bo‘yicha hozircha signal yo‘q.",
    fullAccess: "E’tibor indeksiga to‘liq kirish",
    follow: "Kuzatish",
    unsubscribe: "✓ Chiqish",
    explore: "O‘rganish",
  },
  ae: {
    all: "الكل",
    back: "رجوع",
    loading: "جارٍ تحميل إشارات Telegram...",
    searchPlaceholder: "ابحث عن موضوع أو علامة أو حدث...",
    clearSearch: "مسح",
    more: "المزيد",
    hide: "إخفاء",
    myTopics: "مواضيعي",
    unsubscribeTopicTitle: "إلغاء متابعة الموضوع",
    discussingNow: "ما الذي يناقشه Telegram الآن",
    today: "اليوم",
    mentions: "ذكر",
    sources: "مصدر",
    telegramAttention: "Telegram Attention",
    now: "الآن",
    followTopic: "متابعة الموضوع",
    unfollowTopic: "إلغاء متابعة الموضوع",
    whyGrows: "لماذا ينمو الموضوع",
    whyFalls: "لماذا يخفت الموضوع",
    whyLineSources: "التقط {count} مصدرًا الموضوع في الوقت نفسه؛",
    whyLineActivityUp: "المنشورات الأخيرة تسرّع الانتباه؛",
    whyLineActivityDown: "المنشورات الأخيرة تخفّض الانتباه؛",
    whyLineRelated: "يظهر غالبًا بجانب: {chips}.",
    whoFormsAttention: "من يصنع الانتباه",
    noSignals: "لا توجد إشارات لهذا البحث بعد.",
    fullAccess: "وصول كامل إلى مؤشر الانتباه",
    follow: "متابعة",
    unsubscribe: "✓ إلغاء",
    explore: "استكشاف",
  },
  eg: {
    all: "الكل",
    back: "رجوع",
    loading: "بنحمّل إشارات Telegram...",
    searchPlaceholder: "دور على موضوع أو براند أو حدث...",
    clearSearch: "مسح",
    more: "المزيد",
    hide: "إخفاء",
    myTopics: "مواضيعي",
    unsubscribeTopicTitle: "إلغاء متابعة الموضوع",
    discussingNow: "إيه اللي بيتناقش على Telegram دلوقتي",
    today: "النهارده",
    mentions: "ذكر",
    sources: "مصدر",
    telegramAttention: "Telegram Attention",
    now: "دلوقتي",
    followTopic: "تابع الموضوع",
    unfollowTopic: "إلغاء متابعة الموضوع",
    whyGrows: "ليه الموضوع بيكبر",
    whyFalls: "ليه الموضوع بيهدأ",
    whyLineSources: "الموضوع اتلقط من {count} مصدر في نفس الوقت؛",
    whyLineActivityUp: "آخر المنشورات بتسرّع الانتباه؛",
    whyLineActivityDown: "آخر المنشورات بتقلل الانتباه؛",
    whyLineRelated: "غالبًا بيظهر مع: {chips}.",
    whoFormsAttention: "مين بيشكّل الانتباه",
    noSignals: "مفيش إشارات للبحث ده لسه.",
    fullAccess: "وصول كامل لمؤشر الانتباه",
    follow: "متابعة",
    unsubscribe: "✓ إلغاء",
    explore: "استكشاف",
  },
  pk: {
    all: "سب",
    back: "واپس",
    loading: "Telegram سگنلز لوڈ ہو رہے ہیں...",
    searchPlaceholder: "موضوع، برانڈ، واقعہ تلاش کریں...",
    clearSearch: "صاف کریں",
    more: "مزید",
    hide: "چھپائیں",
    myTopics: "میرے موضوعات",
    unsubscribeTopicTitle: "موضوع اَن فالو کریں",
    discussingNow: "Telegram پر ابھی کیا بحث ہو رہی ہے",
    today: "آج",
    mentions: "ذکر",
    sources: "ذرائع",
    telegramAttention: "Telegram Attention",
    now: "ابھی",
    followTopic: "موضوع فالو کریں",
    unfollowTopic: "موضوع اَن فالو کریں",
    whyGrows: "موضوع کیوں بڑھ رہا ہے",
    whyFalls: "موضوع کیوں کم ہو رہا ہے",
    whyLineSources: "اس موضوع کو ایک ساتھ {count} ذرائع نے اٹھایا؛",
    whyLineActivityUp: "نئی پوسٹس توجہ تیز کر رہی ہیں؛",
    whyLineActivityDown: "نئی پوسٹس توجہ کم کر رہی ہیں؛",
    whyLineRelated: "اکثر ساتھ آتا ہے: {chips}.",
    whoFormsAttention: "توجہ کون بنا رہا ہے",
    noSignals: "اس تلاش کے لیے ابھی کوئی سگنل نہیں.",
    fullAccess: "attention index تک مکمل رسائی",
    follow: "فالو",
    unsubscribe: "✓ اَن فالو",
    explore: "دیکھیں",
  },
  id: {
    all: "Semua",
    back: "Kembali",
    loading: "Memuat sinyal Telegram...",
    searchPlaceholder: "Cari topik, brand, peristiwa...",
    clearSearch: "Hapus",
    more: "Lainnya",
    hide: "Sembunyikan",
    myTopics: "Topik saya",
    unsubscribeTopicTitle: "Berhenti mengikuti topik",
    discussingNow: "Apa yang dibahas Telegram sekarang",
    today: "hari ini",
    mentions: "sebutan",
    sources: "sumber",
    telegramAttention: "Telegram Attention",
    now: "sekarang",
    followTopic: "Ikuti topik",
    unfollowTopic: "Berhenti mengikuti topik",
    whyGrows: "Mengapa topik naik",
    whyFalls: "Mengapa topik mereda",
    whyLineSources: "topik ini diangkat oleh {count} sumber sekaligus;",
    whyLineActivityUp: "posting terbaru mempercepat perhatian;",
    whyLineActivityDown: "posting terbaru menurunkan perhatian;",
    whyLineRelated: "paling sering muncul bersama: {chips}.",
    whoFormsAttention: "Siapa yang membentuk perhatian",
    noSignals: "Belum ada sinyal untuk pencarian ini.",
    fullAccess: "Akses penuh ke indeks perhatian",
    follow: "Ikuti",
    unsubscribe: "✓ Berhenti",
    explore: "Jelajahi",
  },
  mx: {
    all: "Todo",
    back: "Atrás",
    loading: "Cargando señales de Telegram...",
    searchPlaceholder: "Busca tema, marca, evento...",
    clearSearch: "Limpiar",
    more: "Más",
    hide: "Ocultar",
    myTopics: "Mis temas",
    unsubscribeTopicTitle: "Dejar de seguir tema",
    discussingNow: "Qué se habla ahora en Telegram",
    today: "hoy",
    mentions: "menciones",
    sources: "fuentes",
    telegramAttention: "Telegram Attention",
    now: "ahora",
    followTopic: "Seguir tema",
    unfollowTopic: "Dejar de seguir tema",
    whyGrows: "Por qué crece el tema",
    whyFalls: "Por qué se apaga el tema",
    whyLineSources: "el tema fue tomado por {count} fuentes a la vez;",
    whyLineActivityUp: "las publicaciones recientes aceleran la atención;",
    whyLineActivityDown: "las publicaciones recientes reducen la atención;",
    whyLineRelated: "aparece con más frecuencia junto a: {chips}.",
    whoFormsAttention: "Quién forma la atención",
    noSignals: "Todavía no hay señales para esta búsqueda.",
    fullAccess: "Acceso total al índice de atención",
    follow: "Seguir",
    unsubscribe: "✓ Dejar",
    explore: "Explorar",
  },
  sa: {
    all: "الكل",
    back: "رجوع",
    loading: "جارٍ تحميل إشارات Telegram...",
    searchPlaceholder: "ابحث عن موضوع أو علامة أو حدث...",
    clearSearch: "مسح",
    more: "المزيد",
    hide: "إخفاء",
    myTopics: "مواضيعي",
    unsubscribeTopicTitle: "إلغاء متابعة الموضوع",
    discussingNow: "ما الذي يناقشه Telegram الآن",
    today: "اليوم",
    mentions: "ذكر",
    sources: "مصدر",
    telegramAttention: "Telegram Attention",
    now: "الآن",
    followTopic: "متابعة الموضوع",
    unfollowTopic: "إلغاء متابعة الموضوع",
    whyGrows: "لماذا ينمو الموضوع",
    whyFalls: "لماذا يخفت الموضوع",
    whyLineSources: "التقط {count} مصدرًا الموضوع في الوقت نفسه؛",
    whyLineActivityUp: "المنشورات الأخيرة تسرّع الانتباه؛",
    whyLineActivityDown: "المنشورات الأخيرة تخفّض الانتباه؛",
    whyLineRelated: "يظهر غالبًا بجانب: {chips}.",
    whoFormsAttention: "من يصنع الانتباه",
    noSignals: "لا توجد إشارات لهذا البحث بعد.",
    fullAccess: "وصول كامل إلى مؤشر الانتباه",
    follow: "متابعة",
    unsubscribe: "✓ إلغاء",
    explore: "استكشاف",
  },
  es: {
    all: "Todo",
    back: "Atrás",
    loading: "Cargando señales de Telegram...",
    searchPlaceholder: "Busca por tema, marca, evento...",
    clearSearch: "Limpiar",
    more: "Más",
    hide: "Ocultar",
    myTopics: "Mis temas",
    unsubscribeTopicTitle: "Dejar de seguir tema",
    discussingNow: "Qué se está hablando en Telegram",
    today: "hoy",
    mentions: "menciones",
    sources: "fuentes",
    telegramAttention: "Telegram Attention",
    now: "ahora",
    followTopic: "Seguir tema",
    unfollowTopic: "Dejar de seguir tema",
    whyGrows: "Por qué crece el tema",
    whyFalls: "Por qué se apaga el tema",
    whyLineSources: "el tema fue recogido por {count} fuentes a la vez;",
    whyLineActivityUp: "las publicaciones recientes aceleran la atención;",
    whyLineActivityDown: "las publicaciones recientes enfrían la atención;",
    whyLineRelated: "aparece con más frecuencia junto a: {chips}.",
    whoFormsAttention: "Quién forma la atención",
    noSignals: "Aún no hay señales para esta búsqueda.",
    fullAccess: "Acceso completo al índice de atención",
    follow: "Seguir",
    unsubscribe: "✓ Dejar",
    explore: "Explorar",
  },
  it: {
    all: "Tutto",
    back: "Indietro",
    loading: "Caricamento segnali Telegram...",
    searchPlaceholder: "Cerca per tema, brand, evento...",
    clearSearch: "Cancella",
    more: "Altro",
    hide: "Nascondi",
    myTopics: "I miei temi",
    unsubscribeTopicTitle: "Smetti di seguire il tema",
    discussingNow: "Cosa si discute ora su Telegram",
    today: "oggi",
    mentions: "menzioni",
    sources: "fonti",
    telegramAttention: "Telegram Attention",
    now: "ora",
    followTopic: "Segui il tema",
    unfollowTopic: "Smetti di seguire il tema",
    whyGrows: "Perché il tema cresce",
    whyFalls: "Perché il tema cala",
    whyLineSources: "il tema è stato ripreso da {count} fonti insieme;",
    whyLineActivityUp: "gli ultimi post accelerano l’attenzione;",
    whyLineActivityDown: "gli ultimi post raffreddano l’attenzione;",
    whyLineRelated: "appare più spesso vicino a: {chips}.",
    whoFormsAttention: "Chi forma l’attenzione",
    noSignals: "Non ci sono ancora segnali per questa ricerca.",
    fullAccess: "Accesso completo all’indice di attenzione",
    follow: "Segui",
    unsubscribe: "✓ Smetti",
    explore: "Esplora",
  },
  fr: {
    all: "Tout",
    back: "Retour",
    loading: "Chargement des signaux Telegram...",
    searchPlaceholder: "Rechercher un sujet, une marque, un événement...",
    clearSearch: "Effacer",
    more: "Plus",
    hide: "Masquer",
    myTopics: "Mes sujets",
    unsubscribeTopicTitle: "Ne plus suivre le sujet",
    discussingNow: "Ce que Telegram discute maintenant",
    today: "aujourd’hui",
    mentions: "mentions",
    sources: "sources",
    telegramAttention: "Telegram Attention",
    now: "maintenant",
    followTopic: "Suivre le sujet",
    unfollowTopic: "Ne plus suivre le sujet",
    whyGrows: "Pourquoi le sujet monte",
    whyFalls: "Pourquoi le sujet faiblit",
    whyLineSources: "le sujet a été repris par {count} sources à la fois ;",
    whyLineActivityUp: "les dernières publications accélèrent l’attention ;",
    whyLineActivityDown: "les dernières publications refroidissent l’attention ;",
    whyLineRelated: "apparaît le plus souvent avec : {chips}.",
    whoFormsAttention: "Qui forme l’attention",
    noSignals: "Aucun signal pour cette recherche pour le moment.",
    fullAccess: "Accès complet à l’indice d’attention",
    follow: "Suivre",
    unsubscribe: "✓ Arrêter",
    explore: "Explorer",
  },
  de: {
    all: "Alle",
    back: "Zurück",
    loading: "Telegram-Signale werden geladen...",
    searchPlaceholder: "Nach Thema, Marke, Ereignis suchen...",
    clearSearch: "Löschen",
    more: "Mehr",
    hide: "Ausblenden",
    myTopics: "Meine Themen",
    unsubscribeTopicTitle: "Thema nicht mehr verfolgen",
    discussingNow: "Was Telegram gerade diskutiert",
    today: "heute",
    mentions: "Erwähnungen",
    sources: "Quellen",
    telegramAttention: "Telegram Attention",
    now: "jetzt",
    followTopic: "Thema verfolgen",
    unfollowTopic: "Thema nicht mehr verfolgen",
    whyGrows: "Warum das Thema wächst",
    whyFalls: "Warum das Thema abkühlt",
    whyLineSources: "das Thema wurde gleichzeitig von {count} Quellen aufgegriffen;",
    whyLineActivityUp: "neue Beiträge beschleunigen die Aufmerksamkeit;",
    whyLineActivityDown: "neue Beiträge lassen die Aufmerksamkeit abklingen;",
    whyLineRelated: "erscheint am häufigsten neben: {chips}.",
    whoFormsAttention: "Wer Aufmerksamkeit formt",
    noSignals: "Für diese Suche gibt es noch keine Signale.",
    fullAccess: "Voller Zugriff auf den Aufmerksamkeitsindex",
    follow: "Folgen",
    unsubscribe: "✓ Entfolgen",
    explore: "Erkunden",
  },
  ar: {
    all: "Todo",
    back: "Atrás",
    loading: "Cargando señales de Telegram...",
    searchPlaceholder: "Buscar tema, marca, evento...",
    clearSearch: "Limpiar",
    more: "Más",
    hide: "Ocultar",
    myTopics: "Mis temas",
    unsubscribeTopicTitle: "Dejar de seguir tema",
    discussingNow: "Qué se habla ahora en Telegram",
    today: "hoy",
    mentions: "menciones",
    sources: "fuentes",
    telegramAttention: "Telegram Attention",
    now: "ahora",
    followTopic: "Seguir tema",
    unfollowTopic: "Dejar de seguir tema",
    whyGrows: "Por qué crece el tema",
    whyFalls: "Por qué se apaga el tema",
    whyLineSources: "el tema fue tomado por {count} fuentes a la vez;",
    whyLineActivityUp: "las publicaciones recientes aceleran la atención;",
    whyLineActivityDown: "las publicaciones recientes reducen la atención;",
    whyLineRelated: "aparece con más frecuencia junto a: {chips}.",
    whoFormsAttention: "Quién forma la atención",
    noSignals: "Todavía no hay señales para esta búsqueda.",
    fullAccess: "Acceso total al índice de atención",
    follow: "Seguir",
    unsubscribe: "✓ Dejar",
    explore: "Explorar",
  },
  co: {
    all: "Todo",
    back: "Atrás",
    loading: "Cargando señales de Telegram...",
    searchPlaceholder: "Busca tema, marca, evento...",
    clearSearch: "Limpiar",
    more: "Más",
    hide: "Ocultar",
    myTopics: "Mis temas",
    unsubscribeTopicTitle: "Dejar de seguir tema",
    discussingNow: "Qué se habla ahora en Telegram",
    today: "hoy",
    mentions: "menciones",
    sources: "fuentes",
    telegramAttention: "Telegram Attention",
    now: "ahora",
    followTopic: "Seguir tema",
    unfollowTopic: "Dejar de seguir tema",
    whyGrows: "Por qué crece el tema",
    whyFalls: "Por qué se apaga el tema",
    whyLineSources: "el tema fue tomado por {count} fuentes a la vez;",
    whyLineActivityUp: "las publicaciones recientes aceleran la atención;",
    whyLineActivityDown: "las publicaciones recientes reducen la atención;",
    whyLineRelated: "aparece con más frecuencia junto a: {chips}.",
    whoFormsAttention: "Quién forma la atención",
    noSignals: "Todavía no hay señales para esta búsqueda.",
    fullAccess: "Acceso total al índice de atención",
    follow: "Seguir",
    unsubscribe: "✓ Dejar",
    explore: "Explorar",
  },
  za: {
    all: "All",
    back: "Back",
    loading: "Loading Telegram signals...",
    searchPlaceholder: "Search by topic, brand, event...",
    clearSearch: "Clear",
    more: "More",
    hide: "Hide",
    myTopics: "My topics",
    unsubscribeTopicTitle: "Unfollow topic",
    discussingNow: "What Telegram is discussing now",
    today: "today",
    mentions: "mentions",
    sources: "sources",
    telegramAttention: "Telegram Attention",
    now: "now",
    followTopic: "Follow this topic",
    unfollowTopic: "Unfollow this topic",
    whyGrows: "Why this topic is growing",
    whyFalls: "Why this topic is fading",
    whyLineSources: "the topic was picked up by {count} sources at once;",
    whyLineActivityUp: "latest posts are accelerating attention;",
    whyLineActivityDown: "latest posts are cooling attention down;",
    whyLineRelated: "most often appears near: {chips}.",
    whoFormsAttention: "Who shapes attention",
    noSignals: "No signals for this query yet.",
    fullAccess: "Full access to the attention index",
    follow: "Follow",
    unsubscribe: "✓ Unfollow",
    explore: "Explore",
  },
  ng: {
    all: "All",
    back: "Back",
    loading: "Loading Telegram signals...",
    searchPlaceholder: "Search by topic, brand, event...",
    clearSearch: "Clear",
    more: "More",
    hide: "Hide",
    myTopics: "My topics",
    unsubscribeTopicTitle: "Unfollow topic",
    discussingNow: "What Telegram is discussing now",
    today: "today",
    mentions: "mentions",
    sources: "sources",
    telegramAttention: "Telegram Attention",
    now: "now",
    followTopic: "Follow this topic",
    unfollowTopic: "Unfollow this topic",
    whyGrows: "Why this topic is growing",
    whyFalls: "Why this topic is fading",
    whyLineSources: "the topic was picked up by {count} sources at once;",
    whyLineActivityUp: "latest posts are accelerating attention;",
    whyLineActivityDown: "latest posts are cooling attention down;",
    whyLineRelated: "most often appears near: {chips}.",
    whoFormsAttention: "Who shapes attention",
    noSignals: "No signals for this query yet.",
    fullAccess: "Full access to the attention index",
    follow: "Follow",
    unsubscribe: "✓ Unfollow",
    explore: "Explore",
  },
  cn: {
    all: "全部",
    back: "返回",
    loading: "正在加载 Telegram 信号...",
    searchPlaceholder: "按主题、品牌、事件搜索...",
    clearSearch: "清除",
    more: "更多",
    hide: "收起",
    myTopics: "我的主题",
    unsubscribeTopicTitle: "取消关注主题",
    discussingNow: "Telegram 正在讨论什么",
    today: "今天",
    mentions: "提及",
    sources: "来源",
    telegramAttention: "Telegram Attention",
    now: "现在",
    followTopic: "关注主题",
    unfollowTopic: "取消关注主题",
    whyGrows: "为什么这个主题在增长",
    whyFalls: "为什么这个主题在减弱",
    whyLineSources: "该主题同时被 {count} 个来源提及；",
    whyLineActivityUp: "最新发布正在加速关注；",
    whyLineActivityDown: "最新发布正在降低关注；",
    whyLineRelated: "最常一起出现：{chips}.",
    whoFormsAttention: "谁在形成关注",
    noSignals: "此搜索暂时没有信号。",
    fullAccess: "完整访问关注指数",
    follow: "关注",
    unsubscribe: "✓ 取消",
    explore: "探索",
  },
  my: {
    all: "Semua",
    back: "Kembali",
    loading: "Memuatkan isyarat Telegram...",
    searchPlaceholder: "Cari topik, jenama, acara...",
    clearSearch: "Kosongkan",
    more: "Lagi",
    hide: "Sembunyi",
    myTopics: "Topik saya",
    unsubscribeTopicTitle: "Berhenti ikut topik",
    discussingNow: "Apa yang dibincangkan di Telegram sekarang",
    today: "hari ini",
    mentions: "sebutan",
    sources: "sumber",
    telegramAttention: "Telegram Attention",
    now: "sekarang",
    followTopic: "Ikut topik",
    unfollowTopic: "Berhenti ikut topik",
    whyGrows: "Mengapa topik ini naik",
    whyFalls: "Mengapa topik ini reda",
    whyLineSources: "topik ini diangkat oleh {count} sumber serentak;",
    whyLineActivityUp: "siaran terkini mempercepat perhatian;",
    whyLineActivityDown: "siaran terkini meredakan perhatian;",
    whyLineRelated: "paling kerap muncul bersama: {chips}.",
    whoFormsAttention: "Siapa membentuk perhatian",
    noSignals: "Belum ada isyarat untuk carian ini.",
    fullAccess: "Akses penuh ke indeks perhatian",
    follow: "Ikut",
    unsubscribe: "✓ Berhenti",
    explore: "Teroka",
  },
};

function getTrendsCopy(locale: Locale) {
  return TRENDS_COPY[locale] || TRENDS_COPY.us;
}

function formatCopy(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template
  );
}


const CATEGORY_TOPICS: Record<string, TrendItem[]> = {
  all: [
    trend("Bitcoin ETF", 12500, 178, 45, "finance", ["CoinDesk", "CryptoRank", "Whale Alert"]),
    trend("Погода Москва сегодня", 9200, -9, 31, "news", ["Москва Live", "Новости Москвы"]),
    trend("Акции Tesla", 214000, -214, 94, "business", ["Bloomberg", "Market Watch"]),
    trend("OpenAI", 7600, 68, 52, "technology", ["TechCrunch", "The Verge", "AI News"]),
    trend("Спартак", 6100, 42, 28, "sports", ["Матч ТВ", "Чемпионат"]),
  ],
  news: [
    trend("Погода Москва сегодня", 9200, -9, 31, "news", ["Москва Live", "Новости Москвы"]),
    trend("Срочные новости", 8700, 54, 66, "news", ["РИА", "Mash", "112"]),
    trend("Регионы России", 5200, 21, 39, "news", ["Местные новости", "Город Live"]),
  ],
  politics: [
    trend("Иран", 12600, 164, 72, "politics", ["BBC", "Reuters", "DW"]),
    trend("Трамп", 9800, 78, 63, "politics", ["CNN", "Fox News", "Политика"]),
    trend("Украина", 14300, 52, 88, "politics", ["Украина Сейчас", "BBC"]),
  ],
  economy: [
    trend("Курс доллара", 15400, 88, 74, "economy", ["РБК", "Коммерсантъ"]),
    trend("Нефть", 7100, 41, 33, "economy", ["Bloomberg", "Рынки"]),
    trend("Инфляция", 5600, 19, 28, "economy", ["Экономика", "Forbes"]),
  ],
  business: [
    trend("Вкусно и точка", 4800, 178, 45, "business", ["Бизнес FM", "РБК"]),
    trend("Маркетплейсы", 9300, 64, 51, "business", ["Ecom News", "Retail"]),
    trend("Стартапы", 3900, 36, 26, "business", ["VC", "Startups"]),
  ],
  finance: [
    trend("Bitcoin ETF", 12500, 178, 45, "finance", ["CoinDesk", "CryptoRank", "Whale Alert"]),
    trend("Сбербанк", 8100, 55, 41, "finance", ["Банки.ру", "РБК"]),
    trend("TON", 7200, 121, 58, "finance", ["TON Community", "Crypto News"]),
  ],
  technology: [
    trend("OpenAI", 7600, 68, 52, "technology", ["TechCrunch", "The Verge", "AI News"]),
    trend("NVIDIA", 6900, 84, 47, "technology", ["The Verge", "Bloomberg"]),
    trend("iPhone 18", 4300, 31, 35, "technology", ["Apple Media", "MacRumors"]),
  ],
  science: [
    trend("Муравьи", 3600, 44, 20, "science", ["Факт дня", "Наука"]),
    trend("Космос", 4100, 26, 31, "science", ["NASA", "Космос"]),
    trend("Новые открытия", 2900, 18, 24, "science", ["Science", "Популярная наука"]),
  ],
  education: [
    trend("Курсы за 1000$", 5200, 37, 27, "education", ["GeekBrains", "Образование"]),
    trend("Фриланс", 4700, 58, 34, "education", ["Где деньги", "Career"]),
    trend("Английский", 3100, 15, 22, "education", ["Languages", "Study"]),
  ],
  culture: [
    trend("История игрушек 5", 8300, 112, 49, "culture", ["Фильмы и Сериалы", "Кинопоиск"]),
    trend("Новый сериал", 4200, 36, 24, "culture", ["Кино", "Series"]),
    trend("Музыка", 3700, 22, 19, "culture", ["Music News", "Афиша"]),
  ],
  gaming: [
    trend("Инди-игры", 6800, 92, 38, "gaming", ["DTF", "Игры"]),
    trend("GTA 6", 9500, 71, 62, "gaming", ["Игромания", "DTF"]),
    trend("Steam", 5400, 33, 41, "gaming", ["PC Gaming", "Steam News"]),
  ],
  sports: [
    trend("Спартак", 6100, 42, 28, "sports", ["Матч ТВ", "Чемпионат"]),
    trend("Лига чемпионов", 7300, 39, 36, "sports", ["Sports.ru", "Футбол"]),
    trend("Месси", 5100, 25, 30, "sports", ["Football", "Чемпионат"]),
  ],
  health: [
    trend("Здоровье", 4400, 24, 25, "health", ["Медицина", "Health"]),
    trend("Питание", 3900, 31, 20, "health", ["Nutrition", "ЗОЖ"]),
    trend("Тренировки", 2800, 17, 16, "health", ["Fitness", "Спорт"]),
  ],
  travel: [
    trend("Турция", 5900, 61, 35, "travel", ["Travel", "Авиасейлс"]),
    trend("Виза", 4700, 22, 28, "travel", ["Путешествия", "Visa"]),
    trend("Отели", 2600, 14, 15, "travel", ["Hotels", "Travel"]),
  ],
  food: [
    trend("Рецепты", 6300, 48, 29, "food", ["Быстрые рецепты", "Еда"]),
    trend("Картошка с мясом", 4200, 74, 18, "food", ["Рецепты", "Кухня"]),
    trend("Доставка еды", 3500, 21, 22, "food", ["Delivery", "Еда"]),
  ],
  auto: [
    trend("Tesla", 214000, -214, 94, "auto", ["Bloomberg", "Market Watch"]),
    trend("АвтоВАЗ", 4800, 35, 27, "auto", ["Авто", "Cars"]),
    trend("Электромобили", 3900, 29, 20, "auto", ["EV News", "Auto"]),
  ],
  nature: [
    trend("Жуки-носороги", 3200, 86, 22, "nature", ["Двач", "Факт дня"]),
    trend("Птицы", 2800, 32, 17, "nature", ["Nature", "Животные"]),
    trend("Капибары", 2400, 44, 15, "nature", ["Animals", "Мемы"]),
  ],
  marketing: [
    trend("Прогревы", 3600, 43, 19, "marketing", ["SMM", "Маркетинг"]),
    trend("Реклама в Telegram", 5200, 58, 30, "marketing", ["Telegram Ads", "SMM"]),
    trend("Офферы", 3100, 26, 16, "marketing", ["Marketing", "Бизнес"]),
  ],
  startups: [
    trend("AI стартапы", 4600, 65, 34, "startups", ["VC", "Startups"]),
    trend("Раунд инвестиций", 3900, 38, 25, "startups", ["CryptoRank", "Founders"]),
    trend("Фаундеры", 2500, 18, 14, "startups", ["Founder", "Бизнес"]),
  ],
};

function trend(
  topic: string,
  mentions: number,
  momentum: number,
  sourceCount: number,
  category: string,
  sourceTitles: string[]
): TrendItem {
  return {
    topic,
    mentions,
    momentum,
    change: `${momentum > 0 ? "+" : ""}${momentum}%`,
    sourceCount,
    category,
    countries: [{ code: "ru", mentions }],
    topSources: sourceTitles.map((title, index) => ({
      id: `${topic}-${index}`,
      title,
      username: makeDemoHandle(title),
      mentions: Math.max(3, sourceCount - index * 7),
    })),
  };
}

function makeDemoHandle(title: string) {
  const explicit: Record<string, string> = {
    "Москва Live": "moskva_live",
    "Новости Москвы": "moscowmap",
    "Bloomberg": "bloomberg",
    "Market Watch": "marketwatch",
    "CoinDesk": "coindesk",
    "CryptoRank": "cryptorank_io",
    "Whale Alert": "whale_alert",
    "TechCrunch": "techcrunch",
    "The Verge": "verge",
    "AI News": "artificial_intelligence_news",
    "Матч ТВ": "match_tv",
    "Чемпионат": "championat",
    "DTF": "dtfbest",
    "Игры": "games",
  };

  if (explicit[title]) return explicit[title];

  return title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32) || "margelet";
}

function readFollowedTopics() {
  try {
    const raw = localStorage.getItem(FOLLOWED_TOPICS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function writeFollowedTopics(value: string[]) {
  try {
    localStorage.setItem(FOLLOWED_TOPICS_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore localStorage errors
  }
}

function getTopic(trend: TrendItem) {
  return trend.topic || trend.word || "Unknown topic";
}

function normalizeTopic(value: string) {
  return value.trim().toLowerCase();
}

function getMomentumNumber(trend: TrendItem) {
  if (typeof trend.momentum === "number") return trend.momentum;
  const parsed = Number(String(trend.change || "0").replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value: number) {
  if (value >= 1_000_000) return `${Math.round(value / 100_000) / 10}M`;
  if (value >= 1_000) return `${Math.round(value / 100) / 10}K`;
  return String(value);
}

function getChips(topic: string) {
  return topic.split(/\s+/).filter(Boolean).slice(0, 5);
}

function getTrendEmoji(topic: string, category?: string) {
  const text = `${topic} ${category || ""}`.toLowerCase();

  if (text.includes("bitcoin") || text.includes("btc") || text.includes("крип")) return "₿";
  if (text.includes("tesla") || text.includes("авто") || text.includes("машин")) return "🚗";
  if (text.includes("openai") || text.includes("ai") || text.includes("gpt") || text.includes("ии")) return "🤖";
  if (text.includes("погод")) return "🌦️";
  if (text.includes("игр") || text.includes("steam") || text.includes("gta")) return "🎮";
  if (text.includes("спорт") || text.includes("спартак") || text.includes("футбол")) return "⚽";
  if (text.includes("еда") || text.includes("рецепт") || text.includes("картош")) return "🍕";
  if (text.includes("жук") || text.includes("мурав") || text.includes("живот") || text.includes("птиц")) return "🐾";
  if (text.includes("кино") || text.includes("сериал") || text.includes("игрушек")) return "🎬";
  if (text.includes("полит") || text.includes("трамп") || text.includes("иран")) return "🏛️";
  if (text.includes("финанс") || text.includes("банк") || text.includes("доллар")) return "💰";
  if (text.includes("наук") || text.includes("космос")) return "🔬";
  if (text.includes("travel") || text.includes("турц") || text.includes("виза")) return "🧳";

  const group = SITE_TAG_GROUPS.find((item) => item.value === category);
  return group?.emoji || "🔥";
}

function getTrendCategory(topic: string, fallback = "all") {
  const text = topic.toLowerCase();
  if (text.includes("bitcoin") || text.includes("btc") || text.includes("ton") || text.includes("сбер") || text.includes("банк")) return "finance";
  if (text.includes("tesla") || text.includes("авто")) return "auto";
  if (text.includes("openai") || text.includes("nvidia") || text.includes("iphone") || text.includes("ai")) return "technology";
  if (text.includes("спартак") || text.includes("лига") || text.includes("месси")) return "sports";
  if (text.includes("погод") || text.includes("новост")) return "news";
  if (text.includes("игр") || text.includes("steam") || text.includes("gta")) return "gaming";
  if (text.includes("еда") || text.includes("рецепт") || text.includes("картош")) return "food";
  return fallback;
}

function getSourceHandle(source: TrendSource) {
  const username = String(source.username || "").replace(/^@+/, "").trim();
  if (username) return username;

  const id = String(source.id || "").replace(/^@+/, "").trim();
  if (id && !/\s/.test(id) && !/^.+-\d+$/.test(id)) return id;

  return makeDemoHandle(source.title);
}

function getSourceUrl(source: TrendSource) {
  const handle = getSourceHandle(source);
  return handle ? `https://www.margelet.space/${handle}` : "";
}

function getTelegramAvatarUrl(source: TrendSource) {
  const handle = getSourceHandle(source);
  return handle ? `https://t.me/i/userpic/320/${handle}.jpg` : "";
}

function SourceAvatar({
  source,
  size = "sm",
}: {
  source: TrendSource;
  size?: "sm" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-11 w-11 text-sm" : "h-7 w-7 text-[10px]";
  const fallback = source.title.slice(0, 1).toUpperCase();
  const avatarUrl = source.avatarUrl || getTelegramAvatarUrl(source);

  return (
    <div
      className={`${sizeClass} grid shrink-0 place-items-center overflow-hidden rounded-full border border-[color:var(--bg-app)] bg-surface-soft font-black text-primary`}
      title={source.title}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full rounded-full object-cover"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        fallback
      )}
    </div>
  );
}

function SourceDots({ sources = [] }: { sources?: TrendSource[] }) {
  const visible = sources.slice(0, 4);

  return (
    <div className="flex -space-x-2">
      {visible.length ? (
        visible.map((source, index) => (
          <SourceAvatar key={`${source.title}-${index}`} source={source} />
        ))
      ) : null}
    </div>
  );
}

function MiniAttentionChart({
  isUp,
  mentions,
  copy,
}: {
  isUp: boolean;
  mentions: number;
  copy: TrendsCopy;
}) {
  const values = isUp
    ? [0.14, 0.2, 0.3, 0.43, 0.6, 0.78, 1]
    : [1, 0.9, 0.76, 0.55, 0.4, 0.26, 0.12];

  const plotLeft = 42;
  const plotTop = 18;
  const plotWidth = 286;
  const plotHeight = 82;
  const step = plotWidth / (values.length - 1);

  const points = values
    .map((value, index) => {
      const x = plotLeft + index * step;
      const y = plotTop + plotHeight - value * plotHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const activeValue = formatNumber(mentions);
  const midValue = formatNumber(Math.max(1, Math.round(mentions * 0.5)));
  const lowValue = formatNumber(Math.max(1, Math.round(mentions * 0.18)));
  const activeX = plotLeft + (values.length - 1) * step;
  const activeY = plotTop + plotHeight - values[values.length - 1] * plotHeight;
  const lineClass = isUp ? "stroke-emerald-500" : "stroke-red-500";
  const labelClass = isUp ? "text-emerald-500" : "text-red-500";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-soft bg-app px-3 pb-3 pt-3">
      <div className="mb-2 flex items-center justify-between text-[11px] text-secondary">
        <span>48h</span>
        <span className={`font-black ${labelClass}`}>{copy.now} · {activeValue}</span>
      </div>

      <svg viewBox="0 0 344 132" className="h-34 min-h-[136px] w-full overflow-visible">
        {[plotTop, plotTop + plotHeight / 2, plotTop + plotHeight].map((y, index) => (
          <g key={y}>
            <text
              x="0"
              y={y + 4}
              fill="currentColor"
              className="text-[10px] font-bold text-secondary"
            >
              {index === 0 ? activeValue : index === 1 ? midValue : lowValue}
            </text>
            <line
              x1={plotLeft}
              x2={plotLeft + plotWidth}
              y1={y}
              y2={y}
              className="stroke-[color:var(--border-soft)]"
              strokeWidth="1"
            />
          </g>
        ))}

        {["48h", "36h", "24h", "12h", copy.now].map((label, index) => {
          const x = index === 4
            ? plotLeft + plotWidth
            : plotLeft + (plotWidth / 4) * index;

          return (
            <text
              key={label}
              x={x}
              y="126"
              textAnchor={index === 0 ? "start" : index === 4 ? "end" : "middle"}
              fill="currentColor"
              className="text-[10px] font-bold text-secondary"
            >
              {label}
            </text>
          );
        })}

        <polyline
          points={points}
          fill="none"
          className={lineClass}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle
          cx={activeX}
          cy={activeY}
          r="6"
          className={lineClass.replace("stroke", "fill")}
          opacity="0.18"
        />

        <circle
          cx={activeX}
          cy={activeY}
          r="7"
          className={lineClass.replace("stroke", "fill")}
          opacity="0.28"
        >
          <animate
            attributeName="r"
            values="7;18"
            dur="2.8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.28;0"
            dur="2.8s"
            repeatCount="indefinite"
          />
        </circle>

        <circle
          cx={activeX}
          cy={activeY}
          r="7"
          className={lineClass.replace("stroke", "fill")}
          opacity="0.18"
        >
          <animate
            attributeName="r"
            values="7;24"
            begin="1.4s"
            dur="2.8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.2;0"
            begin="1.4s"
            dur="2.8s"
            repeatCount="indefinite"
          />
        </circle>

        <circle
          cx={activeX}
          cy={activeY}
          r="5.2"
          className="fill-white"
        />

        <circle
          cx={activeX}
          cy={activeY}
          r="2"
          className={lineClass.replace("stroke", "fill")}
        />

        <text
          x={activeX - 8}
          y={activeY - 13}
          textAnchor="end"
          fill="currentColor"
          className={`text-[10px] font-black ${labelClass}`}
        >
          {activeValue}
        </text>
      </svg>
    </div>
  );
}


function TrendDetail({
  trend,
  followed,
  onBack,
  onToggleFollow,
  copy,
}: {
  trend: TrendItem;
  followed: boolean;
  onBack: () => void;
  onToggleFollow: () => void;
  copy: TrendsCopy;
}) {
  const topic = getTopic(trend);
  const momentum = getMomentumNumber(trend);
  const isUp = momentum >= 0;
  const sourceCount = trend.sourceCount || trend.topSources?.length || 0;
  const chips = getChips(topic);
  const emoji = getTrendEmoji(topic, trend.category);
  const sourcesRef = useRef<HTMLElement | null>(null);
  const topSources = trend.topSources || [];

  const scrollToSources = () => {
    sourcesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto max-w-[570px] px-4 pb-28 pt-3">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-2 rounded-full border border-soft bg-surface px-3 py-2 text-sm font-bold text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        {copy.back}
      </button>

      <section className="rounded-[30px] border border-soft bg-surface p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surface-soft text-2xl font-black text-primary">
            {emoji}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-400">
              {copy.telegramAttention}
            </div>
            <h2 className="mt-1 text-2xl font-black leading-tight text-primary">
              {topic}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className={isUp ? "font-bold text-emerald-500" : "font-bold text-red-500"}>
                {isUp ? "↗" : "↘"} {String(trend.change).replace("+", "")}
              </span>
              <span className="text-secondary">·</span>
              <span className="text-secondary">{sourceCount} {copy.sources}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-3xl border border-soft bg-app px-3 py-3">
          <div>
            <div className="text-[11px] text-secondary">{copy.mentions}</div>
            <div className="mt-1 text-xl font-black text-primary">{formatNumber(trend.mentions)}</div>
          </div>

          <button
            type="button"
            onClick={scrollToSources}
            className="flex items-center gap-2 rounded-2xl bg-surface-soft px-2 py-2 text-left transition hover:bg-surface"
          >
            <div className="flex -space-x-2">
              {topSources.slice(0, 3).map((source, index) => (
                <SourceAvatar key={`${source.title}-${index}`} source={source} />
              ))}
            </div>
            <div className="text-right">
              <div className="text-[11px] text-secondary">{copy.sources}</div>
              <div className="text-sm font-black text-primary">{sourceCount}</div>
            </div>
          </button>
        </div>

        <div className="mt-4">
          <MiniAttentionChart isUp={isUp} mentions={trend.mentions} copy={copy} />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {chips.map((chip) => (
            <span
              key={chip}
              className="shrink-0 rounded-full border border-soft bg-app px-3 py-1.5 text-xs text-secondary"
            >
              {chip}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={onToggleFollow}
          className={[
            "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition hover:opacity-90",
            followed
              ? "border-red-500/20 bg-red-500/10 text-red-500"
              : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
          ].join(" ")}
        >
          {followed ? <Check className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          {followed ? copy.unfollowTopic : copy.followTopic}
        </button>
      </section>

      <section className="mt-5 border-t border-soft pt-4">
        <h3 className="text-lg font-black text-primary">{isUp ? copy.whyGrows : copy.whyFalls}</h3>
        <div className="mt-3 space-y-2 text-sm leading-6 text-secondary">
          <p>• {formatCopy(copy.whyLineSources, { count: sourceCount })}</p>
          <p>• {isUp ? copy.whyLineActivityUp : copy.whyLineActivityDown}</p>
          <p>• {formatCopy(copy.whyLineRelated, { chips: chips.join(", ") })}</p>
        </div>
      </section>

      <section ref={sourcesRef} id="trend-sources" className="mt-5 border-t border-soft pt-4 scroll-mt-20">
        <h3 className="text-lg font-black text-primary">{copy.whoFormsAttention}</h3>
        <div className="mt-3 space-y-2">
          {(trend.topSources || []).slice(0, 6).map((source, index) => {
            const url = getSourceUrl(source);
            const content = (
              <>
                <div className="flex min-w-0 items-center gap-3">
                  <SourceAvatar source={source} size="lg" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black text-primary">{source.title}</div>
                    {getSourceHandle(source) ? (
                      <div className="truncate text-xs text-secondary">@{getSourceHandle(source)}</div>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0 rounded-full bg-app px-2.5 py-1 text-xs font-black text-secondary">
                  {source.mentions}
                </div>
              </>
            );

            if (url) {
              return (
                <a
                  key={`${source.title}-${index}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-soft bg-surface-soft px-3 py-2 no-underline transition hover:bg-app"
                >
                  {content}
                </a>
              );
            }

            return (
              <div
                key={`${source.title}-${index}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-soft bg-surface-soft px-3 py-2"
              >
                {content}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TrendRow({
  trend,
  opened,
  followed,
  onToggle,
  onOpenDetail,
  onToggleFollow,
  showSourceCount,
  copy,
}: {
  trend: TrendItem;
  opened: boolean;
  followed: boolean;
  onToggle: () => void;
  onOpenDetail: () => void;
  onToggleFollow: () => void;
  showSourceCount: boolean;
  copy: TrendsCopy;
}) {
  const topic = getTopic(trend);
  const momentum = getMomentumNumber(trend);
  const isUp = momentum >= 0;
  const chips = getChips(topic);
  const sourceCount = trend.sourceCount || trend.topSources?.length || 0;
  const emoji = getTrendEmoji(topic, trend.category);

  return (
    <article className="overflow-hidden rounded-[26px] border border-soft bg-surface shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-3 text-left"
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface-soft text-xl font-black text-primary">
          {emoji}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-black text-primary">{topic}</div>

          <div className="mt-1 flex items-center gap-1.5 text-xs whitespace-nowrap">
            <span className={isUp ? "font-black text-emerald-500" : "font-black text-red-500"}>
              {formatNumber(trend.mentions)}
            </span>

            <Search className="h-3.5 w-3.5 text-secondary" />
            {showSourceCount ? (
              <>
                <span className="text-secondary">·</span>
                <span className="text-secondary">{sourceCount} {copy.sources}</span>
              </>
            ) : null}
          </div>
        </div>

        <div
          className={[
            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
            isUp ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500",
          ].join(" ")}
        >
          {opened ? (
            <ChevronDown className="h-6 w-6" />
          ) : Math.abs(momentum) >= 100 ? (
            isUp ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownRight className="h-6 w-6" />
          ) : (
            isUp ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />
          )}
        </div>
      </button>

      {opened ? (
        <div className="border-t border-soft px-3 pb-3 pt-3">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {chips.map((chip) => (
              <span
                key={chip}
                className="shrink-0 rounded-full border border-soft bg-app px-3 py-1 text-xs text-secondary"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <SourceDots sources={trend.topSources} />
              <div className="text-base font-black text-primary">{sourceCount}</div>
            </div>

            <div
              className={[
                "text-sm font-black",
                isUp ? "text-emerald-500" : "text-red-500",
              ].join(" ")}
            >
              {formatNumber(trend.mentions)} {copy.mentions}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleFollow();
              }}
              className={[
                "rounded-2xl border px-4 py-3 text-sm font-black transition hover:opacity-90",
                followed
                  ? "border-red-500/20 bg-red-500/10 text-red-500"
                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
              ].join(" ")}
            >
              {followed ? copy.unsubscribe : copy.follow}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onOpenDetail();
              }}
              className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-white transition hover:opacity-90"
            >
              {copy.explore}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}

function buildCategories(locale: Locale, copy: TrendsCopy): TrendCategory[] {
  const groupsByValue = new Map<string, SiteTagGroup>();

  for (const group of SITE_TAG_GROUPS) {
    groupsByValue.set(group.value, group);
  }

  const categories: TrendCategory[] = [
    { value: "all", emoji: "🔥", label: copy.all },
  ];

  for (const value of FEATURED_CATEGORY_VALUES) {
    if (value === "all") continue;
    const group = groupsByValue.get(value);
    if (!group) continue;
    categories.push({
      value: group.value,
      emoji: group.emoji,
      label: stripCategoryEmoji(getTagLabel(group, locale)),
    });
  }

  return categories;
}

export function TrendsView({
  countryCode = "ru",
  locale = "ru",
}: {
  countryCode?: string;
  locale?: Locale;
}) {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [followedTopicsExpanded, setFollowedTopicsExpanded] = useState(false);
  const [openedTopic, setOpenedTopic] = useState<string | null>(null);
  const [activeTrend, setActiveTrend] = useState<TrendItem | null>(null);
  const [followedTopics, setFollowedTopics] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readFollowedTopics()
  );
  const copy = getTrendsCopy(locale);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await fetch(`/api/v1?action=trends&country=${countryCode}`);
        const data = await res.json();

        if (data.ok && Array.isArray(data.trends) && data.trends.length) {
          const next = data.trends.map((item: TrendItem) => ({
            ...item,
            category: item.category || getTrendCategory(getTopic(item)),
          }));
          setTrends(next);
        } else {
          setTrends(CATEGORY_TOPICS.all);
        }
      } catch (err) {
        console.error("Failed to fetch trends", err);
        setTrends(CATEGORY_TOPICS.all);
      } finally {
        setLoading(false);
      }
    }

    fetchTrends();
  }, [countryCode]);

  useEffect(() => {
    writeFollowedTopics(followedTopics);
  }, [followedTopics]);

  const categories = useMemo(() => buildCategories(locale, copy), [locale, copy]);
  const visibleCategories = categoriesExpanded ? categories : categories.slice(0, 5);
  const visibleFollowedTopics = followedTopicsExpanded
    ? followedTopics
    : followedTopics.slice(0, 2);

  const categoryTrends = useMemo(() => {
    const demo = CATEGORY_TOPICS[selectedCategory] || [];
    const normalizedQuery = query.trim().toLowerCase();

    let list = selectedCategory === "all"
      ? trends.length
        ? trends
        : CATEGORY_TOPICS.all
      : [
          ...trends.filter((item) => (item.category || getTrendCategory(getTopic(item))) === selectedCategory),
          ...demo,
        ];

    const seen = new Set<string>();
    list = list.filter((item) => {
      const key = normalizeTopic(getTopic(item));
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (normalizedQuery) {
      list = list.filter((item) =>
        [getTopic(item), item.category, ...(item.topSources || []).map((source) => source.title)]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      );
    }

    return list.slice(0, 20);
  }, [trends, selectedCategory, query]);

  const toggleFollow = (topic: string) => {
    const key = normalizeTopic(topic);
    setFollowedTopics((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]
    );
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-secondary">
        {copy.loading}
      </div>
    );
  }

  if (activeTrend) {
    const topic = getTopic(activeTrend);
    const followed = followedTopics.includes(normalizeTopic(topic));

    return (
      <TrendDetail
        trend={activeTrend}
        followed={followed}
        onBack={() => setActiveTrend(null)}
        onToggleFollow={() => toggleFollow(topic)}
        copy={copy}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[570px] px-4 pb-36 pt-3">
      <form
        className="relative mb-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.searchPlaceholder}
          className="w-full rounded-2xl border border-soft bg-surface py-3 pl-11 pr-12 text-sm text-primary outline-none placeholder:text-secondary focus:border-[color:var(--border-strong)]"
        />

        {query.trim() ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition hover:bg-surface-soft hover:text-primary"
            aria-label={copy.clearSearch}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </form>

      <div className="mb-4">
        <div className="grid grid-cols-6 gap-2">
          {visibleCategories.map((category) => {
            const active = selectedCategory === category.value;

            return (
              <button
                key={category.value}
                type="button"
                onClick={() => {
                  setSelectedCategory(category.value);
                  setOpenedTopic(null);
                }}
                className="min-w-0 text-center"
              >
                <div
                  className={[
                    "mx-auto grid h-11 w-11 place-items-center rounded-full border text-lg font-black shadow-sm transition",
                    active
                      ? "border-[color:var(--text-primary)] bg-[color:var(--text-primary)] text-[color:var(--bg-app)]"
                      : "border-soft bg-surface text-primary hover:bg-surface-soft",
                  ].join(" ")}
                >
                  {category.emoji}
                </div>
                <div
                  className={[
                    "mt-1 truncate text-[10px] font-semibold leading-tight",
                    active ? "text-primary" : "text-secondary",
                  ].join(" ")}
                >
                  {category.label}
                </div>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setCategoriesExpanded((prev) => !prev)}
            className="min-w-0 text-center"
          >
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-soft bg-surface text-primary shadow-sm transition hover:bg-surface-soft">
              <ChevronDown
                className={[
                  "h-5 w-5 transition-transform",
                  categoriesExpanded ? "rotate-180" : "",
                ].join(" ")}
              />
            </div>
            <div className="mt-1 truncate text-[10px] font-semibold leading-tight text-secondary">
              {categoriesExpanded ? copy.hide : copy.more}
            </div>
          </button>
        </div>
      </div>

      {followedTopics.length ? (
        <div className="mb-4 rounded-[24px] border border-soft bg-surface px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-secondary">
              <Eye className="h-3.5 w-3.5" />
              {copy.myTopics}
            </div>

            {followedTopics.length > 2 ? (
              <button
                type="button"
                onClick={() => setFollowedTopicsExpanded((prev) => !prev)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-soft bg-surface-soft text-secondary transition hover:bg-app hover:text-primary"
                aria-label={followedTopicsExpanded ? copy.hide : copy.more}
                title={followedTopicsExpanded ? copy.hide : copy.more}
              >
                <ChevronDown
                  className={[
                    "h-4 w-4 transition-transform",
                    followedTopicsExpanded ? "rotate-180" : "",
                  ].join(" ")}
                />
              </button>
            ) : null}
          </div>

          <div
            className={[
              followedTopicsExpanded
                ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
                : "flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            ].join(" ")}
          >
            {visibleFollowedTopics.map((topic) => {
              const trend = categoryTrends.find((item) => normalizeTopic(getTopic(item)) === topic) ||
                trends.find((item) => normalizeTopic(getTopic(item)) === topic) ||
                CATEGORY_TOPICS.all.find((item) => normalizeTopic(getTopic(item)) === topic);

              return (
                <div
                  key={topic}
                  className="inline-flex min-w-0 items-center gap-2 rounded-full border border-soft bg-surface-soft py-1 pl-2 pr-1.5 text-xs font-bold text-primary"
                >
                  {trend?.topSources?.length ? <SourceDots sources={trend.topSources} /> : <span>🔥</span>}
                  <span className="max-w-[150px] truncate">{topic}</span>

                  <button
                    type="button"
                    onClick={() => toggleFollow(topic)}
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-secondary transition hover:bg-app hover:text-primary"
                    title={copy.unsubscribeTopicTitle}
                    aria-label={copy.unsubscribeTopicTitle}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mb-3">
        {(() => {
          const activeCategory = categories.find((item) => item.value === selectedCategory) || categories[0];
          const totalMentions = categoryTrends.reduce((sum, item) => sum + item.mentions, 0);
          const title = selectedCategory === "all"
            ? copy.discussingNow
            : `${activeCategory.label} +${formatNumber(totalMentions)} ${copy.today}`;

          return (
            <h2 className="text-xl font-black text-primary">
              {activeCategory.emoji} {title}
            </h2>
          );
        })()}
      </div>

      <section className="space-y-3">
        {categoryTrends.map((trend) => {
          const topic = getTopic(trend);
          const followed = followedTopics.includes(normalizeTopic(topic));

          return (
            <TrendRow
              key={`${trend.category || "all"}-${topic}`}
              trend={trend}
              opened={openedTopic === topic}
              followed={followed}
              onToggle={() =>
                setOpenedTopic((current) => (current === topic ? null : topic))
              }
              onOpenDetail={() => setActiveTrend(trend)}
              onToggleFollow={() => toggleFollow(topic)}
              showSourceCount={selectedCategory !== "all"}
              copy={copy}
            />
          );
        })}
      </section>

      {!categoryTrends.length ? (
        <div className="rounded-[26px] border border-soft bg-surface px-5 py-8 text-center text-sm text-secondary">
          {copy.noSignals}
        </div>
      ) : null}

      <button className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-32px)] max-w-[538px] -translate-x-1/2 rounded-2xl bg-[color:var(--text-primary)] px-5 py-4 text-base font-black text-[color:var(--bg-app)] shadow-soft transition hover:opacity-90">
        {copy.fullAccess}
      </button>
    </div>
  );
}
