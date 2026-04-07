import {
  Heart,
  Info,
  LogOut,
  Globe,
  Send,
  Plus,
  ChevronDown,
  Check,
  Sparkles,
} from "lucide-react";
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  type ComponentType,
} from "react";
import { VerifiedBadge } from "../components/shared/VerifiedBadge";
import type { IngestedPost, Locale } from "../types/app";
import { SITE_LOCALES } from "../lib/locales";

const TELEGRAM_BOT_ID = "8298054487";
const TG_STORAGE_KEY = "margelet_tg_user";
const LIKES_STORAGE_KEY = "margelet_likes";
const LANGUAGE_STORAGE_KEY = "margelet_locale";
const INTRO_LANGUAGE_STORAGE_KEY = "margelet_intro_locale";
const INTRO_SEEN_STORAGE_KEY = "margelet-intro-seen";

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
  introButtonShort: string;
  connectedToTelegram: string;
  logout: string;
  languageTitle: string;
  languageDropdownLabel: string;
  channelTitle: string;
  channelText: string;
  channelPlaceholder: string;
  channelButton: string;
  channelEmptyError: string;
  channelInvalidError: string;
  channelSuccess: string;
  aboutText: string;
  emptyLiked: string;
  telegramUserFallback: string;
  likedTabTitle: string;
  channelTabTitle: string;
  aboutTabTitle: string;
  languageTabTitle: string;
};

