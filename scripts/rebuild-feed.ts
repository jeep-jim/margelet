import { readFile, writeFile } from "node:fs/promises";

import { cleanupFeedPosts, rebuildFeedFromSources } from "../api/lib/sources.ts";
import {
  readFeedFile,
  readFeedIndexFile,
  writeFeedFile,
} from "../api/lib/github-store.ts";
import { updateTrends } from "../api/lib/trends.ts";
import type { IngestedPost } from "../api/lib/contracts.ts";

type Args = {
  countryCode: string | null;
  cleanupOnly: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    countryCode: null,
    cleanupOnly: false,
  };

  for (const entry of argv) {
    if (entry.startsWith("--country=")) {
      const value = entry.slice("--country=".length).trim().toLowerCase();
      args.countryCode = value || null;
      continue;
    }

    if (entry === "--cleanup-only") {
      args.cleanupOnly = true;
    }
  }

  return args;
}


type PlacementPlan = "paid" | "barter";
type PlacementStatus = "pending" | "active" | "paused" | "expired" | "canceled";

type Placement = {
  id: string;
  ownerTelegramId: string;
  ownerUsername?: string | null;
  channelSlug: string;
  channelHandle: string;
  channelTitle?: string;
  country: string;
  plan: PlacementPlan;
  status: PlacementStatus;
  createdAt?: string;
  startAt?: string | null;
  endsAt?: string | null;
  pricingLabel?: string;
  stars?: number;
  donateUrl?: string | null;
  lastCheckAt?: string | null;
  barterViolationAt?: string | null;
  barterViolationReason?: string | null;
  barterViolationNotifiedAt?: string | null;
};

type SourceRecord = {
  id: string;
  countryCode: string;
  handle: string;
  status: string;
  note?: string | null;
};

type SourcesPayload = {
  updatedAt?: string;
  sources: SourceRecord[];
};

const PLACEMENTS_PATH = "data/placements.json";
const SOURCES_PATH = "data/sources.json";
const SITE_URL = "https://margelet.space";
const BOT_TOKEN = String(process.env.TELEGRAM_BOT_TOKEN || "").trim();
const REBUILD_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123 Safari/537.36";

const BARTER_REMOVED_POST_TEXT: Record<string, string> = {
  ru: "Вы удалили обязательный пост по бартеру. Размещение поставлено на паузу. Повторное размещение этого канала теперь доступно только через Stars.",
  ua: "Ви видалили обов’язковий бартерний допис. Розміщення поставлено на паузу. Повторне розміщення цього каналу тепер доступне лише через Stars.",
  us: "You removed the required barter post. The placement has been paused. This channel can now be placed again only through Stars.",
  in: "आपने आवश्यक बार्टर पोस्ट हटा दी है। प्लेसमेंट रोक दिया गया है। अब इस चैनल को दोबारा केवल Stars के माध्यम से जोड़ा जा सकता है।",
  ir: "شما پست الزامیِ تهاتر را حذف کرده‌اید. جایگاه متوقف شد. ثبت دوباره این کانال فقط از طریق Stars امکان‌پذیر است.",
  tr: "Zorunlu barter gönderisini sildiniz. Yerleşim duraklatıldı. Bu kanal artık yalnızca Stars ile tekrar eklenebilir.",
  br: "Você removeu a publicação obrigatória de permuta. A veiculação foi pausada. Este canal agora só pode ser publicado novamente via Stars.",
  kz: "Сіз бартер бойынша міндетті постты өшірдіңіз. Орналастыру уақытша тоқтатылды. Бұл арнаны қайта қосу енді тек Stars арқылы мүмкін.",
  uz: "Siz barter uchun majburiy postni o‘chirdingiz. Joylashtirish pauzaga qo‘yildi. Bu kanalni qayta joylashtirish endi faqat Stars orqali mumkin.",
  ae: "لقد حذفت منشور المقايضة الإلزامي. تم إيقاف الظهور مؤقتاً. لا يمكن إعادة نشر هذا القناة الآن إلا عبر Stars.",
  eg: "لقد حذفت منشور البارتر المطلوب. تم إيقاف الظهور مؤقتاً. إعادة نشر القناة متاحة الآن فقط عبر Stars.",
  pk: "آپ نے لازمی بارٹر پوسٹ حذف کر دی ہے۔ پلیسمنٹ روک دی گئی ہے۔ اب یہ چینل صرف Stars کے ذریعے دوبارہ شامل کیا جا سکتا ہے۔",
  id: "Anda menghapus postingan barter wajib. Penempatan dijeda. Kanal ini sekarang hanya bisa dipasang lagi melalui Stars.",
  mx: "Eliminaste la publicación obligatoria de barter. La colocación se pausó. Ahora este canal solo puede volver a publicarse mediante Stars.",
  sa: "لقد حذفت منشور المقايضة الإلزامي. تم إيقاف الظهور مؤقتاً. لا يمكن إعادة نشر هذه القناة الآن إلا عبر Stars.",
  es: "Eliminaste la publicación obligatoria de barter. La colocación se pausó. Ahora este canal solo puede volver a publicarse mediante Stars.",
  it: "Hai eliminato il post obbligatorio del barter. Il posizionamento è stato messo in pausa. Ora questo canale può essere inserito di nuovo solo tramite Stars.",
  fr: "Vous avez supprimé le post obligatoire du barter. Le placement a été mis en pause. Ce canal ne peut désormais être replacé que via Stars.",
  de: "Du hast den verpflichtenden Barter-Beitrag gelöscht. Die Platzierung wurde pausiert. Dieser Kanal kann jetzt nur noch über Stars erneut platziert werden.",
  ar: "لقد حذفت منشور المقايضة الإلزامي. تم إيقاف الظهور مؤقتاً. لا يمكن إعادة نشر هذه القناة الآن إلا عبر Stars.",
  co: "Eliminaste la publicación obligatoria de barter. La colocación se pausó. Ahora este canal solo puede volver a publicarse mediante Stars.",
  za: "You removed the required barter post. The placement has been paused. This channel can now be placed again only through Stars.",
  ng: "You removed the required barter post. The placement has been paused. This channel can now be placed again only through Stars.",
  cn: "你删除了必需的 barter 帖子。展示已暂停。该频道现在只能通过 Stars 重新投放。",
  my: "Anda telah memadam siaran barter wajib. Penempatan telah dijeda. Saluran ini kini hanya boleh diletakkan semula melalui Stars.",
};

