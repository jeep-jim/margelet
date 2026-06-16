import type { Locale } from "../../types/app";

export type SpaceCopy = {
  searchPlaceholder: string;
  find: string;
  clearSearch: string;
  closeSearch: string;
  searchHint: string;
  authHint: string;
  releaseThought: string;
  newThought: string;
  local: string;
  pullSimilar: string;
  demoHint: string;
  localReply: string;
  deleteSignal: string;
  noticed: string;
  forceTitle: string;
  forceIntro: string;
  forceBody: string;
  forceFooter: string;
  yoda: string;
  kind: Record<string, string>;
};

const EN: SpaceCopy = {
  searchPlaceholder: "Search intentions...",
  find: "find",
  clearSearch: "Clear search",
  closeSearch: "Close search",
  searchHint: "Press Enter/Find. Space highlights spheres on the map — tap a sphere to open it.",
  authHint: "Sign in with Telegram to see yourself and release your own signal.",
  releaseThought: "release thought",
  newThought: "New thought",
  local: "local",
  pullSimilar: "pull similar",
  demoHint: "This is a demo magnet. Your thoughts and replies are stored only on this device.",
  localReply: "local reply...",
  deleteSignal: "delete my signal",
  noticed: "space has noticed you",
  forceTitle: "A long time ago, in a nearby galaxy...",
  forceIntro: "people wanted to be independent from endless feeds.",
  forceBody: "Space is a living map of intentions. Not posts. Not ratings. Just short human signals: I want, I can, I am looking, I can help. Release a thought, drift through the galaxy, and let close meanings find each other.",
  forceFooter: "May the signal be with you.",
  yoda: "Wise sphere says: do not scroll the world — drift through it.",
  kind: {
    want: "want",
    ask: "ask",
    buy: "buy",
    talk: "discuss",
    help: "help",
    sell: "sell",
  },
};

const RU: SpaceCopy = {
  searchPlaceholder: "Поиск намерений...",
  find: "найти",
  clearSearch: "Стереть поиск",
  closeSearch: "Закрыть поиск",
  searchHint: "Enter/Найти подсветит шары на карте. Тапни шар, чтобы раскрыть.",
  authHint: "Авторизуйся через Telegram, чтобы увидеть себя и создать свой сигнал.",
  releaseThought: "выпустить мысль",
  newThought: "Новая мысль",
  local: "локально",
  pullSimilar: "притянуть похожее",
  demoHint: "Это демо-магнит. Свои мысли и ответы хранятся только на этом устройстве.",
  localReply: "локальный ответ...",
  deleteSignal: "удалить мой сигнал",
  noticed: "space заметил вас",
  forceTitle: "Давным-давно, в близкой галактике...",
  forceIntro: "люди хотели быть независимыми от бесконечных лент.",
  forceBody: "Space — живая карта намерений. Не посты. Не рейтинги. Только короткие человеческие сигналы: хочу, могу, ищу, помогу. Выпусти мысль, дрейфуй по галактике и позволь близким смыслам найти друг друга.",
  forceFooter: "Да пребудет с тобой сигнал.",
  yoda: "Мудрая сфера говорит: мир не скроль — по нему дрейфуй.",
  kind: {
    want: "хочу",
    ask: "спросить",
    buy: "куплю",
    talk: "обсудить",
    help: "помогу",
    sell: "продам",
  },
};

const UA: SpaceCopy = {
  ...RU,
  searchPlaceholder: "Пошук намірів...",
  find: "знайти",
  authHint: "Увійди через Telegram, щоб побачити себе і створити свій сигнал.",
  releaseThought: "випустити думку",
  newThought: "Нова думка",
  local: "локально",
  pullSimilar: "притягнути схоже",
  demoHint: "Це демо-магніт. Твої думки та відповіді зберігаються тільки на цьому пристрої.",
  localReply: "локальна відповідь...",
  deleteSignal: "видалити мій сигнал",
  forceFooter: "Нехай сигнал буде з тобою.",
};

const ES: SpaceCopy = {
  ...EN,
  searchPlaceholder: "Buscar intenciones...",
  find: "buscar",
  authHint: "Inicia sesión con Telegram para verte y crear tu propia señal.",
  releaseThought: "lanzar idea",
  newThought: "Nueva idea",
  local: "local",
  pullSimilar: "atraer similares",
  localReply: "respuesta local...",
  deleteSignal: "eliminar mi señal",
  noticed: "space te ha notado",
  forceTitle: "Hace mucho tiempo, en una galaxia cercana...",
  forceIntro: "la gente quería ser independiente de los feeds infinitos.",
  forceBody: "Space es un mapa vivo de intenciones: quiero, puedo, busco, ayudo. Lanza una idea y deja que los significados cercanos se encuentren.",
  forceFooter: "Que la señal te acompañe.",
};

