export const SUPPORTED_LANGS = [
  "en",
  "ru",
  "tr",
  "fa",
  "ar",
  "hi",
  "id",
  "pt",
  "es",
  "de",
] as const;

export type Lang = (typeof SUPPORTED_LANGS)[number];

export type TranslationDict = Record<string, string>;

type Translations = Record<Lang, TranslationDict>;

/**
 * Notes:
 * - EN and RU filled now (base).
 * - Other languages currently fallback to EN via t() if missing.
 * - You can progressively add keys per language without refactoring UI.
 */
export const translations: Translations = {
  en: {
    // header
    "header.back": "Back",
    "header.lang.aria": "Change language",

    // hero
    "hero.line1": "Your device",
    "hero.line2": "is your cloud",
    "hero.desc":
      "Private chat + instant file links. All correspondence remains yours.",

    // hint
    "hint.text":
    "All the magic works on your devices. If you are offline — all files are offline.",

    // misc
    "device.label": "device",
    "cta.enter": "Enter",

    // tabs
    "tab.search.title": "Search",
    "tab.search.desc": "Find any file if it’s shared and available on a device.",

    "tab.files.title": "Files",
    "tab.files.desc":
      "Photos, videos, docs always at hand — your personal cloud on your devices.",

    "tab.chat.title": "Chat",
    "tab.chat.desc":
      "Messenger, calls, video → no lock-ins, history stays on your devices.",

    "tab.control.title": "Control",
    "tab.control.desc":
      "No one sees you, listens to you, or watches you — we respect your privacy!",

    // onboarding
    "onb.title": "Is this a new device?",
    "onb.subtitle.1": "margeleT does not use your phone number.",
    "onb.subtitle.2": "Access is created via devices.",

    "onb.mode.create": "Create",
    "onb.mode.restore": "Sign in",

    "onb.card.create.title": "Name this device",
    "onb.card.create.placeholder": "For example: MacBook Jim",
    "onb.card.create.hint": "This name will be visible in your devices list.",

    "onb.card.restore.title": "Restore via QR",
    "onb.card.restore.box": "QR scanner will be here",

    "onb.cta.continue": "Continue",

        // onboarding (restore)
    "onb.restore.method.password": "Password",
    "onb.restore.method.qr": "QR",

    "onb.restore.password.placeholder": "Password",
    "onb.restore.password.hint":
      "If you lost a device, sign in via QR from another device.",
    "onb.restore.qr.hint":
      "Open margeleT on a device where you're already signed in and scan the QR.",
  },

  ru: {
    // header
    "header.back": "Назад",
    "header.lang.aria": "Сменить язык",

    // hero
    "hero.line1": "Твой девайс",
    "hero.line2": "это облако",
    "hero.desc":
      "Приватный чат + мгновенные ссылки на файлы. Вся переписка остаётся у тебя.",

    // hint
    "hint.text":
    "Вся магия работает на твоих устройствах. Если ты оффлайн — все файлы оффлайн.",

    // misc
    "device.label": "device",
    "cta.enter": "Войти",

    // tabs
    "tab.search.title": "Поиск",
    "tab.search.desc":
      "Можно найти любой файл, если он лежит в открытом доступе на устройстве.",

    "tab.files.title": "Файлы",
    "tab.files.desc":
      "Фото, видео, документы всегда под рукой — личное облако на всех устройствах.",

    "tab.chat.title": "Чат",
    "tab.chat.desc":
      "Мессенджер, звонки, видеочат → без блокировок, вся история на устройстве.",

    "tab.control.title": "Контроль",
    "tab.control.desc":
      "Никто не видит тебя, не слушает и не смотрит — мы уважаем твою приватность!",

    // onboarding
    "onb.title": "Это новое устройство?",
    "onb.subtitle.1": "margeleT не использует номер телефона.",
    "onb.subtitle.2": "Доступ создаётся через устройства.",

    "onb.mode.create": "Создать",
    "onb.mode.restore": "Войти",

    "onb.card.create.title": "Назови это устройство",
    "onb.card.create.placeholder": "Например: MacBook Jim",
    "onb.card.create.hint": "Это имя будет видно в списке твоих устройств.",

    "onb.card.restore.title": "Восстановить через QR",
    "onb.card.restore.box": "Здесь будет сканер QR",

    "onb.cta.continue": "Продолжить",

        // onboarding (restore)
    "onb.restore.method.password": "Пароль",
    "onb.restore.method.qr": "QR",

    "onb.restore.password.placeholder": "Пароль",
    "onb.restore.password.hint":
      "Если потерял устройство — войди через QR с другого устройства.",
    "onb.restore.qr.hint":
      "Открой margeleT на устройстве, где ты уже вошёл, и отсканируй QR.",
  },

  // --- placeholders: add translations later; t() will fallback to EN ---
  tr: {},
  fa: {},
  ar: {},
  hi: {},
  id: {},
  pt: {},
  es: {},
  de: {},
};