import type { VercelRequest, VercelResponse } from "@vercel/node";
import { CREATOR_PRICING_BY_COUNTRY, DEFAULT_PRICING } from "../src/screens/creator/creator.monetization.js";
import { getBarterPromoText, getVerifyText } from "../src/screens/creator/creator.promo.js";

type PlacementPlan = "paid" | "barter";
type PlacementStatus = "pending" | "active" | "paused" | "expired";

type Placement = {
  id: string;
  ownerTelegramId: string;
  ownerUsername: string | null;
  channelSlug: string;
  channelHandle: string;
  country: string;
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

type TelegramUpdate = {
  message?: {
    chat?: { id?: number };
    from?: { id?: number; username?: string };
    text?: string;
    successful_payment?: {
      invoice_payload?: string;
      telegram_payment_charge_id?: string;
    };
  };
  callback_query?: {
    id?: string;
    data?: string;
    from?: { id?: number; username?: string };
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
const SITE_URL = "https://margelet.space";


function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function normalizeHandle(value: string) {
  return value.trim().replace(/^@+/, "").toLowerCase();
}

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}


function buildChannelUrl(slug: string) {
  return `${SITE_URL}/${encodeURIComponent(slug)}`;
}


function parseStartPayload(text: string) {
  const raw = text.replace(/^\/start(@\w+)?\s*/i, "").trim();

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
    country: country.toLowerCase(),
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

async function readPlacements(): Promise<{ items: Placement[]; sha: string | null }> {
  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${PLACEMENTS_PATH}?ref=${encodeURIComponent(
      GITHUB_BRANCH
    )}`,
    { headers: githubHeaders() }
  );

  if (response.status === 404) return { items: [], sha: null };
  if (!response.ok) throw new Error(`GitHub read placements failed: ${response.status}`);

  const data = (await response.json()) as { content?: string; sha?: string };
  const content = Buffer.from(String(data.content || "").replace(/\n/g, ""), "base64").toString("utf8");
  const parsed = JSON.parse(content || "[]");

  return { items: Array.isArray(parsed) ? parsed : [], sha: data.sha || null };
}

async function writePlacements(items: Placement[], message: string) {
  const current = await readPlacements();

  const response = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${PLACEMENTS_PATH}`,
    {
      method: "PUT",
      headers: githubHeaders(),
      body: JSON.stringify({
        message,
        branch: GITHUB_BRANCH,
        sha: current.sha || undefined,
        content: Buffer.from(JSON.stringify(items, null, 2) + "\n", "utf8").toString("base64"),
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub write placements failed: ${response.status} ${text}`);
  }
}

async function upsertPlacement(next: Placement) {
  const { items } = await readPlacements();
  const index = items.findIndex((item) => item.id === next.id);
  const updated = index >= 0 ? items.map((item) => (item.id === next.id ? next : item)) : [next, ...items];
  await writePlacements(updated, `Update placement ${next.channelHandle}`);
}

async function updatePlacement(id: string, patch: Partial<Placement>) {
  const { items } = await readPlacements();
  const updated = items.map((item) => (item.id === id ? { ...item, ...patch } : item));
  await writePlacements(updated, `Update placement ${id}`);
  return updated.find((item) => item.id === id) || null;
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

  const pricing =
    CREATOR_PRICING_BY_COUNTRY[payload.country as keyof typeof CREATOR_PRICING_BY_COUNTRY] ??
    DEFAULT_PRICING;

  const stars = pricing.stars;
  
  const placement: Placement = {
    id: `${payload.ownerTelegramId}_${payload.channelHandle}_${payload.country}`,
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
    pricingLabel: pricing.label,
    stars,
    donateUrl: null,
  };

  await upsertPlacement(placement);

  if (placement.plan === "paid") {
    await sendMessage(chatId, `Заявка создана: @${placement.channelHandle}\nСейчас открою оплату в Stars.`);
    await sendInvoice(chatId, placement);
    return;
  }

  await sendMessage(
    chatId,
    getBarterPromoText(placement.country as any, placement.channelSlug),
    {
        inline_keyboard: [
            [
                {
                text: getVerifyText(placement.country as any),
                callback_data: `verify:${placement.id}`,
                },
            ],
        ],
    }
  );  
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

  await updatePlacement(placement.id, {
    status: "active",
    startAt: new Date().toISOString(),
    endsAt: addDays(30),
    lastCheckAt: new Date().toISOString(),
  });

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

  await updatePlacement(id, {
    status: "active",
    startAt: new Date().toISOString(),
    endsAt: addDays(30),
    telegramPaymentChargeId: payment.telegram_payment_charge_id || null,
  });

  await sendMessage(chatId, "Оплата прошла! Канал активирован на 30 дней 🎉");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    const ownerTelegramId = String(req.query.ownerTelegramId || "").trim();

    const { items } = await readPlacements();

    return res.status(200).json({
      ok: true,
      items: ownerTelegramId
        ? items.filter((item) => item.ownerTelegramId === ownerTelegramId)
        : items,
    });    
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const update = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

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