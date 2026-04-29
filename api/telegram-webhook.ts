import type { VercelRequest, VercelResponse } from "@vercel/node";
import { CREATOR_PRICING_BY_COUNTRY, DEFAULT_PRICING } from "../src/screens/creator/creator.monetization.js";
import { getBarterPromoText, getVerifyText } from "../src/screens/creator/creator.promo.js";

type PlacementPlan = "paid" | "barter";
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
    shortPlan === "p" ? "paid" : shortPlan === "b" ? "barter" : null;

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

async function sendInvoice(chatId: number, placement: Placement) {
  await telegram("sendInvoice", {
    chat_id: chatId,
    title: "margeleT channel placement",
    description: "1 month channel placement on margeleT",
    payload: placement.id,
    currency: "XTR",
    provider_token: "",
    prices: [{ label: placement.pricingLabel, amount: placement.stars }],
  });
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
  const plan: PlacementPlan = raw.plan === "barter" ? "barter" : "paid";
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
    pricingLabel: raw.pricingLabel || (plan === "paid" ? pricing.label : "barter / 1 month"),
    stars: Number(raw.stars || pricing.stars || 0),
    donateUrl: raw.donateUrl || null,
    telegramPaymentChargeId: raw.telegramPaymentChargeId || null,
    lastCheckAt: raw.lastCheckAt || null,
  };
}

async function upsertPlacement(nextRaw: Partial<Placement>) {
  const next = normalizePlacement(nextRaw);
  const { items } = await readPlacements();
  const index = items.findIndex(
    (item) => item.id === next.id ||
      (item.ownerTelegramId === next.ownerTelegramId &&
        normalizeHandle(item.channelHandle) === normalizeHandle(next.channelHandle) &&
        normalizeCountry(item.country) === normalizeCountry(next.country))
  );

  const updated = index >= 0 ? items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...next } : item)) : [next, ...items];
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
  const existing = data.sources.find((source) => source.id === id || (source.countryCode === country && normalizeHandle(source.handle) === handle));

  const next: SourceRecord = {
    id,
    countryCode: country,
    handle,
    title: placement.channelTitle?.trim() || meta?.title || existing?.title || handle,
    avatarUrl: placement.channelAvatarUrl || meta?.avatarUrl || existing?.avatarUrl || null,
    avatarOverride: existing?.avatarOverride ?? null,
    verified: Boolean(placement.verified || meta?.verified || existing?.verified),
    defaultTag: tags[0] || "news",
    tags,
    status: "active",
    note: existing?.note ?? `creator:${placement.plan}`,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    lastCheckedAt: existing?.lastCheckedAt ?? null,
    lastImportedAt: existing?.lastImportedAt ?? null,
    lastSeenPostId: existing?.lastSeenPostId ?? null,
    importedPostsCount: existing?.importedPostsCount ?? 0,
    lastRefreshCursorPostId: existing?.lastRefreshCursorPostId ?? null,
  };

  data.updatedAt = now;
  data.sources = existing
    ? data.sources.map((source) => (source.id === existing.id ? { ...existing, ...next } : source))
    : [next, ...data.sources];

  await writeSources(data, sha, `Add creator source ${handle}`);
}

async function removeSourceFromPlacement(placement: Placement) {
  const country = normalizeCountry(placement.country);
  const handle = normalizeHandle(placement.channelHandle);
  const { data, sha } = await readSources();
  const nextSources = data.sources.filter(
    (source) => !(normalizeCountry(source.countryCode) === country && normalizeHandle(source.handle) === handle)
  );

  if (nextSources.length === data.sources.length) return;

  data.updatedAt = new Date().toISOString();
  data.sources = nextSources;
  await writeSources(data, sha, `Remove creator source ${handle}`);
}

async function activatePlacement(id: string, patch: Partial<Placement>) {
  const placement = await updatePlacement(id, {
    ...patch,
    status: "active",
    startAt: new Date().toISOString(),
    endsAt: addDays(30),
  });

  if (placement) await upsertSourceFromPlacement(placement);
  return placement;
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
  if (body?.action === "upsert_placement") {
    const placement = normalizePlacement(body.placement || {});
    if (!placement.ownerTelegramId || !placement.channelHandle || !placement.country) {
      return res.status(400).json({ ok: false, error: "Invalid placement" });
    }

    const result = await upsertPlacement(placement);
    return res.status(200).json({ ok: true, placement: result.placement, existed: result.existed });
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
      if (next && (status === "paused" || status === "canceled" || Boolean(body.removeSource))) {
        await removeSourceFromPlacement(next);
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
  if (!chatId || !text) return;

  const payload = parseStartPayload(text);
  if (!payload) {
    await sendMessage(chatId, "Привет! Добавление канала запускается из кабинета margeleT.");
    return;
  }

  let placement: Placement | null = null;

  if ("placementId" in payload) {
    const { items } = await readPlacements();
    placement = items.find((item) => item.id === payload.placementId) || null;

    if (!placement) {
      await sendMessage(chatId, "Заявка не найдена. Вернитесь в кабинет margeleT и нажмите кнопку ещё раз.");
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
      pricingLabel: payload.plan === "paid" ? pricing.label : "barter / 1 month",
      stars: pricing.stars,
      donateUrl: null,
    });
    placement = result.placement;
  }

  if (placement.plan === "paid") {
    await sendMessage(chatId, `Заявка создана: @${placement.channelHandle}\nСейчас открою оплату в Stars.`);
    await sendInvoice(chatId, placement);
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
  if (!query?.id || !chatId || !data.startsWith("verify:")) return;

  await answerCallbackQuery(query.id, "Проверяю пост…");

  const id = data.slice("verify:".length);
  const { items } = await readPlacements();
  const placement = items.find((item) => item.id === id);

  if (!placement) {
    await sendMessage(chatId, "Заявка не найдена. Открой добавление канала заново из кабинета.");
    return;
  }

  const ok = await verifyBarterPost(placement.channelHandle, placement.channelSlug);

  if (!ok) {
    await updatePlacement(placement.id, { lastCheckAt: new Date().toISOString() });
    await sendMessage(chatId, "Пока не вижу пост. Опубликуйте текст в канале и нажмите “Проверить пост” ещё раз.");
    return;
  }

  await activatePlacement(placement.id, { lastCheckAt: new Date().toISOString() });
  await sendMessage(chatId, `Готово! Канал @${placement.channelHandle} активирован на 30 дней 🎉`);
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
  const id = payment?.invoice_payload;
  if (!chatId || !id) return;

  await activatePlacement(id, {
    telegramPaymentChargeId: payment.telegram_payment_charge_id || null,
  });

  await sendMessage(chatId, "Оплата прошла! Канал активирован на 30 дней 🎉");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const ownerTelegramId = String(req.query.ownerTelegramId || "").trim();
    const { items } = await readPlacements();

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
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("telegram webhook error", error);
    return res.status(200).json({ ok: false });
  }
}
