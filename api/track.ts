import { redis } from "./lib/kv.js";

const STATS_KEY = "margelet:stats";
const ADMIN_IDS = ["1372669404"];

type TrackAction =
  | "view"
  | "open"
  | "tg_click"
  | "like"
  | "subscribe";

function getTodayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function getCountry(req: any) {
  return String(req.headers["x-vercel-ip-country"] || "unknown").toLowerCase();
}

function getDevice(userAgent: string) {
  const ua = String(userAgent || "").toLowerCase();

  if (ua.includes("mobile")) return "mobile";
  if (ua.includes("tablet")) return "tablet";
  return "desktop";
}

function getIp(req: any) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }

  return "unknown";
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function normalizeAction(value: unknown): TrackAction {
  if (
    value === "open" ||
    value === "tg_click" ||
    value === "like" ||
    value === "subscribe"
  ) {
    return value;
  }

  return "view";
}

function getMetricField(action: TrackAction) {
  switch (action) {
    case "open":
      return "opens";
    case "tg_click":
      return "tgClicks";
    case "like":
      return "likes";
    case "subscribe":
      return "subscriptions";
    case "view":
    default:
      return "views";
  }
}

function postMetricsKey(postId: number) {
  return `${STATS_KEY}:post:${postId}`;
}

function postDailyMetricsKey(postId: number, day: string) {
  return `${STATS_KEY}:post:${postId}:day:${day}`;
}

function sourceMetricsKey(handle: string) {
  return `${STATS_KEY}:source:${handle}`;
}

function sourceDailyMetricsKey(handle: string, day: string) {
  return `${STATS_KEY}:source:${handle}:day:${day}`;
}

function postLikesUsersKey(postId: number) {
  return `${STATS_KEY}:post:${postId}:likes:users`;
}

function sourceSubscribersUsersKey(handle: string) {
  return `${STATS_KEY}:source:${handle}:subs:users`;
}

function dailyUniqueUsersSetKey(day: string) {
  return `${STATS_KEY}:unique:users:day:${day}`;
}

function dailyUniqueUsersCountrySetKey(day: string, country: string) {
  return `${STATS_KEY}:unique:users:country:${country}:day:${day}`;
}

function dailyUniqueUsersDeviceSetKey(day: string, device: string) {
  return `${STATS_KEY}:unique:users:device:${device}:day:${day}`;
}

function allTimeUniqueUsersSetKey() {
  return `${STATS_KEY}:unique:users:all`;
}

function allTimeUniqueUsersCountrySetKey(country: string) {
  return `${STATS_KEY}:unique:users:country:${country}:all`;
}

function allTimeUniqueUsersDeviceSetKey(device: string) {
  return `${STATS_KEY}:unique:users:device:${device}:all`;
}

function buildVisitorId(params: {
  telegramUserId?: string;
  ip: string;
  ua: string;
  country: string;
}) {
  if (params.telegramUserId) {
    return `tg:${params.telegramUserId}`;
  }

  const uaChunk = String(params.ua || "").toLowerCase().slice(0, 120);
  return `anon:${params.ip}|${params.country}|${uaChunk}`;
}

async function incrementGlobalCounters(params: {
  action: TrackAction;
  day: string;
  country: string;
  device: string;
}) {
  const field = getMetricField(params.action);

  if (params.action === "view") {
    await redis.hincrby(STATS_KEY, "views", 1);
    await redis.hincrby(`${STATS_KEY}:days`, params.day, 1);
    await redis.hincrby(`${STATS_KEY}:countries`, params.country, 1);
    await redis.hincrby(`${STATS_KEY}:devices`, params.device, 1);
    return;
  }

  await redis.hincrby(STATS_KEY, field, 1);
  await redis.hincrby(`${STATS_KEY}:days:${field}`, params.day, 1);
  await redis.hincrby(`${STATS_KEY}:countries:${field}`, params.country, 1);
  await redis.hincrby(`${STATS_KEY}:devices:${field}`, params.device, 1);
}

async function incrementPostCounters(postId: number, action: TrackAction, day: string) {
  const field = getMetricField(action);
  await redis.hincrby(postMetricsKey(postId), field, 1);
  await redis.hincrby(postDailyMetricsKey(postId, day), field, 1);
}

async function incrementSourceCounters(handle: string, action: TrackAction, day: string) {
  const field = getMetricField(action);
  await redis.hincrby(sourceMetricsKey(handle), field, 1);
  await redis.hincrby(sourceDailyMetricsKey(handle, day), field, 1);
}

async function recordUniqueVisitor(params: {
  visitorId: string;
  day: string;
  country: string;
  device: string;
}) {
  const addedToDay = await redis.sadd(dailyUniqueUsersSetKey(params.day), params.visitorId);
  if (Number(addedToDay) > 0) {
    await redis.hincrby(`${STATS_KEY}:unique:days`, params.day, 1);
  }

  const addedToCountryDay = await redis.sadd(
    dailyUniqueUsersCountrySetKey(params.day, params.country),
    params.visitorId
  );
  if (Number(addedToCountryDay) > 0) {
    await redis.hincrby(`${STATS_KEY}:countries:unique`, params.country, 1);
  }

  const addedToDeviceDay = await redis.sadd(
    dailyUniqueUsersDeviceSetKey(params.day, params.device),
    params.visitorId
  );
  if (Number(addedToDeviceDay) > 0) {
    await redis.hincrby(`${STATS_KEY}:devices:unique`, params.device, 1);
  }

  const addedToAll = await redis.sadd(allTimeUniqueUsersSetKey(), params.visitorId);
  if (Number(addedToAll) > 0) {
    await redis.hincrby(STATS_KEY, "uniqueUsers", 1);
  }

  await redis.sadd(allTimeUniqueUsersCountrySetKey(params.country), params.visitorId);
  await redis.sadd(allTimeUniqueUsersDeviceSetKey(params.device), params.visitorId);
}

