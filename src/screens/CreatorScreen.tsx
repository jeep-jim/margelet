import {
  Heart,
  Info,
  LogOut,
  Globe,
  Sparkles,
  Send,
  ArrowRightLeft,
  Plus,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { VerifiedBadge } from "../components/shared/VerifiedBadge";
import type { IngestedPost, Locale } from "../types/app";
import { SITE_LOCALES } from "../lib/locales";

const TELEGRAM_BOT_ID = "8298054487";
const TG_STORAGE_KEY = "margelet_tg_user";
const LIKES_STORAGE_KEY = "margelet_likes";
const LANGUAGE_STORAGE_KEY = "margelet_locale";

function getTelegramAuthUrl() {
  const origin = window.location.origin;
  return `https://oauth.telegram.org/auth?bot_id=${TELEGRAM_BOT_ID}&origin=${origin}&request_access=write`;
}

type Props = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  posts: IngestedPost[];
  openPost: (post: IngestedPost) => void;
};

type CabinetTab = "liked" | "channel" | "about" | "language";

type TgUser = {
  id: string;
  first_name: string;
  username?: string;
  photo_url?: string;
};

type ScreenCopy = {
  authTitle: string;
  authText: string;
  authButton: string;
  connectedToTelegram: string;
  logout: string;
  languageTitle: string;
  introTitle: string;
  introText: string;
  introButton: string;
  channelTitle: string;
  channelText: string;
  channelPlaceholder: string;
  channelButton: string;
  channelEmptyError: string;
  channelInvalidError: string;
  channelSuccess: string;
  aboutText: string;
  emptyLiked: string;
};

