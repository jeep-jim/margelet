import { Check, ChevronDown, ChevronUp, Clock3, ExternalLink, Gift, Lock, RotateCw, Send, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
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

function appendCreatorChannel(item: CreatorChannelPlacement) {
  const raw = localStorage.getItem(CREATOR_CHANNELS_STORAGE_KEY);
  const parsed = raw ? (JSON.parse(raw) as CreatorChannelPlacement[]) : [];
  writeCreatorChannels([item, ...parsed]);
}

function updateCreatorChannel(item: CreatorChannelPlacement) {
  const raw = localStorage.getItem(CREATOR_CHANNELS_STORAGE_KEY);
  const parsed = raw ? (JSON.parse(raw) as CreatorChannelPlacement[]) : [];

  writeCreatorChannels(parsed.map((current) => (current.id === item.id ? item : current)));
}

function isValidTelegramDonateUrl(value: string) {
  if (!value.trim()) return true;

  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();

    return ["t.me", "www.t.me", "telegram.me", "www.telegram.me"].includes(host) &&
      url.searchParams.has("direct");
  } catch {
    return false;
  }
}

function getTagLabel(group: SiteTagGroup, locale: Locale) {
  return `${group.emoji} ${group.labels[locale] ?? group.labels.en}`;
}

function getUi(locale: Locale) {
  const ru = locale === "ru" || locale === "uk" || locale === "kk" || locale === "uz";

  return ru
    ? {
        authRequired: "Авторизуйтесь, чтобы добавлять каналы.",
        formTitle: "Добавить канал",
        formText:
          "Заполни данные канала. После отправки мы откроем Telegram-бота — там можно оплатить размещение или выбрать бартер.",
        urlLabel: "Ссылка на Telegram-канал",
        countryLabel: "Страна канала",
        tagsLabel: "Теги",
        planLabel: "Способ размещения",
        paidTitle: "Оплатить",
        paidText: "1 месяц размещения + возможность добавить Telegram-donate ссылку.",
        barterTitle: "Бартер",
        barterText: "1 месяц бесплатно за нативный пост о margeleT в вашем канале.",
        rulesTitle: "Правила размещения",
        rulesOpen: "Открыть правила",
        rulesClose: "Скрыть правила",
        rulesAgree: "Я прочитал правила и понимаю, что канал проходит модерацию.",
        submit: "Перейти в Telegram-бот",
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
        daysLeft: "Осталось",
        price: "Стоимость",
        donateOnlyPaid: "Donate-ссылка доступна только для платного размещения.",
        donateLabel: "Telegram donate-ссылка",
        donatePlaceholder: "https://t.me/your_channel?direct",
        donateInvalid: "Нужна Telegram-ссылка с параметром ?direct",
        donateSaved: "Donate-ссылка сохранена.",
        saveDonate: "Сохранить",
        openBot: "Открыть бота",
        renew: "Продлить",
        paidPlan: "оплата",
        barterPlan: "бартер",
        activeText: "активен",
        expiredText: "истёк",
        pausedText: "пауза",
        waitingBotText: "ожидает бота",
        barterPost:
          "Текст для бартера: Хорошие новости, друзья! Теперь наш канал можно читать ещё и на margeleT.space",
        rulesBody: [
          "Канал должен быть открытым Telegram-каналом с нормальным регулярным контентом.",
          "Запрещены скам, мошенничество, наркотики, оружие, экстремизм, порнография, шок-контент и прямые нарушения закона.",
          "margeleT не переписывает авторский контент и всегда ведёт пользователя обратно к оригинальному каналу.",
          "Модерация может отклонить канал без автоматической публикации.",
        ],
      }
    : {
        authRequired: "Sign in to add channels.",
        formTitle: "Add channel",
        formText:
          "Fill in the channel details. After submitting, we open the Telegram bot where you can pay or choose barter.",
        urlLabel: "Telegram channel link",
        countryLabel: "Channel country",
        tagsLabel: "Tags",
        planLabel: "Placement method",
        paidTitle: "Paid",
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
        daysLeft: "Left",
        price: "Cost",
        donateOnlyPaid: "Donate link is available only for paid placement.",
        donateLabel: "Telegram donate link",
        donatePlaceholder: "https://t.me/your_channel?direct",
        donateInvalid: "Use a Telegram link with ?direct",
        donateSaved: "Donate link saved.",
        saveDonate: "Save",
        openBot: "Open bot",
        renew: "Renew",
        paidPlan: "paid",
        barterPlan: "barter",
        activeText: "active",
        expiredText: "expired",
        pausedText: "paused",
        waitingBotText: "waiting for bot",
        barterPost:
          "Barter text: Good news, friends! Now our channel is also available on margeleT.space",
        rulesBody: [
          "The channel must be an open Telegram channel with normal recurring content.",
          "Scams, fraud, drugs, weapons, extremism, pornography, shock content and direct legal violations are forbidden.",
          "margeleT does not rewrite creator content and always sends users back to the original channel.",
          "Moderation may reject a channel before publication.",
        ],
      };
}