async function toggleLike(params: {
  telegramUserId: string;
  postId: number;
  day: string;
  country: string;
  device: string;
}) {
  const userKey = `u:${params.telegramUserId}`;
  const setKey = postLikesUsersKey(params.postId);
  const alreadyLiked = await redis.sismember(setKey, userKey);

  if (alreadyLiked) {
    await redis.srem(setKey, userKey);

    const currentLikes = Number((await redis.hget(postMetricsKey(params.postId), "likes")) || 0);
    const currentGlobal = Number((await redis.hget(STATS_KEY, "likes")) || 0);

    await redis.hset(postMetricsKey(params.postId), {
      likes: Math.max(0, currentLikes - 1),
    });
    await redis.hset(STATS_KEY, {
      likes: Math.max(0, currentGlobal - 1),
    });

    return { liked: false };
  }

  await redis.sadd(setKey, userKey);
  await redis.hincrby(postMetricsKey(params.postId), "likes", 1);

  await incrementGlobalCounters({
    action: "like",
    day: params.day,
    country: params.country,
    device: params.device,
  });

  return { liked: true };
}

async function toggleSubscribe(params: {
  telegramUserId: string;
  sourceHandle: string;
  day: string;
  country: string;
  device: string;
}) {
  const userKey = `u:${params.telegramUserId}`;
  const setKey = sourceSubscribersUsersKey(params.sourceHandle);
  const alreadySubscribed = await redis.sismember(setKey, userKey);

  if (alreadySubscribed) {
    await redis.srem(setKey, userKey);

    const currentSubs = Number(
      (await redis.hget(sourceMetricsKey(params.sourceHandle), "subscriptions")) || 0
    );
    const currentGlobal = Number((await redis.hget(STATS_KEY, "subscriptions")) || 0);

    await redis.hset(sourceMetricsKey(params.sourceHandle), {
      subscriptions: Math.max(0, currentSubs - 1),
    });
    await redis.hset(STATS_KEY, {
      subscriptions: Math.max(0, currentGlobal - 1),
    });

    return { subscribed: false };
  }

  await redis.sadd(setKey, userKey);
  await redis.hincrby(sourceMetricsKey(params.sourceHandle), "subscriptions", 1);

  await incrementGlobalCounters({
    action: "subscribe",
    day: params.day,
    country: params.country,
    device: params.device,
  });

  return { subscribed: true };
}

async function readState(params: {
  telegramUserId: string;
  postId?: number | null;
  sourceHandle?: string;
}) {
  const userKey = `u:${params.telegramUserId}`;

  const liked =
    typeof params.postId === "number"
      ? Boolean(await redis.sismember(postLikesUsersKey(params.postId), userKey))
      : false;

  const subscribed = params.sourceHandle
    ? Boolean(await redis.sismember(sourceSubscribersUsersKey(params.sourceHandle), userKey))
    : false;

  return { liked, subscribed };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const telegramUserId = asString(req.headers["x-telegram-id"] || body.telegramUserId);
    const action = normalizeAction(body.action);
    const postId = asNumber(body.postId);
    const sourceHandle = asString(body.sourceHandle).replace(/^@/, "").toLowerCase();

    if (telegramUserId && ADMIN_IDS.includes(String(telegramUserId))) {
      return res.status(200).json({ ok: true, skipped: "admin" });
    }

    const ua = String(req.headers["user-agent"] || "");
    const country = getCountry(req);
    const device = getDevice(ua);
    const day = getTodayKey();
    const ip = getIp(req);
    const visitorId = buildVisitorId({
      telegramUserId,
      ip,
      ua,
      country,
    });

    if (action === "like") {
      if (!telegramUserId || !postId) {
        return res.status(400).json({ error: "Missing telegramUserId or postId" });
      }

      const result = await toggleLike({
        telegramUserId,
        postId,
        day,
        country,
        device,
      });

      return res.status(200).json({ ok: true, ...result });
    }

    if (action === "subscribe") {
      if (!telegramUserId || !sourceHandle) {
        return res.status(400).json({ error: "Missing telegramUserId or sourceHandle" });
      }

      const result = await toggleSubscribe({
        telegramUserId,
        sourceHandle,
        day,
        country,
        device,
      });

      return res.status(200).json({ ok: true, ...result });
    }

    await incrementGlobalCounters({
      action,
      day,
      country,
      device,
    });

    if (action === "view" || action === "open" || action === "tg_click") {
      await recordUniqueVisitor({
        visitorId,
        day,
        country,
        device,
      });
    }

    if (postId) {
      await incrementPostCounters(postId, action, day);
    }

    if (sourceHandle) {
      await incrementSourceCounters(sourceHandle, action, day);
    }

    if (telegramUserId) {
      const state = await readState({
        telegramUserId,
        postId,
        sourceHandle,
      });

      return res.status(200).json({
        ok: true,
        action,
        ...state,
      });
    }

    return res.status(200).json({ ok: true, action });
  } catch (error) {
    console.error("track error", error);
    return res.status(500).json({ error: "Failed" });
  }
}