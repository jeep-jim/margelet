import type { Locale } from "../../types/app";

type PromoPack = {
  intro: string;
  news: string;
  nowOn: string;
  after: string;
  verify: string;
};

const PROMO_BY_LOCALE: Partial<Record<Locale, PromoPack>> = {
  ru: {
    intro: "Разместите пост в своём канале:",
    news: "Хорошие новости, друзья!",
    nowOn: "Теперь наш канал можно читать ещё и на margeleT:",
    after: "После публикации нажмите “Проверить пост”.",
    verify: "Проверить пост",
  },
  uk: {
    intro: "Розмістіть допис у своєму каналі:",
    news: "Гарні новини, друзі!",
    nowOn: "Тепер наш канал можна читати ще й на margeleT:",
    after: "Після публікації натисніть “Перевірити допис”.",
    verify: "Перевірити допис",
  },
  en: {
    intro: "Post this message in your channel:",
    news: "Good news, friends!",
    nowOn: "Now our channel can also be read on margeleT:",
    after: "After publishing, press “Verify post”.",
    verify: "Verify post",
  },
  in: {
    intro: "अपने चैनल में यह पोस्ट प्रकाशित करें:",
    news: "अच्छी खबर, दोस्तों!",
    nowOn: "अब हमारा चैनल margeleT पर भी पढ़ा जा सकता है:",
    after: "प्रकाशित करने के बाद “पोस्ट सत्यापित करें” दबाएँ।",
    verify: "पोस्ट सत्यापित करें",
  },
  fa: {
    intro: "این پیام را در کانال خود منتشر کنید:",
    news: "خبر خوب، دوستان!",
    nowOn: "اکنون کانال ما در margeleT هم قابل خواندن است:",
    after: "پس از انتشار، روی «بررسی پست» بزنید.",
    verify: "بررسی پست",
  },
  tr: {
    intro: "Bu mesajı kanalınızda paylaşın:",
    news: "İyi haberler, arkadaşlar!",
    nowOn: "Kanalımız artık margeleT üzerinden de okunabilir:",
    after: "Paylaştıktan sonra “Gönderiyi doğrula” düğmesine basın.",
    verify: "Gönderiyi doğrula",
  },
  "pt-br": {
    intro: "Publique esta mensagem no seu canal:",
    news: "Boas notícias, amigos!",
    nowOn: "Agora nosso canal também pode ser lido no margeleT:",
    after: "Depois de publicar, toque em “Verificar publicação”.",
    verify: "Verificar publicação",
  },
  kk: {
    intro: "Бұл жазбаны өз арнаңызда жариялаңыз:",
    news: "Жақсы жаңалық, достар!",
    nowOn: "Енді біздің арнаны margeleT арқылы да оқуға болады:",
    after: "Жариялағаннан кейін “Постты тексеру” батырмасын басыңыз.",
    verify: "Постты тексеру",
  },
  uz: {
    intro: "Ushbu postni kanalingizda joylashtiring:",
    news: "Yaxshi yangilik, do‘stlar!",
    nowOn: "Endi kanalimizni margeleT’da ham o‘qish mumkin:",
    after: "Joylashtirgandan so‘ng “Postni tekshirish” tugmasini bosing.",
    verify: "Postni tekshirish",
  },
  ae: {
    intro: "انشر هذه الرسالة في قناتك:",
    news: "أخبار جيدة يا أصدقاء!",
    nowOn: "يمكن الآن قراءة قناتنا أيضاً على margeleT:",
    after: "بعد النشر اضغط على “التحقق من المنشور”.",
    verify: "التحقق من المنشور",
  },
  eg: {
    intro: "انشر الرسالة دي في قناتك:",
    news: "أخبار حلوة يا أصدقاء!",
    nowOn: "دلوقتي تقدروا تقرأوا قناتنا كمان على margeleT:",
    after: "بعد النشر اضغط على “تحقق من المنشور”.",
    verify: "تحقق من المنشور",
  },
  pk: {
    intro: "یہ پیغام اپنے چینل میں شائع کریں:",
    news: "اچھی خبر، دوستو!",
    nowOn: "اب ہمارا چینل margeleT پر بھی پڑھا جا سکتا ہے:",
    after: "شائع کرنے کے بعد “پوسٹ چیک کریں” دبائیں۔",
    verify: "پوسٹ چیک کریں",
  },
  id: {
    intro: "Publikasikan pesan ini di kanal Anda:",
    news: "Kabar baik, teman-teman!",
    nowOn: "Sekarang kanal kami juga bisa dibaca di margeleT:",
    after: "Setelah publikasi, tekan “Verifikasi postingan”.",
    verify: "Verifikasi postingan",
  },
  mx: {
    intro: "Publica este mensaje en tu canal:",
    news: "¡Buenas noticias, amigos!",
    nowOn: "Ahora nuestro canal también se puede leer en margeleT:",
    after: "Después de publicar, pulsa “Verificar publicación”.",
    verify: "Verificar publicación",
  },
  sa: {
    intro: "انشر هذه الرسالة في قناتك:",
    news: "أخبار رائعة يا أصدقاء!",
    nowOn: "يمكن الآن قراءة قناتنا أيضاً على margeleT:",
    after: "بعد النشر اضغط على “التحقق من المنشور”.",
    verify: "التحقق من المنشور",
  },
  es: {
    intro: "Publica este mensaje en tu canal:",
    news: "¡Buenas noticias, amigos!",
    nowOn: "Ahora nuestro canal también puede leerse en margeleT:",
    after: "Después de publicar, pulsa “Verificar publicación”.",
    verify: "Verificar publicación",
  },
  it: {
    intro: "Pubblica questo messaggio nel tuo canale:",
    news: "Buone notizie, amici!",
    nowOn: "Ora il nostro canale può essere letto anche su margeleT:",
    after: "Dopo la pubblicazione premi “Verifica post”.",
    verify: "Verifica post",
  },
  fr: {
    intro: "Publiez ce message dans votre canal :",
    news: "Bonne nouvelle, les amis !",
    nowOn: "Notre canal peut désormais aussi être lu sur margeleT :",
    after: "Après publication, appuyez sur « Vérifier le post ».",
    verify: "Vérifier le post",
  },
  de: {
    intro: "Veröffentliche diesen Beitrag in deinem Kanal:",
    news: "Gute Nachrichten, Freunde!",
    nowOn: "Unser Kanal kann jetzt auch auf margeleT gelesen werden:",
    after: "Nach der Veröffentlichung klicke auf „Beitrag prüfen“.",
    verify: "Beitrag prüfen",
  },
  ar: {
    intro: "Publica este mensaje en tu canal:",
    news: "¡Buenas noticias, amigos!",
    nowOn: "Ahora nuestro canal también se puede leer en margeleT:",
    after: "Después de publicar, pulsa “Verificar publicación”.",
    verify: "Verificar publicación",
  },
  co: {
    intro: "Publica este mensaje en tu canal:",
    news: "¡Buenas noticias, amigos!",
    nowOn: "Ahora nuestro canal también se puede leer en margeleT:",
    after: "Después de publicar, pulsa “Verificar publicación”.",
    verify: "Verificar publicación",
  },
  za: {
    intro: "Post this message in your channel:",
    news: "Good news, friends!",
    nowOn: "Now our channel can also be read on margeleT:",
    after: "After publishing, press “Verify post”.",
    verify: "Verify post",
  },
  ng: {
    intro: "Post this message in your channel:",
    news: "Good news, friends!",
    nowOn: "Now our channel can also be read on margeleT:",
    after: "After publishing, press “Verify post”.",
    verify: "Verify post",
  },
  zh: {
    intro: "请在你的频道中发布这条消息：",
    news: "朋友们，好消息！",
    nowOn: "现在我们的频道也可以在 margeleT 上阅读：",
    after: "发布后点击“验证帖子”。",
    verify: "验证帖子",
  },
  ms: {
    intro: "Terbitkan mesej ini di saluran anda:",
    news: "Berita baik, kawan-kawan!",
    nowOn: "Kini saluran kami juga boleh dibaca di margeleT:",
    after: "Selepas menerbitkan, tekan “Sahkan siaran”.",
    verify: "Sahkan siaran",
  },
};

function getPack(locale: Locale): PromoPack {
  return PROMO_BY_LOCALE[locale] ?? PROMO_BY_LOCALE.en!;
}

export function buildPromoUrl(slug: string) {
  return `https://margelet.space/${slug}`;
}

export function getBarterPromoText(locale: Locale, slug: string) {
  const pack = getPack(locale);
  const url = buildPromoUrl(slug);

  return [pack.intro, "", pack.news, pack.nowOn, url, "", pack.after].join("\n");
}

export function getVerifyText(locale: Locale) {
  return getPack(locale).verify;
}