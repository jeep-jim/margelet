import type { Locale } from "../types/app";

export const messages = {
  ru: {
    appName: "Margelet",
    appTagline: "Лента видео из Telegram",

    navIntro: "О проекте",
    navFeed: "Лента",
    navAdd: "Добавить",
    navCreator: "Автор",

    feedBadge: "Лента находок",
    openChannel: "Открыть канал",
    viewsShort: "просм",
    likesShort: "лайки",
    commentsShort: "комм",

    mvpLogicTitle: "Логика MVP",
    mvpLogicText:
      "В центре всегда видео. Детали поста открываются только по нажатию, поэтому лента остаётся чистой и быстрой.",

    sourceModelTitle: "Модель источника",
    sourceModelText:
      "Margelet хранит ссылки на Telegram-посты, а не видеофайлы. Источником всегда остаётся оригинальный пост.",

    previewTitle: "Пост под видео",
    previewSubtitle: "Превью источника Telegram",
    originalPost: "Оригинальный пост Telegram",
    embeddedBlock: "Встроенный блок Telegram-поста",
    openPost: "Открыть пост",
    goToChannel: "В канал",

    cinemaHint: "Нажми вне окна, чтобы закрыть режим просмотра.",

    addEyebrow: "Сценарий автора",
    addTitle: "Добавь одну ссылку на Telegram-пост",
    addText:
      "Без хостинга. Без мастера загрузки. Без лишних настроек. Просто вставь Telegram-пост с видео, и он попадёт в ленту.",
    postUrl: "Ссылка на Telegram-пост",
    videoTitle: "Название видео",
    videoTitlePlaceholder: "Необязательное название",
    channelAuthor: "Канал / автор",
    channelPlaceholder: "Название канала",
    addButton: "Добавить в Margelet",
    addedSuccess: "Видео отправлено в ленту",

    checksTitle: "Что проверяет MVP",
    check1: "Публичная ссылка на Telegram-пост",
    check2: "В исходном посте есть воспроизводимое видео",
    check3: "Читаемые title / caption / метаданные канала",

    futureLabel: "Будущее, не MVP",
    futureTitle: "PRO-автоматизация позже",
    futureText:
      "Автоимпорт из каналов авторов можно оставить как платное улучшение позже. Бесплатный продукт стартует с самого чистого сценария: одна ссылка, один клик.",

    creatorProfile: "Профиль автора",
    publicSource: "Публичный источник канала",
    videos: "Видео",
    totalLikes: "Всего лайков",
    growthSignal: "Сигнал роста канала",
    watchSource: "Смотреть источник",
    viewsFull: "Просмотры",
    likesFull: "Лайки",
    language: "Язык",
    postView: "Просмотр Telegram-поста",
    sourcePost: "Исходный пост",
    openInTelegram: "Открыть в Telegram",
    focusView: "Расширенный просмотр с фокусом на видео",
    focusText:
      "В рабочей версии здесь будет воспроизводимый Telegram-пост или плеер исходника.",

    intro1Title: "Margelet",
    intro1Text: "Контент создаётся как ценность — но живёт как мусор.",
    intro2Title: "Что это?",
    intro2Text:
      "Лента видеоконтента из Telegram. Авторы добавляют пост одной ссылкой и получают новую аудиторию.",
    intro3Title: "Что решает?",
    intro3Text: "Видео в Telegram тонут. Мы возвращаем их в жизнь через ленту.",
    intro4Title: "Как работает?",
    intro4Text: "1 ссылка → 1 клик → видео в ленте. Без загрузок и хостинга.",
    next: "Дальше",
    enter: "Войти",

    newVideoFallback: "Новое видео из Telegram",
    newVideoCaption:
      "Только что добавлено автором по одной ссылке на пост. Для MVP это самый чистый сценарий входа.",
    newChannel: "Новый канал",
    newLang: "НОВЫЙ",
  },
  en: {
    appName: "Margelet",
    appTagline: "Telegram video feed",

    navIntro: "About",
    navFeed: "Feed",
    navAdd: "Add",
    navCreator: "Creator",

    feedBadge: "Discovery feed",
    openChannel: "Open channel",
    viewsShort: "views",
    likesShort: "likes",
    commentsShort: "talk",

    mvpLogicTitle: "MVP logic",
    mvpLogicText:
      "The center is always video-first. Post details open only on tap, so the feed stays clean and fast.",

    sourceModelTitle: "Source model",
    sourceModelText:
      "Margelet stores Telegram post links, not video files. The original post always remains the source.",

    previewTitle: "Post under video",
    previewSubtitle: "Telegram source preview",
    originalPost: "Original Telegram post",
    embeddedBlock: "Embedded Telegram post block",
    openPost: "Open post",
    goToChannel: "Go to channel",

    cinemaHint: "Tap outside to close cinema mode.",

    addEyebrow: "Author flow",
    addTitle: "Add one Telegram post link",
    addText:
      "No hosting. No upload wizard. No extra settings. Paste a Telegram post with video and it joins the feed.",
    postUrl: "Telegram post URL",
    videoTitle: "Video title",
    videoTitlePlaceholder: "Optional title",
    channelAuthor: "Channel / author",
    channelPlaceholder: "Channel name",
    addButton: "Add to Margelet",
    addedSuccess: "Video sent to the feed",

    checksTitle: "What the MVP checks",
    check1: "Public Telegram post link",
    check2: "The source post contains a playable video",
    check3: "Readable title / caption / channel metadata",

    futureLabel: "Future, not MVP",
    futureTitle: "PRO automation later",
    futureText:
      "Auto-import from creator channels can stay as a paid upgrade later. The free product starts with the cleanest possible flow: one link, one click.",

    creatorProfile: "Creator profile",
    publicSource: "Public channel source",
    videos: "Videos",
    totalLikes: "Total likes",
    growthSignal: "Channel growth signal",
    watchSource: "View source",
    viewsFull: "Views",
    likesFull: "Likes",
    language: "Language",
    postView: "Telegram post view",
    sourcePost: "Source post",
    openInTelegram: "Open in Telegram",
    focusView: "Expanded video-first view",
    focusText:
      "In production, the playable Telegram post or resolved source player will live here.",

    intro1Title: "Margelet",
    intro1Text: "Content is created as value — but lives like trash.",
    intro2Title: "What is it?",
    intro2Text:
      "A Telegram video feed. Authors add a post with one link and get a new audience.",
    intro3Title: "What does it solve?",
    intro3Text: "Videos sink in Telegram. We bring them back to life through a feed.",
    intro4Title: "How does it work?",
    intro4Text: "1 link → 1 click → video in feed. No uploads, no hosting.",
    next: "Next",
    enter: "Enter",

    newVideoFallback: "New Telegram video",
    newVideoCaption:
      "Just added by an author using one post link. For MVP this is the cleanest onboarding path.",
    newChannel: "New channel",
    newLang: "NEW",
  },
} as const;

export function getInitialLocale(): Locale {
  const saved = localStorage.getItem("margelet-locale");
  if (saved === "ru" || saved === "en") return saved;

  const browserLang = navigator.language.toLowerCase();
  return browserLang.startsWith("ru") ? "ru" : "en";
}