const PT: SpaceCopy = {
  ...EN,
  searchPlaceholder: "Buscar intenções...",
  find: "buscar",
  authHint: "Entre com Telegram para se ver e criar seu sinal.",
  releaseThought: "soltar pensamento",
  newThought: "Novo pensamento",
  pullSimilar: "atrair parecidos",
  forceFooter: "Que o sinal esteja com você.",
};

const FR: SpaceCopy = {
  ...EN,
  searchPlaceholder: "Chercher des intentions...",
  find: "chercher",
  authHint: "Connecte-toi avec Telegram pour te voir et créer ton signal.",
  releaseThought: "libérer une pensée",
  newThought: "Nouvelle pensée",
  pullSimilar: "attirer le similaire",
  forceFooter: "Que le signal soit avec toi.",
};

const DE: SpaceCopy = {
  ...EN,
  searchPlaceholder: "Absichten suchen...",
  find: "suchen",
  authHint: "Melde dich mit Telegram an, um dich zu sehen und dein Signal zu erstellen.",
  releaseThought: "Gedanke senden",
  newThought: "Neuer Gedanke",
  pullSimilar: "Ähnliches anziehen",
  forceFooter: "Möge das Signal mit dir sein.",
};

const IT: SpaceCopy = {
  ...EN,
  searchPlaceholder: "Cerca intenzioni...",
  find: "cerca",
  authHint: "Accedi con Telegram per vederti e creare il tuo segnale.",
  releaseThought: "rilascia pensiero",
  newThought: "Nuovo pensiero",
  pullSimilar: "attira simili",
  forceFooter: "Che il segnale sia con te.",
};

const TR: SpaceCopy = {
  ...EN,
  searchPlaceholder: "Niyet ara...",
  find: "ara",
  authHint: "Kendini görmek ve sinyal oluşturmak için Telegram ile giriş yap.",
  releaseThought: "düşünce bırak",
  newThought: "Yeni düşünce",
  pullSimilar: "benzerleri çek",
  forceFooter: "Sinyal seninle olsun.",
};

const AR: SpaceCopy = {
  ...EN,
  searchPlaceholder: "ابحث عن النوايا...",
  find: "بحث",
  authHint: "سجّل الدخول عبر Telegram لترى نفسك وتنشئ إشارتك.",
  releaseThought: "أرسل فكرة",
  newThought: "فكرة جديدة",
  pullSimilar: "اجذب المتشابه",
  forceFooter: "لتكن الإشارة معك.",
};

const FA: SpaceCopy = {
  ...EN,
  searchPlaceholder: "جستجوی نیت‌ها...",
  find: "جستجو",
  authHint: "با Telegram وارد شو تا خودت را ببینی و سیگنال بسازی.",
  releaseThought: "رها کردن فکر",
  newThought: "فکر تازه",
  pullSimilar: "جذب مشابه‌ها",
  forceFooter: "سیگنال همراهت باشد.",
};

const HI: SpaceCopy = {
  ...EN,
  searchPlaceholder: "इरादे खोजें...",
  find: "खोजें",
  authHint: "खुद को देखने और अपना संकेत बनाने के लिए Telegram से लॉग इन करें.",
  releaseThought: "विचार छोड़ें",
  newThought: "नया विचार",
  pullSimilar: "मिलते-जुलते खींचें",
  forceFooter: "सिग्नल आपके साथ हो.",
};

const ID: SpaceCopy = {
  ...EN,
  searchPlaceholder: "Cari niat...",
  find: "cari",
  authHint: "Masuk dengan Telegram untuk melihat dirimu dan membuat sinyal.",
  releaseThought: "lepaskan pikiran",
  newThought: "Pikiran baru",
  pullSimilar: "tarik yang mirip",
  forceFooter: "Semoga sinyal bersamamu.",
};

const ZH: SpaceCopy = {
  ...EN,
  searchPlaceholder: "搜索意图...",
  find: "搜索",
  authHint: "使用 Telegram 登录，查看自己并创建信号。",
  releaseThought: "释放想法",
  newThought: "新想法",
  pullSimilar: "吸引相似",
  forceFooter: "愿信号与你同在。",
};

const LOCALE_COPY: Partial<Record<Locale, SpaceCopy>> = {
  ru: RU,
  ua: UA,
  us: EN,
  za: EN,
  ng: EN,
  in: HI,
  ir: FA,
  tr: TR,
  br: PT,
  kz: RU,
  uz: RU,
  ae: AR,
  eg: AR,
  sa: AR,
  pk: EN,
  id: ID,
  mx: ES,
  es: ES,
  ar: ES,
  co: ES,
  it: IT,
  fr: FR,
  de: DE,
  cn: ZH,
  my: ID,
};

export function getSpaceCopy(locale: Locale): SpaceCopy {
  return LOCALE_COPY[locale] || EN;
}