function buildBotUrl(item: CreatorChannelPlacement) {
  const plan = item.plan === "paid" ? "p" : "b";
  const payload = [
    "m",
    item.ownerTelegramId,
    item.channelHandle.replace(/^@+/, ""),
    item.country,
    plan,
  ].join("_");

  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${encodeURIComponent(payload)}`;
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
  const [channelUrl, setChannelUrl] = useState("");
  const [country, setCountry] = useState<Locale>(locale);
  const [tags, setTags] = useState<string[]>([]);
  const [plan, setPlan] = useState<CreatorChannelPlan>("paid");
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [openTagGroups, setOpenTagGroups] = useState<string[]>([]);
  const [channels, setChannels] = useState<CreatorChannelPlacement[]>(() =>
    user ? readCreatorChannels(user.id) : []
  );

  const pricing = getCreatorPricing(country);
  const tagGroups = useMemo(() => SITE_TAG_GROUPS, []);

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

  const handleSubmit = () => {
    if (!user) {
      alert(ui.authRequired);
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

    const now = new Date().toISOString();
    const item: CreatorChannelPlacement = {
      id: `${user.id}_${normalized.handle}_${Date.now()}`,
      ownerTelegramId: user.id,
      channelUrl: normalized.url,
      channelHandle: normalized.handle,
      country,
      tags,
      plan,
      status: "pending",
      createdAt: now,
      startsAt: null,
      endsAt: null,
      pricingLabel: plan === "paid" ? pricing.label : "barter / 1 month",
      donateUrl: null,
    };

    appendCreatorChannel(item);
    setChannels((current) => [item, ...current]);
    setChannelUrl("");
    setTags([]);
    setRulesAccepted(false);
    setOpenTagGroups([]);

    window.open(buildBotUrl(item), "_blank", "noopener,noreferrer");
  };

  const saveDonateUrl = (item: CreatorChannelPlacement, value: string) => {
    if (!isValidTelegramDonateUrl(value)) {
      alert(ui.donateInvalid);
      return;
    }

    const nextItem = { ...item, donateUrl: value.trim() || null };
    updateCreatorChannel(nextItem);
    setChannels((current) => current.map((channel) => (channel.id === item.id ? nextItem : channel)));
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

  const getChannelCardText = (item: CreatorChannelPlacement) => {
    if (item.status === "active") return ui.activeText;
    if (item.status === "expired") return ui.expiredText;
    if (item.status === "paused") return ui.pausedText;
    return ui.waitingBotText;
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-[28px] border border-soft p-6">
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
          {ui.urlLabel}
        </label>
        <input
          value={channelUrl}
          onChange={(event) => setChannelUrl(event.target.value)}
          placeholder={copy.channelPlaceholder}
          className="bg-surface text-primary focus-border-strong mt-2 w-full rounded-full border border-soft px-4 py-3 text-sm outline-none transition"
        />

        <label className="text-secondary mt-5 block text-xs font-semibold uppercase tracking-[0.14em]">
          {ui.countryLabel}
        </label>
        <div className="relative mt-2">
          <select
            value={country}
            onChange={(event) => setCountry(event.target.value as Locale)}
            className="bg-surface text-primary focus-border-strong w-full appearance-none rounded-full border border-soft px-4 py-3 pr-11 text-sm outline-none transition"
          >
            {SITE_LOCALES.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label} · {item.nativeLabel}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
        </div>

        <div className="mt-4 rounded-3xl bg-surface-soft px-4 py-3">
          <div className="text-secondary text-xs uppercase tracking-[0.14em]">{ui.price}</div>
          <div className="text-primary mt-1 text-lg font-semibold">{pricing.label}</div>
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
            className="flex w-full items-center justify-between gap-3 rounded-[18px] bg-surface px-4 py-3 text-left transition hover:bg-surface-hover"
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

        {plan === "barter" ? (
          <div className="text-secondary mt-3 rounded-3xl bg-surface-soft px-4 py-3 text-xs leading-5">
            {ui.barterPost}
          </div>
        ) : null}

        {plan === "paid" ? (
          <div className="text-secondary mt-3 rounded-3xl bg-surface-soft px-4 py-3 text-xs leading-5">
            {ui.donateOnlyPaid}
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

      <div className="bg-surface rounded-[28px] border border-soft p-6">
        <div className="text-primary text-sm font-semibold">{ui.myChannels}</div>
        <div className="mt-4 space-y-3">
          {channels.length ? (
            channels.map((item) => (
              <div key={item.id} className="rounded-[24px] border border-soft bg-surface-soft p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-primary truncate text-sm font-semibold">@{item.channelHandle}</div>
                    <div className="text-secondary mt-1 text-xs">{item.pricingLabel}</div>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "active"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                        : item.status === "expired" || item.status === "paused"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {ui[item.status]}
                  </div>
                </div>

                <div className="text-secondary mt-3 flex items-start gap-2 rounded-[18px] bg-surface px-3 py-3 text-xs leading-5">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{getChannelCardText(item)}</span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-secondary">
                  <div className="rounded-[16px] bg-surface px-3 py-2">
                    <div className="uppercase tracking-[0.12em] opacity-60">страна</div>
                    <div className="text-primary mt-1 font-semibold">{item.country.toUpperCase()}</div>
                  </div>
                  <div className="rounded-[16px] bg-surface px-3 py-2">
                    <div className="uppercase tracking-[0.12em] opacity-60">тип</div>
                    <div className="text-primary mt-1 font-semibold">{item.plan === "paid" ? ui.paidPlan : ui.barterPlan}</div>
                  </div>
                  <div className="rounded-[16px] bg-surface px-3 py-2">
                    <div className="uppercase tracking-[0.12em] opacity-60">срок</div>
                    <div className="text-primary mt-1 font-semibold">{formatDaysLeft(item.endsAt)}</div>
                  </div>
                </div>

                {item.plan === "paid" ? (
                  <div className="mt-3 rounded-[20px] border border-soft bg-surface p-3">
                    <label className="text-secondary text-xs font-semibold uppercase tracking-[0.12em]">
                      {ui.donateLabel}
                    </label>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input
                        defaultValue={item.donateUrl || ""}
                        placeholder={ui.donatePlaceholder}
                        className="bg-surface-soft text-primary focus-border-strong min-w-0 flex-1 rounded-full border border-soft px-4 py-2.5 text-sm outline-none transition"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            saveDonateUrl(item, event.currentTarget.value);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(event) => {
                          const input = event.currentTarget.parentElement?.querySelector("input") as HTMLInputElement | null;
                          saveDonateUrl(item, input?.value || "");
                        }}
                        className="rounded-full bg-strong px-4 py-2.5 text-sm font-semibold text-strong-foreground transition hover:opacity-90"
                      >
                        {ui.saveDonate}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={buildBotUrl(item)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-strong px-4 py-2.5 text-sm font-semibold text-strong-foreground transition hover:opacity-90"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {ui.openBot}
                  </a>
                  {item.status === "expired" || item.status === "paused" ? (
                    <button
                      type="button"
                      onClick={() => renewPlacement(item)}
                      className="inline-flex items-center gap-2 rounded-full border border-soft bg-surface px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-surface-hover"
                    >
                      <RotateCw className="h-4 w-4" />
                      {ui.renew}
                    </button>
                  ) : null}
                </div>
              </div>
            ))
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