const COPY: Record<Locale, ScreenCopy> = {
  en: {
    authTitle: "Sign in with Telegram",
    authText:
      "Authorize to manage your cabinet, view liked posts and submit a request to add your own channel.",
    authButton: "Authorize",
    introButtonShort: "Intro",
    connectedToTelegram: "Connected to Telegram",
    logout: "Log out",
    languageTitle: "Choose language",
    languageDropdownLabel: "Website language",
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
    telegramUserFallback: "Telegram user",
    likedTabTitle: "Liked",
    channelTabTitle: "Add channel",
    aboutTabTitle: "About",
    languageTabTitle: "Language",
  },
  ru: {
    authTitle: "Войти через Telegram",
    authText:
      "Авторизуйся, чтобы управлять своим кабинетом, смотреть понравившиеся публикации и отправлять заявку на добавление собственного канала.",
    authButton: "Авторизоваться",
    introButtonShort: "Intro",
    connectedToTelegram: "Подключено к Telegram",
    logout: "Выйти",
    languageTitle: "Выбор языка",
    languageDropdownLabel: "Язык сайта",
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
    telegramUserFallback: "Пользователь Telegram",
    likedTabTitle: "Понравилось",
    channelTabTitle: "Добавить канал",
    aboutTabTitle: "О проекте",
    languageTabTitle: "Язык",
  },
  de: {
    authTitle: "Mit Telegram anmelden",
    authText:
      "Melde dich an, um dein Cabinet zu verwalten, gelikte Beiträge zu sehen und deinen Kanal zur Moderation einzureichen.",
    authButton: "Autorisieren",
    introButtonShort: "Intro",
    connectedToTelegram: "Mit Telegram verbunden",
    logout: "Abmelden",
    languageTitle: "Sprache wählen",
    languageDropdownLabel: "Webseitensprache",
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
    telegramUserFallback: "Telegram-Nutzer",
    likedTabTitle: "Likes",
    channelTabTitle: "Kanal hinzufügen",
    aboutTabTitle: "Über",
    languageTabTitle: "Sprache",
  },
  es: {
    authTitle: "Entrar con Telegram",
    authText:
      "Autorízate para gestionar tu cabinet, ver publicaciones marcadas y enviar tu canal a moderación.",
    authButton: "Autorizar",
    introButtonShort: "Intro",
    connectedToTelegram: "Conectado a Telegram",
    logout: "Salir",
    languageTitle: "Elegir idioma",
    languageDropdownLabel: "Idioma del sitio",
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
    telegramUserFallback: "Usuario de Telegram",
    likedTabTitle: "Me gusta",
    channelTabTitle: "Añadir canal",
    aboutTabTitle: "Acerca de",
    languageTabTitle: "Idioma",
  },
  tr: {
    authTitle: "Telegram ile giriş yap",
    authText:
      "Kabinetini yönetmek, beğendiğin gönderileri görmek ve kanalını moderasyona göndermek için giriş yap.",
    authButton: "Yetkilendir",
    introButtonShort: "Intro",
    connectedToTelegram: "Telegram bağlı",
    logout: "Çıkış yap",
    languageTitle: "Dil seç",
    languageDropdownLabel: "Site dili",
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
    telegramUserFallback: "Telegram kullanıcısı",
    likedTabTitle: "Beğenilenler",
    channelTabTitle: "Kanal ekle",
    aboutTabTitle: "Hakkında",
    languageTabTitle: "Dil",
  },
  fr: {
    authTitle: "Se connecter avec Telegram",
    authText:
      "Connecte-toi pour gérer ton cabinet, voir les publications aimées et envoyer ton canal à la modération.",
    authButton: "Autoriser",
    introButtonShort: "Intro",
    connectedToTelegram: "Connecté à Telegram",
    logout: "Se déconnecter",
    languageTitle: "Choisir la langue",
    languageDropdownLabel: "Langue du site",
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
    telegramUserFallback: "Utilisateur Telegram",
    likedTabTitle: "Aimés",
    channelTabTitle: "Ajouter un canal",
    aboutTabTitle: "À propos",
    languageTabTitle: "Langue",
  },
  it: {
    authTitle: "Accedi con Telegram",
    authText:
      "Accedi per gestire il tuo cabinet, vedere i post piaciuti e inviare il tuo canale alla moderazione.",
    authButton: "Autorizza",
    introButtonShort: "Intro",
    connectedToTelegram: "Connesso a Telegram",
    logout: "Esci",
    languageTitle: "Scegli lingua",
    languageDropdownLabel: "Lingua del sito",
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
    telegramUserFallback: "Utente Telegram",
    likedTabTitle: "Piaciuti",
    channelTabTitle: "Aggiungi canale",
    aboutTabTitle: "Info",
    languageTabTitle: "Lingua",
  },
  "pt-br": {
    authTitle: "Entrar com Telegram",
    authText:
      "Entre para gerenciar seu cabinet, ver posts curtidos e enviar seu canal para moderação.",
    authButton: "Autorizar",
    introButtonShort: "Intro",
    connectedToTelegram: "Conectado ao Telegram",
    logout: "Sair",
    languageTitle: "Escolher idioma",
    languageDropdownLabel: "Idioma do site",
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
    telegramUserFallback: "Usuário do Telegram",
    likedTabTitle: "Curtidos",
    channelTabTitle: "Adicionar canal",
    aboutTabTitle: "Sobre",
    languageTabTitle: "Idioma",
  },
  id: {
    authTitle: "Masuk dengan Telegram",
    authText:
      "Masuk untuk mengelola cabinet, melihat postingan yang disukai dan mengirim kanalmu ke moderasi.",
    authButton: "Otorisasi",
    introButtonShort: "Intro",
    connectedToTelegram: "Terhubung ke Telegram",
    logout: "Keluar",
    languageTitle: "Pilih bahasa",
    languageDropdownLabel: "Bahasa situs",
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
    telegramUserFallback: "Pengguna Telegram",
    likedTabTitle: "Disukai",
    channelTabTitle: "Tambah kanal",
    aboutTabTitle: "Tentang",
    languageTabTitle: "Bahasa",
  },
  pl: {
    authTitle: "Zaloguj się przez Telegram",
    authText:
      "Zaloguj się, aby zarządzać swoim cabinet, oglądać polubione posty i wysłać kanał do moderacji.",
    authButton: "Autoryzuj",
    introButtonShort: "Intro",
    connectedToTelegram: "Połączono z Telegramem",
    logout: "Wyloguj się",
    languageTitle: "Wybierz język",
    languageDropdownLabel: "Język strony",
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
    telegramUserFallback: "Użytkownik Telegrama",
    likedTabTitle: "Polubione",
    channelTabTitle: "Dodaj kanał",
    aboutTabTitle: "O projekcie",
    languageTabTitle: "Język",
  },
};

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

function readLocaleFromStorage(key: string, fallback: Locale): Locale {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  const exists = SITE_LOCALES.some((item) => item.code === raw);
  return exists ? (raw as Locale) : fallback;
}

function buildAlphabeticalLocales() {
  const sorted = [...SITE_LOCALES].sort((a, b) =>
    a.nativeLabel.localeCompare(b.nativeLabel, undefined, {
      sensitivity: "base",
    })
  );

  const ruIndex = sorted.findIndex((item) => item.code === "ru");
  if (ruIndex === -1) return sorted;

  const [ru] = sorted.splice(ruIndex, 1);
  sorted.splice(Math.min(3, sorted.length), 0, ru);

  return sorted;
}

