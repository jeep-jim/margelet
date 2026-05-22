import type { VercelRequest, VercelResponse } from "@vercel/node";
import { CREATOR_PRICING_BY_COUNTRY, DEFAULT_PRICING } from "../src/screens/creator/creator.monetization";
import { getBotCopy, BOT_COMMAND_LOCALES } from "../src/lib/i18n/bot";
import { getBarterPromoText, getVerifyText } from "../src/screens/creator/creator.promo";

type PlacementPlan = "paid" | "barter" | "claim";
type PlacementStatus = "pending" | "active" | "paused" | "expired" | "canceled";

type Placement = {
  id: string;
  ownerTelegramId: string;
  ownerUsername: string | null;
  channelSlug: string;
  channelHandle: string;
  channelTitle?: string;
  channelAvatarUrl?: string | null;
  verified?: boolean;
  country: string;
  tags?: string[];
  plan: PlacementPlan;
  status: PlacementStatus;
  createdAt: string;
  startAt: string | null;
  endsAt: string | null;
  pricingLabel: string;
  stars: number;
  donateUrl: string | null;
  telegramPaymentChargeId?: string | null;
  lastCheckAt?: string | null;
  sourceId?: string | null;
  sourceWasExisting?: boolean;
};

type SourceRecord = {
  id: string;
  countryCode: string;
  handle: string;
  title: string;
  avatarUrl: string | null;
  avatarOverride: string | null;
  verified: boolean;
  defaultTag: string;
  tags: string[];
  status: "active" | "paused" | "disabled" | string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  lastCheckedAt: string | null;
  lastImportedAt: string | null;
  lastSeenPostId: string | null;
  importedPostsCount: number;
  lastRefreshCursorPostId: string | null;
  ownerTelegramId?: string | null;
  ownerUsername?: string | null;
  placementId?: string | null;
  placementPlan?: PlacementPlan | null;
  placementStatus?: PlacementStatus | null;
  placementEndsAt?: string | null;
  sourceCreatedByPlacement?: boolean;
};

type SourcesFile = {
  updatedAt?: string;
  sources: SourceRecord[];
};

type TelegramUpdate = {
  message?: {
    chat?: { id?: number };
    from?: { id?: number; username?: string; language_code?: string };
    text?: string;
    successful_payment?: {
      invoice_payload?: string;
      telegram_payment_charge_id?: string;
    };
  };
  callback_query?: {
    id?: string;
    data?: string;
    from?: { id?: number; username?: string; language_code?: string };
    message?: { chat?: { id?: number } };
  };
  pre_checkout_query?: {
    id?: string;
    invoice_payload?: string;
  };
};

const BOT_TOKEN = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
const GITHUB_TOKEN = String(process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "").trim();
const GITHUB_OWNER = String(process.env.GITHUB_OWNER || "jeep-jim").trim();
const GITHUB_REPO = String(process.env.GITHUB_REPO || "margelet").trim();
const GITHUB_BRANCH = String(process.env.GITHUB_BRANCH || "main").trim();

