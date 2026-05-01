import {
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Gift,
  Lock,
  RotateCw,
  Send,
  Sparkles
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SITE_LOCALES } from "../../lib/locales";
import { SITE_TAG_GROUPS, type SiteTagGroup } from "../../lib/tags";
import type { Locale } from "../../types/app";
import { formatDaysLeft, getCreatorPricing } from "./creator.monetization";
import type {
  CreatorChannelPlacement,
  CreatorChannelPlan,
  ScreenCopy,
  TgUser,
} from "./creator.types";

const CREATOR_CHANNELS_STORAGE_KEY = "margelet_creator_channels_v1";
const TELEGRAM_BOT_USERNAME = "margeleT_space_bot";
const MAX_PARENT_TAGS = 3;

function normalizeChannelUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withProtocol = trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed.replace(/^@/, "t.me/")}`;

  try {
    const url = new URL(withProtocol);
    if (!["t.me", "www.t.me", "telegram.me", "www.telegram.me"].includes(url.hostname.toLowerCase())) {
      return null;
    }

    const [handle] = url.pathname.split("/").filter(Boolean);
    if (!handle || !/^[A-Za-z0-9_]{4,}$/.test(handle)) return null;

    return {
      handle,
      url: `https://t.me/${handle}`,
    };
  } catch {
    return null;
  }
}

function readCreatorChannels(userId: string): CreatorChannelPlacement[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(CREATOR_CHANNELS_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CreatorChannelPlacement[]) : [];
    return parsed.filter((item) => item.ownerTelegramId === userId);
  } catch {
    localStorage.removeItem(CREATOR_CHANNELS_STORAGE_KEY);
    return [];
  }
}

function writeCreatorChannels(items: CreatorChannelPlacement[]) {
  localStorage.setItem(CREATOR_CHANNELS_STORAGE_KEY, JSON.stringify(items));
}

function getChannelKey(item: Pick<CreatorChannelPlacement, "ownerTelegramId" | "channelHandle" | "country">) {
  return [
    item.ownerTelegramId,
    String(item.channelHandle || "").replace(/^@+/, "").toLowerCase(),
    String(item.country || "").toLowerCase(),
  ].join(":");
}

function dedupeCreatorChannels(items: CreatorChannelPlacement[]) {
  const map = new Map<string, CreatorChannelPlacement>();

  for (const item of items) {
    const key = getChannelKey(item);
    const current = map.get(key);

    if (!current) {
      map.set(key, item);
      continue;
    }

    const currentScore = current.status === "active" ? 3 : current.status === "pending" ? 2 : 1;
    const itemScore = item.status === "active" ? 3 : item.status === "pending" ? 2 : 1;
    map.set(key, itemScore >= currentScore ? { ...current, ...item } : { ...item, ...current });
  }

  return Array.from(map.values()).sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""));
}

function appendCreatorChannel(item: CreatorChannelPlacement) {
  const raw = localStorage.getItem(CREATOR_CHANNELS_STORAGE_KEY);
  const parsed = raw ? (JSON.parse(raw) as CreatorChannelPlacement[]) : [];
  writeCreatorChannels(dedupeCreatorChannels([item, ...parsed]));
}

function updateCreatorChannel(item: CreatorChannelPlacement) {
  const raw = localStorage.getItem(CREATOR_CHANNELS_STORAGE_KEY);
  const parsed = raw ? (JSON.parse(raw) as CreatorChannelPlacement[]) : [];

  writeCreatorChannels(parsed.map((current) => (current.id === item.id ? item : current)));
}

function normalizeTelegramDonateUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  const withProtocol = trimmed.startsWith("http://") || trimmed.startsWith("https://")
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    const host = url.hostname.toLowerCase();
    const [handle] = url.pathname.split("/").filter(Boolean);

    if (!["t.me", "www.t.me"].includes(host)) return null;
    if (!handle || !/^[A-Za-z0-9_]{4,}$/.test(handle)) return null;
    if (url.search !== "?direct") return null;

    return `https://t.me/${handle}?direct`;
  } catch {
    return null;
  }
}

function getTagLabel(group: SiteTagGroup, locale: Locale) {
  return `${group.emoji} ${group.labels[locale] ?? group.labels.en}`;
}

const CHANNEL_UI = {
  ru: {
    authRequired: "Авторизуйтесь, чтобы добавлять каналы.",
    formTitle: "Добавить канал",
    formText: "Заполни данные канала. После отправки мы откроем Telegram-бота — там можно оплатить размещение или выбрать бартер.",
    nameLabel: "1️⃣ Название канала как в Telegram",
    namePlaceholder: "Например: margeleT space",
    nameError: "Введи название канала.",
    urlLabel: "2️⃣ Ссылка на Telegram-канал",
    countryLabel: "3️⃣ Страна канала",
    tagsLabel: "4️⃣ Теги",
    planLabel: "5️⃣ Способ размещения",
    paidTitle: "Stars",
    paidText: "1 месяц размещения + возможность добавить Telegram-donate ссылку.",
    barterTitle: "Бартер",
    barterText: "1 месяц бесплатно за нативный пост о margeleT в вашем канале.",
    rulesTitle: "Правила размещения",
    rulesOpen: "Открыть правила",
    rulesClose: "Скрыть правила",
    rulesAgree: "Я прочитал правила и понимаю, что канал проходит модерацию.",
    submit: "Подтвердить в Telegram-бот",
    emptyError: "Вставь ссылку на Telegram-канал.",
    invalidError: "Нужна ссылка вида https://t.me/channel_name",
    rulesError: "Сначала нужно принять правила.",
    tagsError: "Выбери хотя бы один родительский тег.",
    maxTagsError: "Можно выбрать максимум 3 родительских тега.",
    showAllTags: "Выбрать теги",
    hideTags: "Свернуть теги",
    applyTags: "Применить теги",
    tagsPlaceholder: "Нажмите, чтобы выбрать до 3 тем",
    childrenHint: "Можно уточнить подтеги внутри выбранной темы.",
    myChannels: "Мои каналы",
    noChannels: "Здесь появятся твои заявки и активные размещения.",
    draft: "черновик",
    pending: "ожидает бота",
    active: "активен",
    paused: "пауза",
    expired: "истёк",
    canceled: "удалён",
    daysLeft: "Осталось",
    price: "Тариф",
    donateOnlyPaid: "Donate-ссылка доступна только для платного размещения.",
    donateLabel: "Telegram donate-ссылка",
    donatePlaceholder: "https://t.me/your_channel?direct",
    donateInvalid: "Нужна Telegram-ссылка с параметром ?direct",
    donateSaved: "Donate-ссылка сохранена.",
    saveDonate: "Сохранить",
    openBot: "Открыть бота",
    openChannel: "В канал",
    renew: "Продлить",
    countryStat: "страна",
    typeStat: "тип",
    termStat: "срок",
    paidPlan: "оплата",
    barterPlan: "бартер",
    barterPricing: "бартер / 1 месяц",
    duplicateError: "Этот канал уже добавлен. Открой существующую карточку или продли размещение.",
    submitError: "Не получилось создать заявку. Попробуй ещё раз.",
    networkError: "Не получилось создать заявку. Проверь интернет и попробуй ещё раз.",
    activeText: "активен",
    expiredText: "истёк",
    pausedText: "пауза",
    waitingBotText: "ожидает бота",
    barterPost: "Текст для бартера: Хорошие новости, друзья! Теперь наш канал можно читать ещё и на margeleT.space",
    rulesBody: [
      "Канал должен быть открытым Telegram-каналом с нормальным регулярным контентом.",
      "✋ СТРОГО ЗАПРЕЩЕНЫ; скам, мошенничество, наркотики, оружие, экстремизм, порнография, шок-контент и прямые нарушения закона.",
      "При нарушении правил пункта *✋ Строго запрещены* модерация может отклонить канал без автоматической публикации, при этом Stars не возвращаются.",
      "margeleT не переписывает авторский контент и всегда ведёт пользователя обратно к оригинальному каналу.",
      "Посты появляются и живут в ленте margeleT ровно 24 часа после того как вы опубликовали любой свежий пост в канале Telegram.",
    ],
  },
  en: {
    authRequired: "Sign in to add channels.",
    formTitle: "Add channel",
    formText: "Fill in the channel details. After submitting, we open the Telegram bot where you can pay or choose barter.",
    nameLabel: "1️⃣ Channel name as in Telegram",
    namePlaceholder: "For example: margeleT space",
    nameError: "Enter the channel name.",
    urlLabel: "2️⃣ Telegram channel link",
    countryLabel: "3️⃣ Channel country",
    tagsLabel: "4️⃣ Tags",
    planLabel: "5️⃣ Placement method",
    paidTitle: "Stars",
    paidText: "1 month placement + Telegram donate link option.",
    barterTitle: "Barter",
    barterText: "1 month free for a native post about margeleT in your channel.",
    rulesTitle: "Placement rules",
    rulesOpen: "Open rules",
    rulesClose: "Hide rules",
    rulesAgree: "I have read the rules and understand that the channel goes through moderation.",
    submit: "Open Telegram bot",
    emptyError: "Paste a Telegram channel link first.",
    invalidError: "Use a link like https://t.me/channel_name",
    rulesError: "Accept the rules first.",
    tagsError: "Choose at least one parent tag.",
    maxTagsError: "You can choose up to 3 parent tags.",
    showAllTags: "Choose tags",
    hideTags: "Collapse tags",
    applyTags: "Apply tags",
    tagsPlaceholder: "Tap to choose up to 3 topics",
    childrenHint: "You can refine child tags inside selected topics.",
    myChannels: "My channels",
    noChannels: "Your requests and active placements will appear here.",
    draft: "draft",
    pending: "waiting for bot",
    active: "active",
    paused: "paused",
    expired: "expired",
    canceled: "removed",
    daysLeft: "Left",
    price: "Plan",
    donateOnlyPaid: "Donate link is available only for paid placement.",
    donateLabel: "Telegram donate link",
    donatePlaceholder: "https://t.me/your_channel?direct",
    donateInvalid: "Use a Telegram link with ?direct",
    donateSaved: "Donate link saved.",
    saveDonate: "Save",
    openBot: "Open bot",
    openChannel: "Open channel",
    renew: "Renew",
    countryStat: "country",
    typeStat: "type",
    termStat: "term",
    paidPlan: "paid",
    barterPlan: "barter",
    barterPricing: "barter / 1 month",
    duplicateError: "This channel has already been added. Open the existing card or renew the placement.",
    submitError: "Could not create the request. Try again.",
    networkError: "Could not create the request. Check your internet and try again.",
    activeText: "active",
    expiredText: "expired",
    pausedText: "paused",
    waitingBotText: "waiting for bot",
    barterPost: "Barter text: Good news, friends! Now our channel is also available on margeleT.space",
    rulesBody: [
      "The channel must be an open Telegram channel with normal recurring content.",
      "Scams, fraud, drugs, weapons, extremism, pornography, shock content and direct legal violations are forbidden.",
      "margeleT does not rewrite creator content and always sends users back to the original channel.",
      "Moderation may reject a channel before publication.",
    ],
  },
  zh: {
    authRequired: "请先登录，才能添加频道。",
    formTitle: "添加频道",
    formText: "填写频道信息。提交后，我们会打开 Telegram 机器人，你可以在那里付款或选择置换合作。",
    nameLabel: "1️⃣ Telegram 中的频道名称",
    namePlaceholder: "例如：margeleT space",
    nameError: "请输入频道名称。",
    urlLabel: "2️⃣ Telegram 频道链接",
    countryLabel: "3️⃣ 频道国家/地区",
    tagsLabel: "4️⃣ 标签",
    planLabel: "5️⃣ 放置方式",
    paidTitle: "Stars",
    paidText: "1 个月展示 + 可添加 Telegram donate 链接。",
    barterTitle: "置换合作",
    barterText: "发布一条关于 margeleT 的原生帖子，可免费展示 1 个月。",
    rulesTitle: "放置规则",
    rulesOpen: "打开规则",
    rulesClose: "收起规则",
    rulesAgree: "我已阅读规则，并理解频道需要经过审核。",
    submit: "前往 Telegram 机器人",
    emptyError: "请先粘贴 Telegram 频道链接。",
    invalidError: "链接格式应类似 https://t.me/channel_name",
    rulesError: "请先接受规则。",
    tagsError: "请至少选择一个主标签。",
    maxTagsError: "最多可选择 3 个主标签。",
    showAllTags: "选择标签",
    hideTags: "收起标签",
    applyTags: "应用标签",
    tagsPlaceholder: "点击选择最多 3 个主题",
    childrenHint: "可以在已选主题内细化子标签。",
    myChannels: "我的频道",
    noChannels: "你的申请和有效放置会显示在这里。",
    draft: "草稿",
    pending: "等待机器人",
    active: "已激活",
    paused: "暂停",
    expired: "已过期",
    canceled: "已删除",
    daysLeft: "剩余",
    price: "套餐",
    donateOnlyPaid: "Donate 链接仅适用于付费放置。",
    donateLabel: "Telegram donate 链接",
    donatePlaceholder: "https://t.me/your_channel?direct",
    donateInvalid: "需要带有 ?direct 的 Telegram 链接",
    donateSaved: "Donate 链接已保存。",
    saveDonate: "保存",
    openBot: "打开机器人",
    openChannel: "打开频道",
    renew: "续期",
    countryStat: "国家",
    typeStat: "类型",
    termStat: "期限",
    paidPlan: "付费",
    barterPlan: "置换",
    barterPricing: "置换 / 1 个月",
    duplicateError: "该频道已添加。请打开现有卡片或续期放置。",
    submitError: "无法创建申请。请再试一次。",
    networkError: "无法创建申请。请检查网络后再试。",
    activeText: "已激活",
    expiredText: "已过期",
    pausedText: "暂停",
    waitingBotText: "等待机器人",
    barterPost: "置换文本：好消息，朋友们！现在我们的频道也可以在 margeleT.space 上阅读了。",
    rulesBody: [
      "频道必须是开放的 Telegram 频道，并有正常、持续的内容。",
      "禁止诈骗、欺诈、毒品、武器、极端主义、色情、震惊内容以及直接违法内容。",
      "margeleT 不改写作者内容，并始终把用户带回原始频道。",
      "审核可能会在发布前拒绝频道。",
    ],
  },
} as const;

