import { useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader } from "./components/layout/AppHeader";
import { AddScreen } from "./screens/AddScreen";
import { FeedScreen } from "./screens/FeedScreen";
import { CreatorScreen } from "./screens/CreatorScreen";
import { SourceScreen } from "./screens/SourceScreen";
import { AdminScreen } from "./screens/AdminScreen";
import type { ContentTag, IngestedPost, Locale, TabId } from "./types/app";
import { SplashLoader } from "./components/shared/SplashLoader";
// 🔥 Импортируем единую систему country-кодов
import type { CountryCode } from "../api/lib/contracts";
import { normalizeCountryCode, SEO_LOCALE_META } from "../api/lib/contracts";

const TG_STORAGE_KEY = "margelet_tg_user";
const TG_RELOAD_KEY = "margelet_tg_auth_reloaded";
const SAVES_STORAGE_KEY = "margelet_saves";
const LIKES_STORAGE_KEY = "margelet_likes";
const HIDDEN_POSTS_STORAGE_KEY = "margelet_hidden_posts";
const OPEN_ATTENTION_TOPIC_EVENT = "margelet:open-attention-topic";

const ADMIN_HIDDEN_PATH = "/jim/admin";
const ADMIN_TELEGRAM_IDS = new Set(["1372669404"]);

const SITE_ORIGIN = "https://www.margelet.space";
const DEFAULT_LOCALE: Locale = "ru";

// 🔥 Генерируем список стран из единого SEO_LOCALE_META
const COUNTRY_CODES = new Set<CountryCode>(Object.keys(SEO_LOCALE_META) as CountryCode[]);

function ensureCanonicalLink(href: string) {
  let element = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
}

function getCanonicalHref(pathname: string) {
  const clean = normalizePathname(pathname);

  if (isAdminHiddenPath(clean) || clean.startsWith("/jim/") || clean.startsWith("/admin")) {
    return `${SITE_ORIGIN}/`;
  }

  return `${SITE_ORIGIN}${clean === "/" ? "" : clean}`;
}

// 🔥 FEED_LOADING_COPY теперь использует CountryCode из SEO_LOCALE_META
type FeedLoadingCopy = Partial<Record<CountryCode, string>>;

const FEED_LOADING_COPY: FeedLoadingCopy = {
  ru: "Загрузка ленты...",
  ua: "Завантаження стрічки...",
  us: "Loading feed...",
  in: "Loading feed...",
  ir: "در حال بارگذاری فید...",
  tr: "Akış yükleniyor...",
  br: "Carregando feed...",
  kz: "Лента жүктелуде...",
  uz: "Lenta yuklanmoqda...",
  ae: "جاري تحميل الخلاصة...",
  eg: "جاري تحميل الخلاصة...",
  pk: "Loading feed...",
  id: "Memuat feed...",
  mx: "Cargando feed...",
  sa: "جاري تحميل الخلاصة...",
  es: "Cargando feed...",
  it: "Caricamento del feed...",
  fr: "Chargement du flux...",
  de: "Feed wird geladen...",
  ar: "Cargando feed...",
  co: "Cargando feed...",
  za: "Loading feed...",
  ng: "Loading feed...",
  cn: "正在加载内容流...",
  my: "Memuat feed...",
};
type ExpiredPostCopy = {
  alt: string;
  title: string;
  text: string;
  hint: string;
  button: string;
};