const COPY: Record<Locale, ScreenCopy> = {
  en: {
    authTitle: "Sign in with Telegram",
    authText:
      "Authorize to manage your cabinet, view liked posts and submit a request to add your own channel.",
    authButton: "Authorize",
    connectedToTelegram: "Connected to Telegram",
    logout: "Log out",
    languageTitle: "Choose language",
    introTitle: "Intro",
    introText:
      "Here you can open the intro again and review texts, slides and future artworks.",
    introButton: "Watch intro again",
    channelTitle: "Submit your channel",
    channelText:
      "Paste a Telegram channel link. It will go to moderation and will not be published automatically.",
    channelPlaceholder: "https://t.me/your_channel",
    channelButton: "Send request",
    channelEmptyError: "Paste a Telegram channel link first.",
    channelInvalidError: "Use a link like https://t.me/channel_name",
    channelSuccess:
      "Channel request sent. Later we will connect real delivery to the admin panel.",
    aboutText:
      "margeleT is a distribution layer for current Telegram content. The source of every post always remains the original Telegram channel.",
    emptyLiked: "There is nothing here yet.",
  },
  ru: {
    authTitle: "Войти через Telegram",
    authText:
      "Авторизуйся, чтобы управлять своим кабинетом, смотреть понравившиеся публикации и отправлять заявку на добавление собственного канала.",
    authButton: "Авторизоваться",
    connectedToTelegram: "Подключено к Telegram",
    logout: "Выйти",
    languageTitle: "Выбор языка",
    introTitle: "Интро",
    introText:
      "Здесь можно снова открыть первое приветственное интро и проверить тексты, слайды и будущие арты.",
    introButton: "Смотреть интро снова",
    channelTitle: "Подать заявку на добавление своего канала",
    channelText:
      "Вставь ссылку на Telegram-канал. Канал не публикуется автоматически — он должен пройти модерацию.",
    channelPlaceholder: "https://t.me/your_channel",
    channelButton: "Отправить заявку",
    channelEmptyError: "Вставь ссылку на Telegram-канал",
    channelInvalidError: "Нужна ссылка вида https://t.me/channel_name",
    channelSuccess:
      "Заявка на канал отправлена. Позже подключим реальную отправку в админку.",
    aboutText:
      "margeleT — это слой дистрибуции актуального Telegram-контента. Источником каждого поста всегда остаётся оригинальный Telegram-канал.",
    emptyLiked: "Здесь пока пусто.",
  },
  de: {
    authTitle: "Mit Telegram anmelden",
    authText:
      "Melde dich an, um dein Cabinet zu verwalten, gelikte Beiträge zu sehen und deinen Kanal zur Moderation einzureichen.",
    authButton: "Autorisieren",
    connectedToTelegram: "Mit Telegram verbunden",
    logout: "Abmelden",
    languageTitle: "Sprache wählen",
    introTitle: "Intro",
    introText:
      "Hier kannst du das Intro erneut öffnen und Texte, Slides und künftige Artworks prüfen.",
    introButton: "Intro erneut ansehen",
    channelTitle: "Eigenen Kanal einreichen",
    channelText:
      "Füge einen Telegram-Kanal-Link ein. Er geht in die Moderation und wird nicht automatisch veröffentlicht.",
    channelPlaceholder: "https://t.me/your_channel",
    channelButton: "Anfrage senden",
    channelEmptyError: "Füge zuerst einen Telegram-Kanal-Link ein.",
    channelInvalidError: "Verwende einen Link wie https://t.me/channel_name",
    channelSuccess:
      "Kanalanfrage gesendet. Später verbinden wir die echte Weiterleitung ins Adminpanel.",
    aboutText:
      "margeleT ist eine Distributionsebene für aktuellen Telegram-Content. Die Quelle jedes Beitrags bleibt immer der originale Telegram-Kanal.",
    emptyLiked: "Hier ist noch nichts.",
  },
  es: {
    authTitle: "Entrar con Telegram",
    authText:
      "Autorízate para gestionar tu cabinet, ver publicaciones marcadas y enviar tu canal a moderación.",
    authButton: "Autorizar",
    connectedToTelegram: "Conectado a Telegram",
    logout: "Salir",
    languageTitle: "Elegir idioma",
    introTitle: "Intro",
    introText:
      "Aquí puedes abrir de nuevo la intro y revisar textos, diapositivas y futuros artes.",
    introButton: "Ver intro otra vez",
    channelTitle: "Enviar tu canal",
    channelText:
      "Pega un enlace de canal de Telegram. Irá a moderación y no se publicará automáticamente.",
    channelPlaceholder: "https://t.me/your_channel",
    channelButton: "Enviar solicitud",
    channelEmptyError: "Primero pega un enlace de canal de Telegram.",
    channelInvalidError: "Usa un enlace como https://t.me/channel_name",
    channelSuccess:
      "Solicitud enviada. Más adelante conectaremos el envío real al panel admin.",
    aboutText:
      "margeleT es una capa de distribución de contenido actual de Telegram. La fuente de cada publicación siempre sigue siendo el canal original.",
    emptyLiked: "Aquí todavía no hay nada.",
  },
  tr: {
    authTitle: "Telegram ile giriş yap",
    authText:
      "Kabinetini yönetmek, beğendiğin gönderileri görmek ve kanalını moderasyona göndermek için giriş yap.",
    authButton: "Yetkilendir",
    connectedToTelegram: "Telegram bağlı",
    logout: "Çıkış yap",
    languageTitle: "Dil seç",
    introTitle: "Intro",
    introText:
      "Buradan intro'yu tekrar açabilir, metinleri, slaytları ve gelecekteki görselleri kontrol edebilirsin.",
    introButton: "Intro'yu tekrar izle",
    channelTitle: "Kanalını gönder",
    channelText:
      "Telegram kanal bağlantısını yapıştır. Moderasyona gider ve otomatik yayınlanmaz.",
    channelPlaceholder: "https://t.me/your_channel",
    channelButton: "Başvuru gönder",
    channelEmptyError: "Önce Telegram kanal bağlantısını yapıştır.",
    channelInvalidError: "https://t.me/channel_name gibi bir bağlantı kullan",
    channelSuccess:
      "Kanal başvurusu gönderildi. Daha sonra gerçek gönderimi admin paneline bağlayacağız.",
    aboutText:
      "margeleT, güncel Telegram içeriği için bir dağıtım katmanıdır. Her gönderinin kaynağı her zaman orijinal Telegram kanalı olarak kalır.",
    emptyLiked: "Burada henüz hiçbir şey yok.",
  },
  fr: {
    authTitle: "Se connecter avec Telegram",
    authText:
      "Connecte-toi pour gérer ton cabinet, voir les publications aimées et envoyer ton canal à la modération.",
    authButton: "Autoriser",
    connectedToTelegram: "Connecté à Telegram",
    logout: "Se déconnecter",
    languageTitle: "Choisir la langue",
    introTitle: "Intro",
    introText:
      "Ici tu peux rouvrir l’intro et vérifier les textes, les slides et les futurs artworks.",
    introButton: "Revoir l’intro",
    channelTitle: "Envoyer ton canal",
    channelText:
      "Colle un lien de canal Telegram. Il partira en modération et ne sera pas publié automatiquement.",
    channelPlaceholder: "https://t.me/your_channel",
    channelButton: "Envoyer la demande",
    channelEmptyError: "Colle d’abord un lien de canal Telegram.",
    channelInvalidError: "Utilise un lien comme https://t.me/channel_name",
    channelSuccess:
      "Demande envoyée. Plus tard nous connecterons l’envoi réel au panneau admin.",
    aboutText:
      "margeleT est une couche de distribution pour le contenu Telegram actuel. La source de chaque publication reste toujours le canal Telegram d’origine.",
    emptyLiked: "Il n’y a encore rien ici.",
  },
  it: {
    authTitle: "Accedi con Telegram",
    authText:
      "Accedi per gestire il tuo cabinet, vedere i post piaciuti e inviare il tuo canale alla moderazione.",
    authButton: "Autorizza",
    connectedToTelegram: "Connesso a Telegram",
    logout: "Esci",
    languageTitle: "Scegli lingua",
    introTitle: "Intro",
    introText:
      "Qui puoi aprire di nuovo l’intro e controllare testi, slide e futuri artwork.",
    introButton: "Guarda di nuovo l’intro",
    channelTitle: "Invia il tuo canale",
    channelText:
      "Incolla un link di un canale Telegram. Andrà in moderazione e non sarà pubblicato automaticamente.",
    channelPlaceholder: "https://t.me/your_channel",
    channelButton: "Invia richiesta",
    channelEmptyError: "Incolla prima un link di canale Telegram.",
    channelInvalidError: "Usa un link come https://t.me/channel_name",
    channelSuccess:
      "Richiesta inviata. Più avanti collegheremo l’invio reale al pannello admin.",
    aboutText:
      "margeleT è un livello di distribuzione per i contenuti Telegram attuali. La fonte di ogni post resta sempre il canale Telegram originale.",
    emptyLiked: "Qui non c’è ancora nulla.",
  },
  "pt-br": {
    authTitle: "Entrar com Telegram",
    authText:
      "Entre para gerenciar seu cabinet, ver posts curtidos e enviar seu canal para moderação.",
    authButton: "Autorizar",
    connectedToTelegram: "Conectado ao Telegram",
    logout: "Sair",
    languageTitle: "Escolher idioma",
    introTitle: "Intro",
    introText:
      "Aqui você pode abrir a intro novamente e revisar textos, slides e futuras artes.",
    introButton: "Ver intro novamente",
    channelTitle: "Enviar seu canal",
    channelText:
      "Cole o link de um canal do Telegram. Ele vai para moderação e não será publicado automaticamente.",
    channelPlaceholder: "https://t.me/your_channel",
    channelButton: "Enviar solicitação",
    channelEmptyError: "Cole primeiro um link de canal do Telegram.",
    channelInvalidError: "Use um link como https://t.me/channel_name",
    channelSuccess:
      "Solicitação enviada. Depois vamos conectar o envio real ao painel admin.",
    aboutText:
      "margeleT é uma camada de distribuição para conteúdo atual do Telegram. A fonte de cada post sempre permanece o canal original do Telegram.",
    emptyLiked: "Ainda não há nada aqui.",
  },
  id: {
    authTitle: "Masuk dengan Telegram",
    authText:
      "Masuk untuk mengelola cabinet, melihat postingan yang disukai dan mengirim kanalmu ke moderasi.",
    authButton: "Otorisasi",
    connectedToTelegram: "Terhubung ke Telegram",
    logout: "Keluar",
    languageTitle: "Pilih bahasa",
    introTitle: "Intro",
    introText:
      "Di sini kamu bisa membuka intro lagi dan memeriksa teks, slide, dan artwork selanjutnya.",
    introButton: "Lihat intro lagi",
    channelTitle: "Kirim kanalmu",
    channelText:
      "Tempel tautan kanal Telegram. Kanal akan masuk moderasi dan tidak dipublikasikan otomatis.",
    channelPlaceholder: "https://t.me/your_channel",
    channelButton: "Kirim permintaan",
    channelEmptyError: "Tempel dulu tautan kanal Telegram.",
    channelInvalidError: "Gunakan tautan seperti https://t.me/channel_name",
    channelSuccess:
      "Permintaan kanal terkirim. Nanti kita hubungkan pengiriman nyata ke panel admin.",
    aboutText:
      "margeleT adalah lapisan distribusi untuk konten Telegram saat ini. Sumber setiap postingan selalu tetap kanal Telegram asli.",
    emptyLiked: "Belum ada apa pun di sini.",
  },
  pl: {
    authTitle: "Zaloguj się przez Telegram",
    authText:
      "Zaloguj się, aby zarządzać swoim cabinet, oglądać polubione posty i wysłać kanał do moderacji.",
    authButton: "Autoryzuj",
    connectedToTelegram: "Połączono z Telegramem",
    logout: "Wyloguj się",
    languageTitle: "Wybierz język",
    introTitle: "Intro",
    introText:
      "Tutaj możesz ponownie otworzyć intro i sprawdzić teksty, slajdy oraz przyszłe arty.",
    introButton: "Obejrzyj intro ponownie",
    channelTitle: "Wyślij swój kanał",
    channelText:
      "Wklej link do kanału Telegram. Trafi do moderacji i nie zostanie opublikowany automatycznie.",
    channelPlaceholder: "https://t.me/your_channel",
    channelButton: "Wyślij zgłoszenie",
    channelEmptyError: "Najpierw wklej link do kanału Telegram.",
    channelInvalidError: "Użyj linku jak https://t.me/channel_name",
    channelSuccess:
      "Zgłoszenie wysłane. Później podłączymy prawdziwe wysyłanie do panelu admin.",
    aboutText:
      "margeleT to warstwa dystrybucji aktualnych treści z Telegrama. Źródłem każdego posta zawsze pozostaje oryginalny kanał Telegram.",
    emptyLiked: "Na razie nic tu nie ma.",
  },
};

