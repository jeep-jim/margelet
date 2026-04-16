import {
  Info,
  LogOut,
  Globe,
  Send,
  Plus,
  ChevronDown,
  Check,
  Sparkles,
  Sun,
  Moon,
  X,
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
import { getTheme, toggleTheme, type Theme } from "../lib/theme";

const TELEGRAM_BOT_ID = "8298054487";
const TG_STORAGE_KEY = "margelet_tg_user";
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

type CabinetTab = "channel" | "about" | "language";

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
  channelTabTitle: string;
  aboutTabTitle: string;
  languageTabTitle: string;
  manifestButton: string;
  manifestTitle: string;
  manifestSubtitle: string;
  manifestClose: string;
  manifestIntro1: string;
  manifestIntro2: string;
  manifestIntro3: string;
  manifestIntro4: string;
  manifestBulletsTitle: string;
  manifestBullet1: string;
  manifestBullet2: string;
  manifestBullet3: string;
  manifestBullet4: string;
  manifestBullet5: string;
  manifestOutro1: string;
  manifestOutro2: string;
  manifestOutro3: string;
  manifestOutro4: string;
  manifestOutro5: string;
  manifestOutro6: string;
  manifestOutro7: string;
  manifestOutro8: string;
  manifestOutro9: string;
};

const COPY: Record<Locale, ScreenCopy> = {
  en: {
    authTitle: "Sign in with Telegram",
    authText:
      "Authorize to manage your cabinet, submit a request to add your own channel.",
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
    channelTabTitle: "Add channel",
    aboutTabTitle: "About",
    languageTabTitle: "Language",
    manifestButton: "Manifesto",
    manifestTitle: "Manifesto",
    manifestSubtitle: "margeleT and the open Telegram ecosystem",
    manifestClose: "Close",
    manifestIntro1:
      "margeleT was born from a simple idea: valuable voices should remain reachable, and people should remain connected to the creators they chose themselves.",
    manifestIntro2:
      "All over the world, millions of people discover news, culture, communities, education, humor, and independent media through open Telegram channels. For many authors, Telegram is not just a platform. It is their audience, their work, and a direct connection with their readers.",
    manifestIntro3:
      "But we also see a new challenge: in some countries, access to attention, discovery, and stable reach has become more difficult. Strong channels can remain unseen. Powerful posts get lost in the noise. Authors and readers can lose each other.",
    manifestIntro4:
      "margeleT exists to shorten this distance.",
    manifestBulletsTitle: "Our role is simple:",
    manifestBullet1: "help people discover high-quality open channels",
    manifestBullet2:
      "surface fresh content to the people who are truly interested in it",
    manifestBullet3: "make discovery easier across countries and languages",
    manifestBullet4:
      "return readers to original authors and original sources",
    manifestBullet5:
      "strengthen the bond between authors and their communities",
    manifestOutro1: "We do not replace Telegram.",
    manifestOutro2: "We do not compete with Telegram.",
    manifestOutro3: "We do not claim the work of others as our own.",
    manifestOutro4:
      "We exist as a lightweight layer of discovery and distribution around open Telegram content.",
    manifestOutro5:
      "Every source belongs to its creator. Every channel remains the native home of its audience. Every post begins with the author and should lead back to the author.",
    manifestOutro6:
      "That is why attribution matters to us. That is why original sources matter to us. That is why direct access to channels matters to us.",
    manifestOutro7:
      "We believe open ecosystems grow stronger when useful bridges are built around them.",
    manifestOutro8:
      "Our goal is not to take attention away. Our goal is to help attention find where it truly belongs.",
    manifestOutro9: "— margeleT",
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
    channelTabTitle: "Добавить канал",
    aboutTabTitle: "О проекте",
    languageTabTitle: "Язык",
    manifestButton: "Манифест",
    manifestTitle: "Манифест",
    manifestSubtitle: "margeleT и открытая экосистема Telegram",
    manifestClose: "Закрыть",
    manifestIntro1:
      "margeleT появился из простой идеи: ценные голоса должны оставаться доступными, а люди должны сохранять связь с теми авторами, которых выбрали сами.",
    manifestIntro2:
      "Во всём мире миллионы людей находят новости, культуру, сообщества, образование, юмор и независимые медиа через открытые Telegram-каналы. Для многих авторов Telegram — это не просто платформа. Это аудитория, работа и прямая связь со своими читателями.",
    manifestIntro3:
      "Но мы видим и новую проблему: в некоторых странах доступ к вниманию, поиску и стабильному охвату стал сложнее. Хорошие каналы могут оставаться незамеченными. Сильные публикации теряются в шуме. Авторы и читатели могут терять друг друга.",
    manifestIntro4:
      "margeleT создан, чтобы сократить эту дистанцию.",
    manifestBulletsTitle: "Наша задача проста:",
    manifestBullet1: "помогать людям находить качественные открытые каналы",
    manifestBullet2:
      "показывать свежий контент тем, кому он действительно интересен",
    manifestBullet3: "упрощать поиск между странами и языками",
    manifestBullet4:
      "возвращать читателей к оригинальным авторам и источникам",
    manifestBullet5:
      "укреплять связь между авторами и их сообществами",
    manifestOutro1: "Мы не заменяем Telegram.",
    manifestOutro2: "Мы не конкурируем с Telegram.",
    manifestOutro3: "Мы не присваиваем себе чужой труд.",
    manifestOutro4:
      "Мы существуем как лёгкий слой поиска и дистрибуции вокруг открытого Telegram-контента.",
    manifestOutro5:
      "Каждый источник принадлежит своему создателю. Каждый канал остаётся родным домом своей аудитории. Каждый пост начинается у автора и должен вести обратно к автору.",
    manifestOutro6:
      "Именно поэтому для нас важна ссылка на источник. Именно поэтому для нас важно авторство. Именно поэтому для нас важен прямой переход в канал.",
    manifestOutro7:
      "Мы верим, что открытые экосистемы становятся сильнее, когда вокруг них появляются полезные мосты.",
    manifestOutro8:
      "Наша цель — не забирать внимание себе. Наша цель — помочь вниманию найти того, кому оно действительно принадлежит.",
    manifestOutro9: "— margeleT",
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
    channelTabTitle: "Kanal hinzufügen",
    aboutTabTitle: "Über",
    languageTabTitle: "Sprache",
    manifestButton: "Manifest",
    manifestTitle: "Manifest",
    manifestSubtitle: "margeleT und das offene Telegram-Ökosystem",
    manifestClose: "Schließen",
    manifestIntro1:
      "margeleT entstand aus einer einfachen Idee: wertvolle Stimmen sollen erreichbar bleiben, und Menschen sollen mit den Autorinnen und Autoren verbunden bleiben, die sie selbst gewählt haben.",
    manifestIntro2:
      "Auf der ganzen Welt entdecken Millionen Menschen Nachrichten, Kultur, Gemeinschaften, Bildung, Humor und unabhängige Medien über offene Telegram-Kanäle. Für viele Autorinnen und Autoren ist Telegram nicht nur eine Plattform. Es ist ihr Publikum, ihre Arbeit und eine direkte Verbindung zu ihren Leserinnen und Lesern.",
    manifestIntro3:
      "Doch wir sehen auch ein neues Problem: In manchen Ländern ist der Zugang zu Aufmerksamkeit, Entdeckung und stabiler Reichweite schwieriger geworden. Gute Kanäle können unsichtbar bleiben. Starke Beiträge gehen im Rauschen verloren. Autorinnen, Autoren und Leserinnen, Leser können einander verlieren.",
    manifestIntro4:
      "margeleT wurde geschaffen, um diese Distanz zu verkürzen.",
    manifestBulletsTitle: "Unsere Aufgabe ist einfach:",
    manifestBullet1: "Menschen helfen, hochwertige offene Kanäle zu entdecken",
    manifestBullet2:
      "frische Inhalte den Menschen zeigen, die wirklich daran interessiert sind",
    manifestBullet3: "Entdeckung zwischen Ländern und Sprachen erleichtern",
    manifestBullet4:
      "Leserinnen und Leser zu den ursprünglichen Autorinnen, Autoren und Quellen zurückführen",
    manifestBullet5:
      "die Verbindung zwischen Autorinnen, Autoren und ihren Communities stärken",
    manifestOutro1: "Wir ersetzen Telegram nicht.",
    manifestOutro2: "Wir konkurrieren nicht mit Telegram.",
    manifestOutro3: "Wir eignen uns die Arbeit anderer nicht an.",
    manifestOutro4:
      "Wir existieren als leichte Ebene für Entdeckung und Distribution rund um offene Telegram-Inhalte.",
    manifestOutro5:
      "Jede Quelle gehört ihrem Schöpfer. Jeder Kanal bleibt das natürliche Zuhause seines Publikums. Jeder Beitrag beginnt beim Autor und sollte zum Autor zurückführen.",
    manifestOutro6:
      "Darum ist Quellenangabe für uns wichtig. Darum sind originale Quellen für uns wichtig. Darum ist direkter Zugang zu Kanälen für uns wichtig.",
    manifestOutro7:
      "Wir glauben, dass offene Ökosysteme stärker werden, wenn um sie herum nützliche Brücken entstehen.",
    manifestOutro8:
      "Unser Ziel ist nicht, Aufmerksamkeit wegzunehmen. Unser Ziel ist es, Aufmerksamkeit dorthin zu führen, wo sie wirklich hingehört.",
    manifestOutro9: "— margeleT",
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
    channelTabTitle: "Añadir canal",
    aboutTabTitle: "Acerca de",
    languageTabTitle: "Idioma",
    manifestButton: "Manifiesto",
    manifestTitle: "Manifiesto",
    manifestSubtitle: "margeleT y el ecosistema abierto de Telegram",
    manifestClose: "Cerrar",
    manifestIntro1:
      "margeleT nació de una idea simple: las voces valiosas deben seguir siendo accesibles y las personas deben seguir conectadas con los creadores que eligieron por sí mismas.",
    manifestIntro2:
      "En todo el mundo, millones de personas descubren noticias, cultura, comunidades, educación, humor y medios independientes a través de canales abiertos de Telegram. Para muchos autores, Telegram no es solo una plataforma. Es su audiencia, su trabajo y una conexión directa con sus lectores.",
    manifestIntro3:
      "Pero también vemos un nuevo problema: en algunos países, el acceso a la atención, al descubrimiento y al alcance estable se ha vuelto más difícil. Los buenos canales pueden pasar desapercibidos. Las publicaciones fuertes se pierden en el ruido. Autores y lectores pueden perderse entre sí.",
    manifestIntro4:
      "margeleT existe para acortar esa distancia.",
    manifestBulletsTitle: "Nuestra tarea es simple:",
    manifestBullet1: "ayudar a las personas a descubrir canales abiertos de calidad",
    manifestBullet2:
      "mostrar contenido fresco a quienes realmente están interesados en él",
    manifestBullet3:
      "facilitar el descubrimiento entre países e idiomas",
    manifestBullet4:
      "devolver a los lectores a los autores y fuentes originales",
    manifestBullet5:
      "fortalecer el vínculo entre los autores y sus comunidades",
    manifestOutro1: "No reemplazamos a Telegram.",
    manifestOutro2: "No competimos con Telegram.",
    manifestOutro3: "No nos apropiamos del trabajo de otros.",
    manifestOutro4:
      "Existimos como una capa ligera de descubrimiento y distribución alrededor del contenido abierto de Telegram.",
    manifestOutro5:
      "Cada fuente pertenece a su creador. Cada canal sigue siendo el hogar natural de su audiencia. Cada publicación comienza con el autor y debe volver al autor.",
    manifestOutro6:
      "Por eso la atribución nos importa. Por eso las fuentes originales nos importan. Por eso el acceso directo a los canales nos importa.",
    manifestOutro7:
      "Creemos que los ecosistemas abiertos se vuelven más fuertes cuando se construyen puentes útiles a su alrededor.",
    manifestOutro8:
      "Nuestro objetivo no es quitar atención. Nuestro objetivo es ayudar a que la atención encuentre a quien realmente le pertenece.",
    manifestOutro9: "— margeleT",
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
    channelTabTitle: "Kanal ekle",
    aboutTabTitle: "Hakkında",
    languageTabTitle: "Dil",
    manifestButton: "Manifesto",
    manifestTitle: "Manifesto",
    manifestSubtitle: "margeleT ve açık Telegram ekosistemi",
    manifestClose: "Kapat",
    manifestIntro1:
      "margeleT basit bir fikirden doğdu: değerli sesler erişilebilir kalmalı ve insanlar kendi seçtikleri yaratıcılarla bağlarını koruyabilmeli.",
    manifestIntro2:
      "Dünyanın her yerinde milyonlarca insan haberleri, kültürü, toplulukları, eğitimi, mizahı ve bağımsız medyayı açık Telegram kanalları üzerinden keşfediyor. Birçok yazar için Telegram sadece bir platform değil. O onların kitlesi, emeği ve okuyucularıyla doğrudan bağıdır.",
    manifestIntro3:
      "Ama yeni bir sorun da görüyoruz: bazı ülkelerde dikkat, keşif ve istikrarlı erişim daha zor hale geldi. Güçlü kanallar görünmez kalabiliyor. Güçlü gönderiler gürültü içinde kayboluyor. Yazarlar ve okuyucular birbirlerini kaybedebiliyor.",
    manifestIntro4:
      "margeleT bu mesafeyi kısaltmak için var.",
    manifestBulletsTitle: "Görevimiz basit:",
    manifestBullet1:
      "insanların kaliteli açık kanalları keşfetmesine yardımcı olmak",
    manifestBullet2:
      "gerçekten ilgilenen insanlara taze içerik göstermek",
    manifestBullet3: "ülkeler ve diller arasında keşfi kolaylaştırmak",
    manifestBullet4:
      "okuyucuları özgün yazarlara ve kaynaklara geri götürmek",
    manifestBullet5:
      "yazarlarla toplulukları arasındaki bağı güçlendirmek",
    manifestOutro1: "Telegram'ın yerini almıyoruz.",
    manifestOutro2: "Telegram ile rekabet etmiyoruz.",
    manifestOutro3: "Başkalarının emeğini sahiplenmiyoruz.",
    manifestOutro4:
      "Açık Telegram içeriğinin etrafında hafif bir keşif ve dağıtım katmanı olarak varız.",
    manifestOutro5:
      "Her kaynak yaratıcısına aittir. Her kanal kitlesinin doğal evi olarak kalır. Her gönderi yazarda başlar ve tekrar yazara dönmelidir.",
    manifestOutro6:
      "Bu yüzden atıf bizim için önemlidir. Bu yüzden özgün kaynaklar bizim için önemlidir. Bu yüzden kanallara doğrudan erişim bizim için önemlidir.",
    manifestOutro7:
      "Açık ekosistemlerin, etraflarında faydalı köprüler kurulduğunda daha güçlü hale geldiğine inanıyoruz.",
    manifestOutro8:
      "Amacımız dikkati kendimize çekmek değil. Amacımız dikkatin gerçekten ait olduğu yeri bulmasına yardımcı olmak.",
    manifestOutro9: "— margeleT",
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
    channelTabTitle: "Ajouter un canal",
    aboutTabTitle: "À propos",
    languageTabTitle: "Langue",
    manifestButton: "Manifeste",
    manifestTitle: "Manifeste",
    manifestSubtitle: "margeleT et l'écosystème ouvert de Telegram",
    manifestClose: "Fermer",
    manifestIntro1:
      "margeleT est né d'une idée simple : les voix précieuses doivent rester accessibles, et les personnes doivent rester liées aux créateurs qu'elles ont choisis elles-mêmes.",
    manifestIntro2:
      "Partout dans le monde, des millions de personnes découvrent l'actualité, la culture, les communautés, l'éducation, l'humour et les médias indépendants grâce aux canaux Telegram ouverts. Pour de nombreux auteurs, Telegram n'est pas seulement une plateforme. C'est leur audience, leur travail et un lien direct avec leurs lecteurs.",
    manifestIntro3:
      "Mais nous voyons aussi un nouveau problème : dans certains pays, l'accès à l'attention, à la découverte et à une portée stable est devenu plus difficile. De bons canaux peuvent rester invisibles. Les publications fortes se perdent dans le bruit. Les auteurs et les lecteurs peuvent se perdre les uns les autres.",
    manifestIntro4:
      "margeleT existe pour réduire cette distance.",
    manifestBulletsTitle: "Notre mission est simple :",
    manifestBullet1:
      "aider les gens à découvrir des canaux ouverts de qualité",
    manifestBullet2:
      "montrer du contenu frais aux personnes réellement intéressées",
    manifestBullet3:
      "faciliter la découverte entre pays et langues",
    manifestBullet4:
      "ramener les lecteurs vers les auteurs et les sources d'origine",
    manifestBullet5:
      "renforcer le lien entre les auteurs et leurs communautés",
    manifestOutro1: "Nous ne remplaçons pas Telegram.",
    manifestOutro2: "Nous ne concurrençons pas Telegram.",
    manifestOutro3: "Nous ne nous approprions pas le travail des autres.",
    manifestOutro4:
      "Nous existons comme une couche légère de découverte et de distribution autour du contenu Telegram ouvert.",
    manifestOutro5:
      "Chaque source appartient à son créateur. Chaque canal reste la maison naturelle de son audience. Chaque publication commence chez l'auteur et doit revenir à l'auteur.",
    manifestOutro6:
      "C'est pourquoi l'attribution compte pour nous. C'est pourquoi les sources d'origine comptent pour nous. C'est pourquoi l'accès direct aux canaux compte pour nous.",
    manifestOutro7:
      "Nous croyons que les écosystèmes ouverts deviennent plus forts lorsque des ponts utiles sont construits autour d'eux.",
    manifestOutro8:
      "Notre objectif n'est pas de prendre l'attention. Notre objectif est d'aider l'attention à trouver l'endroit auquel elle appartient vraiment.",
    manifestOutro9: "— margeleT",
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
    channelTabTitle: "Aggiungi canale",
    aboutTabTitle: "Info",
    languageTabTitle: "Lingua",
    manifestButton: "Manifesto",
    manifestTitle: "Manifesto",
    manifestSubtitle: "margeleT e l'ecosistema aperto di Telegram",
    manifestClose: "Chiudi",
    manifestIntro1:
      "margeleT è nato da un'idea semplice: le voci preziose devono restare accessibili e le persone devono restare connesse ai creatori che hanno scelto da sole.",
    manifestIntro2:
      "In tutto il mondo, milioni di persone scoprono notizie, cultura, comunità, educazione, umorismo e media indipendenti attraverso canali Telegram aperti. Per molti autori, Telegram non è solo una piattaforma. È il loro pubblico, il loro lavoro e un collegamento diretto con i lettori.",
    manifestIntro3:
      "Ma vediamo anche un nuovo problema: in alcuni paesi l'accesso all'attenzione, alla scoperta e a una portata stabile è diventato più difficile. I buoni canali possono restare invisibili. I post forti si perdono nel rumore. Autori e lettori possono perdersi a vicenda.",
    manifestIntro4:
      "margeleT esiste per accorciare questa distanza.",
    manifestBulletsTitle: "Il nostro compito è semplice:",
    manifestBullet1:
      "aiutare le persone a scoprire canali aperti di qualità",
    manifestBullet2:
      "mostrare contenuti freschi alle persone davvero interessate",
    manifestBullet3:
      "rendere più facile la scoperta tra paesi e lingue",
    manifestBullet4:
      "riportare i lettori agli autori e alle fonti originali",
    manifestBullet5:
      "rafforzare il legame tra autori e comunità",
    manifestOutro1: "Non sostituiamo Telegram.",
    manifestOutro2: "Non competiamo con Telegram.",
    manifestOutro3: "Non ci appropriamo del lavoro altrui.",
    manifestOutro4:
      "Esistiamo come un leggero livello di scoperta e distribuzione attorno al contenuto Telegram aperto.",
    manifestOutro5:
      "Ogni fonte appartiene al suo creatore. Ogni canale resta la casa naturale del suo pubblico. Ogni post nasce dall'autore e deve tornare all'autore.",
    manifestOutro6:
      "Per questo l'attribuzione conta per noi. Per questo le fonti originali contano per noi. Per questo l'accesso diretto ai canali conta per noi.",
    manifestOutro7:
      "Crediamo che gli ecosistemi aperti diventino più forti quando attorno a loro vengono costruiti ponti utili.",
    manifestOutro8:
      "Il nostro obiettivo non è sottrarre attenzione. Il nostro obiettivo è aiutare l'attenzione a trovare il luogo a cui appartiene davvero.",
    manifestOutro9: "— margeleT",
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
    channelTabTitle: "Adicionar canal",
    aboutTabTitle: "Sobre",
    languageTabTitle: "Idioma",
    manifestButton: "Manifesto",
    manifestTitle: "Manifesto",
    manifestSubtitle: "margeleT e o ecossistema aberto do Telegram",
    manifestClose: "Fechar",
    manifestIntro1:
      "margeleT nasceu de uma ideia simples: vozes valiosas devem continuar acessíveis, e as pessoas devem continuar conectadas aos criadores que escolheram por si mesmas.",
    manifestIntro2:
      "Em todo o mundo, milhões de pessoas descobrem notícias, cultura, comunidades, educação, humor e mídia independente por meio de canais abertos do Telegram. Para muitos autores, o Telegram não é apenas uma plataforma. É sua audiência, seu trabalho e uma ligação direta com seus leitores.",
    manifestIntro3:
      "Mas também vemos um novo problema: em alguns países, o acesso à atenção, à descoberta e ao alcance estável ficou mais difícil. Bons canais podem permanecer invisíveis. Postagens fortes se perdem no ruído. Autores e leitores podem perder uns aos outros.",
    manifestIntro4:
      "margeleT existe para encurtar essa distância.",
    manifestBulletsTitle: "Nossa tarefa é simples:",
    manifestBullet1:
      "ajudar as pessoas a descobrir canais abertos de qualidade",
    manifestBullet2:
      "mostrar conteúdo fresco às pessoas realmente interessadas",
    manifestBullet3:
      "facilitar a descoberta entre países e idiomas",
    manifestBullet4:
      "levar os leitores de volta aos autores e fontes originais",
    manifestBullet5:
      "fortalecer o vínculo entre autores e suas comunidades",
    manifestOutro1: "Não substituímos o Telegram.",
    manifestOutro2: "Não competimos com o Telegram.",
    manifestOutro3: "Não nos apropriamos do trabalho dos outros.",
    manifestOutro4:
      "Existimos como uma camada leve de descoberta e distribuição em torno do conteúdo aberto do Telegram.",
    manifestOutro5:
      "Cada fonte pertence ao seu criador. Cada canal continua sendo a casa natural da sua audiência. Cada postagem começa no autor e deve voltar ao autor.",
    manifestOutro6:
      "É por isso que a atribuição importa para nós. É por isso que as fontes originais importam para nós. É por isso que o acesso direto aos canais importa para nós.",
    manifestOutro7:
      "Acreditamos que ecossistemas abertos se tornam mais fortes quando pontes úteis são construídas ao redor deles.",
    manifestOutro8:
      "Nosso objetivo não é tirar atenção. Nosso objetivo é ajudar a atenção a encontrar o lugar ao qual ela realmente pertence.",
    manifestOutro9: "— margeleT",
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
    channelTabTitle: "Tambah kanal",
    aboutTabTitle: "Tentang",
    languageTabTitle: "Bahasa",
    manifestButton: "Manifesto",
    manifestTitle: "Manifesto",
    manifestSubtitle: "margeleT dan ekosistem Telegram terbuka",
    manifestClose: "Tutup",
    manifestIntro1:
      "margeleT lahir dari gagasan sederhana: suara yang berharga harus tetap dapat dijangkau, dan orang-orang harus tetap terhubung dengan kreator yang mereka pilih sendiri.",
    manifestIntro2:
      "Di seluruh dunia, jutaan orang menemukan berita, budaya, komunitas, pendidikan, humor, dan media independen melalui kanal Telegram terbuka. Bagi banyak penulis, Telegram bukan sekadar platform. Ini adalah audiens mereka, karya mereka, dan hubungan langsung dengan pembaca mereka.",
    manifestIntro3:
      "Namun kami juga melihat masalah baru: di beberapa negara, akses terhadap perhatian, penemuan, dan jangkauan yang stabil menjadi lebih sulit. Kanal yang bagus bisa tetap tidak terlihat. Postingan kuat hilang di tengah kebisingan. Penulis dan pembaca bisa kehilangan satu sama lain.",
    manifestIntro4:
      "margeleT hadir untuk memperpendek jarak ini.",
    manifestBulletsTitle: "Tugas kami sederhana:",
    manifestBullet1:
      "membantu orang menemukan kanal terbuka berkualitas",
    manifestBullet2:
      "menampilkan konten segar kepada orang yang benar-benar tertarik",
    manifestBullet3:
      "mempermudah penemuan antarnegara dan bahasa",
    manifestBullet4:
      "mengembalikan pembaca ke penulis dan sumber asli",
    manifestBullet5:
      "memperkuat hubungan antara penulis dan komunitas mereka",
    manifestOutro1: "Kami tidak menggantikan Telegram.",
    manifestOutro2: "Kami tidak bersaing dengan Telegram.",
    manifestOutro3: "Kami tidak mengklaim karya orang lain sebagai milik kami.",
    manifestOutro4:
      "Kami ada sebagai lapisan ringan untuk penemuan dan distribusi di sekitar konten Telegram terbuka.",
    manifestOutro5:
      "Setiap sumber milik penciptanya. Setiap kanal tetap menjadi rumah alami audiensnya. Setiap postingan dimulai dari penulis dan harus kembali kepada penulis.",
    manifestOutro6:
      "Itulah sebabnya atribusi penting bagi kami. Itulah sebabnya sumber asli penting bagi kami. Itulah sebabnya akses langsung ke kanal penting bagi kami.",
    manifestOutro7:
      "Kami percaya ekosistem terbuka menjadi lebih kuat ketika jembatan yang berguna dibangun di sekitarnya.",
    manifestOutro8:
      "Tujuan kami bukan mengambil perhatian. Tujuan kami adalah membantu perhatian menemukan tempat yang benar-benar menjadi miliknya.",
    manifestOutro9: "— margeleT",
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
    channelTabTitle: "Dodaj kanał",
    aboutTabTitle: "O projekcie",
    languageTabTitle: "Język",
    manifestButton: "Manifest",
    manifestTitle: "Manifest",
    manifestSubtitle: "margeleT i otwarty ekosystem Telegrama",
    manifestClose: "Zamknij",
    manifestIntro1:
      "margeleT powstał z prostej idei: wartościowe głosy powinny pozostać dostępne, a ludzie powinni zachować więź z twórcami, których sami wybrali.",
    manifestIntro2:
      "Na całym świecie miliony ludzi odkrywają wiadomości, kulturę, społeczności, edukację, humor i niezależne media przez otwarte kanały Telegrama. Dla wielu autorów Telegram to nie tylko platforma. To ich publiczność, ich praca i bezpośrednia więź z czytelnikami.",
    manifestIntro3:
      "Ale widzimy też nowy problem: w niektórych krajach dostęp do uwagi, odkrywania i stabilnego zasięgu stał się trudniejszy. Dobre kanały mogą pozostać niewidoczne. Mocne posty giną w szumie. Autorzy i czytelnicy mogą się nawzajem tracić.",
    manifestIntro4:
      "margeleT istnieje po to, aby skrócić ten dystans.",
    manifestBulletsTitle: "Nasze zadanie jest proste:",
    manifestBullet1:
      "pomagać ludziom odkrywać wysokiej jakości otwarte kanały",
    manifestBullet2:
      "pokazywać świeże treści tym, którzy naprawdę się nimi interesują",
    manifestBullet3:
      "ułatwiać odkrywanie między krajami i językami",
    manifestBullet4:
      "przywracać czytelników do oryginalnych autorów i źródeł",
    manifestBullet5:
      "wzmacniać więź między autorami a ich społecznościami",
    manifestOutro1: "Nie zastępujemy Telegrama.",
    manifestOutro2: "Nie konkurujemy z Telegramem.",
    manifestOutro3: "Nie przywłaszczamy sobie cudzej pracy.",
    manifestOutro4:
      "Istniejemy jako lekka warstwa odkrywania i dystrybucji wokół otwartych treści Telegrama.",
    manifestOutro5:
      "Każde źródło należy do swojego twórcy. Każdy kanał pozostaje naturalnym domem swojej publiczności. Każdy post zaczyna się u autora i powinien wracać do autora.",
    manifestOutro6:
      "Dlatego przypisanie ma dla nas znaczenie. Dlatego oryginalne źródła mają dla nas znaczenie. Dlatego bezpośredni dostęp do kanałów ma dla nas znaczenie.",
    manifestOutro7:
      "Wierzymy, że otwarte ekosystemy stają się silniejsze, gdy buduje się wokół nich użyteczne mosty.",
    manifestOutro8:
      "Naszym celem nie jest odbieranie uwagi. Naszym celem jest pomóc uwadze znaleźć miejsce, do którego naprawdę należy.",
    manifestOutro9: "— margeleT",
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
          ? "bg-strong text-strong-foreground"
          : "border border-soft bg-surface text-secondary bg-surface-hover"
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
          ? "bg-strong text-strong-foreground"
          : "border border-soft bg-surface text-secondary bg-surface-hover"
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
      <div className="text-secondary mb-2 text-xs font-medium uppercase tracking-[0.08em]">
        {label}
      </div>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="bg-surface text-primary bg-surface-hover flex min-h-[52px] w-full items-center justify-between rounded-full border border-soft px-4 py-3 text-left transition"
      >
        <span className="text-primary truncate pr-4 text-sm font-medium">
          {selected?.nativeLabel ?? value}
        </span>

        <ChevronDown
          className={`text-secondary h-4 w-4 shrink-0 transition ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="theme-scrollbar bg-surface shadow-soft absolute bottom-[calc(100%+8px)] left-0 right-0 z-30 max-h-80 overflow-y-auto rounded-[24px] border border-soft p-2">
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
                    ? "bg-strong text-strong-foreground"
                    : "text-secondary bg-surface-hover"
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
    <div className="bg-surface text-primary shadow-soft overflow-hidden rounded-[32px] border border-soft">
      <div className="px-5 py-5">
        <div className="text-[26px] font-semibold leading-tight">
          {copy.authTitle}
        </div>

        <div className="text-secondary mt-2 max-w-[32rem] text-sm leading-6">
          {copy.authText}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => {
              window.location.href = getTelegramAuthUrl();
            }}
            className="bg-strong text-strong-foreground bg-strong-hover inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium transition"
            type="button"
          >
            {copy.authButton}
          </button>

          <button
            onClick={onReplayIntro}
            className="bg-surface text-primary bg-surface-hover inline-flex items-center gap-2 rounded-full border border-soft px-4 py-2.5 text-sm font-medium transition"
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
    <div className="bg-surface text-primary shadow-soft overflow-hidden rounded-[32px] border border-soft">
      <div className="px-5 py-5">
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-surface-soft">
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

            <div className="text-secondary truncate text-sm">
              {user.username ? `@${user.username}` : copy.telegramUserFallback}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="bg-success-soft text-success inline-flex min-h-[32px] items-center rounded-full px-3 py-1 text-xs font-medium">
            {copy.connectedToTelegram}
          </div>

          <button
            onClick={onLogout}
            className="text-secondary bg-surface-hover inline-flex items-center gap-2 rounded-full border border-soft px-3 py-1.5 text-xs font-medium transition"
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


function ManifestModal({
  copy,
  open,
  onClose,
  theme,
}: {
  copy: ScreenCopy;
  open: boolean;
  onClose: () => void;
  theme: Theme;
}) {
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 z-[120]">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        className={`absolute inset-0 overflow-y-auto ${
          isDark ? "bg-[#17212b] text-white" : "bg-[#f4f5f7] text-[#0f172a]"
        }`}
      >
        <div
          className={`sticky top-0 z-20 border-b ${
            isDark
              ? "border-[#2b3f53] bg-[#1f2c3a]/95"
              : "border-[#e2e8f0] bg-white/95"
          } backdrop-blur`}
        >
          <div className="mx-auto flex h-16 max-w-[570px] items-center justify-between px-4">
            <div className="w-10" />

            <div className="text-center">
              <div className="text-lg font-semibold">{copy.manifestTitle}</div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
                isDark
                  ? "text-white/80 hover:bg-white/10"
                  : "text-[#475569] hover:bg-[#eef2f7]"
              }`}
              aria-label={copy.manifestClose}
              title={copy.manifestClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-[570px] px-3 pb-10 pt-5 sm:px-4">
          <div
            className={`overflow-hidden ${
              isDark ? "bg-transparent" : "bg-transparent"
            } sm:rounded-[30px] sm:border ${
              isDark
                ? "sm:border-[#2b3f53] sm:bg-[#1b2937]"
                : "sm:border-[#e2e8f0] sm:bg-white"
            }`}
          >            
            <div className="px-4 pb-8 pt-5 sm:px-6">
              <div
                className={`mb-3 w-full overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-semibold leading-5 sm:text-[24px] sm:leading-8 ${
                  isDark ? "text-white" : "text-[#111827]"
                }`}
              >
                {copy.manifestSubtitle}
              </div>                  

              <div className="mb-0 overflow-hidden rounded-[28px]">
                <img
                  src="/manifest-hero.webp"
                  alt={copy.manifestTitle}
                  className="h-auto w-full object-cover"
                />
              </div>

              <div
                className={`space-y-4 text-[15px] leading-7 ${
                  isDark ? "text-[#d5deea]" : "text-[#334155]"
                }`}
              >
                <p>{copy.manifestIntro1}</p>
                <p>{copy.manifestIntro2}</p>
                <p>{copy.manifestIntro3}</p>
                <p>{copy.manifestIntro4}</p>

                <div className="space-y-3">
                  <p
                    className={`text-[18px] font-semibold ${
                      isDark ? "text-white" : "text-[#111827]"
                    }`}
                  >
                    {copy.manifestBulletsTitle}
                  </p>

                  <ul className="space-y-2 pl-5">
                    <li>{copy.manifestBullet1}</li>
                    <li>{copy.manifestBullet2}</li>
                    <li>{copy.manifestBullet3}</li>
                    <li>{copy.manifestBullet4}</li>
                    <li>{copy.manifestBullet5}</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <p>{copy.manifestOutro1}</p>
                  <p>{copy.manifestOutro2}</p>
                  <p>{copy.manifestOutro3}</p>
                  <p>{copy.manifestOutro4}</p>
                  <p>{copy.manifestOutro5}</p>
                  <p>{copy.manifestOutro6}</p>
                  <p>{copy.manifestOutro7}</p>
                  <p>{copy.manifestOutro8}</p>
                </div>

                <div
                  className={`pt-2 text-xl font-semibold ${
                    isDark ? "text-white" : "text-[#111827]"
                  }`}
                >
                  {copy.manifestOutro9}
                </div>
              </div>

              <div className="mt-8 flex justify-center sm:hidden">
                <button
                  type="button"
                  onClick={onClose}
                  className={`inline-flex min-h-[48px] items-center rounded-full px-6 py-3 text-sm font-medium transition ${
                    isDark
                      ? "border border-[#7244d4] bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white hover:opacity-95"
                      : "border border-[#d8b4fe] bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white hover:opacity-95"
                  }`}
                >
                  {copy.manifestClose}
                </button>
              </div>              
            </div>
          </div>
          <div className="mt-8 hidden justify-center sm:flex">
            <button
              type="button"
              onClick={onClose}
              className={`inline-flex min-h-[48px] items-center rounded-full px-6 py-3 text-sm font-medium transition ${
                isDark
                  ? "border border-[#7244d4] bg-gradient-to-r from-[#7c3aed] to-[#a855f7] text-white hover:opacity-95"
                  : "border border-[#d8b4fe] bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] text-white hover:opacity-95"
              }`}
            >
              {copy.manifestClose}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export function CreatorScreen({
  locale,
  setLocale,
  posts: _posts,
  openPost: _openPost,
}: Props) {
  const [user, setUser] = useState<TgUser | null>(null);
  const [tab, setTab] = useState<CabinetTab>("language");
  const [channelUrl, setChannelUrl] = useState("");
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window === "undefined" ? "light" : getTheme()
  );
  const [introLocale, setIntroLocale] = useState<Locale>(() =>
    typeof window === "undefined"
      ? locale
      : readLocaleFromStorage(INTRO_LANGUAGE_STORAGE_KEY, locale)
  );
  const [manifestOpen, setManifestOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      setUser(readTelegramUserFromStorage());
      setIntroLocale(readLocaleFromStorage(INTRO_LANGUAGE_STORAGE_KEY, locale));
      setTheme(getTheme());
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


  const handleLogout = () => {
    localStorage.removeItem(TG_STORAGE_KEY);
    setUser(null);
  };

  const handleChangeLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
  };

  const handleToggleTheme = () => {
    const next = toggleTheme();
    setTheme(next);
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
    <>
      <div className="bg-app text-primary min-h-screen px-4 pb-10 pt-20">
        <div className="mx-auto max-w-[570px] space-y-6">
          {!user ? (
            <AuthBlock copy={copy} onReplayIntro={handleReplayIntro} />
          ) : (
            <ProfileBlock user={user} copy={copy} onLogout={handleLogout} />
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">

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

            <div className="flex shrink-0 items-center gap-2">
              <TopIconButton
                active={theme === "dark"}
                onClick={handleToggleTheme}
                icon={theme === "dark" ? Sun : Moon}
                title="Theme"
              />

              <LanguageChip
                active={tab === "language"}
                onClick={() => setTab("language")}
                label={LOCALE_SHORT[locale]}
                title={copy.languageTabTitle}
              />
            </div>
          </div>

          {tab === "language" ? (
            <div className="space-y-3">
              <div className="bg-surface rounded-[28px] border border-soft p-6">
                <div className="text-primary mb-4 flex items-center gap-2 text-sm font-semibold">
                  <Globe className="h-4 w-4" />
                  {copy.languageTitle}
                </div>

                <LocaleDropdown
                  label={copy.languageDropdownLabel}
                  value={locale}
                  onChange={handleChangeLocale}
                />
              </div>

              <button
                type="button"
                onClick={() => setManifestOpen(true)}
                className="inline-flex min-h-[56px] w-full items-center justify-center rounded-[20px] border border-[#7244d4] bg-gradient-to-r from-[#7c3aed] to-[#a855f7] px-6 py-4 text-lg font-semibold text-white shadow-[0_14px_34px_rgba(124,58,237,0.28)] transition hover:opacity-95"
              >
                {copy.manifestButton}
              </button>
            </div>
          ) : null}

          {tab === "channel" ? (
            <div className="bg-surface rounded-[28px] border border-soft p-6">
              <div className="text-primary mb-3 flex items-center gap-2 text-sm font-semibold">
                <Send className="h-4 w-4" />
                {copy.channelTitle}
              </div>

              <div className="text-secondary text-sm leading-6">
                {copy.channelText}
              </div>

              <input
                value={channelUrl}
                onChange={(event) => setChannelUrl(event.target.value)}
                placeholder={copy.channelPlaceholder}
                className="bg-surface text-primary focus-border-strong mt-4 w-full rounded-full border border-soft px-4 py-3 text-sm outline-none transition"
              />

              <button
                type="button"
                onClick={handleSubmitChannel}
                className="bg-strong text-strong-foreground bg-strong-hover mt-4 inline-flex items-center rounded-full px-4 py-2 text-sm transition"
              >
                {copy.channelButton}
              </button>
            </div>
          ) : null}

          {tab === "about" ? (
            <div className="bg-surface text-secondary rounded-[28px] border border-soft p-6 text-sm leading-7">
              {copy.aboutText}
            </div>
          ) : null}
        </div>
      </div>

      <ManifestModal
        copy={copy}
        open={manifestOpen}
        onClose={() => setManifestOpen(false)}
        theme={theme}
      />
    </>
  );
}