const EXPIRED_POST_COPY: Partial<Record<CountryCode, ExpiredPostCopy>> = {
  ru: {
    alt: "Пост скрыт",
    title: "Пост уже отжил своё",
    text: "Свежие посты живут в ленте margeleT 24 часа. Никому не интересны вчерашние новости, поэтому этот пост уже скрыт из живой ленты.",
    hint: "Открой свежую ленту — там уже новые сигналы, источники и темы.",
    button: "Открыть свежую ленту",
  },
  ua: {
    alt: "Пост приховано",
    title: "Пост уже віджив своє",
    text: "Свіжі пости живуть у стрічці margeleT 24 години. Вчорашні новини вже нікому не цікаві, тому цей пост приховано з живої стрічки.",
    hint: "Відкрий свіжу стрічку — там уже нові сигнали, джерела й теми.",
    button: "Відкрити свіжу стрічку",
  },
  us: {
    alt: "Post hidden",
    title: "This post has expired",
    text: "Fresh posts stay in the margeleT feed for 24 hours. Yesterday’s news gets old fast, so this post is now hidden from the live feed.",
    hint: "Open the fresh feed — new signals, sources, and topics are already there.",
    button: "Open fresh feed",
  },
  in: {
    alt: "Post hidden",
    title: "This post has expired",
    text: "Fresh posts stay in the margeleT feed for 24 hours. Yesterday’s news gets old fast, so this post is now hidden from the live feed.",
    hint: "Open the fresh feed — new signals, sources, and topics are already there.",
    button: "Open fresh feed",
  },
  ir: {
    alt: "پست پنهان شد",
    title: "این پست منقضی شده است",
    text: "پست‌های تازه در فید margeleT فقط ۲۴ ساعت زنده می‌مانند. خبرهای دیروز دیگر جذاب نیستند، بنابراین این پست از فید زنده پنهان شده است.",
    hint: "فید تازه را باز کن — سیگنال‌ها، منابع و موضوعات جدید آنجا هستند.",
    button: "باز کردن فید تازه",
  },
  tr: {
    alt: "Gönderi gizlendi",
    title: "Bu gönderinin süresi doldu",
    text: "Yeni gönderiler margeleT akışında 24 saat kalır. Dünün haberleri hızla eskir, bu yüzden bu gönderi canlı akıştan gizlendi.",
    hint: "Taze akışı aç — yeni sinyaller, kaynaklar ve konular orada.",
    button: "Taze akışı aç",
  },
  br: {
    alt: "Post oculto",
    title: "Este post já expirou",
    text: "Posts frescos ficam no feed do margeleT por 24 horas. Notícias de ontem envelhecem rápido, então este post foi ocultado do feed ao vivo.",
    hint: "Abra o feed fresco — novos sinais, fontes e temas já estão lá.",
    button: "Abrir feed fresco",
  },
  kz: {
    alt: "Пост жасырылды",
    title: "Посттың уақыты өтті",
    text: "Жаңа посттар margeleT лентасында 24 сағат сақталады. Кешегі жаңалық тез ескіреді, сондықтан бұл пост тірі лентадан жасырылды.",
    hint: "Жаңа лентаны аш — онда жаңа сигналдар, дереккөздер және тақырыптар бар.",
    button: "Жаңа лентаны ашу",
  },
  uz: {
    alt: "Post yashirildi",
    title: "Bu post muddati tugadi",
    text: "Yangi postlar margeleT lentasida 24 soat yashaydi. Kechagi yangiliklar tez eskiradi, shuning uchun bu post jonli lentadan yashirildi.",
    hint: "Yangi lentani oching — u yerda yangi signallar, manbalar va mavzular bor.",
    button: "Yangi lentani ochish",
  },
  ae: {
    alt: "تم إخفاء المنشور",
    title: "انتهت صلاحية هذا المنشور",
    text: "تبقى المنشورات الجديدة في خلاصة margeleT لمدة 24 ساعة. أخبار الأمس تصبح قديمة بسرعة، لذلك تم إخفاء هذا المنشور من الخلاصة الحية.",
    hint: "افتح الخلاصة الجديدة — هناك إشارات ومصادر ومواضيع جديدة.",
    button: "افتح الخلاصة الجديدة",
  },
  eg: {
    alt: "تم إخفاء المنشور",
    title: "انتهت صلاحية هذا المنشور",
    text: "المنشورات الجديدة بتفضل في خلاصة margeleT لمدة 24 ساعة. أخبار امبارح بتقدم بسرعة، لذلك المنشور ده اتخفى من الخلاصة المباشرة.",
    hint: "افتح الخلاصة الجديدة — فيها إشارات ومصادر ومواضيع جديدة.",
    button: "افتح الخلاصة الجديدة",
  },
  pk: {
    alt: "Post hidden",
    title: "This post has expired",
    text: "Fresh posts stay in the margeleT feed for 24 hours. Yesterday’s news gets old fast, so this post is now hidden from the live feed.",
    hint: "Open the fresh feed — new signals, sources, and topics are already there.",
    button: "Open fresh feed",
  },
  id: {
    alt: "Postingan disembunyikan",
    title: "Postingan ini sudah kedaluwarsa",
    text: "Postingan segar hidup di feed margeleT selama 24 jam. Berita kemarin cepat basi, jadi postingan ini sudah disembunyikan dari feed langsung.",
    hint: "Buka feed segar — sinyal, sumber, dan topik baru sudah ada di sana.",
    button: "Buka feed segar",
  },
  mx: {
    alt: "Post oculto",
    title: "Este post ya expiró",
    text: "Los posts frescos viven en el feed de margeleT durante 24 horas. Las noticias de ayer envejecen rápido, así que este post ya está oculto del feed en vivo.",
    hint: "Abre el feed fresco — ya hay nuevas señales, fuentes y temas.",
    button: "Abrir feed fresco",
  },
  sa: {
    alt: "تم إخفاء المنشور",
    title: "انتهت صلاحية هذا المنشور",
    text: "تبقى المنشورات الجديدة في خلاصة margeleT لمدة 24 ساعة. أخبار الأمس تصبح قديمة بسرعة، لذلك تم إخفاء هذا المنشور من الخلاصة الحية.",
    hint: "افتح الخلاصة الجديدة — هناك إشارات ومصادر ومواضيع جديدة.",
    button: "افتح الخلاصة الجديدة",
  },
  es: {
    alt: "Post oculto",
    title: "Este post ya expiró",
    text: "Los posts frescos viven en el feed de margeleT durante 24 horas. Las noticias de ayer envejecen rápido, así que este post ya está oculto del feed en vivo.",
    hint: "Abre el feed fresco — ya hay nuevas señales, fuentes y temas.",
    button: "Abrir feed fresco",
  },
  it: {
    alt: "Post nascosto",
    title: "Questo post è scaduto",
    text: "I post freschi restano nel feed margeleT per 24 ore. Le notizie di ieri invecchiano in fretta, quindi questo post è stato nascosto dal feed live.",
    hint: "Apri il feed fresco — ci sono già nuovi segnali, fonti e temi.",
    button: "Apri feed fresco",
  },
  fr: {
    alt: "Post masqué",
    title: "Ce post a expiré",
    text: "Les posts frais restent dans le feed margeleT pendant 24 heures. Les nouvelles d’hier vieillissent vite, donc ce post est maintenant masqué du feed en direct.",
    hint: "Ouvre le feed frais — de nouveaux signaux, sources et sujets sont déjà là.",
    button: "Ouvrir le feed frais",
  },
  de: {
    alt: "Post ausgeblendet",
    title: "Dieser Post ist abgelaufen",
    text: "Frische Posts bleiben 24 Stunden im margeleT-Feed. Nachrichten von gestern werden schnell alt, deshalb ist dieser Post im Live-Feed ausgeblendet.",
    hint: "Öffne den frischen Feed — dort warten neue Signale, Quellen und Themen.",
    button: "Frischen Feed öffnen",
  },
  ar: {
    alt: "Publicación oculta",
    title: "Esta publicación ya expiró",
    text: "Las publicaciones frescas viven en el feed de margeleT durante 24 horas. Las noticias de ayer envejecen rápido, así que esta publicación ya está oculta del feed en vivo.",
    hint: "Abre el feed fresco — ya hay nuevas señales, fuentes y temas.",
    button: "Abrir feed fresco",
  },
  co: {
    alt: "Publicación oculta",
    title: "Esta publicación ya expiró",
    text: "Las publicaciones frescas viven en el feed de margeleT durante 24 horas. Las noticias de ayer envejecen rápido, así que esta publicación ya está oculta del feed en vivo.",
    hint: "Abre el feed fresco — ya hay nuevas señales, fuentes y temas.",
    button: "Abrir feed fresco",
  },
  za: {
    alt: "Post hidden",
    title: "This post has expired",
    text: "Fresh posts stay in the margeleT feed for 24 hours. Yesterday’s news gets old fast, so this post is now hidden from the live feed.",
    hint: "Open the fresh feed — new signals, sources, and topics are already there.",
    button: "Open fresh feed",
  },
  ng: {
    alt: "Post hidden",
    title: "This post has expired",
    text: "Fresh posts stay in the margeleT feed for 24 hours. Yesterday’s news gets old fast, so this post is now hidden from the live feed.",
    hint: "Open the fresh feed — new signals, sources, and topics are already there.",
    button: "Open fresh feed",
  },
  cn: {
    alt: "帖子已隐藏",
    title: "这条帖子已过期",
    text: "新帖子会在 margeleT 信息流中保留 24 小时。昨天的新闻很快就会过时，所以这条帖子已从实时信息流中隐藏。",
    hint: "打开最新信息流 — 新信号、新来源和新话题已经在那里。",
    button: "打开最新信息流",
  },
  my: {
    alt: "Siaran disembunyikan",
    title: "Siaran ini telah tamat tempoh",
    text: "Siaran baharu hidup dalam feed margeleT selama 24 jam. Berita semalam cepat basi, jadi siaran ini telah disembunyikan daripada feed langsung.",
    hint: "Buka feed segar — isyarat, sumber dan topik baharu sudah ada di sana.",
    button: "Buka feed segar",
  },
};