type ChannelUi = {
  [K in keyof typeof CHANNEL_UI.en]: K extends "rulesBody" ? readonly string[] : string;
};

const CHANNEL_UI_BY_LOCALE: Record<Locale, ChannelUi> = {
  ru: CHANNEL_UI.ru,
  uk: {
    ...CHANNEL_UI.ru,
    authRequired: "Авторизуйтеся, щоб додавати канали.", formTitle: "Додати канал", formText: "Заповни дані каналу. Після надсилання ми відкриємо Telegram-бота — там можна оплатити розміщення або вибрати бартер.", nameLabel: "1️⃣ Назва каналу як у Telegram", nameError: "Введи назву каналу.", urlLabel: "2️⃣ Посилання на Telegram-канал", countryLabel: "3️⃣ Країна каналу", tagsLabel: "4️⃣ Теги", planLabel: "5️⃣ Спосіб розміщення", paidText: "1 місяць розміщення + можливість додати Telegram-donate посилання.", barterTitle: "Бартер", barterText: "1 місяць безкоштовно за нативний пост про margeleT у вашому каналі.", rulesOpen: "Відкрити правила", rulesClose: "Сховати правила", rulesAgree: "Я прочитав правила і розумію, що канал проходить модерацію.", submit: "Перейти в Telegram-бот", emptyError: "Встав посилання на Telegram-канал.", invalidError: "Потрібне посилання формату https://t.me/channel_name", rulesError: "Спочатку потрібно прийняти правила.", tagsError: "Обери хоча б один батьківський тег.", maxTagsError: "Можна вибрати максимум 3 батьківські теги.", showAllTags: "Вибрати теги", hideTags: "Згорнути теги", applyTags: "Застосувати теги", tagsPlaceholder: "Натисни, щоб вибрати до 3 тем", childrenHint: "Можна уточнити підтеги всередині вибраної теми.", myChannels: "Мої канали", noChannels: "Тут з’являться твої заявки й активні розміщення.", pending: "очікує бота", active: "активний", paused: "пауза", expired: "минув", canceled: "видалено", price: "Тариф", donateInvalid: "Потрібне Telegram-посилання з параметром ?direct", donateSaved: "Donate-посилання збережено.", saveDonate: "Зберегти", openChannel: "У канал", renew: "Продовжити", countryStat: "країна", typeStat: "тип", termStat: "строк", paidPlan: "оплата", barterPlan: "бартер", barterPricing: "бартер / 1 місяць", duplicateError: "Цей канал уже додано. Відкрий існуючу картку або продовж розміщення.", submitError: "Не вдалося створити заявку. Спробуй ще раз.", networkError: "Не вдалося створити заявку. Перевір інтернет і спробуй ще раз.", barterPost: "Текст для бартеру: Гарні новини, друзі! Тепер наш канал можна читати ще й на margeleT.space",
  },
  en: CHANNEL_UI.en,
  za: { ...CHANNEL_UI.en, authRequired: "Sign in to add channels.", myChannels: "My channels" },
  ng: { ...CHANNEL_UI.en, authRequired: "Sign in to add channels.", myChannels: "My channels" },
  zh: CHANNEL_UI.zh,
  de: {
    ...CHANNEL_UI.en,
    authRequired: "Melde dich an, um Kanäle hinzuzufügen.", formTitle: "Kanal hinzufügen", formText: "Fülle die Kanaldaten aus. Danach öffnen wir den Telegram-Bot — dort kannst du bezahlen oder Barter wählen.", nameLabel: "1️⃣ Kanalname wie in Telegram", namePlaceholder: "Zum Beispiel: margeleT space", nameError: "Gib den Kanalnamen ein.", urlLabel: "2️⃣ Telegram-Kanallink", countryLabel: "3️⃣ Kanalland", tagsLabel: "4️⃣ Tags", planLabel: "5️⃣ Platzierungsmethode", paidText: "1 Monat Platzierung + Telegram-Donate-Link möglich.", barterTitle: "Barter", barterText: "1 Monat kostenlos für einen nativen Post über margeleT in deinem Kanal.", rulesOpen: "Regeln öffnen", rulesClose: "Regeln ausblenden", rulesAgree: "Ich habe die Regeln gelesen und verstehe, dass der Kanal moderiert wird.", submit: "Telegram-Bot öffnen", emptyError: "Füge zuerst einen Telegram-Kanallink ein.", invalidError: "Nutze einen Link wie https://t.me/channel_name", rulesError: "Akzeptiere zuerst die Regeln.", tagsError: "Wähle mindestens einen Haupttag.", maxTagsError: "Du kannst bis zu 3 Haupttags wählen.", showAllTags: "Tags wählen", hideTags: "Tags einklappen", applyTags: "Tags anwenden", tagsPlaceholder: "Tippe, um bis zu 3 Themen zu wählen", childrenHint: "Du kannst Untertags innerhalb des gewählten Themas verfeinern.", myChannels: "Meine Kanäle", noChannels: "Deine Anfragen und aktiven Platzierungen erscheinen hier.", pending: "wartet auf Bot", active: "aktiv", paused: "Pause", expired: "abgelaufen", canceled: "entfernt", price: "Tarif", donateInvalid: "Nutze einen Telegram-Link mit ?direct", donateSaved: "Donate-Link gespeichert.", saveDonate: "Speichern", openChannel: "Zum Kanal", renew: "Verlängern", countryStat: "Land", typeStat: "Typ", termStat: "Laufzeit", paidPlan: "bezahlt", barterPlan: "Barter", barterPricing: "Barter / 1 Monat", duplicateError: "Dieser Kanal wurde bereits hinzugefügt. Öffne die vorhandene Karte oder verlängere die Platzierung.", submitError: "Anfrage konnte nicht erstellt werden. Versuche es erneut.", networkError: "Anfrage konnte nicht erstellt werden. Prüfe das Internet und versuche es erneut.", barterPost: "Barter-Text: Gute Nachrichten, Freunde! Jetzt ist unser Kanal auch auf margeleT.space verfügbar",
  },
  es: {
    ...CHANNEL_UI.en,
    authRequired: "Inicia sesión para añadir canales.", formTitle: "Añadir canal", formText: "Completa los datos del canal. Después abriremos el bot de Telegram, donde podrás pagar o elegir barter.", nameLabel: "1️⃣ Nombre del canal como en Telegram", namePlaceholder: "Por ejemplo: margeleT space", nameError: "Introduce el nombre del canal.", urlLabel: "2️⃣ Enlace del canal de Telegram", countryLabel: "3️⃣ País del canal", tagsLabel: "4️⃣ Etiquetas", planLabel: "5️⃣ Método de colocación", paidText: "1 mes de colocación + opción de enlace donate de Telegram.", barterTitle: "Barter", barterText: "1 mes gratis por una publicación nativa sobre margeleT en tu canal.", rulesOpen: "Abrir reglas", rulesClose: "Ocultar reglas", rulesAgree: "He leído las reglas y entiendo que el canal pasa por moderación.", submit: "Abrir bot de Telegram", emptyError: "Pega primero el enlace del canal de Telegram.", invalidError: "Usa un enlace como https://t.me/channel_name", rulesError: "Primero acepta las reglas.", tagsError: "Elige al menos una etiqueta principal.", maxTagsError: "Puedes elegir hasta 3 etiquetas principales.", showAllTags: "Elegir etiquetas", hideTags: "Contraer etiquetas", applyTags: "Aplicar etiquetas", tagsPlaceholder: "Toca para elegir hasta 3 temas", childrenHint: "Puedes precisar subetiquetas dentro del tema elegido.", myChannels: "Mis canales", noChannels: "Tus solicitudes y colocaciones activas aparecerán aquí.", pending: "esperando bot", active: "activo", paused: "pausa", expired: "caducado", canceled: "eliminado", price: "Plan", donateInvalid: "Usa un enlace de Telegram con ?direct", donateSaved: "Enlace donate guardado.", saveDonate: "Guardar", openChannel: "Al canal", renew: "Renovar", countryStat: "país", typeStat: "tipo", termStat: "plazo", paidPlan: "pago", barterPlan: "barter", barterPricing: "barter / 1 mes", duplicateError: "Este canal ya fue añadido. Abre la tarjeta existente o renueva la colocación.", submitError: "No se pudo crear la solicitud. Inténtalo de nuevo.", networkError: "No se pudo crear la solicitud. Revisa internet e inténtalo de nuevo.", barterPost: "Texto para barter: ¡Buenas noticias, amigos! Ahora nuestro canal también está disponible en margeleT.space",
  },
  mx: undefined as any,
  ar: undefined as any,
  co: undefined as any,
  fr: {
    ...CHANNEL_UI.en,
    authRequired: "Connecte-toi pour ajouter des chaînes.", formTitle: "Ajouter une chaîne", formText: "Remplis les données de la chaîne. Ensuite nous ouvrirons le bot Telegram, où tu pourras payer ou choisir le barter.", nameLabel: "1️⃣ Nom de la chaîne comme sur Telegram", nameError: "Entre le nom de la chaîne.", urlLabel: "2️⃣ Lien de la chaîne Telegram", countryLabel: "3️⃣ Pays de la chaîne", tagsLabel: "4️⃣ Tags", planLabel: "5️⃣ Mode de placement", paidText: "1 mois de placement + option de lien donate Telegram.", barterTitle: "Barter", barterText: "1 mois gratuit contre un post natif sur margeleT dans votre chaîne.", rulesOpen: "Ouvrir les règles", rulesClose: "Masquer les règles", rulesAgree: "J’ai lu les règles et je comprends que la chaîne est modérée.", submit: "Ouvrir le bot Telegram", emptyError: "Colle d’abord le lien de la chaîne Telegram.", invalidError: "Utilise un lien comme https://t.me/channel_name", rulesError: "Accepte d’abord les règles.", tagsError: "Choisis au moins un tag principal.", maxTagsError: "Tu peux choisir jusqu’à 3 tags principaux.", showAllTags: "Choisir les tags", hideTags: "Réduire les tags", applyTags: "Appliquer les tags", tagsPlaceholder: "Appuie pour choisir jusqu’à 3 thèmes", childrenHint: "Tu peux préciser les sous-tags dans le thème choisi.", myChannels: "Mes chaînes", noChannels: "Tes demandes et placements actifs apparaîtront ici.", pending: "en attente du bot", active: "actif", paused: "pause", expired: "expiré", canceled: "supprimé", price: "Plan", donateInvalid: "Utilise un lien Telegram avec ?direct", donateSaved: "Lien donate enregistré.", saveDonate: "Enregistrer", openChannel: "Vers la chaîne", renew: "Renouveler", countryStat: "pays", typeStat: "type", termStat: "durée", paidPlan: "payant", barterPlan: "barter", barterPricing: "barter / 1 mois", duplicateError: "Cette chaîne a déjà été ajoutée. Ouvre la carte existante ou renouvelle le placement.", submitError: "Impossible de créer la demande. Réessaie.", networkError: "Impossible de créer la demande. Vérifie internet et réessaie.", barterPost: "Texte barter : Bonne nouvelle ! Notre chaîne est aussi disponible sur margeleT.space",
  },
  it: {
    ...CHANNEL_UI.en,
    authRequired: "Accedi per aggiungere canali.", formTitle: "Aggiungi canale", formText: "Compila i dati del canale. Dopo l’invio apriremo il bot Telegram, dove potrai pagare o scegliere il barter.", nameLabel: "1️⃣ Nome del canale come su Telegram", nameError: "Inserisci il nome del canale.", urlLabel: "2️⃣ Link del canale Telegram", countryLabel: "3️⃣ Paese del canale", tagsLabel: "4️⃣ Tag", planLabel: "5️⃣ Metodo di pubblicazione", paidText: "1 mese di pubblicazione + opzione link donate Telegram.", barterTitle: "Barter", barterText: "1 mese gratis per un post nativo su margeleT nel tuo canale.", rulesOpen: "Apri regole", rulesClose: "Nascondi regole", rulesAgree: "Ho letto le regole e capisco che il canale passa la moderazione.", submit: "Apri bot Telegram", emptyError: "Incolla prima il link del canale Telegram.", invalidError: "Usa un link come https://t.me/channel_name", rulesError: "Accetta prima le regole.", tagsError: "Scegli almeno un tag principale.", maxTagsError: "Puoi scegliere fino a 3 tag principali.", showAllTags: "Scegli tag", hideTags: "Comprimi tag", applyTags: "Applica tag", tagsPlaceholder: "Tocca per scegliere fino a 3 temi", childrenHint: "Puoi specificare i sotto-tag nel tema scelto.", myChannels: "I miei canali", noChannels: "Le tue richieste e pubblicazioni attive appariranno qui.", pending: "in attesa del bot", active: "attivo", paused: "pausa", expired: "scaduto", canceled: "rimosso", price: "Piano", donateInvalid: "Usa un link Telegram con ?direct", donateSaved: "Link donate salvato.", saveDonate: "Salva", openChannel: "Al canale", renew: "Rinnova", countryStat: "paese", typeStat: "tipo", termStat: "durata", paidPlan: "pagato", barterPlan: "barter", barterPricing: "barter / 1 mese", duplicateError: "Questo canale è già stato aggiunto. Apri la scheda esistente o rinnova la pubblicazione.", submitError: "Impossibile creare la richiesta. Riprova.", networkError: "Impossibile creare la richiesta. Controlla internet e riprova.", barterPost: "Testo barter: Buone notizie, amici! Ora il nostro canale è disponibile anche su margeleT.space",
  },
  "pt-br": {
    ...CHANNEL_UI.en,
    authRequired: "Entre para adicionar canais.", formTitle: "Adicionar canal", formText: "Preencha os dados do canal. Depois abriremos o bot do Telegram, onde você pode pagar ou escolher barter.", nameLabel: "1️⃣ Nome do canal como no Telegram", nameError: "Digite o nome do canal.", urlLabel: "2️⃣ Link do canal do Telegram", countryLabel: "3️⃣ País do canal", tagsLabel: "4️⃣ Tags", planLabel: "5️⃣ Método de colocação", paidText: "1 mês de colocação + opção de link donate do Telegram.", barterTitle: "Barter", barterText: "1 mês grátis por um post nativo sobre margeleT no seu canal.", rulesOpen: "Abrir regras", rulesClose: "Ocultar regras", rulesAgree: "Li as regras e entendo que o canal passa por moderação.", submit: "Abrir bot do Telegram", emptyError: "Cole primeiro o link do canal do Telegram.", invalidError: "Use um link como https://t.me/channel_name", rulesError: "Aceite as regras primeiro.", tagsError: "Escolha pelo menos uma tag principal.", maxTagsError: "Você pode escolher até 3 tags principais.", showAllTags: "Escolher tags", hideTags: "Recolher tags", applyTags: "Aplicar tags", tagsPlaceholder: "Toque para escolher até 3 temas", childrenHint: "Você pode refinar subtags dentro do tema escolhido.", myChannels: "Meus canais", noChannels: "Suas solicitações e colocações ativas aparecerão aqui.", pending: "aguardando bot", active: "ativo", paused: "pausa", expired: "expirado", canceled: "removido", price: "Plano", donateInvalid: "Use um link do Telegram com ?direct", donateSaved: "Link donate salvo.", saveDonate: "Salvar", openChannel: "Ir ao canal", renew: "Renovar", countryStat: "país", typeStat: "tipo", termStat: "prazo", paidPlan: "pago", barterPlan: "barter", barterPricing: "barter / 1 mês", duplicateError: "Este canal já foi adicionado. Abra o cartão existente ou renove a colocação.", submitError: "Não foi possível criar a solicitação. Tente novamente.", networkError: "Não foi possível criar a solicitação. Verifique a internet e tente novamente.", barterPost: "Texto barter: Boas notícias, amigos! Agora nosso canal também está disponível no margeleT.space",
  },
  tr: {
    ...CHANNEL_UI.en,
    authRequired: "Kanal eklemek için giriş yap.", formTitle: "Kanal ekle", formText: "Kanal bilgilerini doldur. Gönderdikten sonra ödeme yapabileceğin veya barter seçebileceğin Telegram botunu açacağız.", nameLabel: "1️⃣ Telegram’daki kanal adı", nameError: "Kanal adını gir.", urlLabel: "2️⃣ Telegram kanal linki", countryLabel: "3️⃣ Kanal ülkesi", tagsLabel: "4️⃣ Etiketler", planLabel: "5️⃣ Yerleşim yöntemi", paidText: "1 ay yerleşim + Telegram donate linki ekleme seçeneği.", barterTitle: "Barter", barterText: "Kanalında margeleT hakkında native post karşılığı 1 ay ücretsiz.", rulesOpen: "Kuralları aç", rulesClose: "Kuralları gizle", rulesAgree: "Kuralları okudum ve kanalın moderasyondan geçtiğini anlıyorum.", submit: "Telegram botuna git", emptyError: "Önce Telegram kanal linkini yapıştır.", invalidError: "https://t.me/channel_name gibi bir link kullan", rulesError: "Önce kuralları kabul et.", tagsError: "En az bir ana etiket seç.", maxTagsError: "En fazla 3 ana etiket seçebilirsin.", showAllTags: "Etiket seç", hideTags: "Etiketleri kapat", applyTags: "Etiketleri uygula", tagsPlaceholder: "3 konuya kadar seçmek için dokun", childrenHint: "Seçilen konu içinde alt etiketleri netleştirebilirsin.", myChannels: "Kanallarım", noChannels: "Başvuruların ve aktif yerleşimlerin burada görünecek.", pending: "bot bekleniyor", active: "aktif", paused: "duraklatıldı", expired: "süresi doldu", canceled: "kaldırıldı", price: "Plan", donateInvalid: "?direct içeren Telegram linki gerekli", donateSaved: "Donate linki kaydedildi.", saveDonate: "Kaydet", openChannel: "Kanala git", renew: "Yenile", countryStat: "ülke", typeStat: "tip", termStat: "süre", paidPlan: "ücretli", barterPlan: "barter", barterPricing: "barter / 1 ay", duplicateError: "Bu kanal zaten eklendi. Mevcut kartı aç veya yerleşimi yenile.", submitError: "Başvuru oluşturulamadı. Tekrar dene.", networkError: "Başvuru oluşturulamadı. İnterneti kontrol edip tekrar dene.", barterPost: "Barter metni: Güzel haberler! Kanalımız artık margeleT.space üzerinde de okunabilir",
  },
  id: {
    ...CHANNEL_UI.en,
    authRequired: "Masuk untuk menambahkan channel.", formTitle: "Tambah channel", formText: "Isi detail channel. Setelah dikirim, kami akan membuka bot Telegram untuk pembayaran atau barter.", nameLabel: "1️⃣ Nama channel seperti di Telegram", nameError: "Masukkan nama channel.", urlLabel: "2️⃣ Link channel Telegram", countryLabel: "3️⃣ Negara channel", tagsLabel: "4️⃣ Tag", planLabel: "5️⃣ Metode penempatan", paidText: "Penempatan 1 bulan + opsi link donate Telegram.", barterTitle: "Barter", barterText: "Gratis 1 bulan untuk post native tentang margeleT di channel kamu.", rulesOpen: "Buka aturan", rulesClose: "Tutup aturan", rulesAgree: "Saya telah membaca aturan dan memahami bahwa channel akan dimoderasi.", submit: "Buka bot Telegram", emptyError: "Tempel link channel Telegram dulu.", invalidError: "Gunakan link seperti https://t.me/channel_name", rulesError: "Terima aturan dulu.", tagsError: "Pilih setidaknya satu tag utama.", maxTagsError: "Kamu bisa memilih maksimal 3 tag utama.", showAllTags: "Pilih tag", hideTags: "Tutup tag", applyTags: "Terapkan tag", tagsPlaceholder: "Ketuk untuk memilih hingga 3 topik", childrenHint: "Kamu bisa memperjelas subtag di dalam topik terpilih.", myChannels: "Channel saya", noChannels: "Permintaan dan penempatan aktif akan muncul di sini.", pending: "menunggu bot", active: "aktif", paused: "jeda", expired: "kedaluwarsa", canceled: "dihapus", price: "Paket", donateInvalid: "Gunakan link Telegram dengan ?direct", donateSaved: "Link donate disimpan.", saveDonate: "Simpan", openChannel: "Ke channel", renew: "Perpanjang", countryStat: "negara", typeStat: "tipe", termStat: "masa", paidPlan: "bayar", barterPlan: "barter", barterPricing: "barter / 1 bulan", duplicateError: "Channel ini sudah ditambahkan. Buka kartu yang ada atau perpanjang penempatan.", submitError: "Gagal membuat permintaan. Coba lagi.", networkError: "Gagal membuat permintaan. Periksa internet lalu coba lagi.", barterPost: "Teks barter: Kabar baik! Sekarang channel kami juga bisa dibaca di margeleT.space",
  },
  ms: {
    ...CHANNEL_UI.en,
    authRequired: "Log masuk untuk menambah saluran.", formTitle: "Tambah saluran", formText: "Isi butiran saluran. Selepas dihantar, kami akan membuka bot Telegram untuk bayaran atau barter.", nameLabel: "1️⃣ Nama saluran seperti di Telegram", nameError: "Masukkan nama saluran.", urlLabel: "2️⃣ Pautan saluran Telegram", countryLabel: "3️⃣ Negara saluran", tagsLabel: "4️⃣ Tag", planLabel: "5️⃣ Kaedah penempatan", paidText: "Penempatan 1 bulan + pilihan pautan donate Telegram.", barterTitle: "Barter", barterText: "Percuma 1 bulan untuk post native tentang margeleT dalam saluran anda.", rulesOpen: "Buka peraturan", rulesClose: "Sembunyikan peraturan", rulesAgree: "Saya telah membaca peraturan dan faham saluran akan dimoderasi.", submit: "Buka bot Telegram", emptyError: "Tampal pautan saluran Telegram dahulu.", invalidError: "Gunakan pautan seperti https://t.me/channel_name", rulesError: "Terima peraturan dahulu.", tagsError: "Pilih sekurang-kurangnya satu tag utama.", maxTagsError: "Anda boleh memilih maksimum 3 tag utama.", showAllTags: "Pilih tag", hideTags: "Tutup tag", applyTags: "Guna tag", tagsPlaceholder: "Ketik untuk pilih hingga 3 topik", childrenHint: "Anda boleh memperincikan subtag dalam topik dipilih.", myChannels: "Saluran saya", noChannels: "Permintaan dan penempatan aktif anda akan muncul di sini.", pending: "menunggu bot", active: "aktif", paused: "jeda", expired: "tamat", canceled: "dipadam", price: "Pelan", donateInvalid: "Gunakan pautan Telegram dengan ?direct", donateSaved: "Pautan donate disimpan.", saveDonate: "Simpan", openChannel: "Ke saluran", renew: "Sambung", countryStat: "negara", typeStat: "jenis", termStat: "tempoh", paidPlan: "bayar", barterPlan: "barter", barterPricing: "barter / 1 bulan", duplicateError: "Saluran ini sudah ditambah. Buka kad sedia ada atau sambung penempatan.", submitError: "Tidak dapat mencipta permintaan. Cuba lagi.", networkError: "Tidak dapat mencipta permintaan. Semak internet dan cuba lagi.", barterPost: "Teks barter: Berita baik! Kini saluran kami juga boleh dibaca di margeleT.space",
  },
  in: {
    ...CHANNEL_UI.en,
    authRequired: "चैनल जोड़ने के लिए साइन इन करें।", formTitle: "चैनल जोड़ें", formText: "चैनल की जानकारी भरें। भेजने के बाद हम Telegram bot खोलेंगे, जहाँ आप भुगतान कर सकते हैं या barter चुन सकते हैं।", nameLabel: "1️⃣ Telegram में चैनल का नाम", nameError: "चैनल का नाम दर्ज करें।", urlLabel: "2️⃣ Telegram चैनल लिंक", countryLabel: "3️⃣ चैनल देश", tagsLabel: "4️⃣ टैग", planLabel: "5️⃣ प्लेसमेंट तरीका", paidText: "1 महीने का प्लेसमेंट + Telegram donate लिंक विकल्प।", barterTitle: "Barter", barterText: "अपने चैनल में margeleT पर native post के बदले 1 महीना मुफ्त।", rulesOpen: "नियम खोलें", rulesClose: "नियम छुपाएँ", rulesAgree: "मैंने नियम पढ़ लिए हैं और समझता हूँ कि चैनल moderation से गुज़रेगा।", submit: "Telegram bot खोलें", emptyError: "पहले Telegram चैनल लिंक डालें।", invalidError: "https://t.me/channel_name जैसा लिंक इस्तेमाल करें", rulesError: "पहले नियम स्वीकार करें।", tagsError: "कम से कम एक parent tag चुनें।", maxTagsError: "आप अधिकतम 3 parent tags चुन सकते हैं।", showAllTags: "टैग चुनें", hideTags: "टैग बंद करें", applyTags: "टैग लागू करें", tagsPlaceholder: "3 topics तक चुनने के लिए टैप करें", childrenHint: "चुने गए topic के अंदर child tags refine कर सकते हैं।", myChannels: "मेरे चैनल", noChannels: "आपकी requests और active placements यहाँ दिखेंगी।", pending: "bot की प्रतीक्षा", active: "active", paused: "pause", expired: "expired", canceled: "removed", price: "Plan", donateInvalid: "?direct वाला Telegram लिंक चाहिए", donateSaved: "Donate link saved.", saveDonate: "Save", openChannel: "चैनल खोलें", renew: "Renew", countryStat: "देश", typeStat: "प्रकार", termStat: "अवधि", paidPlan: "paid", barterPlan: "barter", barterPricing: "barter / 1 month", duplicateError: "यह चैनल पहले से जोड़ा गया है। मौजूदा card खोलें या placement renew करें।", submitError: "Request नहीं बन पाई। फिर कोशिश करें।", networkError: "Request नहीं बन पाई। इंटरनेट चेक करें और फिर कोशिश करें।", barterPost: "Barter text: अच्छी खबर! अब हमारा चैनल margeleT.space पर भी पढ़ा जा सकता है",
  },
  pk: {
    ...CHANNEL_UI.en,
    authRequired: "چینل شامل کرنے کے لیے سائن اِن کریں۔", formTitle: "چینل شامل کریں", formText: "چینل کی تفصیلات بھریں۔ جمع کرانے کے بعد ہم Telegram bot کھولیں گے، جہاں آپ ادائیگی یا barter منتخب کر سکتے ہیں۔", nameLabel: "1️⃣ Telegram میں چینل کا نام", nameError: "چینل کا نام درج کریں۔", urlLabel: "2️⃣ Telegram چینل لنک", countryLabel: "3️⃣ چینل کا ملک", tagsLabel: "4️⃣ ٹیگز", planLabel: "5️⃣ placement کا طریقہ", paidText: "1 ماہ placement + Telegram donate link کا اختیار۔", barterTitle: "Barter", barterText: "اپنے چینل میں margeleT پر native post کے بدلے 1 ماہ مفت۔", rulesOpen: "قواعد کھولیں", rulesClose: "قواعد چھپائیں", rulesAgree: "میں نے قواعد پڑھ لیے ہیں اور سمجھتا ہوں کہ چینل moderation سے گزرے گا۔", submit: "Telegram bot کھولیں", emptyError: "پہلے Telegram چینل لنک پیسٹ کریں۔", invalidError: "https://t.me/channel_name جیسا لنک استعمال کریں", rulesError: "پہلے قواعد قبول کریں۔", tagsError: "کم از کم ایک parent tag منتخب کریں۔", maxTagsError: "آپ زیادہ سے زیادہ 3 parent tags منتخب کر سکتے ہیں۔", showAllTags: "ٹیگز منتخب کریں", hideTags: "ٹیگز بند کریں", applyTags: "ٹیگز لگائیں", tagsPlaceholder: "3 topics تک منتخب کرنے کے لیے tap کریں", childrenHint: "منتخب topic کے اندر child tags refine کر سکتے ہیں۔", myChannels: "میرے چینلز", noChannels: "آپ کی requests اور active placements یہاں نظر آئیں گی۔", pending: "bot کا انتظار", active: "active", paused: "pause", expired: "expired", canceled: "removed", price: "Plan", donateInvalid: "?direct والا Telegram link چاہیے", donateSaved: "Donate link saved.", saveDonate: "Save", openChannel: "چینل کھولیں", renew: "Renew", countryStat: "ملک", typeStat: "قسم", termStat: "مدت", paidPlan: "paid", barterPlan: "barter", barterPricing: "barter / 1 month", duplicateError: "یہ چینل پہلے ہی شامل ہے۔ موجودہ card کھولیں یا placement renew کریں۔", submitError: "Request نہیں بن سکی۔ دوبارہ کوشش کریں۔", networkError: "Request نہیں بن سکی۔ انٹرنیٹ چیک کریں اور دوبارہ کوشش کریں۔", barterPost: "Barter text: اچھی خبر! اب ہمارا چینل margeleT.space پر بھی پڑھا جا سکتا ہے",
  },
  fa: {
    ...CHANNEL_UI.en,
    authRequired: "برای افزودن کانال وارد شوید.", formTitle: "افزودن کانال", formText: "اطلاعات کانال را وارد کنید. پس از ارسال، ربات Telegram را باز می‌کنیم تا پرداخت کنید یا barter را انتخاب کنید.", nameLabel: "1️⃣ نام کانال مثل Telegram", nameError: "نام کانال را وارد کنید.", urlLabel: "2️⃣ لینک کانال Telegram", countryLabel: "3️⃣ کشور کانال", tagsLabel: "4️⃣ تگ‌ها", planLabel: "5️⃣ روش قرارگیری", paidText: "۱ ماه قرارگیری + امکان افزودن لینک donate تلگرام.", barterTitle: "Barter", barterText: "۱ ماه رایگان در برابر یک پست طبیعی درباره margeleT در کانال شما.", rulesOpen: "نمایش قوانین", rulesClose: "پنهان کردن قوانین", rulesAgree: "قوانین را خوانده‌ام و می‌دانم کانال بررسی می‌شود.", submit: "رفتن به ربات Telegram", emptyError: "ابتدا لینک کانال Telegram را وارد کنید.", invalidError: "از لینکی مثل https://t.me/channel_name استفاده کنید", rulesError: "ابتدا قوانین را بپذیرید.", tagsError: "حداقل یک تگ اصلی انتخاب کنید.", maxTagsError: "حداکثر ۳ تگ اصلی می‌توانید انتخاب کنید.", showAllTags: "انتخاب تگ‌ها", hideTags: "بستن تگ‌ها", applyTags: "اعمال تگ‌ها", tagsPlaceholder: "برای انتخاب حداکثر ۳ موضوع بزنید", childrenHint: "می‌توانید زیرتگ‌های موضوع انتخاب‌شده را دقیق‌تر کنید.", myChannels: "کانال‌های من", noChannels: "درخواست‌ها و قرارگیری‌های فعال شما اینجا نمایش داده می‌شود.", pending: "در انتظار ربات", active: "فعال", paused: "مکث", expired: "منقضی", canceled: "حذف‌شده", price: "پلن", donateInvalid: "لینک Telegram با ?direct لازم است", donateSaved: "لینک donate ذخیره شد.", saveDonate: "ذخیره", openChannel: "رفتن به کانال", renew: "تمدید", countryStat: "کشور", typeStat: "نوع", termStat: "مدت", paidPlan: "پرداخت", barterPlan: "barter", barterPricing: "barter / ۱ ماه", duplicateError: "این کانال قبلاً اضافه شده است. کارت موجود را باز کنید یا قرارگیری را تمدید کنید.", submitError: "درخواست ساخته نشد. دوباره تلاش کنید.", networkError: "درخواست ساخته نشد. اینترنت را بررسی کنید و دوباره تلاش کنید.", barterPost: "متن barter: خبر خوب دوستان! اکنون کانال ما در margeleT.space هم قابل خواندن است",
  },
  ae: {
    ...CHANNEL_UI.en,
    authRequired: "سجّل الدخول لإضافة القنوات.", formTitle: "إضافة قناة", formText: "املأ بيانات القناة. بعد الإرسال سنفتح بوت Telegram، وهناك يمكنك الدفع أو اختيار المقايضة.", nameLabel: "1️⃣ اسم القناة كما في Telegram", namePlaceholder: "مثال: margeleT space", nameError: "أدخل اسم القناة.", urlLabel: "2️⃣ رابط قناة Telegram", countryLabel: "3️⃣ بلد القناة", tagsLabel: "4️⃣ الوسوم", planLabel: "5️⃣ طريقة الظهور", paidText: "ظهور لمدة شهر + إمكانية إضافة رابط Telegram donate.", barterTitle: "مقايضة", barterText: "شهر مجاني مقابل منشور طبيعي عن margeleT في قناتك.", rulesOpen: "فتح القواعد", rulesClose: "إخفاء القواعد", rulesAgree: "قرأت القواعد وأفهم أن القناة تمر بالمراجعة.", submit: "الانتقال إلى بوت Telegram", emptyError: "ألصق رابط قناة Telegram أولاً.", invalidError: "استخدم رابطاً مثل https://t.me/channel_name", rulesError: "اقبل القواعد أولاً.", tagsError: "اختر وسمًا رئيسيًا واحدًا على الأقل.", maxTagsError: "يمكنك اختيار 3 وسوم رئيسية كحد أقصى.", showAllTags: "اختيار الوسوم", hideTags: "طي الوسوم", applyTags: "تطبيق الوسوم", tagsPlaceholder: "اضغط لاختيار حتى 3 مواضيع", childrenHint: "يمكنك уточيح الوسوم الفرعية داخل الموضوع المختار.", myChannels: "قنواتي", noChannels: "ستظهر طلباتك والمواضع النشطة هنا.", pending: "ينتظر البوت", active: "نشط", paused: "متوقف مؤقتًا", expired: "منتهي", canceled: "محذوف", price: "الخطة", donateInvalid: "يلزم رابط Telegram يحتوي على ?direct", donateSaved: "تم حفظ رابط donate.", saveDonate: "حفظ", openChannel: "إلى القناة", renew: "تمديد", countryStat: "البلد", typeStat: "النوع", termStat: "المدة", paidPlan: "مدفوع", barterPlan: "مقايضة", barterPricing: "مقايضة / شهر واحد", duplicateError: "تمت إضافة هذه القناة بالفعل. افتح البطاقة الموجودة أو مدّد الظهور.", submitError: "تعذر إنشاء الطلب. حاول مرة أخرى.", networkError: "تعذر إنشاء الطلب. تحقق من الإنترنت وحاول مرة أخرى.", barterPost: "نص المقايضة: أخبار جيدة يا أصدقاء! الآن يمكن قراءة قناتنا أيضاً على margeleT.space",
    rulesBody: [
      "يجب أن تكون القناة قناة Telegram مفتوحة وبمحتوى منتظم.",
      "يُحظر الاحتيال والمخدرات والأسلحة والتطرف والإباحية والمحتوى الصادم والانتهاكات القانونية المباشرة.",
      "margeleT لا يعيد كتابة محتوى المؤلفين ويعيد المستخدم دائمًا إلى القناة الأصلية.",
      "قد ترفض المراجعة القناة قبل النشر.",
    ],
  },
  eg: undefined as any,
  sa: undefined as any,
  kk: {
    ...CHANNEL_UI.ru,
    authRequired: "Арналар қосу үшін авторизациядан өтіңіз.", formTitle: "Арна қосу", formText: "Арна деректерін толтырыңыз. Жібергеннен кейін Telegram-бот ашылады — онда төлеуге немесе бартер таңдауға болады.", nameLabel: "1️⃣ Telegram-дағы арна атауы", nameError: "Арна атауын енгізіңіз.", urlLabel: "2️⃣ Telegram арна сілтемесі", countryLabel: "3️⃣ Арна елі", tagsLabel: "4️⃣ Тегтер", planLabel: "5️⃣ Орналастыру тәсілі", barterText: "margeleT туралы нативті пост үшін 1 ай тегін.", submit: "Telegram-ботқа өту", myChannels: "Менің арналарым", pending: "ботты күтуде", active: "белсенді", paused: "пауза", expired: "аяқталды", canceled: "өшірілді", saveDonate: "Сақтау", openChannel: "Арнаға", renew: "Ұзарту", countryStat: "ел", typeStat: "түрі", termStat: "мерзім", paidPlan: "төлем", barterPlan: "бартер", barterPricing: "бартер / 1 ай",
  },
  uz: {
    ...CHANNEL_UI.ru,
    authRequired: "Kanallar qo‘shish uchun tizimga kiring.", formTitle: "Kanal qo‘shish", formText: "Kanal ma’lumotlarini to‘ldiring. Yuborgandan so‘ng Telegram-bot ochiladi — u yerda to‘lash yoki barter tanlash mumkin.", nameLabel: "1️⃣ Telegramdagi kanal nomi", nameError: "Kanal nomini kiriting.", urlLabel: "2️⃣ Telegram kanal havolasi", countryLabel: "3️⃣ Kanal mamlakati", tagsLabel: "4️⃣ Teglar", planLabel: "5️⃣ Joylashtirish usuli", paidText: "1 oy joylashtirish + Telegram donate havolasini qo‘shish imkoniyati.", barterText: "Kanalingizda margeleT haqida native post uchun 1 oy bepul.", submit: "Telegram-botga o‘tish", myChannels: "Mening kanallarim", pending: "bot kutilmoqda", active: "faol", paused: "pauza", expired: "muddati tugagan", canceled: "o‘chirilgan", saveDonate: "Saqlash", openChannel: "Kanalga", renew: "Uzaytirish", countryStat: "mamlakat", typeStat: "tur", termStat: "muddat", paidPlan: "to‘lov", barterPlan: "barter", barterPricing: "barter / 1 oy",
  },
};