function normalizeHandle(value: string | null | undefined) {
  return String(value || "").trim().replace(/^@+/, "").toLowerCase();
}

function normalizeCountry(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function buildChannelUrl(slug: string) {
  return `${SITE_URL}/${encodeURIComponent(normalizeHandle(slug))}`;
}

async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(path: string, payload: unknown) {
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function fetchTelegramChannelHtml(handle: string) {
  const response = await fetch(`https://t.me/s/${encodeURIComponent(handle)}`, {
    headers: {
      "user-agent": REBUILD_USER_AGENT,
      accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  return response.text();
}

async function checkRequiredBarterPost(placement: Placement): Promise<"ok" | "missing" | "unreachable"> {
  const handle = normalizeHandle(placement.channelHandle || placement.channelSlug);
  if (!handle) return "missing";

  const html = await fetchTelegramChannelHtml(handle);
  if (!html) return "unreachable";

  const normalizedHtml = html.toLowerCase();
  const expectedSlug = normalizeHandle(placement.channelSlug || handle);
  const expectedUrl = buildChannelUrl(expectedSlug).toLowerCase();
  const found =
    normalizedHtml.includes("margelet.space") &&
    (normalizedHtml.includes(expectedUrl) || normalizedHtml.includes(expectedSlug));

  return found ? "ok" : "missing";
}

function getViolationText(country: string, handle: string) {
  const text = BARTER_REMOVED_POST_TEXT[normalizeCountry(country)] || BARTER_REMOVED_POST_TEXT.us;
  return `@${handle}\n\n${text}`;
}

async function notifyTelegramUser(telegramId: string, text: string) {
  if (!BOT_TOKEN || !telegramId) return false;

  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramId,
        text,
        disable_web_page_preview: true,
      }),
    });

    const data = await response.json().catch(() => null);
    return Boolean(response.ok && data?.ok);
  } catch (error) {
    console.warn("barter violation notification failed", telegramId, error);
    return false;
  }
}