const PLACEMENTS_PATH = "data/placements.json";
const SOURCES_PATH = "data/sources.json";
const SITE_URL = "https://margelet.space";

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeHandle(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

function normalizeCountry(value: string) {
  return value.trim().toLowerCase();
}

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function buildChannelUrl(slug: string) {
  return `${SITE_URL}/${encodeURIComponent(slug)}`;
}

function getPlacementId(ownerTelegramId: string, handle: string, country: string) {
  return `${ownerTelegramId}_${normalizeHandle(handle)}_${normalizeCountry(country)}`;
}


const CLAIM_PRICING_LABEL_BY_LOCALE: Record<string, string> = {
  ru: "подтверждение владения",
  uk: "підтвердження власності",
  en: "ownership claim",
  in: "ownership claim",
  fa: "تأیید مالکیت",
  tr: "sahiplik onayı",
  "pt-br": "confirmação de propriedade",
  kk: "иелікті растау",
  uz: "egalikni tasdiqlash",
  ae: "تأكيد الملكية",
  eg: "تأكيد الملكية",
  pk: "ملکیت کی تصدیق",
  id: "klaim kepemilikan",
  mx: "confirmación de propiedad",
  sa: "تأكيد الملكية",
  es: "confirmación de propiedad",
  it: "conferma proprietà",
  fr: "confirmation de propriété",
  de: "Inhaberschaft bestätigen",
  ar: "confirmación de propiedad",
  co: "confirmación de propiedad",
  za: "ownership claim",
  ng: "ownership claim",
  zh: "所有权确认",
  ms: "pengesahan pemilikan",
};

const CLAIM_CREATED_BY_LOCALE: Record<string, (handle: string) => string> = {
  ru: (handle) => `Заявка на подтверждение канала @${handle} создана.\n\nАдмин проверит владение и привяжет канал к вашему Telegram.`,
  uk: (handle) => `Заявку на підтвердження каналу @${handle} створено.\n\nАдмін перевірить право власності й прив’яже канал до вашого Telegram.`,
  en: (handle) => `Ownership claim for @${handle} has been created.\n\nAdmin will review it and link the channel to your Telegram account.`,
  in: (handle) => `@${handle} के लिए ownership claim बन गया है।\n\nAdmin इसे check करेगा और channel को आपके Telegram से link करेगा।`,
  fa: (handle) => `درخواست تأیید مالکیت برای @${handle} ساخته شد.\n\nادمین آن را بررسی می‌کند و کانال را به Telegram شما وصل می‌کند.`,
  tr: (handle) => `@${handle} için sahiplik onayı oluşturuldu.\n\nAdmin kontrol edip kanalı Telegram hesabınıza bağlayacak.`,
  "pt-br": (handle) => `A confirmação de propriedade de @${handle} foi criada.\n\nO admin vai revisar e vincular o canal ao seu Telegram.`,
  kk: (handle) => `@${handle} арнасына иелікті растау өтінімі жасалды.\n\nАдмин тексеріп, арнаны Telegram аккаунтыңызға байланыстырады.`,
  uz: (handle) => `@${handle} kanali uchun egalikni tasdiqlash so‘rovi yaratildi.\n\nAdmin tekshiradi va kanalni Telegram akkauntingizga bog‘laydi.`,
  ae: (handle) => `تم إنشاء طلب تأكيد ملكية القناة @${handle}.\n\nسيراجعه الأدمن ويربط القناة بحساب Telegram الخاص بك.`,
  eg: (handle) => `تم إنشاء طلب تأكيد ملكية القناة @${handle}.\n\nالأدمن هيراجعه ويربط القناة بحساب Telegram الخاص بك.`,
  pk: (handle) => `@${handle} کے لیے ملکیت کی تصدیق کی درخواست بن گئی ہے۔\n\nایڈمن اسے چیک کرے گا اور چینل کو آپ کے Telegram سے لنک کرے گا۔`,
  id: (handle) => `Klaim kepemilikan untuk @${handle} sudah dibuat.\n\nAdmin akan memeriksa dan menautkan channel ke Telegram Anda.`,
  mx: (handle) => `Se creó la confirmación de propiedad para @${handle}.\n\nEl admin la revisará y vinculará el canal a tu Telegram.`,
  sa: (handle) => `تم إنشاء طلب تأكيد ملكية القناة @${handle}.\n\nسيراجعه الأدمن ويربط القناة بحساب Telegram الخاص بك.`,
  es: (handle) => `Se creó la confirmación de propiedad para @${handle}.\n\nEl admin la revisará y vinculará el canal a tu Telegram.`,
  it: (handle) => `La richiesta di conferma proprietà per @${handle} è stata creata.\n\nL’admin la controllerà e collegherà il canale al tuo Telegram.`,
  fr: (handle) => `La confirmation de propriété pour @${handle} a été créée.\n\nL’admin la vérifiera et liera la chaîne à votre Telegram.`,
  de: (handle) => `Die Inhaberschaftsbestätigung für @${handle} wurde erstellt.\n\nDer Admin prüft sie und verknüpft den Kanal mit deinem Telegram.`,
  ar: (handle) => `Se creó la confirmación de propiedad para @${handle}.\n\nEl admin la revisará y vinculará el canal a tu Telegram.`,
  co: (handle) => `Se creó la confirmación de propiedad para @${handle}.\n\nEl admin la revisará y vinculará el canal a tu Telegram.`,
  za: (handle) => `Ownership claim for @${handle} has been created.\n\nAdmin will review it and link the channel to your Telegram account.`,
  ng: (handle) => `Ownership claim for @${handle} has been created.\n\nAdmin will review it and link the channel to your Telegram account.`,
  zh: (handle) => `@${handle} 的所有权确认申请已创建。\n\n管理员会审核并将频道绑定到你的 Telegram。`,
  ms: (handle) => `Pengesahan pemilikan untuk @${handle} telah dibuat.\n\nAdmin akan menyemak dan memautkan saluran ke Telegram anda.`,
};

function resolveClaimLocale(languageCode?: string | null, country?: string | null) {
  const byCountry = normalizeCountry(String(country || ""));
  if (CLAIM_CREATED_BY_LOCALE[byCountry]) return byCountry;

  const lang = String(languageCode || "").toLowerCase();
  if (lang.startsWith("pt")) return "pt-br";
  if (lang.startsWith("ru")) return "ru";
  if (lang.startsWith("uk")) return "uk";
  if (lang.startsWith("de")) return "de";
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("tr")) return "tr";
  if (lang.startsWith("fr")) return "fr";
  if (lang.startsWith("it")) return "it";
  if (lang.startsWith("id")) return "id";
  if (lang.startsWith("fa")) return "fa";
  if (lang.startsWith("ar")) return "ae";
  if (lang.startsWith("ur")) return "pk";
  if (lang.startsWith("hi")) return "in";
  if (lang.startsWith("kk")) return "kk";
  if (lang.startsWith("uz")) return "uz";
  if (lang.startsWith("ms")) return "ms";
  if (lang.startsWith("zh")) return "zh";
  return "en";
}