type TgUser = {
  id: string;
  first_name: string;
  username?: string;
  photo_url?: string;
};

type UserRole = "guest" | "user" | "channel_owner" | "admin";

type AccessInfo = {
  telegramUserId: string;
  username: string | null;
  role: "user" | "channel_owner" | "admin";
  note: string | null;
  grantedBy: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  isActive: boolean;
};

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return atob(padded);
}

function parseTelegramUserFromHash(): TgUser | null {
  const hash = window.location.hash || "";
  const match = hash.match(/tgAuthResult=([^&]+)/);

  if (!match?.[1]) return null;

  try {
    const encoded = match[1];
    const jsonString = decodeBase64Url(encoded);
    const parsed = JSON.parse(jsonString);

    if (!parsed?.id) return null;

    return {
      id: String(parsed.id),
      first_name: parsed.first_name || "",
      username: parsed.username || "",
      photo_url: parsed.photo_url || "",
    };
  } catch (error) {
    console.error("Failed to parse tgAuthResult from hash", error);
    return null;
  }
}

function readTelegramUserFromStorage(): TgUser | null {
  const raw = localStorage.getItem(TG_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TgUser;
  } catch {
    localStorage.removeItem(TG_STORAGE_KEY);
    return null;
  }
}

function normalizePathname(pathname: string) {
  if (!pathname) return "/";
  const clean = pathname.trim();
  return clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
}