async function enforceBarterIntegrity() {
  const placements = await readJsonFile<Placement[]>(PLACEMENTS_PATH, []);
  const sourcesPayload = await readJsonFile<SourcesPayload>(SOURCES_PATH, {
    updatedAt: new Date(0).toISOString(),
    sources: [],
  });

  const now = new Date().toISOString();
  let changedPlacements = false;
  let changedSources = false;
  let checked = 0;
  let paused = 0;
  let notified = 0;
  const pausedKeys = new Set<string>();

  const nextPlacements: Placement[] = [];

  for (const placement of placements) {
    const handle = normalizeHandle(placement.channelHandle || placement.channelSlug);
    const country = normalizeCountry(placement.country);
    const isActiveBarter = placement.plan === "barter" && placement.status === "active";

    if (!isActiveBarter || !handle || !country) {
      nextPlacements.push(placement);
      continue;
    }

    checked += 1;
    const checkResult = await checkRequiredBarterPost(placement);

    if (checkResult === "ok" || checkResult === "unreachable") {
      nextPlacements.push({ ...placement, lastCheckAt: now });
      changedPlacements = true;
      continue;
    }

    paused += 1;
    pausedKeys.add(`${country}:${handle}`);

    const notificationSent = await notifyTelegramUser(
      placement.ownerTelegramId,
      getViolationText(country, handle)
    );

    if (notificationSent) notified += 1;

    nextPlacements.push({
      ...placement,
      status: "paused",
      lastCheckAt: now,
      barterViolationAt: now,
      barterViolationReason: "required_barter_post_missing",
      barterViolationNotifiedAt: notificationSent ? now : placement.barterViolationNotifiedAt || null,
    });
    changedPlacements = true;
  }

  if (pausedKeys.size > 0) {
    const sources = Array.isArray(sourcesPayload.sources) ? sourcesPayload.sources : [];
    const nextSources = sources.filter((source) => {
      const key = `${normalizeCountry(source.countryCode)}:${normalizeHandle(source.handle)}`;
      return !pausedKeys.has(key);
    });

    if (nextSources.length !== sources.length) {
      sourcesPayload.updatedAt = now;
      sourcesPayload.sources = nextSources;
      changedSources = true;
    }
  }

  if (changedPlacements) {
    await writeJsonFile(PLACEMENTS_PATH, nextPlacements);
  }

  if (changedSources) {
    await writeJsonFile(SOURCES_PATH, sourcesPayload);
  }

  return { checked, paused, notified, changedPlacements, changedSources };
}

async function runCleanupOnly() {
  const feedFile = await readFeedFile<IngestedPost>();
  const currentPosts = Array.isArray(feedFile.posts) ? feedFile.posts : [];
  const cleanedPosts = cleanupFeedPosts(currentPosts);

  await writeFeedFile(cleanedPosts, {
    allowEmpty: currentPosts.length === 0,
    reason: "cleanup-only",
  });

  const index = await readFeedIndexFile();

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "cleanup-only",
        before: currentPosts.length,
        after: cleanedPosts.length,
        removed: Math.max(0, currentPosts.length - cleanedPosts.length),
        countries: Object.keys(index.countries).length,
      },
      null,
      2
    )
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.cleanupOnly) {
    await runCleanupOnly();
    return;
  }

  // 🔥 ВРЕМЕННО ОТКЛЮЧЕНО ДЛЯ ДИАГНОСТИКИ
  // const integrity = await enforceBarterIntegrity();
  const integrity = { checked: 0, paused: 0, notified: 0, changedPlacements: false, changedSources: false };
  console.log("barter integrity (disabled)", JSON.stringify(integrity));

  const result = await rebuildFeedFromSources({
    countryCode: (args.countryCode as never) || null,
  });

  const index = await readFeedIndexFile();

  // 🔥 ПОСЛЕ РЕБУЛДА: пишем фид с указанием страны
  if (result.posts.length > 0 || result.activeCountries === 0) {
    await writeFeedFile(result.posts, {
      reason: args.countryCode ? `country:${args.countryCode}` : "full-rebuild",
    });
  }

  // 🔥 НОВОЕ: обновляем тренды для всех стран
  // Группируем посты по странам
  const postsByCountryTemp: Record<string, IngestedPost[]> = {};
  for (const post of result.posts) {
    const countryCode = (post as any).sourceCountryCode || (post as any).countryCode || 'ru';
    if (!postsByCountryTemp[countryCode]) {
      postsByCountryTemp[countryCode] = [];
    }
    postsByCountryTemp[countryCode].push(post);
  }
  
  if (Object.keys(postsByCountryTemp).length > 0) {
    console.log("📊 Updating trends for countries...");
    for (const [countryCode, countryPosts] of Object.entries(postsByCountryTemp)) {
      if (countryPosts && countryPosts.length > 0) {
        await updateTrends(countryPosts, countryCode);
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "rebuild",
        result,
        indexCountries: Object.keys(index.countries).length,
      },
      null,
      2
    )
  );

  if (!result.skipped && result.activeCountries > 0 && result.posts.length === 0) {
    throw new Error("Safety stop: rebuild produced 0 posts with active countries");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});