function getClaimPricingLabel(country?: string | null) {
  const locale = resolveClaimLocale(null, country);
  return CLAIM_PRICING_LABEL_BY_LOCALE[locale] || CLAIM_PRICING_LABEL_BY_LOCALE.en;
}

function getClaimCreatedText(languageCode: string | null | undefined, country: string | null | undefined, handle: string) {
  const locale = resolveClaimLocale(languageCode, country);
  const builder = CLAIM_CREATED_BY_LOCALE[locale] || CLAIM_CREATED_BY_LOCALE.en;
  return builder(normalizeHandle(handle));
}

function parseStartPayload(text: string) {
  const raw = text.replace(/^\/start(@\w+)?\s*/i, "").trim();

  if (raw.startsWith("p_")) {
    const placementId = raw.slice(2).trim();
    return placementId ? { placementId } : null;
  }

  if (!raw.startsWith("m_")) return null;

  const parts = raw.split("_");
  const shortPlan = parts[parts.length - 1];
  const country = parts[parts.length - 2];
  const ownerTelegramId = parts[1];
  const channelHandle = parts.slice(2, -2).join("_");

  const plan: PlacementPlan | null =
  shortPlan === "p"
    ? "paid"
    : shortPlan === "b"
      ? "barter"
      : shortPlan === "c"
        ? "claim"
        : null;


  if (!ownerTelegramId || !channelHandle || !country || !plan) return null;

  return {
    ownerTelegramId,
    channelSlug: normalizeHandle(channelHandle),
    channelHandle: normalizeHandle(channelHandle),
    country: normalizeCountry(country),
    plan,
  };
}

async function telegram(method: string, payload: Record<string, unknown>) {
  if (!BOT_TOKEN) throw new Error("Missing TELEGRAM_BOT_TOKEN");

  const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(`Telegram ${method} failed: ${JSON.stringify(data)}`);
  }

  return data;
}

async function sendMessage(chatId: number, text: string, replyMarkup?: unknown) {
  await telegram("sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
    reply_markup: replyMarkup,
  });
}

async function answerCallbackQuery(id: string, text?: string) {
  await telegram("answerCallbackQuery", {
    callback_query_id: id,
    text: text || "",
    show_alert: false,
  });
}

async function sendInvoice(chatId: number, placement: Placement, languageCode?: string | null) {
  const copy = getBotCopy(languageCode, placement.country);

  await telegram("sendInvoice", {
    chat_id: chatId,
    title: copy.invoiceTitle,
    description: copy.invoiceDescription,
    payload: placement.id,
    currency: "XTR",
    provider_token: "",
    prices: [{ label: placement.pricingLabel, amount: placement.stars }],
  });
}