function isAdminHiddenPath(pathname: string) {
  return normalizePathname(pathname) === ADMIN_HIDDEN_PATH;
}

function ensureRobotsMeta(name: string, content: string) {
  let element = document.querySelector(
    `meta[name="${name}"]`
  ) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function parseSharedPath(pathname: string) {
  const clean = normalizePathname(pathname);
  const parts = clean.split("/").filter(Boolean);

  if (parts.length !== 2) {
    return null;
  }

  const [handle, postId] = parts;

  if (!handle || !postId) {
    return null;
  }

  return { handle, postId };
}

function parsePostPath(pathname: string) {
  const clean = normalizePathname(pathname);
  const parts = clean.split("/").filter(Boolean);

  if (parts.length !== 2) return null;
  if (parts[0] !== "post") return null;

  const postId = parts[1]?.trim();
  if (!postId || !/^\d+$/.test(postId)) return null;

  return postId;
}

function ExpiredPostScreen({ locale, onBack }: { locale: Locale; onBack: () => void }) {
  const copy =
    EXPIRED_POST_COPY[normalizeCountryCode(locale)] ??
    EXPIRED_POST_COPY.ru!;
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className="min-h-screen bg-app text-primary px-4 pb-10"
      style={{ paddingTop: "calc(var(--app-header-offset) + 16px)" }}
    >
      <div className="mx-auto max-w-[570px]">
        <section className="overflow-hidden rounded-[28px] border border-soft bg-surface px-5 py-8 text-center shadow-soft">
          {imageFailed ? (
            <div
              className="mx-auto flex h-28 w-28 items-center justify-center rounded-[28px] bg-surface-soft text-6xl"
              role="img"
              aria-label={copy.alt}
            >
              🦆
            </div>
          ) : (
            <img
              src="/no_searsh.png"
              alt={copy.alt}
              className="mx-auto h-28 w-28 object-contain"
              loading="eager"
              decoding="async"
              onError={() => setImageFailed(true)}
            />
          )}

          <h1 className="mt-5 text-[26px] font-bold leading-tight text-primary">
            {copy.title}
          </h1>

          <p className="mx-auto mt-3 max-w-[420px] text-sm leading-6 text-secondary">
            {copy.text}
          </p>

          <p className="mx-auto mt-2 max-w-[420px] text-sm leading-6 text-secondary">
            {copy.hint}
          </p>

          <button
            type="button"
            onClick={onBack}
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-full bg-strong px-6 text-sm font-semibold text-strong-foreground transition hover:opacity-95"
          >
            {copy.button}
          </button>
        </section>
      </div>
    </div>
  );
}