CHANNEL_UI_BY_LOCALE.mx = CHANNEL_UI_BY_LOCALE.es;
CHANNEL_UI_BY_LOCALE.ar = CHANNEL_UI_BY_LOCALE.es;
CHANNEL_UI_BY_LOCALE.co = CHANNEL_UI_BY_LOCALE.es;
CHANNEL_UI_BY_LOCALE.eg = CHANNEL_UI_BY_LOCALE.ae;
CHANNEL_UI_BY_LOCALE.sa = CHANNEL_UI_BY_LOCALE.ae;

Object.assign(CHANNEL_UI_BY_LOCALE.kk, {
  authRequired: "Арналар қосу үшін кіріңіз.",
  formTitle: "Арна қосу",
  formText: "Арна деректерін толтырыңыз. Жібергеннен кейін Telegram-бот ашылады — онда төлеуге немесе бартер таңдауға болады.",
  nameLabel: "1️⃣ Telegram-дағы арна атауы",
  namePlaceholder: "Мысалы: margeleT space",
  nameError: "Арна атауын енгізіңіз.",
  urlLabel: "2️⃣ Telegram арна сілтемесі",
  countryLabel: "3️⃣ Арна елі",
  tagsLabel: "4️⃣ Тегтер",
  planLabel: "5️⃣ Орналастыру тәсілі",
  paidTitle: "Stars",
  paidText: "1 ай орналастыру + Telegram-donate сілтемесін қосу мүмкіндігі.",
  barterTitle: "Бартер",
  barterText: "margeleT туралы нативті пост үшін 1 ай тегін.",
  rulesTitle: "Орналастыру ережелері",
  rulesOpen: "Ережелерді көрсету",
  rulesClose: "Ережелерді жасыру",
  rulesAgree: "Мен ережелерді оқыдым және арна модерациядан өтетінін түсінемін.",
  submit: "Telegram-ботқа өту",
  emptyError: "Telegram арна сілтемесін енгізіңіз.",
  invalidError: "https://t.me/channel_name түріндегі сілтеме қажет",
  rulesError: "Алдымен ережелерді қабылдау керек.",
  tagsError: "Кемінде бір негізгі тег таңдаңыз.",
  maxTagsError: "Ең көбі 3 негізгі тег таңдауға болады.",
  showAllTags: "Тегтерді таңдау",
  hideTags: "Тегтерді жабу",
  applyTags: "Тегтерді қолдану",
  tagsPlaceholder: "3 тақырыпқа дейін таңдау үшін басыңыз",
  childrenHint: "Таңдалған тақырып ішінде ішкі тегтерді нақтылауға болады.",
  myChannels: "Менің арналарым",
  noChannels: "Мұнда өтінімдеріңіз және белсенді орналастырулар көрсетіледі.",
  draft: "жоба",
  pending: "ботты күтуде",
  active: "белсенді",
  paused: "пауза",
  expired: "мерзімі өтті",
  canceled: "жойылды",
  daysLeft: "Қалды",
  price: "Тариф",
  donateOnlyPaid: "Donate-сілтеме тек ақылы орналастыру үшін қолжетімді.",
  donateLabel: "Telegram donate-сілтеме",
  donatePlaceholder: "https://t.me/your_channel?direct",
  donateInvalid: "?direct параметрі бар Telegram-сілтеме қажет",
  donateSaved: "Donate-сілтеме сақталды.",
  saveDonate: "Сақтау",
  openBot: "Ботты ашу",
  openChannel: "Арнаға",
  renew: "Ұзарту",
  countryStat: "ел",
  typeStat: "түрі",
  termStat: "мерзім",
  paidPlan: "төлем",
  barterPlan: "бартер",
  barterPricing: "бартер / 1 ай",
  duplicateError: "Бұл арна бұрын қосылған. Бар карточканы ашыңыз немесе орналастыруды ұзартыңыз.",
  submitError: "Өтінім жасау мүмкін болмады. Қайталап көріңіз.",
  networkError: "Өтінім жасау мүмкін болмады. Интернетті тексеріп, қайта көріңіз.",
  activeText: "белсенді",
  expiredText: "мерзімі өтті",
  pausedText: "пауза",
  waitingBotText: "ботты күтуде",
  barterPost: "Бартер мәтіні: Жақсы жаңалық, достар! Енді біздің арнаны margeleT.space сайтында да оқуға болады",
  rulesBody: [
    "Арна қалыпты әрі тұрақты контенті бар ашық Telegram-арна болуы керек.",
    "✋ ҚАТАҢ ТЫЙЫМ САЛЫНАДЫ; скам, алаяқтық, есірткі, қару, экстремизм, порнография, шок-контент және заңды тікелей бұзу.",
    "*✋ Қатаң тыйым салынады* ережесі бұзылса, модерация арнаны автоматты жариялаусыз қабылдамауы мүмкін, бұл жағдайда Stars қайтарылмайды.",
    "margeleT авторлық контентті қайта жазбайды және пайдаланушыны әрдайым түпнұсқа арнаға қайта апарады.",
    "Telegram арнасында кез келген жаңа пост жарияланғаннан кейін посттар margeleT лентасында дәл 24 сағат пайда болып тұрады.",
  ],
});