const LANGUAGE_ORDER: Locale[] = [
  "en",
  "de",
  "es",
  "tr",
  "fr",
  "it",
  "pt-br",
  "id",
  "pl",
  "ru",
];

const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  de: "DE",
  es: "ES",
  tr: "TR",
  fr: "FR",
  it: "IT",
  "pt-br": "PT",
  id: "ID",
  pl: "PL",
  ru: "RU",
};

function getLocaleOption(locale: Locale) {
  return SITE_LOCALES.find((item) => item.code === locale);
}

function getPreview(post: IngestedPost) {
  return (
    post.media.find((item) => item.kind === "image")?.url ||
    post.media.find((item) => item.kind === "video")?.poster ||
    null
  );
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

function readNumberArrayFromStorage(key: string): number[] {
  const raw = localStorage.getItem(key);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
  } catch {
    localStorage.removeItem(key);
    return [];
  }
}

function TopIconButton({
  active,
  onClick,
  icon: Icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition ${
        active
          ? "bg-neutral-950 text-white"
          : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

function LanguageChip({
  active,
  label,
  onClick,
  title,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex h-12 items-center gap-2 rounded-full px-4 transition ${
        active
          ? "bg-neutral-950 text-white"
          : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
      }`}
    >
      <Globe className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function AuthBlock({ copy }: { copy: ScreenCopy }) {
  return (
    <div className="overflow-hidden rounded-[32px] bg-[#4da3ff] text-white">
      <div className="grid gap-5 px-5 py-5 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-3 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
            <span>margeleT</span>
            <ArrowRightLeft className="h-4 w-4" />
            <span>Telegram</span>
          </div>

          <div className="text-[26px] font-semibold leading-tight">
            {copy.authTitle}
          </div>

          <div className="mt-2 max-w-[28rem] text-sm leading-6 text-white/92">
            {copy.authText}
          </div>

          <button
            onClick={() => {
              window.location.href = getTelegramAuthUrl();
            }}
            className="mt-5 inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100"
            type="button"
          >
            {copy.authButton}
          </button>
        </div>

        <div className="relative hidden min-h-[150px] md:block">
          <div className="absolute right-0 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-white/14 blur-xl" />
          <div className="absolute right-8 top-1/2 flex h-24 w-24 -translate-y-1/2 items-center justify-center rounded-[28px] border border-white/20 bg-white/10 backdrop-blur-md">
            <Send className="h-10 w-10 -rotate-12 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileBlock({
  user,
  copy,
  onLogout,
}: {
  user: TgUser;
  copy: ScreenCopy;
  onLogout: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white text-neutral-950 shadow-sm">
      <div className="grid gap-5 px-5 py-5 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-3 rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">
            <span>margeleT</span>
            <ArrowRightLeft className="h-4 w-4" />
            <span>Telegram</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-full bg-neutral-200">
              {user.photo_url ? (
                <img
                  src={user.photo_url}
                  alt={user.first_name}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : null}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <div className="truncate text-lg font-semibold">
                  {user.first_name}
                </div>
                <VerifiedBadge className="shrink-0 text-[#2AABEE]" />
              </div>

              <div className="truncate text-sm text-neutral-500">
                {user.username ? `@${user.username}` : "Telegram user"}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {copy.connectedToTelegram}
            </div>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
              type="button"
            >
              <LogOut className="h-3.5 w-3.5" />
              {copy.logout}
            </button>
          </div>
        </div>

        <div className="relative hidden min-h-[150px] md:block">
          <div className="absolute right-0 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-neutral-100 blur-xl" />
          <div className="absolute right-8 top-1/2 flex h-24 w-24 -translate-y-1/2 items-center justify-center rounded-[28px] border border-neutral-200 bg-neutral-50">
            <Send className="h-10 w-10 -rotate-12 text-neutral-700" />
          </div>
        </div>
      </div>
    </div>
  );
}

function CabinetTile({
  post,
  onOpen,
}: {
  post: IngestedPost;
  onOpen: () => void;
}) {
  const preview = getPreview(post);

  return (
    <button
      onClick={onOpen}
      className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-200 text-left"
      type="button"
    >
      {preview ? (
        <img
          src={preview}
          alt={post.text || post.source.title}
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-300 to-neutral-200" />
      )}

      <div className="absolute inset-0 bg-black/10 transition group-hover:bg-black/5" />

      <div className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
        {post.contentType}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-3 text-white">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/90 text-[11px] font-bold text-black">
            {post.source.avatar ? (
              <img
                src={post.source.avatar}
                alt={post.source.title}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                {String(post.source.title || "TG").slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{post.source.title}</div>
            <div className="truncate text-xs text-white/75">
              @{post.source.handle}
            </div>
          </div>
        </div>

        <div className="line-clamp-2 text-xs leading-5 text-white/90">
          {post.text || "Telegram post"}
        </div>
      </div>
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[28px] border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
      {text}
    </div>
  );
}

export function CreatorScreen({
  locale,
  setLocale,
  posts,
  openPost,
}: Props) {
  const [user, setUser] = useState<TgUser | null>(null);
  const [tab, setTab] = useState<CabinetTab>("language");
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [channelUrl, setChannelUrl] = useState("");

  useEffect(() => {
    const sync = () => {
      setUser(readTelegramUserFromStorage());
      setLikedIds(readNumberArrayFromStorage(LIKES_STORAGE_KEY));
    };

    sync();

    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const copy = COPY[locale] ?? COPY.en;

  const likedPosts = useMemo(() => {
    return posts.filter((post) => likedIds.includes(post.id));
  }, [posts, likedIds]);

  const handleLogout = () => {
    localStorage.removeItem(TG_STORAGE_KEY);
    setUser(null);
  };

  const handleChangeLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
  };

  const handleReplayIntro = () => {
    localStorage.removeItem("margelet-intro-seen");
    window.location.reload();
  };

  const handleSubmitChannel = () => {
    const value = channelUrl.trim();

    if (!value) {
      alert(copy.channelEmptyError);
      return;
    }

    if (!/^https?:\/\/t\.me\/[A-Za-z0-9_]+\/?$/.test(value)) {
      alert(copy.channelInvalidError);
      return;
    }

    alert(copy.channelSuccess);
    setChannelUrl("");
  };

  const orderedLocales = LANGUAGE_ORDER
    .map((code) => getLocaleOption(code))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-20 text-neutral-950">
      <div className="mx-auto max-w-[720px] space-y-6">
        {!user ? (
          <AuthBlock copy={copy} />
        ) : (
          <ProfileBlock user={user} copy={copy} onLogout={handleLogout} />
        )}

        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
          <TopIconButton
            active={tab === "liked"}
            onClick={() => setTab("liked")}
            icon={Heart}
            title="Liked"
          />

          <TopIconButton
            active={tab === "channel"}
            onClick={() => setTab("channel")}
            icon={Plus}
            title="Add channel"
          />

          <TopIconButton
            active={tab === "about"}
            onClick={() => setTab("about")}
            icon={Info}
            title="About"
          />

          <LanguageChip
            active={tab === "language"}
            onClick={() => setTab("language")}
            label={LOCALE_SHORT[locale]}
            title="Language"
          />
        </div>

        {tab === "language" ? (
          <div className="space-y-4">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Globe className="h-4 w-4" />
                {copy.languageTitle}
              </div>

              <div className="flex flex-wrap gap-3">
                {orderedLocales.map((item) => {
                  if (!item) return null;

                  const isActive = locale === item.code;

                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleChangeLocale(item.code as Locale)}
                      className={`inline-flex min-h-[44px] items-center rounded-full px-5 text-sm transition ${
                        isActive
                          ? "bg-neutral-950 text-white"
                          : "border border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      }`}
                    >
                      {item.nativeLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-neutral-200 bg-white p-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4" />
                {copy.introTitle}
              </div>

              <div className="text-sm leading-6 text-neutral-600">
                {copy.introText}
              </div>

              <button
                type="button"
                onClick={handleReplayIntro}
                className="mt-4 inline-flex items-center rounded-full bg-neutral-950 px-4 py-2 text-sm text-white transition hover:bg-neutral-800"
              >
                {copy.introButton}
              </button>
            </div>
          </div>
        ) : null}

        {tab === "liked" ? (
          likedPosts.length === 0 ? (
            <EmptyState text={copy.emptyLiked} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {likedPosts.map((post) => (
                <CabinetTile
                  key={post.id}
                  post={post}
                  onOpen={() => openPost(post)}
                />
              ))}
            </div>
          )
        ) : null}

        {tab === "channel" ? (
          <div className="rounded-[28px] border border-neutral-200 bg-white p-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Send className="h-4 w-4" />
              {copy.channelTitle}
            </div>

            <div className="text-sm leading-6 text-neutral-600">
              {copy.channelText}
            </div>

            <input
              value={channelUrl}
              onChange={(event) => setChannelUrl(event.target.value)}
              placeholder={copy.channelPlaceholder}
              className="mt-4 w-full rounded-full border border-neutral-200 px-4 py-3 text-sm outline-none transition focus:border-neutral-950"
            />

            <button
              type="button"
              onClick={handleSubmitChannel}
              className="mt-4 inline-flex items-center rounded-full bg-neutral-950 px-4 py-2 text-sm text-white transition hover:bg-neutral-800"
            >
              {copy.channelButton}
            </button>
          </div>
        ) : null}

        {tab === "about" ? (
          <div className="rounded-[28px] border border-neutral-200 bg-white p-6 text-sm leading-7 text-neutral-700">
            {copy.aboutText}
          </div>
        ) : null}
      </div>
    </div>
  );
}