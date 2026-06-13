import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getTheme, type Theme } from "../lib/theme";
import { CreatorAuthBlock } from "./creator/CreatorAuthBlock";
import { CreatorLanguagePanel } from "./creator/CreatorLanguagePanel";
import { CreatorManifestModal } from "./creator/CreatorManifestModal";
import { CreatorProfileBlock } from "./creator/CreatorProfileBlock";
import {
  LANGUAGE_STORAGE_KEY,
  TG_STORAGE_KEY,
} from "./creator/creator.constants";
import { getCreatorCopy } from "./creator/creator.copy";
import type { CreatorScreenProps, TgUser } from "./creator/creator.types";
import type { IngestedPost } from "../types/app";
import { readTelegramUserFromStorage } from "./creator/creator.utils";
import { useCreatorPwa } from "./creator/useCreatorPwa";

const SUBSCRIPTIONS_STORAGE_KEY = "margelet_subscriptions";

function normalizeHandle(value: unknown) {
  return String(value || "")
    .replace(/^@+/, "")
    .trim()
    .toLowerCase();
}

function readSubscriptionsFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is string => typeof item === "string" && !!item.trim(),
      )
      .map((item) => normalizeHandle(item))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getPostImage(post: IngestedPost) {
  return post.media?.find((item) => item.kind === "image")?.url || null;
}

function getPostSourceHandle(post: IngestedPost) {
  return normalizeHandle(post.source?.handle);
}

function getPostSourceTitle(post: IngestedPost) {
  return post.source?.title || post.source?.handle || "Telegram";
}

function getPostPreview(post: IngestedPost, locale: string) {
  const text = String(post.text || "").trim();
  if (text) return text;
  const cabinetCopy = getCabinetCopy(locale);
  return post.contentType === "video"
    ? cabinetCopy.videoPost
    : cabinetCopy.telegramPost;
}