function TopIconButton({
  active,
  onClick,
  icon: Icon,
  title,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
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

function LocaleDropdown({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Locale;
  onChange: (locale: Locale) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const options = useMemo(() => buildAlphabeticalLocales(), []);
  const selected = getLocaleOption(value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
        {label}
      </div>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex min-h-[52px] w-full items-center justify-between rounded-full border border-neutral-200 bg-white px-4 py-3 text-left transition hover:bg-neutral-50"
      >
        <span className="truncate pr-4 text-sm font-medium text-neutral-900">
          {selected?.nativeLabel ?? value}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-neutral-500 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-30 max-h-80 overflow-y-auto rounded-[24px] border border-neutral-200 bg-white p-2 shadow-xl">          
          {options.map((item) => {
            const isActive = item.code === value;

            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  onChange(item.code as Locale);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition ${
                  isActive
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <span className="truncate pr-4">{item.nativeLabel}</span>
                {isActive ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function AuthBlock({
  copy,
  onReplayIntro,
}: {
  copy: ScreenCopy;
  onReplayIntro: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white text-neutral-950 shadow-sm">
      <div className="px-5 py-5">
        <div className="text-[26px] font-semibold leading-tight">
          {copy.authTitle}
        </div>

        <div className="mt-2 max-w-[32rem] text-sm leading-6 text-neutral-600">
          {copy.authText}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => {
              window.location.href = getTelegramAuthUrl();
            }}
            className="inline-flex items-center rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
            type="button"
          >
            {copy.authButton}
          </button>

          <button
            onClick={onReplayIntro}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-100"
            type="button"
          >
            <Sparkles className="h-4 w-4" />
            {copy.introButtonShort}
          </button>
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
      <div className="px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-neutral-200">
            {user.photo_url ? (
              <img
                src={user.photo_url}
                alt={user.first_name}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="truncate text-lg font-semibold">
                {user.first_name}
              </div>
              <VerifiedBadge className="shrink-0 text-[#2AABEE]" />
            </div>

            <div className="truncate text-sm text-neutral-500">
              {user.username ? `@${user.username}` : copy.telegramUserFallback}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="inline-flex min-h-[32px] items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
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
            <div className="truncate text-sm font-semibold">
              {post.source.title}
            </div>
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
  const [introLocale, setIntroLocale] = useState<Locale>(() =>
    typeof window === "undefined"
      ? locale
      : readLocaleFromStorage(INTRO_LANGUAGE_STORAGE_KEY, locale)
  );

  useEffect(() => {
    const sync = () => {
      setUser(readTelegramUserFromStorage());
      setLikedIds(readNumberArrayFromStorage(LIKES_STORAGE_KEY));
      setIntroLocale(readLocaleFromStorage(INTRO_LANGUAGE_STORAGE_KEY, locale));
    };

    sync();

    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, [locale]);

  useEffect(() => {
    localStorage.setItem(INTRO_LANGUAGE_STORAGE_KEY, introLocale);
  }, [introLocale]);

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
    localStorage.setItem(LANGUAGE_STORAGE_KEY, introLocale);
    localStorage.setItem(INTRO_LANGUAGE_STORAGE_KEY, introLocale);
    setLocale(introLocale);
    localStorage.removeItem(INTRO_SEEN_STORAGE_KEY);
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

  return (
    <div className="min-h-screen bg-neutral-50 px-4 pb-10 pt-20 text-neutral-950">
      <div className="mx-auto max-w-[570px] space-y-6">
        {!user ? (
          <AuthBlock copy={copy} onReplayIntro={handleReplayIntro} />
        ) : (
          <ProfileBlock user={user} copy={copy} onLogout={handleLogout} />
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
            <TopIconButton
              active={tab === "liked"}
              onClick={() => setTab("liked")}
              icon={Heart}
              title={copy.likedTabTitle}
            />

            <TopIconButton
              active={tab === "channel"}
              onClick={() => setTab("channel")}
              icon={Plus}
              title={copy.channelTabTitle}
            />

            <TopIconButton
              active={tab === "about"}
              onClick={() => setTab("about")}
              icon={Info}
              title={copy.aboutTabTitle}
            />
          </div>

          <div className="shrink-0">
            <LanguageChip
              active={tab === "language"}
              onClick={() => setTab("language")}
              label={LOCALE_SHORT[locale]}
              title={copy.languageTabTitle}
            />
          </div>
        </div>

        {tab === "language" ? (
          <div className="space-y-4">
            <div className="rounded-[28px] border border-neutral-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
                <Globe className="h-4 w-4" />
                {copy.languageTitle}
              </div>

              <LocaleDropdown
                label={copy.languageDropdownLabel}
                value={locale}
                onChange={handleChangeLocale}
              />
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