function parseSourcePath(pathname: string) {
  const clean = normalizePathname(pathname);
  const parts = clean.split("/").filter(Boolean);

  if (parts.length !== 1) {
    return null;
  }

  const [handle] = parts;

  if (!handle || handle === "jim") {
    return null;
  }

  // 🔥 Теперь проверяем country коды через normalizeCountryCode
  if (COUNTRY_CODES.has(normalizeCountryCode(handle))) {
    return null;
  }

  return handle;
}

function getPostIdFromUrl(postUrl: string) {
  const match = String(postUrl || "").match(/\/([0-9]+)(?:\?single)?$/);
  return match?.[1] || "";
}

function normalizeSourceHandle(value: string | null | undefined) {
  return String(value || "").replace(/^@+/, "").trim().toLowerCase();
}

function fallbackAccess(user: TgUser | null): AccessInfo | null {
  if (!user) return null;

  return {
    telegramUserId: user.id,
    username: user.username || null,
    role: ADMIN_TELEGRAM_IDS.has(user.id) ? "admin" : "user",
    note: null,
    grantedBy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt: null,
    isActive: true,
  };
}

async function loadServerFeed(_locale: Locale): Promise<IngestedPost[]> {
  const readPosts = (payload: any): IngestedPost[] => {
    if (Array.isArray(payload?.posts)) return payload.posts;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  };

  try {
    const indexRes = await fetch(`/feeds/index.json`);

    if (indexRes.ok) {
      const index = await indexRes.json();
      const countries = Object.values(index?.countries || {}) as Array<{
        path?: string;
        mode?: "single" | "chunked";
        chunks?: Array<{ path?: string }> | number;
      }>;

      const countryPosts = await Promise.all(
        countries.map(async (country: any) => {
          if (!country?.path) return [];

          const countryRes = await fetch(country.path);
          if (!countryRes.ok) return [];

          const countryData = await countryRes.json();

          const directPosts = readPosts(countryData);
          if (directPosts.length > 0) return directPosts;

          if (Array.isArray(countryData?.chunks)) {
            const chunkPosts = await Promise.all(
              countryData.chunks.map(async (chunk: any) => {
                if (!chunk?.path) return [];

                const chunkRes = await fetch(chunk.path);
                if (!chunkRes.ok) return [];

                const chunkData = await chunkRes.json();
                return readPosts(chunkData);
              })
            );

            return chunkPosts.flat();
          }

          return [];
        })
      );

      const posts = countryPosts.flat();

      if (posts.length > 0) {
        return posts.sort(
          (a, b) =>
            Date.parse(String(b.createdAt || "")) -
            Date.parse(String(a.createdAt || ""))
        );
      }
    }
  } catch {
    //
  }

  try {
    const res = await fetch(`/api/feed`);

    const contentType = res.headers.get("content-type") || "";

    if (res.ok && contentType.includes("application/json")) {
      const data = await res.json();
      return readPosts(data);
    }
  } catch {
    //
  }

  const fallbackRes = await fetch(`/feed.json`);

  if (!fallbackRes.ok) {
    throw new Error("feed request failed");
  }

  const fallbackData = await fallbackRes.json();
  return readPosts(fallbackData);
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => DEFAULT_LOCALE);  
  const [current, setCurrent] = useState<TabId>("feed");
  const [serverPosts, setServerPosts] = useState<IngestedPost[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [showFeedLoadingHint] = useState(false);
  const [currentTelegramUser, setCurrentTelegramUser] = useState<TgUser | null>(null);
  const [selectedSourceHandle, setSelectedSourceHandle] = useState<string | null>(null);
  const [accessInfo, setAccessInfo] = useState<AccessInfo | null>(null);
  const [locationPath, setLocationPath] = useState<string>(() =>
    typeof window === "undefined" ? "/" : normalizePathname(window.location.pathname)
  );

  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<number[]>([]);
  const [hiddenPostIds, setHiddenPostIds] = useState<number[]>([]);

  const userRole = useMemo<UserRole>(() => {
    if (!currentTelegramUser) return "guest";
    return accessInfo?.role || fallbackAccess(currentTelegramUser)?.role || "user";
  }, [accessInfo, currentTelegramUser]);

  const sharedPath = useMemo(() => parseSharedPath(locationPath), [locationPath]);
  const postPathId = useMemo(() => parsePostPath(locationPath), [locationPath]);
  const sourcePathHandle = useMemo(() => parseSourcePath(locationPath), [locationPath]);

  const posts = useMemo(() => {
    const visible =
      hiddenPostIds.length === 0
        ? serverPosts
        : serverPosts.filter((post) => !hiddenPostIds.includes(post.id));

    if (!sharedPath) {
      return visible;
    }

    const matchIndex = visible.findIndex((post) => {
      return (
        normalizeSourceHandle(post.source.handle) === normalizeSourceHandle(sharedPath.handle) &&
        getPostIdFromUrl(post.postUrl) === sharedPath.postId
      );
    });

    if (matchIndex <= 0) {
      return visible;
    }

    const target = visible[matchIndex];
    return [target, ...visible.filter((post) => post.id !== target.id)];
  }, [serverPosts, hiddenPostIds, sharedPath]);

  const syncPathState = useCallback(() => {
    setLocationPath(normalizePathname(window.location.pathname));
  }, []);

  const replacePath = useCallback((nextPath: string) => {
    const normalized = normalizePathname(nextPath);
    if (normalizePathname(window.location.pathname) !== normalized) {
      window.history.pushState({ margelet: true }, document.title, normalized);
    }
    setLocationPath(normalized);
  }, []);

  const goHome = useCallback(() => {
    setSelectedSourceHandle(null);
    setCurrent("feed");
    replacePath("/");
  }, [replacePath]);

  const openSource = useCallback(
    (handle: string) => {
      setSelectedSourceHandle(normalizeSourceHandle(handle));
      setCurrent("source");
      replacePath(`/${normalizeSourceHandle(handle)}`);
    },
    [replacePath]
  );



  useEffect(() => {
    if (typeof window === "undefined") return;

    const guardKey = "margelet_back_guard";
    if (!window.history.state || window.history.state[guardKey] !== true) {
      window.history.replaceState({ ...(window.history.state || {}), [guardKey]: true }, document.title, window.location.href);
    }
  }, []);

  useEffect(() => {
    function handleOpenAttentionTopic() {
      setSelectedSourceHandle(null);
      setCurrent("feed");
      replacePath("/");
    }

    window.addEventListener(OPEN_ATTENTION_TOPIC_EVENT, handleOpenAttentionTopic);

    return () => {
      window.removeEventListener(OPEN_ATTENTION_TOPIC_EVENT, handleOpenAttentionTopic);
    };
  }, [replacePath]);

  const handleHeaderTabChange = useCallback(
    (tab: TabId) => {
      if (tab === "feed") {
        goHome();
        return;
      }

      if (tab === "add") {
        setSelectedSourceHandle(null);
        setCurrent("add");
        replacePath("/");
        return;
      }

      if (tab === "creator") {
        setSelectedSourceHandle(null);
        setCurrent("creator");
        replacePath("/");
        return;
      }

      if (tab === "admin") {
        setSelectedSourceHandle(null);
        setCurrent("admin");
        replacePath(ADMIN_HIDDEN_PATH);
        return;
      }

      setCurrent(tab);
    },
    [goHome, replacePath]
  );


  useEffect(() => {
    const openCreatorFromSpace = () => {
      handleHeaderTabChange("creator");
    };

    window.addEventListener("margelet:open-creator", openCreatorFromSpace);

    return () => {
      window.removeEventListener("margelet:open-creator", openCreatorFromSpace);
    };
  }, [handleHeaderTabChange]);

  useEffect(() => {
    setLocale(DEFAULT_LOCALE);

    setCurrentTelegramUser(readTelegramUserFromStorage());

    if (isAdminHiddenPath(window.location.pathname)) {
      setCurrent("admin");
      return;
    }

    const currentPostPath = parsePostPath(window.location.pathname);
    if (currentPostPath) {
      setSelectedSourceHandle(null);
      setCurrent("feed");
      return;
    }

    const currentShared = parseSharedPath(window.location.pathname);
    if (currentShared) {
      setSelectedSourceHandle(normalizeSourceHandle(currentShared.handle));
      setCurrent("source");
      return;
    }

    const currentSource = parseSourcePath(window.location.pathname);
    if (currentSource) {
      setSelectedSourceHandle(normalizeSourceHandle(currentSource));
      setCurrent("source");
      return;
    }

    const countryPath = normalizePathname(window.location.pathname)
      .split("/")
      .filter(Boolean)[0];

    if (countryPath && COUNTRY_CODES.has(normalizeCountryCode(countryPath))) {
      setLocale(normalizeCountryCode(countryPath) as Locale);
      setCurrent("feed");
      return;
    }

    setCurrent("feed");
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      syncPathState();

      const pathname = normalizePathname(window.location.pathname);

      if (isAdminHiddenPath(pathname)) {
        setCurrent("admin");
        return;
      }

      const currentPostPath = parsePostPath(pathname);
      if (currentPostPath) {
        setSelectedSourceHandle(null);
        setCurrent("feed");
        return;
      }

      const currentShared = parseSharedPath(pathname);
      if (currentShared) {
        setSelectedSourceHandle(normalizeSourceHandle(currentShared.handle));
        setCurrent("source");
        return;
      }

      const currentSource = parseSourcePath(pathname);
      if (currentSource) {
        setSelectedSourceHandle(normalizeSourceHandle(currentSource));
        setCurrent("source");
        return;
      }

      const countryPath = pathname
        .split("/")
        .filter(Boolean)[0];

      if (countryPath && COUNTRY_CODES.has(normalizeCountryCode(countryPath))) {
        setLocale(normalizeCountryCode(countryPath) as Locale);
        setSelectedSourceHandle(null);
        setCurrent("feed");
        return;
      }

      setSelectedSourceHandle(null);
      setCurrent("feed");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [syncPathState]);

  useEffect(() => {
    const syncUser = () => {
      setCurrentTelegramUser(readTelegramUserFromStorage());
    };

    window.addEventListener("focus", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("focus", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  useEffect(() => {
    const storedSaves = localStorage.getItem(SAVES_STORAGE_KEY);
    const storedLikes = localStorage.getItem(LIKES_STORAGE_KEY);
    const storedHidden = localStorage.getItem(HIDDEN_POSTS_STORAGE_KEY);


    if (storedSaves) {
      try {
        setSavedPostIds(JSON.parse(storedSaves));
      } catch {
        localStorage.removeItem(SAVES_STORAGE_KEY);
      }
    }

    if (storedLikes) {
      try {
        setLikedPostIds(JSON.parse(storedLikes));
      } catch {
        localStorage.removeItem(LIKES_STORAGE_KEY);
      }
    }

    if (storedHidden) {
      try {
        setHiddenPostIds(JSON.parse(storedHidden));
      } catch {
        localStorage.removeItem(HIDDEN_POSTS_STORAGE_KEY);
      }
    }
  }, []);


  useEffect(() => {
    localStorage.setItem(SAVES_STORAGE_KEY, JSON.stringify(savedPostIds));
  }, [savedPostIds]);

  useEffect(() => {
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likedPostIds));
  }, [likedPostIds]);

  useEffect(() => {
    localStorage.setItem(HIDDEN_POSTS_STORAGE_KEY, JSON.stringify(hiddenPostIds));
  }, [hiddenPostIds]);

  useEffect(() => {
    const tgUser = parseTelegramUserFromHash();

    if (!tgUser) {
      sessionStorage.removeItem(TG_RELOAD_KEY);
      return;
    }

    localStorage.setItem(TG_STORAGE_KEY, JSON.stringify(tgUser));
    setCurrentTelegramUser(tgUser);

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname + window.location.search
    );
    syncPathState();

    const alreadyReloaded = sessionStorage.getItem(TG_RELOAD_KEY) === "1";

    if (!alreadyReloaded) {
      sessionStorage.setItem(TG_RELOAD_KEY, "1");
      window.location.reload();
    } else {
      sessionStorage.removeItem(TG_RELOAD_KEY);
    }
  }, [syncPathState]);

  useEffect(() => {
    if (!currentTelegramUser) {
      setAccessInfo(null);
      return;
    }

    setAccessInfo(fallbackAccess(currentTelegramUser));
  }, [currentTelegramUser]);  

  const loadFeed = useCallback(async () => {
    setIsFeedLoading(true);
    setServerPosts([]);

    try {
      const nextPosts = await loadServerFeed(locale);
      setServerPosts(nextPosts);
    } catch (error) {
      console.error("Failed to load feed", error);
      setServerPosts([]);
    } finally {
      setIsFeedLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    const isPrivateScreen = current === "admin";
    const robotsContent = isPrivateScreen
      ? "noindex,nofollow,noarchive,nosnippet"
      : "index,follow,max-snippet:-1,max-image-preview:large";

    ensureRobotsMeta("robots", robotsContent);
    ensureRobotsMeta("googlebot", robotsContent);
    ensureCanonicalLink(getCanonicalHref(locationPath));
  }, [current, locationPath]);


  const handleToggleLike = (id: number) => {
    setLikedPostIds((prev) =>
      prev.includes(id) ? prev.filter((postId) => postId !== id) : [...prev, id]
    );
  };

  const handleToggleSave = (id: number) => {
    setSavedPostIds((prev) =>
      prev.includes(id) ? prev.filter((postId) => postId !== id) : [...prev, id]
    );
  };

  const handleHidePost = (id: number) => {
    setHiddenPostIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleDeletePost = async (id: number) => {
    if (!currentTelegramUser?.id) {
      throw new Error("NO_TELEGRAM_USER");
    }

    const res = await fetch("/api/admin-posts", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entity: "posts",
        id,
        telegramUserId: currentTelegramUser.id,
        telegramUsername: currentTelegramUser.username || null,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message = String(data?.error || "delete failed");
      const staleCacheMiss =
        message.includes("not found") ||
        message.includes("not in feed") ||
        message.includes("Selected posts were not found");

      if (!staleCacheMiss) {
        throw new Error(message);
      }
    }

    setServerPosts((prev) => prev.filter((post) => post.id !== id));
    setHiddenPostIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setSavedPostIds((prev) => prev.filter((postId) => postId !== id));
    setLikedPostIds((prev) => prev.filter((postId) => postId !== id));
  };

  const handleAdd = async ({
    url,
    tag,
  }: {
    url: string;
    tag: ContentTag;
  }) => {
    const res = await fetch("/api/submit-post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        tag,
        locale,
        role: userRole === "guest" ? "user" : userRole,
        addedByTelegramId: currentTelegramUser?.id || null,
        addedByUsername: currentTelegramUser?.username || null,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.error || "submit failed");
    }

    await loadFeed();
    goHome();
  };

  return (
    <div className="bg-app text-primary min-h-screen">
      {current !== "admin" ? (
        <AppHeader
          current={current}
          setCurrent={handleHeaderTabChange}
          locale={locale}
        />
      ) : null}

      {postPathId ? (
        <ExpiredPostScreen locale={locale} onBack={goHome} />
      ) : null}

      {current === "feed" && !postPathId ? (
        <FeedScreen
          locale={locale}
          posts={posts}
          isFeedLoading={isFeedLoading}
          likedPostIds={likedPostIds}
          savedPostIds={savedPostIds}
          onToggleLike={handleToggleLike}
          onToggleSave={handleToggleSave}
          onHidePost={handleHidePost}
          onDeletePost={handleDeletePost}
          currentTelegramUserId={currentTelegramUser?.id || null}
          openSource={openSource}
        />
      ) : null}

      {current === "add" ? (
        <AddScreen
          locale={locale}
          currentTelegramUser={currentTelegramUser}
          userRole={userRole}
          onAdd={handleAdd}
        />
      ) : null}

      {current === "creator" ? (
        <CreatorScreen
          locale={locale}
          setLocale={setLocale}
          posts={posts}
          likedPostIds={likedPostIds}
          savedPostIds={savedPostIds}
          openPost={(post) => {
            const postId = getPostIdFromUrl(post.postUrl);
            const handle = normalizeSourceHandle(post.source.handle);
            setSelectedSourceHandle(null);
            setCurrent("feed");
            replacePath(postId ? `/${handle}/${postId}` : "/");
          }}
        />
      ) : null}

      {current === "source" && !postPathId ? (
        <SourceScreen
          locale={locale}
          posts={posts}
          sourceHandle={selectedSourceHandle || sourcePathHandle}
          onBack={goHome}
          onOpenPost={(post) => {
            const postId = getPostIdFromUrl(post.postUrl);
            setSelectedSourceHandle(normalizeSourceHandle(post.source.handle));
            setCurrent("source");
            replacePath(`/${normalizeSourceHandle(post.source.handle)}/${postId}`);
          }}
          likedPostIds={likedPostIds}
          onToggleLike={handleToggleLike}
          onHidePost={handleHidePost}
          onDeletePost={handleDeletePost}
          currentTelegramUserId={currentTelegramUser?.id || null}
          openSource={openSource}
        />
      ) : null}

      {current === "admin" ? (
        <AdminScreen
          locale={locale}
          telegramUserId={currentTelegramUser?.id || null}
          onClose={goHome}
          onDeletePost={handleDeletePost}
        />
      ) : null}

      {isFeedLoading && showFeedLoadingHint && current === "feed" ? (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm text-white backdrop-blur">
          {FEED_LOADING_COPY[normalizeCountryCode(locale)] ?? FEED_LOADING_COPY.us}
        </div>
      ) : null}
      {isFeedLoading && current === "feed" ? <SplashLoader /> : null}
    </div>
  );
}