async function setupBotCommands() {
  const defaultCopy = getBotCopy("en");
  const toCommands = (copy: ReturnType<typeof getBotCopy>) => [
    { command: "start", description: copy.commands.start },
    { command: "help", description: copy.commands.help },
    { command: "status", description: copy.commands.status },
    { command: "add", description: copy.commands.add },
  ];

  const results: Array<{ languageCode: string; ok: boolean; error?: string }> = [];

  await telegram("setMyCommands", { commands: toCommands(defaultCopy) });
  results.push({ languageCode: "default", ok: true });

  const usedLanguageCodes = new Set<string>();

  for (const item of BOT_COMMAND_LOCALES) {
    const languageCode = String(item.telegramLanguageCode || "").trim().toLowerCase();

    if (!languageCode || usedLanguageCodes.has(languageCode)) continue;
    usedLanguageCodes.add(languageCode);

    const copy = getBotCopy(null, item.locale);

    try {
      await telegram("setMyCommands", {
        language_code: languageCode,
        commands: toCommands(copy),
      });
      results.push({ languageCode, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Telegram setMyCommands skipped for ${languageCode}: ${message}`);
      results.push({ languageCode, ok: false, error: message });
    }
  }

  return results;
}

function githubHeaders() {
  if (!GITHUB_TOKEN) throw new Error("Missing GITHUB_TOKEN");

  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function readGithubJson<T>(path: string, fallback: T): Promise<{ data: T; sha: string | null }> {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${encodeURIComponent(
      GITHUB_BRANCH
    )}`,
    { headers: githubHeaders() }
  );

  if (response.status === 404) return { data: fallback, sha: null };
  if (!response.ok) throw new Error(`GitHub read ${path} failed: ${response.status}`);

  const raw = (await response.json()) as { content?: string; sha?: string };
  const content = Buffer.from(String(raw.content || "").replace(/\n/g, ""), "base64").toString("utf8");

  return { data: JSON.parse(content || JSON.stringify(fallback)) as T, sha: raw.sha || null };
}

async function writeGithubJson<T>(path: string, data: T, sha: string | null, message: string) {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`, {
    method: "PUT",
    headers: githubHeaders(),
    body: JSON.stringify({
      message,
      branch: GITHUB_BRANCH,
      sha: sha || undefined,
      content: Buffer.from(JSON.stringify(data, null, 2) + "\n", "utf8").toString("base64"),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub write ${path} failed: ${response.status} ${text}`);
  }
}

async function readPlacements(): Promise<{ items: Placement[]; sha: string | null }> {
  const { data, sha } = await readGithubJson<Placement[]>(PLACEMENTS_PATH, []);
  return { items: Array.isArray(data) ? data : [], sha };
}

async function writePlacements(items: Placement[], message: string) {
  const current = await readPlacements();
  await writeGithubJson(PLACEMENTS_PATH, items, current.sha, message);
}

async function readSources(): Promise<{ data: SourcesFile; sha: string | null }> {
  const fallback: SourcesFile = { updatedAt: new Date().toISOString(), sources: [] };
  const { data, sha } = await readGithubJson<SourcesFile>(SOURCES_PATH, fallback);
  return { data: { ...fallback, ...data, sources: Array.isArray(data.sources) ? data.sources : [] }, sha };
}

async function writeSources(data: SourcesFile, sha: string | null, message: string) {
  await writeGithubJson(SOURCES_PATH, data, sha, message);
}

function normalizePlacement(raw: Partial<Placement>): Placement {
  const country = normalizeCountry(String(raw.country || "ru"));
  const channelHandle = normalizeHandle(String(raw.channelHandle || raw.channelSlug || ""));
  const ownerTelegramId = String(raw.ownerTelegramId || "").trim();
  const plan: PlacementPlan =
  raw.plan === "barter" ? "barter" : raw.plan === "claim" ? "claim" : "paid";
  const pricing = CREATOR_PRICING_BY_COUNTRY[country as keyof typeof CREATOR_PRICING_BY_COUNTRY] ?? DEFAULT_PRICING;

  return {
    id: raw.id || getPlacementId(ownerTelegramId, channelHandle, country),
    ownerTelegramId,
    ownerUsername: raw.ownerUsername || null,
    channelSlug: normalizeHandle(String(raw.channelSlug || channelHandle)),
    channelHandle,
    channelTitle: asString(raw.channelTitle) || channelHandle,
    channelAvatarUrl: raw.channelAvatarUrl || null,
    verified: Boolean(raw.verified),
    country,
    tags: Array.isArray(raw.tags) ? raw.tags.filter(Boolean) : [],
    plan,
    status: raw.status || "pending",
    createdAt: raw.createdAt || new Date().toISOString(),
    startAt: raw.startAt || null,
    endsAt: raw.endsAt || null,
    pricingLabel:
      raw.pricingLabel ||
      (plan === "paid"
        ? pricing.label
        : plan === "barter"
          ? "barter / 1 month"
          : getClaimPricingLabel(country)),
    stars: plan === "paid" ? Number(raw.stars || pricing.stars || 0) : 0,
    donateUrl: raw.donateUrl || null,
    telegramPaymentChargeId: raw.telegramPaymentChargeId || null,
    lastCheckAt: raw.lastCheckAt || null,
    sourceId: raw.sourceId || null,
    sourceWasExisting: Boolean(raw.sourceWasExisting),
  };
}

function findSourceForPlacement(sources: SourceRecord[], placement: Pick<Placement, "country" | "channelHandle" | "sourceId">) {
  const country = normalizeCountry(placement.country);
  const handle = normalizeHandle(placement.channelHandle);

  return sources.find(
    (source) =>
      (placement.sourceId && source.id === placement.sourceId) ||
      (normalizeCountry(source.countryCode) === country && normalizeHandle(source.handle) === handle)
  );
}

async function withSourceLink(raw: Partial<Placement>) {
  const next = normalizePlacement(raw);
  const { data } = await readSources();
  const existingSource = findSourceForPlacement(data.sources, next);

  return {
    ...next,
    sourceId: next.sourceId || existingSource?.id || null,
    sourceWasExisting: typeof raw.sourceWasExisting === "boolean" ? raw.sourceWasExisting : Boolean(existingSource),
  };
}

async function upsertPlacement(nextRaw: Partial<Placement>) {
  const next = await withSourceLink(nextRaw);
  const { items } = await readPlacements();
  const index = items.findIndex(
    (item) => item.id === next.id ||
      (item.ownerTelegramId === next.ownerTelegramId &&
        normalizeHandle(item.channelHandle) === normalizeHandle(next.channelHandle) &&
        normalizeCountry(item.country) === normalizeCountry(next.country))
  );

  const updated =
    index >= 0
      ? items.map((item, itemIndex) =>
          itemIndex === index
            ? {
                ...item,
                ...next,
                sourceId: next.sourceId || item.sourceId || null,
                sourceWasExisting: item.sourceWasExisting || next.sourceWasExisting,
              }
            : item
        )
      : [next, ...items];

  await writePlacements(updated, `Update placement ${next.channelHandle}`);
  return index >= 0 ? { placement: updated[index], existed: true } : { placement: next, existed: false };
}

async function updatePlacement(id: string, patch: Partial<Placement>) {
  const { items } = await readPlacements();
  const updated = items.map((item) => (item.id === id ? normalizePlacement({ ...item, ...patch }) : item));
  await writePlacements(updated, `Update placement ${id}`);
  return updated.find((item) => item.id === id) || null;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchTelegramMeta(handle: string) {
  try {
    const response = await fetch(`https://t.me/s/${encodeURIComponent(handle)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 AppleWebKit/537.36 Chrome/123 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) return null;
    const html = await response.text();
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);

    return {
      title: titleMatch?.[1] ? decodeHtml(titleMatch[1]).replace(/\s+–\s+Telegram\s*$/i, "").trim() : null,
      avatarUrl: imageMatch?.[1] ? decodeHtml(imageMatch[1]).trim() : null,
      verified: /tgme_page_verified|verified_icon|icon-verified/i.test(html),
    };
  } catch {
    return null;
  }
}

async function upsertSourceFromPlacement(placement: Placement) {
  const now = new Date().toISOString();
  const country = normalizeCountry(placement.country);
  const handle = normalizeHandle(placement.channelHandle);
  const id = `${country}:${handle}`;
  const meta = await fetchTelegramMeta(handle);
  const tags = placement.tags?.length ? placement.tags : ["news"];
  const { data, sha } = await readSources();
  const existing = findSourceForPlacement(data.sources, placement);
  const sourceWasExisting = Boolean(existing || placement.sourceWasExisting);

  const next: SourceRecord = {
    id: existing?.id || placement.sourceId || id,
    countryCode: country,
    handle,
    title: placement.channelTitle?.trim() || meta?.title || existing?.title || handle,
    avatarUrl: placement.channelAvatarUrl || meta?.avatarUrl || existing?.avatarUrl || null,
    avatarOverride: existing?.avatarOverride ?? null,
    verified: Boolean(placement.verified || meta?.verified || existing?.verified),
    defaultTag: existing?.defaultTag || tags[0] || "news",
    tags: tags.length ? tags : existing?.tags || ["news"],
    status: "active",
    note: typeof existing?.note === "string" ? existing.note : null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    lastCheckedAt: existing?.lastCheckedAt ?? null,
    lastImportedAt: existing?.lastImportedAt ?? null,
    lastSeenPostId: existing?.lastSeenPostId ?? null,
    importedPostsCount: existing?.importedPostsCount ?? 0,
    lastRefreshCursorPostId: existing?.lastRefreshCursorPostId ?? null,
    ownerTelegramId: placement.ownerTelegramId || existing?.ownerTelegramId || null,
    ownerUsername: placement.ownerUsername || existing?.ownerUsername || null,
    placementId: placement.id,
    placementPlan: placement.plan,
    placementStatus: placement.status,
    placementEndsAt: placement.endsAt || null,
    sourceCreatedByPlacement: existing?.sourceCreatedByPlacement ?? !sourceWasExisting,
  };

  data.updatedAt = now;
  data.sources = existing
    ? data.sources.map((source) => (source.id === existing.id ? { ...existing, ...next } : source))
    : [next, ...data.sources];

  await writeSources(data, sha, `Upsert placement source ${handle}`);

  await updatePlacement(placement.id, {
    sourceId: next.id,
    sourceWasExisting,
  });
}

async function deactivateSourceFromPlacement(placement: Placement, nextStatus: PlacementStatus) {
  const { data, sha } = await readSources();
  const existing = findSourceForPlacement(data.sources, placement);

  if (!existing) return;

  const shouldRemove = Boolean(existing.sourceCreatedByPlacement && !placement.sourceWasExisting && nextStatus === "canceled");

  data.updatedAt = new Date().toISOString();
  data.sources = shouldRemove
    ? data.sources.filter((source) => source.id !== existing.id)
    : data.sources.map((source) =>
        source.id === existing.id
          ? {
              ...source,
              status: nextStatus === "active" ? "active" : "paused",
              placementStatus: nextStatus,
              placementEndsAt: placement.endsAt || source.placementEndsAt || null,
              updatedAt: data.updatedAt!,
            }
          : source
      );

  await writeSources(data, sha, shouldRemove ? `Remove placement source ${placement.channelHandle}` : `Update placement source ${placement.channelHandle}`);
}

async function activatePlacement(id: string, patch: Partial<Placement>) {
  const previous = (await readPlacements()).items.find((item) => item.id === id);
  const placement = await updatePlacement(id, {
    ...patch,
    status: "active",
    startAt: patch.startAt || previous?.startAt || new Date().toISOString(),
    endsAt: patch.endsAt || previous?.endsAt || addDays(30),
  });

  if (placement) await upsertSourceFromPlacement(placement);
  return placement;
}

async function extendPlacement(id: string, days = 30) {
  const { items } = await readPlacements();
  const current = items.find((item) => item.id === id);

  if (!current) return null;

  const now = Date.now();
  const base = current.endsAt && Date.parse(current.endsAt) > now ? Date.parse(current.endsAt) : now;
  const endsAt = new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
  const next = await updatePlacement(id, {
    status: "active",
    startAt: current.startAt || new Date().toISOString(),
    endsAt,
  });

  if (next) await upsertSourceFromPlacement(next);
  return next;
}

async function expireOverduePlacements() {
  const { items } = await readPlacements();
  const now = Date.now();
  const expired = items.filter(
    (item) => item.status === "active" && item.endsAt && Date.parse(item.endsAt) <= now
  );

  if (!expired.length) return items;

  const expiredIds = new Set(expired.map((item) => item.id));
  const updated = items.map((item) =>
    expiredIds.has(item.id) ? normalizePlacement({ ...item, status: "expired" }) : item
  );

  await writePlacements(updated, "Expire placements");

  for (const item of updated) {
    if (expiredIds.has(item.id)) {
      await deactivateSourceFromPlacement(item, "expired");
    }
  }

  return updated;
}

async function verifyBarterPost(handle: string, expectedSlug: string) {
  const url = `https://t.me/s/${encodeURIComponent(handle)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 AppleWebKit/537.36 Chrome/123 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) return false;

  const html = await response.text();
  const expectedUrl = buildChannelUrl(expectedSlug).toLowerCase();

  return (
    html.toLowerCase().includes("margelet.space") &&
    (html.toLowerCase().includes(expectedUrl) || html.toLowerCase().includes(expectedSlug.toLowerCase()))
  );
}

async function handleSiteAction(body: any, res: VercelResponse) {
  await expireOverduePlacements();

  if (body?.action === "upsert_placement") {
    const placement = normalizePlacement(body.placement || {});
    if (!placement.ownerTelegramId || !placement.channelHandle || !placement.country) {
      return res.status(400).json({ ok: false, error: "Invalid placement" });
    }

    const result = await upsertPlacement(placement);
    return res.status(200).json({ ok: true, placement: result.placement, existed: result.existed });
  }

  if (body?.action === "extend_placement") {
    const placementId = asString(body.placementId);
    const days = Number(body.days || 30);

    if (!placementId) {
      return res.status(400).json({ ok: false, error: "Invalid placement extend" });
    }

    const next = await extendPlacement(placementId, Number.isFinite(days) && days > 0 ? days : 30);

    if (!next) {
      return res.status(404).json({ ok: false, error: "Placement not found" });
    }

    return res.status(200).json({ ok: true, placement: next });
  }

  if (body?.action === "update_placement_status") {
    const placementId = asString(body.placementId);
    const status = asString(body.status) as PlacementStatus;
    const allowed: PlacementStatus[] = ["pending", "active", "paused", "expired", "canceled"];

    if (!placementId || !allowed.includes(status)) {
      return res.status(400).json({ ok: false, error: "Invalid placement status update" });
    }

    const { items } = await readPlacements();
    const current = items.find((item) => item.id === placementId);

    if (!current) {
      return res.status(404).json({ ok: false, error: "Placement not found" });
    }

    let next: Placement | null = null;

    if (status === "active") {
      next = await activatePlacement(placementId, {
        status: "active",
        startAt: current.startAt || new Date().toISOString(),
        endsAt: current.endsAt || addDays(30),
      });
    } else {
      next = await updatePlacement(placementId, { status });
      if (next && (status === "paused" || status === "expired" || status === "canceled" || Boolean(body.removeSource))) {
        await deactivateSourceFromPlacement(next, status);
      }
    }

    return res.status(200).json({ ok: true, placement: next });
  }

  return res.status(400).json({ ok: false, error: "Unknown site action" });
}

async function handleStart(update: TelegramUpdate) {
  const message = update.message;
  const chatId = message?.chat?.id;
  const text = asString(message?.text);
  const languageCode = message?.from?.language_code || null;
  if (!chatId || !text) return;

  const payload = parseStartPayload(text);
  if (!payload) {
    await sendMessage(chatId, getBotCopy(languageCode).start);
    return;
  }

  let placement: Placement | null = null;

  if ("placementId" in payload) {
    const { items } = await readPlacements();
    placement = items.find((item) => item.id === payload.placementId) || null;

    if (!placement) {
      await sendMessage(chatId, getBotCopy(languageCode).placementNotFound);
      return;
    }

    if (message?.from?.username) {
      const updated = await updatePlacement(placement.id, { ownerUsername: message.from.username });
      placement = updated || placement;
    }
  } else {
    const pricing = CREATOR_PRICING_BY_COUNTRY[payload.country as keyof typeof CREATOR_PRICING_BY_COUNTRY] ?? DEFAULT_PRICING;
    const result = await upsertPlacement({
      id: getPlacementId(payload.ownerTelegramId, payload.channelHandle, payload.country),
      ownerTelegramId: payload.ownerTelegramId,
      ownerUsername: message?.from?.username || null,
      channelSlug: payload.channelSlug,
      channelHandle: payload.channelHandle,
      country: payload.country,
      plan: payload.plan,
      status: "pending",
      createdAt: new Date().toISOString(),
      startAt: null,
      endsAt: null,
      pricingLabel:
        payload.plan === "paid"
          ? pricing.label
          : payload.plan === "barter"
            ? "barter / 1 month"
            : getClaimPricingLabel(payload.country),
      stars: payload.plan === "paid" ? pricing.stars : 0,
      donateUrl: null,
    });
    placement = result.placement;
  }

  const copy = getBotCopy(languageCode, placement.country);

  if (placement.plan === "paid") {
    await sendMessage(chatId, copy.paidCreated(placement.channelHandle));
    await sendInvoice(chatId, placement, languageCode);
    return;
  }

  if (placement.plan === "claim") {
    await sendMessage(
      chatId,
      getClaimCreatedText(languageCode, placement.country, placement.channelHandle)
    );
    return;
  }

  await sendMessage(chatId, getBarterPromoText(placement.country as any, placement.channelSlug), {
    inline_keyboard: [
      [
        {
          text: getVerifyText(placement.country as any),
          callback_data: `verify:${placement.id}`,
        },
      ],
    ],
  });
}
async function handleCallback(update: TelegramUpdate) {
  const query = update.callback_query;
  const data = asString(query?.data);
  const chatId = query?.message?.chat?.id;
  const languageCode = query?.from?.language_code || null;
  if (!query?.id || !chatId || !data.startsWith("verify:")) return;

  const id = data.slice("verify:".length);
  const { items } = await readPlacements();
  const placement = items.find((item) => item.id === id);
  const copy = getBotCopy(languageCode, placement?.country);

  await answerCallbackQuery(query.id, copy.checkAlert);

  if (!placement) {
    await sendMessage(chatId, copy.placementNotFound);
    return;
  }

  const ok = await verifyBarterPost(placement.channelHandle, placement.channelSlug);

  if (!ok) {
    await updatePlacement(placement.id, { lastCheckAt: new Date().toISOString() });
    await sendMessage(chatId, copy.barterMissing);
    return;
  }

  await activatePlacement(placement.id, { lastCheckAt: new Date().toISOString() });
  await sendMessage(chatId, copy.barterSuccess(placement.channelHandle));
}
async function handlePreCheckout(update: TelegramUpdate) {
  const query = update.pre_checkout_query;
  if (!query?.id) return;

  await telegram("answerPreCheckoutQuery", {
    pre_checkout_query_id: query.id,
    ok: true,
  });
}

async function handleSuccessfulPayment(update: TelegramUpdate) {
  const payment = update.message?.successful_payment;
  const chatId = update.message?.chat?.id;
  const languageCode = update.message?.from?.language_code || null;
  const id = payment?.invoice_payload;
  if (!chatId || !id) return;

  const placement = await activatePlacement(id, {
    telegramPaymentChargeId: payment.telegram_payment_charge_id || null,
  });

  const copy = getBotCopy(languageCode, placement?.country);
  await sendMessage(chatId, copy.paidSuccess(placement?.channelHandle || "channel"));
}

async function handleHelp(update: TelegramUpdate) {
  const chatId = update.message?.chat?.id;
  if (!chatId) return;
  await sendMessage(chatId, getBotCopy(update.message?.from?.language_code || null).help);
}

async function handleAdd(update: TelegramUpdate) {
  const chatId = update.message?.chat?.id;
  if (!chatId) return;
  await sendMessage(chatId, getBotCopy(update.message?.from?.language_code || null).add);
}

function localizeStatus(copy: ReturnType<typeof getBotCopy>, status: PlacementStatus) {
  if (status === "active") return copy.statusActive;
  if (status === "paused") return copy.statusPaused;
  if (status === "expired") return copy.statusExpired;
  if (status === "canceled") return copy.statusCanceled;
  return copy.statusPending;
}

async function handleStatus(update: TelegramUpdate) {
  const chatId = update.message?.chat?.id;
  const ownerTelegramId = update.message?.from?.id;
  const languageCode = update.message?.from?.language_code || null;
  const copy = getBotCopy(languageCode);
  if (!chatId || !ownerTelegramId) return;

  const { items } = await readPlacements();
  const ownItems = items.filter((item) => item.ownerTelegramId === String(ownerTelegramId) && item.status !== "canceled");

  if (!ownItems.length) {
    await sendMessage(chatId, copy.statusEmpty);
    return;
  }

  const lines = ownItems.slice(0, 10).map((item) => {
    const itemCopy = getBotCopy(languageCode, item.country);
    return itemCopy.statusLine(
      item.channelHandle,
      localizeStatus(itemCopy, item.status),
      item.plan === "paid" ? itemCopy.planPaid : item.plan === "barter" ? itemCopy.planBarter : getClaimPricingLabel(item.country)
    );
  });

  await sendMessage(chatId, `${copy.statusTitle}\n${lines.join("\n")}`);
}
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    if (String(req.query.setupCommands || "") === "1") {
      const commands = await setupBotCommands();
      return res.status(200).json({ ok: true, commands });
    }

    const ownerTelegramId = String(req.query.ownerTelegramId || "").trim();
    const items = await expireOverduePlacements();

    const includeCanceled = String(req.query.includeCanceled || "") === "1";
    const visibleItems = includeCanceled ? items : items.filter((item) => item.status !== "canceled");

    return res.status(200).json({
      ok: true,
      items: ownerTelegramId
        ? visibleItems.filter((item) => item.ownerTelegramId === ownerTelegramId)
        : visibleItems,
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const update = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    if (update?.source === "site") {
      return await handleSiteAction(update, res);
    }

    if (update.pre_checkout_query) {
      await handlePreCheckout(update);
    } else if (update.message?.successful_payment) {
      await handleSuccessfulPayment(update);
    } else if (update.callback_query) {
      await handleCallback(update);
    } else if (update.message?.text?.startsWith("/start")) {
      await handleStart(update);
    } else if (update.message?.text?.startsWith("/help")) {
      await handleHelp(update);
    } else if (update.message?.text?.startsWith("/status")) {
      await handleStatus(update);
    } else if (update.message?.text?.startsWith("/add")) {
      await handleAdd(update);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("telegram webhook error", error);
    return res.status(200).json({ ok: false });
  }
}