Object.assign(CHANNEL_UI_BY_LOCALE.uz, {
  authRequired: "Kanallar qo‘shish uchun tizimga kiring.",
  formTitle: "Kanal qo‘shish",
  formText: "Kanal ma’lumotlarini to‘ldiring. Yuborgandan so‘ng Telegram-bot ochiladi — u yerda to‘lash yoki barter tanlash mumkin.",
  nameLabel: "1️⃣ Telegramdagi kanal nomi",
  namePlaceholder: "Masalan: margeleT space",
  nameError: "Kanal nomini kiriting.",
  urlLabel: "2️⃣ Telegram kanal havolasi",
  countryLabel: "3️⃣ Kanal mamlakati",
  tagsLabel: "4️⃣ Teglar",
  planLabel: "5️⃣ Joylashtirish usuli",
  paidTitle: "Stars",
  paidText: "1 oy joylashtirish + Telegram donate havolasini qo‘shish imkoniyati.",
  barterTitle: "Barter",
  barterText: "Kanalingizda margeleT haqida native post uchun 1 oy bepul.",
  rulesTitle: "Joylashtirish qoidalari",
  rulesOpen: "Qoidalarni ko‘rsatish",
  rulesClose: "Qoidalarni yashirish",
  rulesAgree: "Men qoidalarni o‘qidim va kanal moderatsiyadan o‘tishini tushunaman.",
  submit: "Telegram-botga o‘tish",
  emptyError: "Telegram kanal havolasini kiriting.",
  invalidError: "https://t.me/channel_name ko‘rinishidagi havola kerak",
  rulesError: "Avval qoidalarni qabul qiling.",
  tagsError: "Kamida bitta asosiy teg tanlang.",
  maxTagsError: "Ko‘pi bilan 3 ta asosiy teg tanlash mumkin.",
  showAllTags: "Teglarni tanlash",
  hideTags: "Teglarni yopish",
  applyTags: "Teglarni qo‘llash",
  tagsPlaceholder: "3 ta mavzugacha tanlash uchun bosing",
  childrenHint: "Tanlangan mavzu ichida ichki teglarni aniqlashtirish mumkin.",
  myChannels: "Mening kanallarim",
  noChannels: "Bu yerda so‘rovlaringiz va faol joylashtirishlaringiz ko‘rinadi.",
  draft: "qoralama",
  pending: "bot kutilmoqda",
  active: "faol",
  paused: "pauza",
  expired: "muddati tugagan",
  canceled: "o‘chirilgan",
  daysLeft: "Qoldi",
  price: "Tarif",
  donateOnlyPaid: "Donate havolasi faqat pullik joylashtirish uchun mavjud.",
  donateLabel: "Telegram donate-havola",
  donatePlaceholder: "https://t.me/your_channel?direct",
  donateInvalid: "?direct parametri bor Telegram havola kerak",
  donateSaved: "Donate havolasi saqlandi.",
  saveDonate: "Saqlash",
  openBot: "Botni ochish",
  openChannel: "Kanalga",
  renew: "Uzaytirish",
  countryStat: "mamlakat",
  typeStat: "tur",
  termStat: "muddat",
  paidPlan: "to‘lov",
  barterPlan: "barter",
  barterPricing: "barter / 1 oy",
  duplicateError: "Bu kanal allaqachon qo‘shilgan. Mavjud kartani oching yoki joylashtirishni uzaytiring.",
  submitError: "So‘rov yaratib bo‘lmadi. Qayta urinib ko‘ring.",
  networkError: "So‘rov yaratib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.",
  activeText: "faol",
  expiredText: "muddati tugagan",
  pausedText: "pauza",
  waitingBotText: "bot kutilmoqda",
  barterPost: "Barter matni: Yaxshi yangilik, do‘stlar! Endi kanalimizni margeleT.space saytida ham o‘qish mumkin",
  rulesBody: [
    "Kanal normal va muntazam kontentga ega ochiq Telegram-kanal bo‘lishi kerak.",
    "✋ QAT’IYAN TAQIQLANADI; scam, firibgarlik, narkotiklar, qurol, ekstremizm, pornografiya, shok-kontent va qonunni bevosita buzish.",
    "*✋ Qat’iyan taqiqlanadi* qoidasi buzilsa, moderatsiya kanalni avtomatik nashrsiz rad etishi mumkin, bunda Stars qaytarilmaydi.",
    "margeleT muallif kontentini qayta yozmaydi va foydalanuvchini har doim asl kanalga qaytaradi.",
    "Telegram kanalida har qanday yangi post e’lon qilingandan so‘ng postlar margeleT lentasida aynan 24 soat davomida paydo bo‘ladi va turadi.",
  ],
});