function SourceAvatar({
  src,
  title,
  sizeClass = "h-14 w-14",
}: {
  src?: string | null;
  title: string;
  sizeClass?: string;
}) {
  return (
    <div
      className={`${sizeClass} shrink-0 overflow-hidden rounded-full border border-soft bg-surface-soft`}
    >
      {src ? (
        <img
          src={src}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-black text-primary">
          {title.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

type CreatorCabinetCopy = {
  authWhyTitle: string;
  authWhyText: string;
  likes: string;
  subscriptions: string;
  all: string;
  postSingular: string;
  postsPlural: string;
  emptyLikesTitle: string;
  emptyLikesText: string;
  emptySubscriptionsTitle: string;
  emptySubscriptionsText: string;
  videoPost: string;
  telegramPost: string;
};

const CREATOR_CABINET_COPY: Record<string, CreatorCabinetCopy> = {
  ru: {
    authWhyTitle: "Зачем входить?",
    authWhyText:
      "Авторизация нужна, чтобы не потерять лайки, подписки на каналы и будущий Chat. Сейчас всё может жить локально в браузере, а после входа кабинет станет твоим постоянным местом в margeleT.",
    likes: "Нравится",
    subscriptions: "Подписки",
    all: "Все",
    postSingular: "пост",
    postsPlural: "пост",
    emptyLikesTitle: "Пока нет лайков",
    emptyLikesText: "Жми огонёк под постами — они будут собираться здесь.",
    emptySubscriptionsTitle: "Пока нет подписок",
    emptySubscriptionsText:
      "Подпишись на каналы через меню поста — они появятся здесь.",
    videoPost: "Видео из Telegram",
    telegramPost: "Пост из Telegram",
  },
  ua: {
    authWhyTitle: "Навіщо входити?",
    authWhyText:
      "Авторизація потрібна, щоб не втратити лайки, підписки на канали та майбутній Chat. Зараз усе може жити локально в браузері, а після входу кабінет стане твоїм постійним місцем у margeleT.",
    likes: "Подобається",
    subscriptions: "Підписки",
    all: "Усі",
    postSingular: "пост",
    postsPlural: "постів",
    emptyLikesTitle: "Поки немає лайків",
    emptyLikesText: "Натискай вогник під постами — вони збиратимуться тут.",
    emptySubscriptionsTitle: "Поки немає підписок",
    emptySubscriptionsText:
      "Підпишись на канали через меню поста — вони зʼявляться тут.",
    videoPost: "Відео з Telegram",
    telegramPost: "Пост з Telegram",
  },
  us: {
    authWhyTitle: "Why sign in?",
    authWhyText:
      "Sign in so you do not lose likes, channel subscriptions, and the future Chat. For now everything can live locally in this browser; after sign-in this cabinet becomes your permanent place in margeleT.",
    likes: "Likes",
    subscriptions: "Subscriptions",
    all: "All",
    postSingular: "post",
    postsPlural: "posts",
    emptyLikesTitle: "No likes yet",
    emptyLikesText: "Tap the fire under posts — they will collect here.",
    emptySubscriptionsTitle: "No subscriptions yet",
    emptySubscriptionsText:
      "Subscribe to channels from a post menu — they will appear here.",
    videoPost: "Telegram video",
    telegramPost: "Telegram post",
  },
  in: {
    authWhyTitle: "लॉग इन क्यों करें?",
    authWhyText:
      "लॉग इन करने से आपके लाइक, चैनल सब्सक्रिप्शन और भविष्य का Chat सुरक्षित रहेंगे। अभी सब कुछ ब्राउज़र में लोकल रह सकता है; लॉग इन के बाद यह कैबिनेट margeleT में आपकी स्थायी जगह बन जाएगी।",
    likes: "लाइक",
    subscriptions: "सब्सक्रिप्शन",
    all: "सभी",
    postSingular: "पोस्ट",
    postsPlural: "पोस्ट",
    emptyLikesTitle: "अभी कोई लाइक नहीं",
    emptyLikesText: "पोस्ट के नीचे आग दबाएँ — वे यहाँ इकट्ठा होंगे।",
    emptySubscriptionsTitle: "अभी कोई सब्सक्रिप्शन नहीं",
    emptySubscriptionsText:
      "पोस्ट मेन्यू से चैनल सब्सक्राइब करें — वे यहाँ दिखेंगे।",
    videoPost: "Telegram वीडियो",
    telegramPost: "Telegram पोस्ट",
  },
  ir: {
    authWhyTitle: "چرا وارد شوید؟",
    authWhyText:
      "ورود کمک می‌کند لایک‌ها، اشتراک کانال‌ها و Chat آینده را از دست ندهید. فعلاً همه‌چیز می‌تواند محلی در مرورگر بماند؛ پس از ورود، این کابینت جای دائمی شما در margeleT می‌شود.",
    likes: "پسندها",
    subscriptions: "اشتراک‌ها",
    all: "همه",
    postSingular: "پست",
    postsPlural: "پست",
    emptyLikesTitle: "هنوز لایکی نیست",
    emptyLikesText: "زیر پست‌ها آتش را بزنید — اینجا جمع می‌شوند.",
    emptySubscriptionsTitle: "هنوز اشتراکی نیست",
    emptySubscriptionsText:
      "از منوی پست در کانال‌ها مشترک شوید — اینجا ظاهر می‌شوند.",
    videoPost: "ویدیوی Telegram",
    telegramPost: "پست Telegram",
  },
  tr: {
    authWhyTitle: "Neden giriş yapmalı?",
    authWhyText:
      "Giriş yapmak beğenileri, kanal aboneliklerini ve gelecekteki Chat’i kaybetmemek içindir. Şimdilik her şey tarayıcıda yerel kalabilir; girişten sonra bu kabin margeleT’te kalıcı yerin olur.",
    likes: "Beğeniler",
    subscriptions: "Abonelikler",
    all: "Tümü",
    postSingular: "gönderi",
    postsPlural: "gönderi",
    emptyLikesTitle: "Henüz beğeni yok",
    emptyLikesText: "Gönderilerin altındaki ateşe bas — burada toplanacaklar.",
    emptySubscriptionsTitle: "Henüz abonelik yok",
    emptySubscriptionsText:
      "Gönderi menüsünden kanallara abone ol — burada görünecekler.",
    videoPost: "Telegram videosu",
    telegramPost: "Telegram gönderisi",
  },
  br: {
    authWhyTitle: "Por que entrar?",
    authWhyText:
      "A autorização ajuda a não perder curtidas, inscrições em canais e o futuro Chat. Agora tudo pode ficar local no navegador; depois do login, este painel vira seu lugar permanente no margeleT.",
    likes: "Curtidas",
    subscriptions: "Inscrições",
    all: "Todos",
    postSingular: "post",
    postsPlural: "posts",
    emptyLikesTitle: "Ainda sem curtidas",
    emptyLikesText: "Toque no fogo abaixo dos posts — eles aparecerão aqui.",
    emptySubscriptionsTitle: "Ainda sem inscrições",
    emptySubscriptionsText:
      "Inscreva-se em canais pelo menu do post — eles aparecerão aqui.",
    videoPost: "Vídeo do Telegram",
    telegramPost: "Post do Telegram",
  },
  kz: {
    authWhyTitle: "Неге кіру керек?",
    authWhyText:
      "Кіру лайктарды, арна жазылымдарын және болашақ Chat-ты жоғалтпау үшін керек. Әзірге бәрі браузерде жергілікті сақталады; кіргеннен кейін бұл кабинет margeleT ішіндегі тұрақты орның болады.",
    likes: "Лайктар",
    subscriptions: "Жазылымдар",
    all: "Барлығы",
    postSingular: "пост",
    postsPlural: "пост",
    emptyLikesTitle: "Әзірге лайк жоқ",
    emptyLikesText: "Пост астындағы отты бас — олар осында жиналады.",
    emptySubscriptionsTitle: "Әзірге жазылым жоқ",
    emptySubscriptionsText:
      "Пост мәзірінен арналарға жазыл — олар осында шығады.",
    videoPost: "Telegram видеосы",
    telegramPost: "Telegram посты",
  },
  uz: {
    authWhyTitle: "Nega kirish kerak?",
    authWhyText:
      "Kirish layklar, kanal obunalari va kelajakdagi Chat yo‘qolmasligi uchun kerak. Hozircha hammasi brauzerda lokal turishi mumkin; kirgandan keyin kabinet margeleT’dagi doimiy joying bo‘ladi.",
    likes: "Layklar",
    subscriptions: "Obunalar",
    all: "Hammasi",
    postSingular: "post",
    postsPlural: "post",
    emptyLikesTitle: "Hali layklar yo‘q",
    emptyLikesText: "Post ostidagi olovni bos — ular shu yerda yig‘iladi.",
    emptySubscriptionsTitle: "Hali obunalar yo‘q",
    emptySubscriptionsText:
      "Post menyusidan kanallarga obuna bo‘l — ular shu yerda chiqadi.",
    videoPost: "Telegram videosi",
    telegramPost: "Telegram posti",
  },
  ae: {
    authWhyTitle: "لماذا تسجيل الدخول؟",
    authWhyText:
      "تسجيل الدخول يساعدك على عدم فقدان الإعجابات واشتراكات القنوات وChat القادم. حالياً يمكن أن يبقى كل شيء محلياً في المتصفح، وبعد الدخول يصبح هذا الحساب مكانك الدائم في margeleT.",
    likes: "الإعجابات",
    subscriptions: "الاشتراكات",
    all: "الكل",
    postSingular: "منشور",
    postsPlural: "منشورات",
    emptyLikesTitle: "لا إعجابات بعد",
    emptyLikesText: "اضغط النار تحت المنشورات — ستتجمع هنا.",
    emptySubscriptionsTitle: "لا اشتراكات بعد",
    emptySubscriptionsText: "اشترك في القنوات من قائمة المنشور — ستظهر هنا.",
    videoPost: "فيديو Telegram",
    telegramPost: "منشور Telegram",
  },
  eg: {
    authWhyTitle: "ليه تسجل الدخول؟",
    authWhyText:
      "تسجيل الدخول يساعدك ما تفقدش الإعجابات واشتراكات القنوات وChat القادم. حالياً كل شيء ممكن يفضل محلي في المتصفح، وبعد الدخول يبقى الكابينة مكانك الدائم في margeleT.",
    likes: "الإعجابات",
    subscriptions: "الاشتراكات",
    all: "الكل",
    postSingular: "منشور",
    postsPlural: "منشورات",
    emptyLikesTitle: "لسه مفيش إعجابات",
    emptyLikesText: "اضغط النار تحت المنشورات — هتتجمع هنا.",
    emptySubscriptionsTitle: "لسه مفيش اشتراكات",
    emptySubscriptionsText: "اشترك في القنوات من قائمة المنشور — هتظهر هنا.",
    videoPost: "فيديو Telegram",
    telegramPost: "منشور Telegram",
  },
  pk: {
    authWhyTitle: "لاگ اِن کیوں کریں؟",
    authWhyText:
      "لاگ اِن سے آپ کے لائکس، چینل سبسکرپشنز اور آنے والا Chat محفوظ رہتا ہے۔ ابھی سب کچھ براؤزر میں مقامی طور پر رہ سکتا ہے؛ لاگ اِن کے بعد یہ کابینہ margeleT میں آپ کی مستقل جگہ بن جائے گی۔",
    likes: "لائکس",
    subscriptions: "سبسکرپشنز",
    all: "سب",
    postSingular: "پوسٹ",
    postsPlural: "پوسٹس",
    emptyLikesTitle: "ابھی کوئی لائک نہیں",
    emptyLikesText: "پوسٹس کے نیچے آگ دبائیں — وہ یہاں جمع ہوں گی۔",
    emptySubscriptionsTitle: "ابھی کوئی سبسکرپشن نہیں",
    emptySubscriptionsText:
      "پوسٹ مینو سے چینلز سبسکرائب کریں — وہ یہاں آئیں گے۔",
    videoPost: "Telegram ویڈیو",
    telegramPost: "Telegram پوسٹ",
  },
  id: {
    authWhyTitle: "Kenapa masuk?",
    authWhyText:
      "Masuk membantu agar like, langganan channel, dan Chat masa depan tidak hilang. Untuk sekarang semuanya bisa tersimpan lokal di browser; setelah masuk, kabinet ini menjadi tempat tetapmu di margeleT.",
    likes: "Suka",
    subscriptions: "Langganan",
    all: "Semua",
    postSingular: "post",
    postsPlural: "post",
    emptyLikesTitle: "Belum ada suka",
    emptyLikesText:
      "Tekan api di bawah post — semuanya akan terkumpul di sini.",
    emptySubscriptionsTitle: "Belum ada langganan",
    emptySubscriptionsText:
      "Berlangganan channel dari menu post — mereka akan muncul di sini.",
    videoPost: "Video Telegram",
    telegramPost: "Post Telegram",
  },
  mx: {
    authWhyTitle: "¿Por qué iniciar sesión?",
    authWhyText:
      "Iniciar sesión sirve para no perder tus likes, suscripciones a canales y el futuro Chat. Por ahora todo puede vivir localmente en el navegador; después de entrar, este gabinete será tu lugar permanente en margeleT.",
    likes: "Me gusta",
    subscriptions: "Suscripciones",
    all: "Todo",
    postSingular: "post",
    postsPlural: "posts",
    emptyLikesTitle: "Aún no hay likes",
    emptyLikesText: "Toca el fuego bajo los posts — se reunirán aquí.",
    emptySubscriptionsTitle: "Aún no hay suscripciones",
    emptySubscriptionsText:
      "Suscríbete a canales desde el menú del post — aparecerán aquí.",
    videoPost: "Vídeo de Telegram",
    telegramPost: "Post de Telegram",
  },
  sa: {
    authWhyTitle: "لماذا تسجيل الدخول؟",
    authWhyText:
      "تسجيل الدخول يحفظ إعجاباتك واشتراكات القنوات وChat القادم. حالياً يمكن أن يبقى كل شيء في المتصفح، وبعد الدخول يصبح هذا الحساب مكانك الدائم في margeleT.",
    likes: "الإعجابات",
    subscriptions: "الاشتراكات",
    all: "الكل",
    postSingular: "منشور",
    postsPlural: "منشورات",
    emptyLikesTitle: "لا إعجابات بعد",
    emptyLikesText: "اضغط النار تحت المنشورات — ستتجمع هنا.",
    emptySubscriptionsTitle: "لا اشتراكات بعد",
    emptySubscriptionsText: "اشترك في القنوات من قائمة المنشور — ستظهر هنا.",
    videoPost: "فيديو Telegram",
    telegramPost: "منشور Telegram",
  },
  es: {
    authWhyTitle: "¿Por qué iniciar sesión?",
    authWhyText:
      "Iniciar sesión sirve para no perder tus likes, suscripciones a canales y el futuro Chat. Por ahora todo puede vivir localmente en el navegador; después de entrar, este gabinete será tu lugar permanente en margeleT.",
    likes: "Me gusta",
    subscriptions: "Suscripciones",
    all: "Todo",
    postSingular: "post",
    postsPlural: "posts",
    emptyLikesTitle: "Aún no hay likes",
    emptyLikesText: "Toca el fuego bajo los posts — se reunirán aquí.",
    emptySubscriptionsTitle: "Aún no hay suscripciones",
    emptySubscriptionsText:
      "Suscríbete a canales desde el menú del post — aparecerán aquí.",
    videoPost: "Vídeo de Telegram",
    telegramPost: "Post de Telegram",
  },
  it: {
    authWhyTitle: "Perché accedere?",
    authWhyText:
      "L’accesso serve a non perdere like, iscrizioni ai canali e il futuro Chat. Per ora tutto può restare locale nel browser; dopo l’accesso questo pannello diventa il tuo spazio stabile in margeleT.",
    likes: "Mi piace",
    subscriptions: "Iscrizioni",
    all: "Tutto",
    postSingular: "post",
    postsPlural: "post",
    emptyLikesTitle: "Ancora nessun like",
    emptyLikesText: "Tocca il fuoco sotto i post — si raccoglieranno qui.",
    emptySubscriptionsTitle: "Ancora nessuna iscrizione",
    emptySubscriptionsText:
      "Iscriviti ai canali dal menu del post — appariranno qui.",
    videoPost: "Video Telegram",
    telegramPost: "Post Telegram",
  },
  fr: {
    authWhyTitle: "Pourquoi se connecter ?",
    authWhyText:
      "La connexion permet de ne pas perdre tes likes, abonnements aux chaînes et le futur Chat. Pour l’instant tout peut rester local dans le navigateur ; après connexion, ce cabinet devient ton espace permanent dans margeleT.",
    likes: "J’aime",
    subscriptions: "Abonnements",
    all: "Tout",
    postSingular: "post",
    postsPlural: "posts",
    emptyLikesTitle: "Aucun like pour l’instant",
    emptyLikesText:
      "Appuie sur le feu sous les posts — ils se regrouperont ici.",
    emptySubscriptionsTitle: "Aucun abonnement pour l’instant",
    emptySubscriptionsText:
      "Abonne-toi aux chaînes depuis le menu du post — elles apparaîtront ici.",
    videoPost: "Vidéo Telegram",
    telegramPost: "Post Telegram",
  },
  de: {
    authWhyTitle: "Warum anmelden?",
    authWhyText:
      "Die Anmeldung schützt Likes, Kanal-Abos und den zukünftigen Chat. Aktuell kann alles lokal im Browser bleiben; nach der Anmeldung wird dieses Kabinett dein fester Ort in margeleT.",
    likes: "Likes",
    subscriptions: "Abos",
    all: "Alle",
    postSingular: "Post",
    postsPlural: "Posts",
    emptyLikesTitle: "Noch keine Likes",
    emptyLikesText: "Tippe auf das Feuer unter Posts — sie sammeln sich hier.",
    emptySubscriptionsTitle: "Noch keine Abos",
    emptySubscriptionsText:
      "Abonniere Kanäle über das Post-Menü — sie erscheinen hier.",
    videoPost: "Telegram-Video",
    telegramPost: "Telegram-Post",
  },
  ar: {
    authWhyTitle: "لماذا تسجيل الدخول؟",
    authWhyText:
      "تسجيل الدخول يحفظ إعجاباتك واشتراكات القنوات وChat القادم. حالياً يمكن أن يبقى كل شيء في المتصفح، وبعد الدخول يصبح هذا الحساب مكانك الدائم في margeleT.",
    likes: "الإعجابات",
    subscriptions: "الاشتراكات",
    all: "الكل",
    postSingular: "منشور",
    postsPlural: "منشورات",
    emptyLikesTitle: "لا إعجابات بعد",
    emptyLikesText: "اضغط النار تحت المنشورات — ستتجمع هنا.",
    emptySubscriptionsTitle: "لا اشتراكات بعد",
    emptySubscriptionsText: "اشترك في القنوات من قائمة المنشور — ستظهر هنا.",
    videoPost: "فيديو Telegram",
    telegramPost: "منشور Telegram",
  },
  co: {
    authWhyTitle: "¿Por qué iniciar sesión?",
    authWhyText:
      "Iniciar sesión sirve para no perder tus likes, suscripciones a canales y el futuro Chat. Por ahora todo puede vivir localmente en el navegador; después de entrar, este gabinete será tu lugar permanente en margeleT.",
    likes: "Me gusta",
    subscriptions: "Suscripciones",
    all: "Todo",
    postSingular: "post",
    postsPlural: "posts",
    emptyLikesTitle: "Aún no hay likes",
    emptyLikesText: "Toca el fuego bajo los posts — se reunirán aquí.",
    emptySubscriptionsTitle: "Aún no hay suscripciones",
    emptySubscriptionsText:
      "Suscríbete a canales desde el menú del post — aparecerán aquí.",
    videoPost: "Vídeo de Telegram",
    telegramPost: "Post de Telegram",
  },
  za: {
    authWhyTitle: "Why sign in?",
    authWhyText:
      "Sign in so you do not lose likes, channel subscriptions, and the future Chat. For now everything can live locally in this browser; after sign-in this cabinet becomes your permanent place in margeleT.",
    likes: "Likes",
    subscriptions: "Subscriptions",
    all: "All",
    postSingular: "post",
    postsPlural: "posts",
    emptyLikesTitle: "No likes yet",
    emptyLikesText: "Tap the fire under posts — they will collect here.",
    emptySubscriptionsTitle: "No subscriptions yet",
    emptySubscriptionsText:
      "Subscribe to channels from a post menu — they will appear here.",
    videoPost: "Telegram video",
    telegramPost: "Telegram post",
  },
  ng: {
    authWhyTitle: "Why sign in?",
    authWhyText:
      "Sign in so you do not lose likes, channel subscriptions, and the future Chat. For now everything can live locally in this browser; after sign-in this cabinet becomes your permanent place in margeleT.",
    likes: "Likes",
    subscriptions: "Subscriptions",
    all: "All",
    postSingular: "post",
    postsPlural: "posts",
    emptyLikesTitle: "No likes yet",
    emptyLikesText: "Tap the fire under posts — they will collect here.",
    emptySubscriptionsTitle: "No subscriptions yet",
    emptySubscriptionsText:
      "Subscribe to channels from a post menu — they will appear here.",
    videoPost: "Telegram video",
    telegramPost: "Telegram post",
  },
  cn: {
    authWhyTitle: "为什么登录？",
    authWhyText:
      "登录是为了不丢失点赞、频道订阅和未来的 Chat。现在这些内容可以先保存在浏览器本地；登录后，这个个人柜台会成为你在 margeleT 的固定空间。",
    likes: "喜欢",
    subscriptions: "订阅",
    all: "全部",
    postSingular: "帖",
    postsPlural: "帖子",
    emptyLikesTitle: "还没有喜欢",
    emptyLikesText: "点击帖子下方的火焰，它们会收集到这里。",
    emptySubscriptionsTitle: "还没有订阅",
    emptySubscriptionsText: "从帖子菜单订阅频道，它们会出现在这里。",
    videoPost: "Telegram 视频",
    telegramPost: "Telegram 帖子",
  },
  my: {
    authWhyTitle: "Kenapa log masuk?",
    authWhyText:
      "Log masuk membantu supaya suka, langganan saluran dan Chat akan datang tidak hilang. Buat masa ini semuanya boleh kekal setempat dalam pelayar; selepas log masuk, kabinet ini menjadi tempat tetap anda di margeleT.",
    likes: "Suka",
    subscriptions: "Langganan",
    all: "Semua",
    postSingular: "pos",
    postsPlural: "pos",
    emptyLikesTitle: "Belum ada suka",
    emptyLikesText: "Tekan api di bawah pos — semuanya akan terkumpul di sini.",
    emptySubscriptionsTitle: "Belum ada langganan",
    emptySubscriptionsText:
      "Langgan saluran daripada menu pos — ia akan muncul di sini.",
    videoPost: "Video Telegram",
    telegramPost: "Pos Telegram",
  },
};

function getCabinetCopy(locale: string): CreatorCabinetCopy {
  return CREATOR_CABINET_COPY[locale] || CREATOR_CABINET_COPY.us;
}

function formatPostCount(count: number, copy: CreatorCabinetCopy) {
  return `${count} ${count === 1 ? copy.postSingular : copy.postsPlural}`;
}

function CreatorAuthInfoCard({ locale }: { locale: string }) {
  const cabinetCopy = getCabinetCopy(locale);

  return (
    <div className="rounded-[28px] border border-soft bg-surface-soft px-5 py-4">
      <div className="text-sm font-black text-primary">
        {cabinetCopy.authWhyTitle}
      </div>
      <div className="mt-2 text-sm leading-6 text-secondary">
        {cabinetCopy.authWhyText}
      </div>
    </div>
  );
}

function SavedCabinetBlock({
  locale,
  posts,
  likedPostIds,
  subscriptionHandles,
  openPost,
}: {
  locale: string;
  posts: IngestedPost[];
  likedPostIds: number[];
  subscriptionHandles: string[];
  openPost: (post: IngestedPost) => void;
}) {
  const [tab, setTab] = useState<"likes" | "subscriptions">("likes");
  const [selectedHandle, setSelectedHandle] = useState<string>("");
  const [channelsOpen, setChannelsOpen] = useState(false);
  const cabinetCopy = getCabinetCopy(locale);

  const likedSet = useMemo(() => new Set(likedPostIds), [likedPostIds]);
  const subscribedSet = useMemo(
    () => new Set(subscriptionHandles.map((handle) => normalizeHandle(handle))),
    [subscriptionHandles],
  );

  const likedPosts = useMemo(
    () => posts.filter((post) => likedSet.has(post.id)).slice(0, 80),
    [posts, likedSet],
  );

  const subscriptionSources = useMemo(() => {
    const map = new Map<
      string,
      {
        handle: string;
        title: string;
        avatar: string | null;
        latestPostId: number;
        postsCount: number;
      }
    >();

    for (const post of posts) {
      const handle = getPostSourceHandle(post);
      if (!handle || !subscribedSet.has(handle)) continue;

      const existing = map.get(handle);
      if (!existing) {
        map.set(handle, {
          handle,
          title: getPostSourceTitle(post),
          avatar: post.source?.avatar || null,
          latestPostId: post.id,
          postsCount: 1,
        });
        continue;
      }

      existing.postsCount += 1;
      if (post.id > existing.latestPostId) {
        existing.latestPostId = post.id;
        existing.title = getPostSourceTitle(post);
        existing.avatar = post.source?.avatar || existing.avatar;
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.latestPostId - a.latestPostId,
    );
  }, [posts, subscribedSet]);

  const subscriptionPosts = useMemo(() => {
    if (subscribedSet.size === 0) return [];

    return posts
      .filter((post) => {
        const handle = getPostSourceHandle(post);
        if (!subscribedSet.has(handle)) return false;
        if (selectedHandle && handle !== selectedHandle) return false;
        return true;
      })
      .slice(0, 120);
  }, [posts, subscribedSet, selectedHandle]);

  const activePosts = tab === "likes" ? likedPosts : subscriptionPosts;

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-2 rounded-[24px] border border-soft bg-surface-soft p-1">
        <button
          type="button"
          onClick={() => {
            setTab("likes");
            setSelectedHandle("");
            setChannelsOpen(false);
          }}
          className={[
            "rounded-[20px] px-3 py-3 text-sm font-black transition",
            tab === "likes"
              ? "bg-strong text-strong-foreground shadow-sm"
              : "text-secondary hover:bg-surface",
          ].join(" ")}
        >
          🔥 {cabinetCopy.likes} · {likedPosts.length}
        </button>

        <button
          type="button"
          onClick={() => setTab("subscriptions")}
          className={[
            "rounded-[20px] px-3 py-3 text-sm font-black transition",
            tab === "subscriptions"
              ? "bg-strong text-strong-foreground shadow-sm"
              : "text-secondary hover:bg-surface",
          ].join(" ")}
        >
          🔔 {cabinetCopy.subscriptions} · {subscriptionSources.length}
        </button>
      </div>

      {tab === "subscriptions" && subscriptionSources.length > 0 ? (
        <div className="space-y-3">
          <div className="overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedHandle("");
                  setChannelsOpen((value) => !value);
                }}
                className={[
                  "flex w-[68px] shrink-0 flex-col items-center gap-1 text-center transition",
                  !selectedHandle
                    ? "opacity-100"
                    : "opacity-70 hover:opacity-100",
                ].join(" ")}
              >
                <span
                  className={[
                    "grid h-14 w-14 place-items-center rounded-full border text-secondary shadow-sm transition",
                    !selectedHandle
                      ? "border-strong bg-surface text-primary"
                      : "border-soft bg-surface-soft",
                  ].join(" ")}
                >
                  <ChevronDown
                    className={`h-5 w-5 transition ${channelsOpen ? "rotate-180" : ""}`}
                  />
                </span>
                <span className="w-full truncate text-[11px] font-semibold text-primary">
                  {cabinetCopy.all}
                </span>
                <span className="text-[10px] text-secondary">
                  {formatPostCount(subscriptionPosts.length, cabinetCopy)}
                </span>
              </button>

              {!channelsOpen
                ? subscriptionSources.map((source) => (
                    <button
                      key={source.handle}
                      type="button"
                      onClick={() => setSelectedHandle(source.handle)}
                      className={[
                        "flex w-[72px] shrink-0 flex-col items-center gap-1 text-center transition",
                        selectedHandle === source.handle
                          ? "opacity-100"
                          : "opacity-70 hover:opacity-100",
                      ].join(" ")}
                    >
                      <SourceAvatar src={source.avatar} title={source.title} />
                      <span className="w-full truncate text-[11px] font-semibold text-primary">
                        {source.title}
                      </span>
                      <span className="text-[10px] text-secondary">
                        {formatPostCount(source.postsCount, cabinetCopy)}
                      </span>
                    </button>
                  ))
                : null}
            </div>
          </div>

          {channelsOpen ? (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {subscriptionSources.map((source) => (
                <button
                  key={source.handle}
                  type="button"
                  onClick={() => {
                    setSelectedHandle(source.handle);
                    setChannelsOpen(false);
                  }}
                  className={[
                    "flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-center transition hover:bg-surface-soft",
                    selectedHandle === source.handle ? "bg-surface-soft" : "",
                  ].join(" ")}
                >
                  <SourceAvatar
                    src={source.avatar}
                    title={source.title}
                    sizeClass="h-12 w-12"
                  />
                  <span className="w-full truncate text-[11px] font-semibold text-primary">
                    {source.title}
                  </span>
                  <span className="text-[10px] text-secondary">
                    {formatPostCount(source.postsCount, cabinetCopy)}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {activePosts.length > 0 ? (
        <div className="space-y-3">
          {activePosts.map((post) => {
            const image = getPostImage(post);
            const title = getPostSourceTitle(post);
            const avatar = post.source?.avatar || null;

            return (
              <article
                key={post.id}
                className="overflow-hidden rounded-[24px] border border-soft bg-surface-soft"
              >
                <button
                  type="button"
                  onClick={() => openPost(post)}
                  className="block w-full text-left"
                >
                  <div className="flex gap-3 p-3">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <SourceAvatar
                        src={avatar}
                        title={title}
                        sizeClass="h-16 w-16"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-secondary">
                        {title}
                      </div>
                      <div className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-primary">
                        {getPostPreview(post, locale)}
                      </div>
                    </div>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[28px] border border-soft bg-surface-soft px-8 py-10 text-center">
          <div className="text-5xl">{tab === "likes" ? "🔥" : "🔔"}</div>
          <div className="mt-4 text-xl font-black text-primary">
            {tab === "likes"
              ? cabinetCopy.emptyLikesTitle
              : cabinetCopy.emptySubscriptionsTitle}
          </div>
          <div className="mx-auto mt-3 max-w-[300px] text-sm leading-6 text-secondary">
            {tab === "likes"
              ? cabinetCopy.emptyLikesText
              : cabinetCopy.emptySubscriptionsText}
          </div>
        </div>
      )}
    </section>
  );
}

export function CreatorScreen({
  locale,
  setLocale,
  posts,
  likedPostIds,
  openPost,
}: CreatorScreenProps) {
  const [user, setUser] = useState<TgUser | null>(null);
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window === "undefined" ? "dark" : getTheme(),
  );
  const [manifestOpen, setManifestOpen] = useState(false);
  const [subscriptionHandles, setSubscriptionHandles] = useState<string[]>([]);

  const { canShowInstallButton, handleInstallApp, installHintText } =
    useCreatorPwa(locale);

  useEffect(() => {
    const sync = () => {
      setUser(readTelegramUserFromStorage());
      setTheme(getTheme());
      setSubscriptionHandles(readSubscriptionsFromStorage());
    };

    sync();

    window.addEventListener("focus", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("focus", sync);
      window.removeEventListener("storage", sync);
    };
  }, [locale]);

  const copy = getCreatorCopy(locale);

  const handleLogout = () => {
    localStorage.removeItem(TG_STORAGE_KEY);
    setUser(null);
  };

  const handleChangeLocale = (nextLocale: typeof locale) => {
    setLocale(nextLocale);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale);
  };

  return (
    <>
      <div
        className="bg-app text-primary min-h-screen px-4 pb-10"
        style={{ paddingTop: "calc(var(--app-header-offset) + 16px)" }}
      >
        <div className="mx-auto max-w-[570px] space-y-6">
          {!user ? (
            <>
              <CreatorAuthBlock
                copy={copy}
                onOpenManifest={() => setManifestOpen(true)}
              />
              <CreatorAuthInfoCard locale={locale} />
            </>
          ) : (
            <CreatorProfileBlock
              user={user}
              copy={copy}
              onLogout={handleLogout}
            />
          )}

          <CreatorLanguagePanel
            copy={copy}
            locale={locale}
            onChangeLocale={handleChangeLocale}
            onOpenManifest={() => setManifestOpen(true)}
            canShowInstallButton={canShowInstallButton}
            onInstallApp={handleInstallApp}
            installHintText={installHintText}
          />

          <SavedCabinetBlock
            locale={locale}
            posts={posts}
            likedPostIds={likedPostIds}
            subscriptionHandles={subscriptionHandles}
            openPost={openPost}
          />
        </div>
      </div>

      <CreatorManifestModal
        copy={copy}
        open={manifestOpen}
        onClose={() => setManifestOpen(false)}
        theme={theme}
      />
    </>
  );
}