const RULES_BODY_BY_LOCALE: Partial<Record<Locale, readonly string[]>> = {
  ru: [
    "Канал должен быть открытым Telegram-каналом с нормальным регулярным контентом.",
    "✋ СТРОГО ЗАПРЕЩЕНЫ; скам, мошенничество, наркотики, оружие, экстремизм, порнография, шок-контент и прямые нарушения закона.",
    "При нарушении правил пункта *✋ Строго запрещены* модерация может отклонить канал без автоматической публикации, при этом Stars не возвращаются.",
    "margeleT не переписывает авторский контент и всегда ведёт пользователя обратно к оригинальному каналу.",
    "Посты появляются и живут в ленте margeleT ровно 24 часа после того как вы опубликовали любой свежий пост в канале Telegram.",
  ],
  uk: [
    "Канал має бути відкритим Telegram-каналом із нормальним регулярним контентом.",
    "✋ СУВОРО ЗАБОРОНЕНО; скам, шахрайство, наркотики, зброя, екстремізм, порнографія, шок-контент і прямі порушення закону.",
    "У разі порушення правила *✋ Суворо заборонено* модерація може відхилити канал без автоматичної публікації, при цьому Stars не повертаються.",
    "margeleT не переписує авторський контент і завжди веде користувача назад до оригінального каналу.",
    "Пости з’являються і живуть у стрічці margeleT рівно 24 години після того, як ви опублікували будь-який свіжий пост у Telegram-каналі.",
  ],
  en: [
    "The channel must be an open Telegram channel with normal regular content.",
    "✋ STRICTLY PROHIBITED; scams, fraud, drugs, weapons, extremism, pornography, shock content and direct violations of the law.",
    "If the *✋ Strictly prohibited* rule is violated, moderation may reject the channel without automatic publication, and Stars are not refunded.",
    "margeleT does not rewrite creator content and always sends users back to the original channel.",
    "Posts appear and live in the margeleT feed for exactly 24 hours after you publish any fresh post in your Telegram channel.",
  ],
  za: [
    "The channel must be an open Telegram channel with normal regular content.",
    "✋ STRICTLY PROHIBITED; scams, fraud, drugs, weapons, extremism, pornography, shock content and direct violations of the law.",
    "If the *✋ Strictly prohibited* rule is violated, moderation may reject the channel without automatic publication, and Stars are not refunded.",
    "margeleT does not rewrite creator content and always sends users back to the original channel.",
    "Posts appear and live in the margeleT feed for exactly 24 hours after you publish any fresh post in your Telegram channel.",
  ],
  ng: [
    "The channel must be an open Telegram channel with normal regular content.",
    "✋ STRICTLY PROHIBITED; scams, fraud, drugs, weapons, extremism, pornography, shock content and direct violations of the law.",
    "If the *✋ Strictly prohibited* rule is violated, moderation may reject the channel without automatic publication, and Stars are not refunded.",
    "margeleT does not rewrite creator content and always sends users back to the original channel.",
    "Posts appear and live in the margeleT feed for exactly 24 hours after you publish any fresh post in your Telegram channel.",
  ],
  zh: [
    "频道必须是开放的 Telegram 频道，并有正常、定期的内容。",
    "✋ 严格禁止；诈骗、欺诈、毒品、武器、极端主义、色情、冲击性内容以及直接违法行为。",
    "如果违反 *✋ 严格禁止* 规则，审核可以拒绝频道且不会自动发布，同时 Stars 不会退还。",
    "margeleT 不会改写作者内容，并始终把用户带回原始频道。",
    "当你在 Telegram 频道发布任何新帖子后，帖子会在 margeleT 信息流中显示并保留整整 24 小时。",
  ],
  de: [
    "Der Kanal muss ein offener Telegram-Kanal mit normalem, regelmäßigem Inhalt sein.",
    "✋ STRENG VERBOTEN; Scams, Betrug, Drogen, Waffen, Extremismus, Pornografie, Schockinhalte und direkte Gesetzesverstöße.",
    "Bei einem Verstoß gegen die Regel *✋ Streng verboten* kann die Moderation den Kanal ohne automatische Veröffentlichung ablehnen; Stars werden dabei nicht erstattet.",
    "margeleT schreibt Autoreninhalte nicht um und führt Nutzer immer zurück zum Originalkanal.",
    "Posts erscheinen und bleiben genau 24 Stunden im margeleT-Feed, nachdem du einen neuen Post im Telegram-Kanal veröffentlicht hast.",
  ],
  es: [
    "El canal debe ser un canal abierto de Telegram con contenido normal y regular.",
    "✋ ESTRICTAMENTE PROHIBIDO; estafas, fraude, drogas, armas, extremismo, pornografía, contenido impactante y violaciones directas de la ley.",
    "Si se viola la regla *✋ Estrictamente prohibido*, la moderación puede rechazar el canal sin publicación automática y los Stars no se devuelven.",
    "margeleT no reescribe el contenido del autor y siempre lleva al usuario de vuelta al canal original.",
    "Las publicaciones aparecen y viven en el feed de margeleT exactamente 24 horas después de que publiques cualquier post nuevo en el canal de Telegram.",
  ],
  mx: [
    "El canal debe ser un canal abierto de Telegram con contenido normal y regular.",
    "✋ ESTRICTAMENTE PROHIBIDO; estafas, fraude, drogas, armas, extremismo, pornografía, contenido impactante y violaciones directas de la ley.",
    "Si se viola la regla *✋ Estrictamente prohibido*, la moderación puede rechazar el canal sin publicación automática y los Stars no se devuelven.",
    "margeleT no reescribe el contenido del autor y siempre lleva al usuario de vuelta al canal original.",
    "Las publicaciones aparecen y viven en el feed de margeleT exactamente 24 horas después de que publiques cualquier post nuevo en el canal de Telegram.",
  ],
  ar: [
    "El canal debe ser un canal abierto de Telegram con contenido normal y regular.",
    "✋ ESTRICTAMENTE PROHIBIDO; estafas, fraude, drogas, armas, extremismo, pornografía, contenido impactante y violaciones directas de la ley.",
    "Si se viola la regla *✋ Estrictamente prohibido*, la moderación puede rechazar el canal sin publicación automática y los Stars no se devuelven.",
    "margeleT no reescribe el contenido del autor y siempre lleva al usuario de vuelta al canal original.",
    "Las publicaciones aparecen y viven en el feed de margeleT exactamente 24 horas después de que publiques cualquier post nuevo en el canal de Telegram.",
  ],
  co: [
    "El canal debe ser un canal abierto de Telegram con contenido normal y regular.",
    "✋ ESTRICTAMENTE PROHIBIDO; estafas, fraude, drogas, armas, extremismo, pornografía, contenido impactante y violaciones directas de la ley.",
    "Si se viola la regla *✋ Estrictamente prohibido*, la moderación puede rechazar el canal sin publicación automática y los Stars no se devuelven.",
    "margeleT no reescribe el contenido del autor y siempre lleva al usuario de vuelta al canal original.",
    "Las publicaciones aparecen y viven en el feed de margeleT exactamente 24 horas después de que publiques cualquier post nuevo en el canal de Telegram.",
  ],
  fr: [
    "La chaîne doit être une chaîne Telegram ouverte avec du contenu normal et régulier.",
    "✋ STRICTEMENT INTERDIT ; arnaques, fraude, drogues, armes, extrémisme, pornographie, contenu choquant et violations directes de la loi.",
    "En cas de violation de la règle *✋ Strictement interdit*, la modération peut refuser la chaîne sans publication automatique, et les Stars ne sont pas remboursés.",
    "margeleT ne réécrit pas le contenu des auteurs et renvoie toujours l’utilisateur vers la chaîne originale.",
    "Les posts apparaissent et restent dans le feed margeleT exactement 24 heures après la publication de tout nouveau post dans la chaîne Telegram.",
  ],
  it: [
    "Il canale deve essere un canale Telegram aperto con contenuti normali e regolari.",
    "✋ SEVERAMENTE VIETATO; scam, frodi, droghe, armi, estremismo, pornografia, contenuti shock e violazioni dirette della legge.",
    "Se viene violata la regola *✋ Severamente vietato*, la moderazione può rifiutare il canale senza pubblicazione automatica e gli Stars non vengono rimborsati.",
    "margeleT non riscrive i contenuti degli autori e riporta sempre l’utente al canale originale.",
    "I post appaiono e restano nel feed margeleT per esattamente 24 ore dopo la pubblicazione di qualsiasi nuovo post nel canale Telegram.",
  ],
  "pt-br": [
    "O canal deve ser um canal aberto do Telegram com conteúdo normal e regular.",
    "✋ ESTRITAMENTE PROIBIDO; golpes, fraudes, drogas, armas, extremismo, pornografia, conteúdo chocante e violações diretas da lei.",
    "Se a regra *✋ Estritamente proibido* for violada, a moderação pode rejeitar o canal sem publicação automática, e os Stars não são reembolsados.",
    "margeleT não reescreve o conteúdo dos autores e sempre leva o usuário de volta ao canal original.",
    "Os posts aparecem e ficam no feed do margeleT por exatamente 24 horas depois que você publica qualquer post novo no canal do Telegram.",
  ],
  tr: [
    "Kanal, normal ve düzenli içerik paylaşan açık bir Telegram kanalı olmalıdır.",
    "✋ KESİNLİKLE YASAKTIR; scam, dolandırıcılık, uyuşturucu, silah, aşırılık, pornografi, şok içerik ve doğrudan yasa ihlalleri.",
    "*✋ Kesinlikle yasaktır* kuralı ihlal edilirse moderasyon kanalı otomatik yayın olmadan reddedebilir ve Stars iade edilmez.",
    "margeleT yazar içeriğini yeniden yazmaz ve kullanıcıyı her zaman orijinal kanala geri götürür.",
    "Telegram kanalında yeni bir gönderi yayınladıktan sonra gönderiler margeleT akışında tam 24 saat görünür ve yaşar.",
  ],
  id: [
    "Channel harus berupa channel Telegram terbuka dengan konten normal dan rutin.",
    "✋ DILARANG KERAS; scam, penipuan, narkoba, senjata, ekstremisme, pornografi, konten mengejutkan, dan pelanggaran hukum langsung.",
    "Jika aturan *✋ Dilarang keras* dilanggar, moderasi dapat menolak channel tanpa publikasi otomatis, dan Stars tidak dikembalikan.",
    "margeleT tidak menulis ulang konten kreator dan selalu mengarahkan pengguna kembali ke channel asli.",
    "Post muncul dan hidup di feed margeleT tepat 24 jam setelah kamu menerbitkan post baru di channel Telegram.",
  ],
  ms: [
    "Saluran mestilah saluran Telegram terbuka dengan kandungan normal dan berkala.",
    "✋ DILARANG SAMA SEKALI; scam, penipuan, dadah, senjata, ekstremisme, pornografi, kandungan mengejutkan dan pelanggaran undang-undang secara langsung.",
    "Jika peraturan *✋ Dilarang sama sekali* dilanggar, moderasi boleh menolak saluran tanpa penerbitan automatik, dan Stars tidak dipulangkan.",
    "margeleT tidak menulis semula kandungan pencipta dan sentiasa membawa pengguna kembali ke saluran asal.",
    "Post muncul dan kekal dalam feed margeleT tepat 24 jam selepas anda menerbitkan sebarang post baharu dalam saluran Telegram.",
  ],
  in: [
    "चैनल एक खुला Telegram चैनल होना चाहिए जिसमें सामान्य और नियमित कंटेंट हो।",
    "✋ सख्त मना है; scam, धोखाधड़ी, ड्रग्स, हथियार, extremism, pornography, shock-content और कानून के सीधे उल्लंघन।",
    "अगर *✋ सख्त मना है* नियम का उल्लंघन होता है, तो moderation चैनल को automatic publication के बिना reject कर सकती है, और Stars वापस नहीं किए जाते।",
    "margeleT लेखक का कंटेंट rewrite नहीं करता और हमेशा user को original channel पर वापस ले जाता है।",
    "Telegram चैनल में कोई भी नया post publish करने के बाद posts margeleT feed में ठीक 24 घंटे तक दिखाई देते और रहते हैं।",
  ],
  pk: [
    "چینل ایک کھلا Telegram چینل ہونا چاہیے جس میں نارمل اور باقاعدہ مواد ہو۔",
    "✋ سختی سے ممنوع؛ اسکیم، دھوکہ دہی، منشیات، ہتھیار، انتہا پسندی، فحش مواد، shock-content اور قانون کی براہِ راست خلاف ورزیاں۔",
    "اگر *✋ سختی سے ممنوع* اصول کی خلاف ورزی ہو تو moderation چینل کو automatic publication کے بغیر reject کر سکتی ہے، اور Stars واپس نہیں کیے جاتے۔",
    "margeleT مصنف کا مواد دوبارہ نہیں لکھتا اور ہمیشہ صارف کو اصل چینل پر واپس لے جاتا ہے۔",
    "Telegram چینل میں کوئی بھی نیا post شائع کرنے کے بعد posts margeleT feed میں بالکل 24 گھنٹے تک دکھائی دیتے اور رہتے ہیں۔",
  ],
  fa: [
    "کانال باید یک کانال باز Telegram با محتوای عادی و منظم باشد.",
    "✋ به‌شدت ممنوع است؛ اسکم، کلاهبرداری، مواد مخدر، سلاح، افراط‌گرایی، پورنوگرافی، محتوای شوک‌آور و نقض مستقیم قانون.",
    "در صورت نقض قانون *✋ به‌شدت ممنوع است*، moderation می‌تواند کانال را بدون انتشار خودکار رد کند و Stars بازگردانده نمی‌شود.",
    "margeleT محتوای نویسنده را بازنویسی نمی‌کند و همیشه کاربر را به کانال اصلی بازمی‌گرداند.",
    "پست‌ها دقیقاً ۲۴ ساعت پس از انتشار هر پست تازه در کانال Telegram، در فید margeleT ظاهر می‌شوند و باقی می‌مانند.",
  ],
  ae: [
    "يجب أن تكون القناة قناة Telegram مفتوحة وبمحتوى طبيعي ومنتظم.",
    "✋ ممنوع تمامًا؛ الاحتيال، الخداع، المخدرات، الأسلحة، التطرف، الإباحية، المحتوى الصادم والانتهاكات المباشرة للقانون.",
    "عند مخالفة قاعدة *✋ ممنوع تمامًا* قد ترفض المراجعة القناة بدون نشر تلقائي، ولا يتم استرداد Stars.",
    "margeleT لا يعيد كتابة محتوى المؤلفين ويعيد المستخدم دائمًا إلى القناة الأصلية.",
    "تظهر المنشورات وتبقى في موجز margeleT لمدة 24 ساعة بالضبط بعد نشر أي منشور جديد في قناة Telegram.",
  ],
  eg: [
    "يجب أن تكون القناة قناة Telegram مفتوحة وبمحتوى طبيعي ومنتظم.",
    "✋ ممنوع تمامًا؛ الاحتيال، الخداع، المخدرات، الأسلحة، التطرف، الإباحية، المحتوى الصادم والانتهاكات المباشرة للقانون.",
    "عند مخالفة قاعدة *✋ ممنوع تمامًا* قد ترفض المراجعة القناة بدون نشر تلقائي، ولا يتم استرداد Stars.",
    "margeleT لا يعيد كتابة محتوى المؤلفين ويعيد المستخدم دائمًا إلى القناة الأصلية.",
    "تظهر المنشورات وتبقى في موجز margeleT لمدة 24 ساعة بالضبط بعد نشر أي منشور جديد في قناة Telegram.",
  ],
  sa: [
    "يجب أن تكون القناة قناة Telegram مفتوحة وبمحتوى طبيعي ومنتظم.",
    "✋ ممنوع تمامًا؛ الاحتيال، الخداع، المخدرات، الأسلحة، التطرف، الإباحية، المحتوى الصادم والانتهاكات المباشرة للقانون.",
    "عند مخالفة قاعدة *✋ ممنوع تمامًا* قد ترفض المراجعة القناة بدون نشر تلقائي، ولا يتم استرداد Stars.",
    "margeleT لا يعيد كتابة محتوى المؤلفين ويعيد المستخدم دائمًا إلى القناة الأصلية.",
    "تظهر المنشورات وتبقى في موجز margeleT لمدة 24 ساعة بالضبط بعد نشر أي منشور جديد في قناة Telegram.",
  ],
  kk: [
    "Арна қалыпты әрі тұрақты контенті бар ашық Telegram-арна болуы керек.",
    "✋ ҚАТАҢ ТЫЙЫМ САЛЫНАДЫ; скам, алаяқтық, есірткі, қару, экстремизм, порнография, шок-контент және заңды тікелей бұзу.",
    "*✋ Қатаң тыйым салынады* ережесі бұзылса, модерация арнаны автоматты жариялаусыз қабылдамауы мүмкін, бұл жағдайда Stars қайтарылмайды.",
    "margeleT авторлық контентті қайта жазбайды және пайдаланушыны әрдайым түпнұсқа арнаға қайта апарады.",
    "Telegram арнасында кез келген жаңа пост жарияланғаннан кейін посттар margeleT лентасында дәл 24 сағат пайда болып тұрады.",
  ],
  uz: [
    "Kanal normal va muntazam kontentga ega ochiq Telegram-kanal bo‘lishi kerak.",
    "✋ QAT’IYAN TAQIQLANADI; scam, firibgarlik, narkotiklar, qurol, ekstremizm, pornografiya, shok-kontent va qonunni bevosita buzish.",
    "*✋ Qat’iyan taqiqlanadi* qoidasi buzilsa, moderatsiya kanalni avtomatik nashrsiz rad etishi mumkin, bunda Stars qaytarilmaydi.",
    "margeleT muallif kontentini qayta yozmaydi va foydalanuvchini har doim asl kanalga qaytaradi.",
    "Telegram kanalida har qanday yangi post e’lon qilingandan so‘ng postlar margeleT lentasida aynan 24 soat davomida paydo bo‘ladi va turadi.",
  ],
};

Object.entries(RULES_BODY_BY_LOCALE).forEach(([key, rulesBody]) => {
  const localeKey = key as Locale;
  const current = CHANNEL_UI_BY_LOCALE[localeKey];
  if (current) {
    CHANNEL_UI_BY_LOCALE[localeKey] = { ...current, rulesBody };
  }
});

function getUi(locale: Locale): ChannelUi {
  return CHANNEL_UI_BY_LOCALE[locale] ?? CHANNEL_UI.en;
}

function buildBotUrl(item: CreatorChannelPlacement) {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${encodeURIComponent(`p_${item.id}`)}`;
}

export function CreatorChannelPanel({
  copy,
  locale,
  user,
}: {
  copy: ScreenCopy;
  locale: Locale;
  user: TgUser | null;
}) {
  const ui = getUi(locale);
  const [channelTitle, setChannelTitle] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [country, setCountry] = useState<Locale>(locale);
  const [tags, setTags] = useState<string[]>([]);
  const [plan, setPlan] = useState<CreatorChannelPlan>("paid");
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [openTagGroups, setOpenTagGroups] = useState<string[]>([]);
  const [channels, setChannels] = useState<CreatorChannelPlacement[]>(() =>
    user ? dedupeCreatorChannels(readCreatorChannels(user.id)) : []
  );
  const [donateDrafts, setDonateDrafts] = useState<Record<string, string>>({});

  const pricing = getCreatorPricing(country);
  const tagGroups = useMemo(() => SITE_TAG_GROUPS, []);

  useEffect(() => {
    if (!user) return;

    let alive = true;

    const syncPlacements = async () => {
      try {
        const response = await fetch(
          `/api/telegram-webhook?ownerTelegramId=${encodeURIComponent(user.id)}`
        );

        const data = await response.json();

        if (!alive || !data?.ok || !Array.isArray(data.items)) return;

        setChannels(() => {
          const remoteItems = data.items
            .filter((remote: any) => remote?.status !== "canceled")
            .map((remote: any) => ({
              id: String(remote.id || [remote.ownerTelegramId, remote.channelHandle, remote.country].join("_")),
              ownerTelegramId: String(remote.ownerTelegramId || user.id),
              channelUrl: "https://t.me/" + String(remote.channelHandle || "").replace(/^@+/, ""),
              channelHandle: String(remote.channelHandle || "").replace(/^@+/, ""),
              channelTitle: remote.channelTitle,
              channelAvatarUrl: remote.channelAvatarUrl ?? null,
              verified: Boolean(remote.verified),
              country: String(remote.country || locale).toLowerCase() as Locale,
              tags: Array.isArray(remote.tags) ? remote.tags : [],
              plan: remote.plan === "barter" ? "barter" : "paid",
              status: remote.status || "pending",
              createdAt: remote.createdAt || new Date().toISOString(),
              startsAt: remote.startAt ?? remote.startsAt ?? null,
              endsAt: remote.endsAt ?? null,
              pricingLabel: remote.pricingLabel || "",
              donateUrl: remote.donateUrl ?? null,
            }));

          const next = dedupeCreatorChannels(remoteItems);
          writeCreatorChannels(next);
          return next;
        });
      } catch {
        // silent sync fail
      }
    };
    

    syncPlacements();
    const timer = window.setInterval(syncPlacements, 15000);

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [user]);

  const selectedParentTags = tags.filter((value) => SITE_TAG_GROUPS.some((group) => group.value === value));

  const selectedParentLabels = selectedParentTags
    .map((value) => SITE_TAG_GROUPS.find((group) => group.value === value))
    .filter(Boolean)
    .map((group) => getTagLabel(group as SiteTagGroup, locale));

  const toggleTagGroupOpen = (value: string) => {
    setOpenTagGroups((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  const toggleParentTag = (group: SiteTagGroup) => {
    const active = tags.includes(group.value);

    if (active) {
      const childValues = group.children.map((child) => child.value);
      setTags((current) => current.filter((item) => item !== group.value && !childValues.includes(item)));
      return;
    }

    if (selectedParentTags.length >= MAX_PARENT_TAGS) {
      alert(ui.maxTagsError);
      return;
    }

    setTags((current) => [...current, group.value]);
    setOpenTagGroups((current) => (current.includes(group.value) ? current : [...current, group.value]));
  };

  const toggleChildTag = (group: SiteTagGroup, childValue: string) => {
    const parentActive = tags.includes(group.value);
    const childActive = tags.includes(childValue);

    if (childActive) {
      setTags((current) => current.filter((item) => item !== childValue));
      return;
    }

    if (!parentActive) {
      if (selectedParentTags.length >= MAX_PARENT_TAGS) {
        alert(ui.maxTagsError);
        return;
      }

      setTags((current) => [...current, group.value, childValue]);
      return;
    }

    setTags((current) => [...current, childValue]);
  };

  const handleSubmit = async () => {
    if (!user) {
      alert(ui.authRequired);
      return;
    }

    const cleanChannelTitle = channelTitle.trim();
    if (!cleanChannelTitle) {
      alert(ui.nameError);
      return;
    }

    const normalized = normalizeChannelUrl(channelUrl);
    if (!channelUrl.trim()) {
      alert(ui.emptyError);
      return;
    }

    if (!normalized) {
      alert(ui.invalidError);
      return;
    }

    if (!selectedParentTags.length) {
      alert(ui.tagsError);
      return;
    }

    if (!rulesAccepted) {
      alert(ui.rulesError);
      return;
    }

    const duplicate = channels.find(
      (item) =>
        String(item.channelHandle).replace(/^@+/, "").toLowerCase() === normalized.handle.toLowerCase() &&
        String(item.country).toLowerCase() === String(country).toLowerCase()
    );

    if (duplicate) {
      alert(ui.duplicateError);
      return;
    }

    const now = new Date().toISOString();
    const item: CreatorChannelPlacement = {
      id: `${user.id}_${normalized.handle.toLowerCase()}_${String(country).toLowerCase()}`,
      ownerTelegramId: user.id,
      channelUrl: normalized.url,
      channelHandle: normalized.handle,
      channelTitle: cleanChannelTitle,
      channelAvatarUrl: null,
      verified: false,
      country,
      tags,
      plan,
      status: "pending",
      createdAt: now,
      startsAt: null,
      endsAt: null,
      pricingLabel: plan === "paid" ? pricing.label : ui.barterPricing,
      donateUrl: null,
    };

    try {
      const response = await fetch("/api/telegram-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "site", action: "upsert_placement", placement: item }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        alert(ui.submitError);
        return;
      }
    } catch {
      alert(ui.networkError);
      return;
    }

    appendCreatorChannel(item);
    setChannels((current) => dedupeCreatorChannels([item, ...current]));
    setChannelTitle("");
    setChannelUrl("");
    setTags([]);
    setRulesAccepted(false);
    setOpenTagGroups([]);

    window.open(buildBotUrl(item), "_blank", "noopener,noreferrer");
  };

  const saveDonateUrl = (item: CreatorChannelPlacement, value: string) => {
    const normalizedDonateUrl = normalizeTelegramDonateUrl(value);

    if (normalizedDonateUrl === null) {
      alert(ui.donateInvalid);
      return;
    }

    const nextItem = { ...item, donateUrl: normalizedDonateUrl || null };
    updateCreatorChannel(nextItem);
    setChannels((current) => current.map((channel) => (channel.id === item.id ? nextItem : channel)));
    setDonateDrafts((current) => ({ ...current, [item.id]: normalizedDonateUrl }));
    alert(ui.donateSaved);
  };

  const renewPlacement = (item: CreatorChannelPlacement) => {
    const nextItem: CreatorChannelPlacement = {
      ...item,
      status: "pending",
      startsAt: null,
      endsAt: null,
    };

    updateCreatorChannel(nextItem);
    setChannels((current) => current.map((channel) => (channel.id === item.id ? nextItem : channel)));
    window.open(buildBotUrl(nextItem), "_blank", "noopener,noreferrer");
  };


  return (
    <div className="space-y-4">
      <div className="px-1">
        <div className="text-primary mb-3 flex items-center gap-2 text-sm font-semibold">
          <Send className="h-4 w-4" />
          {ui.formTitle}
        </div>

        {!user ? (
          <div className="mb-4 rounded-3xl border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-700 dark:text-blue-300">
            {ui.authRequired}
          </div>
        ) : null}

        <div className="text-secondary text-sm leading-6">{ui.formText}</div>

        <label className="text-secondary mt-5 block text-xs font-semibold uppercase tracking-[0.14em]">
          {ui.nameLabel}
        </label>
        <input
          value={channelTitle}
          onChange={(event) => setChannelTitle(event.target.value)}
          placeholder={ui.namePlaceholder}
          className="mt-2 w-full rounded-full border border-soft bg-surface-soft px-4 py-3 text-sm text-primary shadow-inner outline-none transition focus-border-strong dark:bg-white/10"
        />

        <label className="text-secondary mt-5 block text-xs font-semibold uppercase tracking-[0.14em]">
          {ui.urlLabel}
        </label>
        <input
          value={channelUrl}
          onChange={(event) => setChannelUrl(event.target.value)}
          placeholder={copy.channelPlaceholder}
          className="mt-2 w-full rounded-full border border-soft bg-surface-soft px-4 py-3 text-sm text-primary shadow-inner outline-none transition focus-border-strong dark:bg-white/10"
        />

        <label className="text-secondary mt-5 block text-xs font-semibold uppercase tracking-[0.14em]">
          {ui.countryLabel}
        </label>
        <div className="relative mt-2">
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value as Locale)}
            className="w-full appearance-none rounded-full border border-soft bg-surface-soft px-4 py-3 pr-11 text-sm text-primary shadow-inner outline-none transition focus-border-strong dark:bg-white/10"
          >
            {SITE_LOCALES.map((item) => (
              <option
                key={item.code}
                value={item.code}
                className="bg-[#142434] text-white dark:bg-[#142434] dark:text-white"
              >
                {item.label} · {item.nativeLabel}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
        </div>


        <div className="mt-5 flex items-end justify-between gap-3">
          <label className="text-secondary block text-xs font-semibold uppercase tracking-[0.14em]">
            {ui.tagsLabel}
          </label>
          <div className="text-secondary text-xs">
            {selectedParentTags.length}/{MAX_PARENT_TAGS}
          </div>
        </div>

        <div className="mt-2 rounded-[24px] border border-soft bg-surface-soft p-2">
          <button
            type="button"
            onClick={() => setTagPickerOpen((value) => !value)}
            className="flex w-full items-center justify-between gap-3 rounded-[18px] border border-soft bg-surface-soft px-4 py-3 text-left shadow-inner transition hover:bg-white/90 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <div className="min-w-0 flex-1">
              {selectedParentLabels.length ? (
                <div className="flex flex-wrap gap-2">
                  {selectedParentLabels.map((label) => (
                    <span key={label} className="rounded-full bg-strong/10 px-3 py-1 text-xs font-semibold text-strong">
                      {label}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-secondary text-sm">{ui.tagsPlaceholder}</div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-secondary text-xs">{selectedParentTags.length}/{MAX_PARENT_TAGS}</span>
              {tagPickerOpen ? <ChevronUp className="h-4 w-4 text-secondary" /> : <ChevronDown className="h-4 w-4 text-secondary" />}
            </div>
          </button>

          {tagPickerOpen ? (
            <div className="mt-3 space-y-3">
              {tagGroups.map((group) => {
                const parentActive = tags.includes(group.value);
                const groupOpen = openTagGroups.includes(group.value);
                const hasChildren = group.children.length > 0;

                return (
                  <div key={group.value} className="rounded-[22px] border border-soft bg-surface p-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleParentTag(group)}
                        className={`min-w-0 flex-1 rounded-full border px-3 py-2 text-left text-xs font-medium transition ${
                          parentActive
                            ? "border-strong bg-strong text-strong-foreground"
                            : "border-soft bg-surface-hover text-secondary"
                        }`}
                      >
                        {getTagLabel(group, locale)}
                      </button>

                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => toggleTagGroupOpen(group.value)}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-soft bg-surface text-secondary transition hover:text-primary"
                          aria-label={groupOpen ? ui.hideTags : ui.showAllTags}
                        >
                          {groupOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      ) : null}
                    </div>

                    {hasChildren && groupOpen ? (
                      <div className="mt-2 flex flex-wrap gap-2 px-1 pb-1">
                        {group.children.map((child) => {
                          const active = tags.includes(child.value);
                          return (
                            <button
                              key={child.value}
                              type="button"
                              onClick={() => toggleChildTag(group, child.value)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                                active
                                  ? "border-strong bg-strong text-strong-foreground"
                                  : "border-soft bg-surface text-secondary"
                              }`}
                            >
                              {child.emoji} {child.labels[locale] ?? child.labels.en}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <div className="sticky bottom-3 z-10 rounded-[22px] border border-soft bg-surface/95 p-2 backdrop-blur">
                <button
                  type="button"
                  onClick={() => setTagPickerOpen(false)}
                  className="bg-strong text-strong-foreground bg-strong-hover flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition"
                >
                  <Check className="h-4 w-4" />
                  {ui.applyTags}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="text-secondary mt-2 text-xs leading-5">{ui.childrenHint}</div>

        <label className="text-secondary mt-5 block text-xs font-semibold uppercase tracking-[0.14em]">
          {ui.planLabel}
        </label>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setPlan("paid")}
            className={`rounded-[24px] border p-4 text-left transition ${
              plan === "paid" ? "border-strong bg-strong text-strong-foreground" : "border-soft bg-surface-hover text-primary"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4" />
              {ui.paidTitle}
            </div>
            <div className="mt-2 text-xs opacity-80">{ui.paidText}</div>
          </button>

          <button
            type="button"
            onClick={() => setPlan("barter")}
            className={`rounded-[24px] border p-4 text-left transition ${
              plan === "barter" ? "border-strong bg-strong text-strong-foreground" : "border-soft bg-surface-hover text-primary"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <Gift className="h-4 w-4" />
              {ui.barterTitle}
            </div>
            <div className="mt-2 text-xs opacity-80">{ui.barterText}</div>
          </button>
        </div>

        {plan === "paid" ? (
          <div className="mt-3 rounded-3xl bg-surface-soft px-4 py-3">
            <div className="text-secondary text-xs uppercase tracking-[0.14em]">{ui.price}</div>
            <div className="text-primary mt-1 text-lg font-semibold">{pricing.label}</div>
          </div>
        ) : null}

        {plan === "barter" ? (
          <div className="text-secondary mt-3 rounded-3xl bg-surface-soft px-4 py-3 text-xs leading-5">
            {ui.barterPost}
          </div>
        ) : null}


        <div className="mt-5 rounded-3xl border border-soft bg-surface-soft p-4">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setRulesAccepted(!rulesAccepted)}
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                rulesAccepted ? "border-strong bg-strong text-strong-foreground" : "border-soft bg-surface"
              }`}
              aria-label={ui.rulesAgree}
            >
              {rulesAccepted ? <Check className="h-3.5 w-3.5" /> : null}
            </button>

            <div className="min-w-0 flex-1">
              <div className="text-primary text-sm leading-5">{ui.rulesAgree}</div>
              <button
                type="button"
                onClick={() => setRulesOpen((value) => !value)}
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-strong"
              >
                {rulesOpen ? ui.rulesClose : ui.rulesOpen}
                {rulesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {rulesOpen ? (
            <div className="text-secondary mt-4 space-y-2 border-t border-soft pt-4 text-sm leading-6">
              {ui.rulesBody.map((item) => (
                <div key={item}>• {item}</div>
              ))}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="bg-strong text-strong-foreground bg-strong-hover mt-5 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition"
        >
          {user ? <ExternalLink className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {ui.submit}
        </button>
      </div>

      <div>
        <div className="text-primary text-sm font-semibold px-1">{ui.myChannels}</div>
        <div className="mt-4 space-y-3">
          {channels.length ? (
            channels.map((item) => {
              const cleanHandle = item.channelHandle.replace(/^@+/, "");
              const title = item.channelTitle?.trim() || cleanHandle;
              const avatarUrl = item.channelAvatarUrl || `https://t.me/i/userpic/320/${cleanHandle}.jpg`;

              return (
                <div
                  key={item.id}
                  className="rounded-[26px] border border-soft bg-surface-soft p-4"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={avatarUrl}
                      alt=""
                      className="h-14 w-14 rounded-full object-cover border border-soft bg-surface"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "https://www.gravatar.com/avatar/?d=mp&s=200";
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <div className="truncate text-primary text-sm font-semibold">
                          {title}
                        </div>

                        {item.verified ? (
                          <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />
                        ) : null}
                      </div>

                      <div className="text-secondary text-xs mt-1">
                        @{cleanHandle}
                      </div>
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "active"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : item.status === "pending"
                          ? "bg-blue-500/15 text-blue-500"
                          : "bg-amber-500/15 text-amber-500"
                      }`}
                    >
                      {ui[item.status]}
                    </div>
                  </div>

                  {item.plan === "paid" && item.status === "active" ? (
                    <div className="mt-3 rounded-[18px] bg-surface px-3 py-3">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
                        {ui.donateLabel}
                      </div>

                      <div className="space-y-2">
                        <input
                          value={donateDrafts[item.id] ?? item.donateUrl ?? ""}
                          onChange={(event) =>
                            setDonateDrafts((current) => ({ ...current, [item.id]: event.target.value }))
                          }
                          placeholder={ui.donatePlaceholder}
                          className="w-full rounded-full border border-soft bg-surface-soft px-4 py-2.5 text-sm text-primary shadow-inner outline-none transition focus-border-strong dark:bg-white/10"
                        />

                        <button
                          type="button"
                          onClick={() => saveDonateUrl(item, donateDrafts[item.id] ?? item.donateUrl ?? "")}
                          className="w-full rounded-full bg-strong px-4 py-2.5 text-sm font-semibold text-strong-foreground transition bg-strong-hover"
                        >
                          {ui.saveDonate}
                        </button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-[14px] bg-surface px-3 py-2">
                      <div className="text-secondary uppercase opacity-60">{ui.countryStat}</div>
                      <div className="text-primary mt-1 font-semibold">
                        {item.country.toUpperCase()}
                      </div>
                    </div>

                    <div className="rounded-[14px] bg-surface px-3 py-2">
                      <div className="text-secondary uppercase opacity-60">{ui.typeStat}</div>
                      <div className="text-primary mt-1 font-semibold">
                        {item.plan === "paid" ? ui.paidPlan : ui.barterPlan}
                      </div>
                    </div>

                    <div className="rounded-[14px] bg-surface px-3 py-2">
                      <div className="text-secondary uppercase opacity-60">{ui.termStat}</div>
                      <div className="text-primary mt-1 font-semibold">
                        {formatDaysLeft(item.endsAt)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <a
                      href={`/${cleanHandle}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-strong px-4 py-2.5 text-sm font-semibold text-strong-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {ui.openChannel}
                    </a>

                    {item.status === "expired" || item.status === "paused" ? (
                      <button
                        type="button"
                        onClick={() => renewPlacement(item)}
                        className="inline-flex items-center gap-2 rounded-full border border-soft px-4 py-2.5 text-sm font-semibold text-primary"
                      >
                        <RotateCw className="h-4 w-4" />
                        {ui.renew}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-secondary rounded-[24px] bg-surface-soft px-4 py-4 text-sm">
              {ui.noChannels}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
