import type { SiteLocale } from "../locales.js";

export type BotCopy = {
  start: string;
  placementNotFound: string;
  paidCreated: (handle: string) => string;
  checkAlert: string;
  barterMissing: string;
  barterSuccess: (handle: string) => string;
  paidSuccess: (handle: string) => string;
  help: string;
  add: string;
  statusEmpty: string;
  statusTitle: string;
  statusLine: (handle: string, status: string, plan: string) => string;
  statusActive: string;
  statusPending: string;
  statusPaused: string;
  statusExpired: string;
  statusCanceled: string;
  planPaid: string;
  planBarter: string;
  invoiceTitle: string;
  invoiceDescription: string;
  commands: { start: string; help: string; status: string; add: string };
};

const afterAddEn = "Your channel has been added to margeleT. As soon as a new post appears in your channel, it will show up in the margeleT feed and your channel page will become available on the service.";
const afterAddRu = "Ваш канал добавлен в margeleT. Как только в канале выйдет новый пост, он появится в ленте margeleT, а страница канала станет доступна на сервисе.";
const afterAddEs = "Tu canal se ha añadido a margeleT. En cuanto aparezca una nueva publicación en tu canal, se mostrará en el feed de margeleT y la página del canal estará disponible en el servicio.";
const afterAddAr = "تمت إضافة قناتك إلى margeleT. بمجرد نشر منشور جديد في قناتك، سيظهر في موجز margeleT وستصبح صفحة القناة متاحة في الخدمة.";

const en: BotCopy = {
  start: "Hi! Channel placement starts from your margeleT cabinet.\n\n/add — open cabinet\n/status — placement status\n/help — help",
  placementNotFound: "Placement was not found. Please return to your margeleT cabinet and press the button again.",
  paidCreated: (handle) => `Placement created: @${handle}\nI will open Stars payment now.`,
  checkAlert: "Checking the post…",
  barterMissing: "I don’t see the post yet. Publish the text in your channel and press “Verify post” again.",
  barterSuccess: (handle) => `Done! Channel @${handle} has been added to margeleT for 30 days 🎉\n\n${afterAddEn}`,
  paidSuccess: (handle) => `Payment received! Channel @${handle} has been added to margeleT for 30 days 🎉\n\n${afterAddEn}`,
  help: "margeleT helps you add a Telegram channel to the global feed.\n\nCommands:\n/add — open cabinet\n/status — check placements\n/start — start again",
  add: "Channel placement starts from your margeleT cabinet:\nhttps://margelet.space",
  statusEmpty: "No placements yet. Open your margeleT cabinet and add a channel.",
  statusTitle: "Your margeleT placements:",
  statusLine: (handle, status, plan) => `@${handle} — ${status} · ${plan}`,
  statusActive: "active",
  statusPending: "waiting for confirmation",
  statusPaused: "paused",
  statusExpired: "expired",
  statusCanceled: "canceled",
  planPaid: "Stars",
  planBarter: "barter",
  invoiceTitle: "margeleT channel placement",
  invoiceDescription: "1 month channel placement on margeleT",
  commands: { start: "Start", help: "Help", status: "Placement status", add: "Add channel" },
};

const ru: BotCopy = {
  start: "Привет! Добавление канала запускается из кабинета margeleT.\n\n/add — открыть кабинет\n/status — статус заявок\n/help — помощь",
  placementNotFound: "Заявка не найдена. Вернитесь в кабинет margeleT и нажмите кнопку ещё раз.",
  paidCreated: (handle) => `Заявка создана: @${handle}\nСейчас открою оплату в Stars.`,
  checkAlert: "Проверяю пост…",
  barterMissing: "Пока не вижу пост. Опубликуйте текст в канале и нажмите “Проверить пост” ещё раз.",
  barterSuccess: (handle) => `Готово! Канал @${handle} добавлен в margeleT на 30 дней 🎉\n\n${afterAddRu}`,
  paidSuccess: (handle) => `Оплата прошла! Канал @${handle} добавлен в margeleT на 30 дней 🎉\n\n${afterAddRu}`,
  help: "margeleT помогает добавить Telegram-канал в глобальную ленту.\n\nКоманды:\n/add — открыть кабинет\n/status — проверить заявки\n/start — начать заново",
  add: "Добавление канала запускается из кабинета margeleT:\nhttps://margelet.space",
  statusEmpty: "Пока нет заявок. Откройте кабинет margeleT и добавьте канал.",
  statusTitle: "Ваши заявки margeleT:",
  statusLine: (handle, status, plan) => `@${handle} — ${status} · ${plan}`,
  statusActive: "активен",
  statusPending: "ожидает подтверждения",
  statusPaused: "на паузе",
  statusExpired: "истёк",
  statusCanceled: "отменён",
  planPaid: "Stars",
  planBarter: "бартер",
  invoiceTitle: "Размещение канала margeleT",
  invoiceDescription: "Размещение канала на margeleT на 1 месяц",
  commands: { start: "Начать", help: "Помощь", status: "Статус заявок", add: "Добавить канал" },
};

const uk: BotCopy = {
  ...ru,
  start: "Привіт! Додавання каналу запускається з кабінету margeleT.\n\n/add — відкрити кабінет\n/status — статус заявок\n/help — допомога",
  placementNotFound: "Заявку не знайдено. Поверніться в кабінет margeleT і натисніть кнопку ще раз.",
  paidCreated: (handle) => `Заявку створено: @${handle}\nЗараз відкрию оплату в Stars.`,
  checkAlert: "Перевіряю пост…",
  barterMissing: "Поки не бачу пост. Опублікуйте текст у каналі та натисніть “Перевірити пост” ще раз.",
  barterSuccess: (handle) => `Готово! Канал @${handle} додано до margeleT на 30 днів 🎉\n\nВаш канал додано до margeleT. Щойно у каналі зʼявиться новий пост, він потрапить у стрічку margeleT, а сторінка каналу стане доступною на сервісі.`,
  paidSuccess: (handle) => `Оплату отримано! Канал @${handle} додано до margeleT на 30 днів 🎉\n\nВаш канал додано до margeleT. Щойно у каналі зʼявиться новий пост, він потрапить у стрічку margeleT, а сторінка каналу стане доступною на сервісі.`,
  help: "margeleT допомагає додати Telegram-канал у глобальну стрічку.\n\nКоманди:\n/add — відкрити кабінет\n/status — перевірити заявки\n/start — почати знову",
  add: "Додавання каналу запускається з кабінету margeleT:\nhttps://margelet.space",
  statusEmpty: "Поки немає заявок. Відкрийте кабінет margeleT і додайте канал.",
  statusTitle: "Ваші заявки margeleT:",
  statusActive: "активний",
  statusPending: "очікує підтвердження",
  statusPaused: "на паузі",
  statusExpired: "завершено",
  statusCanceled: "скасовано",
  planBarter: "бартер",
  invoiceTitle: "Розміщення каналу margeleT",
  invoiceDescription: "Розміщення каналу на margeleT на 1 місяць",
  commands: { start: "Почати", help: "Допомога", status: "Статус заявок", add: "Додати канал" },
};

const es: BotCopy = {
  ...en,
  start: "¡Hola! La colocación del canal empieza desde tu gabinete de margeleT.\n\n/add — abrir gabinete\n/status — estado de colocaciones\n/help — ayuda",
  placementNotFound: "No se encontró la solicitud. Vuelve a tu gabinete de margeleT y pulsa el botón otra vez.",
  paidCreated: (handle) => `Solicitud creada: @${handle}\nAhora abriré el pago con Stars.`,
  checkAlert: "Comprobando la publicación…",
  barterMissing: "Aún no veo la publicación. Publica el texto en tu canal y pulsa “Verificar publicación” otra vez.",
  barterSuccess: (handle) => `¡Listo! El canal @${handle} se ha añadido a margeleT por 30 días 🎉\n\n${afterAddEs}`,
  paidSuccess: (handle) => `¡Pago recibido! El canal @${handle} se ha añadido a margeleT por 30 días 🎉\n\n${afterAddEs}`,
  help: "margeleT te ayuda a añadir un canal de Telegram al feed global.\n\nComandos:\n/add — abrir gabinete\n/status — comprobar colocaciones\n/start — empezar de nuevo",
  add: "La colocación del canal empieza desde tu gabinete de margeleT:\nhttps://margelet.space",
  statusEmpty: "Todavía no hay colocaciones. Abre tu gabinete de margeleT y añade un canal.",
  statusTitle: "Tus colocaciones en margeleT:",
  statusActive: "activo",
  statusPending: "esperando confirmación",
  statusPaused: "en pausa",
  statusExpired: "caducado",
  statusCanceled: "cancelado",
  planBarter: "intercambio",
  invoiceTitle: "Colocación de canal en margeleT",
  invoiceDescription: "Colocación de canal en margeleT durante 1 mes",
  commands: { start: "Inicio", help: "Ayuda", status: "Estado", add: "Añadir canal" },
};

const ar: BotCopy = {
  ...en,
  start: "مرحباً! تبدأ إضافة القناة من لوحة margeleT.\n\n/add — فتح اللوحة\n/status — حالة الطلبات\n/help — المساعدة",
  placementNotFound: "لم يتم العثور على الطلب. ارجع إلى لوحة margeleT واضغط الزر مرة أخرى.",
  paidCreated: (handle) => `تم إنشاء الطلب: @${handle}\nسأفتح الدفع عبر Stars الآن.`,
  checkAlert: "جارٍ التحقق من المنشور…",
  barterMissing: "لا أرى المنشور بعد. انشر النص في قناتك واضغط “Verify post” مرة أخرى.",
  barterSuccess: (handle) => `تم! تمت إضافة القناة @${handle} إلى margeleT لمدة 30 يوماً 🎉\n\n${afterAddAr}`,
  paidSuccess: (handle) => `تم استلام الدفع! تمت إضافة القناة @${handle} إلى margeleT لمدة 30 يوماً 🎉\n\n${afterAddAr}`,
  help: "يساعدك margeleT على إضافة قناة Telegram إلى الموجز العالمي.\n\nالأوامر:\n/add — فتح اللوحة\n/status — التحقق من الطلبات\n/start — البدء من جديد",
  add: "تبدأ إضافة القناة من لوحة margeleT:\nhttps://margelet.space",
  statusEmpty: "لا توجد طلبات بعد. افتح لوحة margeleT وأضف قناة.",
  statusTitle: "طلبات margeleT الخاصة بك:",
  statusActive: "نشط",
  statusPending: "بانتظار التأكيد",
  statusPaused: "متوقف مؤقتاً",
  statusExpired: "منتهي",
  statusCanceled: "ملغي",
  planBarter: "تبادل",
  invoiceTitle: "إضافة قناة على margeleT",
  invoiceDescription: "إضافة قناة على margeleT لمدة شهر واحد",
  commands: { start: "ابدأ", help: "مساعدة", status: "حالة الطلبات", add: "إضافة قناة" },
};

const de: BotCopy = {
  ...en,
  start: "Hi! Die Kanalplatzierung startet in deinem margeleT-Kabinett.\n\n/add — Kabinett öffnen\n/status — Platzierungsstatus\n/help — Hilfe",
  placementNotFound: "Die Platzierung wurde nicht gefunden. Bitte kehre in dein margeleT-Kabinett zurück und drücke den Button erneut.",
  paidCreated: (handle) => `Platzierung erstellt: @${handle}\nIch öffne jetzt die Zahlung mit Stars.`,
  checkAlert: "Beitrag wird geprüft…",
  barterMissing: "Ich sehe den Beitrag noch nicht. Veröffentliche den Text in deinem Kanal und drücke erneut “Verify post”.",
  barterSuccess: (handle) => `Fertig! Kanal @${handle} wurde für 30 Tage zu margeleT hinzugefügt 🎉\n\nDein Kanal wurde zu margeleT hinzugefügt. Sobald ein neuer Beitrag in deinem Kanal erscheint, wird er im margeleT-Feed angezeigt und die Kanalseite ist im Service verfügbar.`,
  paidSuccess: (handle) => `Zahlung erhalten! Kanal @${handle} wurde für 30 Tage zu margeleT hinzugefügt 🎉\n\nDein Kanal wurde zu margeleT hinzugefügt. Sobald ein neuer Beitrag in deinem Kanal erscheint, wird er im margeleT-Feed angezeigt und die Kanalseite ist im Service verfügbar.`,
  commands: { start: "Start", help: "Hilfe", status: "Status", add: "Kanal hinzufügen" },
};

const fr: BotCopy = {
  ...en,
  start: "Bonjour ! L’ajout du canal commence depuis votre cabinet margeleT.\n\n/add — ouvrir le cabinet\n/status — statut des placements\n/help — aide",
  placementNotFound: "Placement introuvable. Revenez dans votre cabinet margeleT et appuyez de nouveau sur le bouton.",
  paidCreated: (handle) => `Demande créée : @${handle}\nJe vais ouvrir le paiement en Stars.`,
  checkAlert: "Vérification du post…",
  barterMissing: "Je ne vois pas encore le post. Publiez le texte dans votre canal puis appuyez à nouveau sur “Verify post”.",
  barterSuccess: (handle) => `C’est fait ! Le canal @${handle} a été ajouté à margeleT pour 30 jours 🎉\n\nVotre canal a été ajouté à margeleT. Dès qu’un nouveau post sera publié dans votre canal, il apparaîtra dans le feed margeleT et la page du canal sera disponible sur le service.`,
  paidSuccess: (handle) => `Paiement reçu ! Le canal @${handle} a été ajouté à margeleT pour 30 jours 🎉\n\nVotre canal a été ajouté à margeleT. Dès qu’un nouveau post sera publié dans votre canal, il apparaîtra dans le feed margeleT et la page du canal sera disponible sur le service.`,
  commands: { start: "Démarrer", help: "Aide", status: "Statut", add: "Ajouter un canal" },
};

const it: BotCopy = {
  ...en,
  start: "Ciao! L’aggiunta del canale parte dal tuo cabinet margeleT.\n\n/add — apri cabinet\n/status — stato inserimenti\n/help — aiuto",
  paidCreated: (handle) => `Richiesta creata: @${handle}\nOra apro il pagamento con Stars.`,
  checkAlert: "Controllo il post…",
  barterMissing: "Non vedo ancora il post. Pubblica il testo nel tuo canale e premi di nuovo “Verify post”.",
  barterSuccess: (handle) => `Fatto! Il canale @${handle} è stato aggiunto a margeleT per 30 giorni 🎉\n\nIl tuo canale è stato aggiunto a margeleT. Appena uscirà un nuovo post nel canale, apparirà nel feed margeleT e la pagina del canale sarà disponibile nel servizio.`,
  paidSuccess: (handle) => `Pagamento ricevuto! Il canale @${handle} è stato aggiunto a margeleT per 30 giorni 🎉\n\nIl tuo canale è stato aggiunto a margeleT. Appena uscirà un nuovo post nel canale, apparirà nel feed margeleT e la pagina del canale sarà disponibile nel servizio.`,
  commands: { start: "Avvia", help: "Aiuto", status: "Stato", add: "Aggiungi canale" },
};

const tr: BotCopy = {
  ...en,
  start: "Merhaba! Kanal ekleme işlemi margeleT kabininden başlar.\n\n/add — kabini aç\n/status — yerleşim durumu\n/help — yardım",
  placementNotFound: "Başvuru bulunamadı. Lütfen margeleT kabinine dönüp düğmeye tekrar basın.",
  paidCreated: (handle) => `Başvuru oluşturuldu: @${handle}\nŞimdi Stars ödemesini açacağım.`,
  checkAlert: "Gönderi kontrol ediliyor…",
  barterMissing: "Gönderiyi henüz görmüyorum. Metni kanalınızda yayınlayın ve “Verify post” düğmesine tekrar basın.",
  barterSuccess: (handle) => `Tamam! @${handle} kanalı 30 günlüğüne margeleT’e eklendi 🎉\n\nKanalınız margeleT’e eklendi. Kanalınızda yeni bir gönderi yayınlandığında margeleT akışında görünecek ve kanal sayfanız serviste erişilebilir olacaktır.`,
  paidSuccess: (handle) => `Ödeme alındı! @${handle} kanalı 30 günlüğüne margeleT’e eklendi 🎉\n\nKanalınız margeleT’e eklendi. Kanalınızda yeni bir gönderi yayınlandığında margeleT akışında görünecek ve kanal sayfanız serviste erişilebilir olacaktır.`,
  commands: { start: "Başlat", help: "Yardım", status: "Durum", add: "Kanal ekle" },
};

const ptBr: BotCopy = {
  ...en,
  start: "Olá! A inclusão do canal começa no seu painel margeleT.\n\n/add — abrir painel\n/status — status das inclusões\n/help — ajuda",
  placementNotFound: "A solicitação não foi encontrada. Volte ao painel margeleT e pressione o botão novamente.",
  paidCreated: (handle) => `Solicitação criada: @${handle}\nVou abrir o pagamento em Stars agora.`,
  checkAlert: "Verificando o post…",
  barterMissing: "Ainda não vejo o post. Publique o texto no seu canal e pressione “Verify post” novamente.",
  barterSuccess: (handle) => `Pronto! O canal @${handle} foi adicionado ao margeleT por 30 dias 🎉\n\nSeu canal foi adicionado ao margeleT. Assim que um novo post aparecer no canal, ele será exibido no feed do margeleT e a página do canal ficará disponível no serviço.`,
  paidSuccess: (handle) => `Pagamento recebido! O canal @${handle} foi adicionado ao margeleT por 30 dias 🎉\n\nSeu canal foi adicionado ao margeleT. Assim que um novo post aparecer no canal, ele será exibido no feed do margeleT e a página do canal ficará disponível no serviço.`,
  commands: { start: "Iniciar", help: "Ajuda", status: "Status", add: "Adicionar canal" },
};

const id: BotCopy = {
  ...en,
  start: "Halo! Penempatan channel dimulai dari kabinet margeleT Anda.\n\n/add — buka kabinet\n/status — status penempatan\n/help — bantuan",
  paidCreated: (handle) => `Pengajuan dibuat: @${handle}\nSaya akan membuka pembayaran Stars sekarang.`,
  barterMissing: "Saya belum melihat postingannya. Publikasikan teks di channel Anda lalu tekan “Verify post” lagi.",
  barterSuccess: (handle) => `Selesai! Channel @${handle} telah ditambahkan ke margeleT selama 30 hari 🎉\n\nChannel Anda telah ditambahkan ke margeleT. Begitu ada posting baru di channel Anda, posting itu akan muncul di feed margeleT dan halaman channel akan tersedia di layanan.`,
  paidSuccess: (handle) => `Pembayaran diterima! Channel @${handle} telah ditambahkan ke margeleT selama 30 hari 🎉\n\nChannel Anda telah ditambahkan ke margeleT. Begitu ada posting baru di channel Anda, posting itu akan muncul di feed margeleT dan halaman channel akan tersedia di layanan.`,
  commands: { start: "Mulai", help: "Bantuan", status: "Status", add: "Tambah channel" },
};

const hi: BotCopy = {
  ...en,
  start: "नमस्ते! चैनल जोड़ना आपके margeleT कैबिनेट से शुरू होता है।\n\n/add — कैबिनेट खोलें\n/status — प्लेसमेंट स्थिति\n/help — सहायता",
  placementNotFound: "प्लेसमेंट नहीं मिला। कृपया margeleT कैबिनेट पर वापस जाएँ और बटन फिर दबाएँ।",
  paidCreated: (handle) => `अनुरोध बना: @${handle}\nअब Stars भुगतान खोल रहा हूँ।`,
  checkAlert: "पोस्ट जाँची जा रही है…",
  barterMissing: "मुझे अभी पोस्ट नहीं दिख रही है। अपने चैनल में टेक्स्ट प्रकाशित करें और “Verify post” फिर दबाएँ।",
  barterSuccess: (handle) => `हो गया! चैनल @${handle} को 30 दिनों के लिए margeleT में जोड़ दिया गया है 🎉\n\nआपका चैनल margeleT में जोड़ दिया गया है। जैसे ही आपके चैनल में नई पोस्ट आएगी, वह margeleT फ़ीड में दिखाई देगी और चैनल पेज सेवा पर उपलब्ध होगा।`,
  paidSuccess: (handle) => `भुगतान मिल गया! चैनल @${handle} को 30 दिनों के लिए margeleT में जोड़ दिया गया है 🎉\n\nआपका चैनल margeleT में जोड़ दिया गया है। जैसे ही आपके चैनल में नई पोस्ट आएगी, वह margeleT फ़ीड में दिखाई देगी और चैनल पेज सेवा पर उपलब्ध होगा।`,
  commands: { start: "शुरू करें", help: "सहायता", status: "स्थिति", add: "चैनल जोड़ें" },
};

const fa: BotCopy = {
  ...en,
  start: "سلام! افزودن کانال از کابین margeleT شروع می‌شود.\n\n/add — باز کردن کابین\n/status — وضعیت درخواست‌ها\n/help — راهنما",
  paidCreated: (handle) => `درخواست ساخته شد: @${handle}\nاکنون پرداخت Stars را باز می‌کنم.`,
  checkAlert: "در حال بررسی پست…",
  barterMissing: "هنوز پست را نمی‌بینم. متن را در کانال منتشر کنید و دوباره “Verify post” را بزنید.",
  barterSuccess: (handle) => `انجام شد! کانال @${handle} به مدت ۳۰ روز به margeleT اضافه شد 🎉\n\nکانال شما به margeleT اضافه شد. به محض انتشار پست جدید در کانال، در فید margeleT نمایش داده می‌شود و صفحه کانال در سرویس در دسترس خواهد بود.`,
  paidSuccess: (handle) => `پرداخت دریافت شد! کانال @${handle} به مدت ۳۰ روز به margeleT اضافه شد 🎉\n\nکانال شما به margeleT اضافه شد. به محض انتشار پست جدید در کانال، در فید margeleT نمایش داده می‌شود و صفحه کانال در سرویس در دسترس خواهد بود.`,
  commands: { start: "شروع", help: "راهنما", status: "وضعیت", add: "افزودن کانال" },
};

const kk: BotCopy = {
  ...ru,
  start: "Сәлем! Арнаны қосу margeleT кабинетінде басталады.\n\n/add — кабинетті ашу\n/status — өтінім күйі\n/help — көмек",
  paidCreated: (handle) => `Өтінім жасалды: @${handle}\nҚазір Stars төлемін ашамын.`,
  barterMissing: "Пост әлі көрінбей тұр. Мәтінді арнаңызға жариялап, “Verify post” түймесін қайта басыңыз.",
  barterSuccess: (handle) => `Дайын! @${handle} арнасы margeleT-ке 30 күнге қосылды 🎉\n\nАрнаңыз margeleT-ке қосылды. Арнаңызда жаңа пост шыққан бойда ол margeleT лентасында пайда болады, ал арна беті сервисте қолжетімді болады.`,
  paidSuccess: (handle) => `Төлем қабылданды! @${handle} арнасы margeleT-ке 30 күнге қосылды 🎉\n\nАрнаңыз margeleT-ке қосылды. Арнаңызда жаңа пост шыққан бойда ол margeleT лентасында пайда болады, ал арна беті сервисте қолжетімді болады.`,
  commands: { start: "Бастау", help: "Көмек", status: "Күйі", add: "Арна қосу" },
};

const uz: BotCopy = {
  ...ru,
  start: "Salom! Kanal qo‘shish margeleT kabinetidan boshlanadi.\n\n/add — kabinetni ochish\n/status — arizalar holati\n/help — yordam",
  paidCreated: (handle) => `Ariza yaratildi: @${handle}\nHozir Stars to‘lovini ochaman.`,
  barterMissing: "Post hali ko‘rinmayapti. Matnni kanalingizda e’lon qiling va “Verify post” tugmasini yana bosing.",
  barterSuccess: (handle) => `Tayyor! @${handle} kanali 30 kunga margeleT’ga qo‘shildi 🎉\n\nKanalingiz margeleT’ga qo‘shildi. Kanalingizda yangi post chiqqan zahoti u margeleT lentasida ko‘rinadi va kanal sahifasi servisda ochiladi.`,
  paidSuccess: (handle) => `To‘lov qabul qilindi! @${handle} kanali 30 kunga margeleT’ga qo‘shildi 🎉\n\nKanalingiz margeleT’ga qo‘shildi. Kanalingizda yangi post chiqqan zahoti u margeleT lentasida ko‘rinadi va kanal sahifasi servisda ochiladi.`,
  commands: { start: "Boshlash", help: "Yordam", status: "Holat", add: "Kanal qo‘shish" },
};

const ur: BotCopy = {
  ...en,
  start: "سلام! چینل شامل کرنا آپ کے margeleT کابینہ سے شروع ہوتا ہے۔\n\n/add — کابینہ کھولیں\n/status — پلیسمنٹ اسٹیٹس\n/help — مدد",
  paidCreated: (handle) => `درخواست بن گئی: @${handle}\nاب Stars ادائیگی کھول رہا ہوں۔`,
  barterMissing: "مجھے ابھی پوسٹ نظر نہیں آ رہی۔ اپنے چینل میں متن شائع کریں اور “Verify post” دوبارہ دبائیں۔",
  barterSuccess: (handle) => `ہو گیا! چینل @${handle} کو 30 دن کے لیے margeleT میں شامل کر دیا گیا ہے 🎉\n\nآپ کا چینل margeleT میں شامل ہو گیا ہے۔ جیسے ہی آپ کے چینل میں نئی پوسٹ آئے گی، وہ margeleT فیڈ میں نظر آئے گی اور چینل پیج سروس پر دستیاب ہو جائے گا۔`,
  paidSuccess: (handle) => `ادائیگی موصول ہو گئی! چینل @${handle} کو 30 دن کے لیے margeleT میں شامل کر دیا گیا ہے 🎉\n\nآپ کا چینل margeleT میں شامل ہو گیا ہے۔ جیسے ہی آپ کے چینل میں نئی پوسٹ آئے گی، وہ margeleT فیڈ میں نظر آئے گی اور چینل پیج سروس پر دستیاب ہو جائے گا۔`,
  commands: { start: "شروع", help: "مدد", status: "اسٹیٹس", add: "چینل شامل کریں" },
};

const zh: BotCopy = {
  ...en,
  start: "你好！频道添加从你的 margeleT 控制台开始。\n\n/add — 打开控制台\n/status — 查看状态\n/help — 帮助",
  paidCreated: (handle) => `申请已创建：@${handle}\n现在打开 Stars 支付。`,
  barterMissing: "我还没有看到帖子。请在你的频道发布文本，然后再次点击 “Verify post”。",
  barterSuccess: (handle) => `完成！频道 @${handle} 已添加到 margeleT，期限 30 天 🎉\n\n你的频道已添加到 margeleT。频道发布新帖子后，它会出现在 margeleT 信息流中，频道页面也会在服务中可用。`,
  paidSuccess: (handle) => `已收到付款！频道 @${handle} 已添加到 margeleT，期限 30 天 🎉\n\n你的频道已添加到 margeleT。频道发布新帖子后，它会出现在 margeleT 信息流中，频道页面也会在服务中可用。`,
  commands: { start: "开始", help: "帮助", status: "状态", add: "添加频道" },
};

const ms: BotCopy = {
  ...en,
  start: "Hai! Penambahan saluran bermula dari kabinet margeleT anda.\n\n/add — buka kabinet\n/status — status penempatan\n/help — bantuan",
  paidCreated: (handle) => `Permohonan dibuat: @${handle}\nSaya akan buka bayaran Stars sekarang.`,
  barterMissing: "Saya belum nampak siaran itu. Terbitkan teks dalam saluran anda dan tekan “Verify post” sekali lagi.",
  barterSuccess: (handle) => `Selesai! Saluran @${handle} telah ditambah ke margeleT selama 30 hari 🎉\n\nSaluran anda telah ditambah ke margeleT. Sebaik sahaja siaran baharu muncul dalam saluran anda, ia akan dipaparkan dalam feed margeleT dan halaman saluran akan tersedia dalam servis.`,
  paidSuccess: (handle) => `Bayaran diterima! Saluran @${handle} telah ditambah ke margeleT selama 30 hari 🎉\n\nSaluran anda telah ditambah ke margeleT. Sebaik sahaja siaran baharu muncul dalam saluran anda, ia akan dipaparkan dalam feed margeleT dan halaman saluran akan tersedia dalam servis.`,
  commands: { start: "Mula", help: "Bantuan", status: "Status", add: "Tambah saluran" },
};

export const BOT_COPY_BY_LOCALE: Record<SiteLocale, BotCopy> = {
  ru,
  uk,
  en,
  in: hi,
  fa,
  tr,
  "pt-br": ptBr,
  kk,
  uz,
  ae: ar,
  eg: ar,
  pk: ur,
  id,
  mx: es,
  sa: ar,
  es,
  it,
  fr,
  de,
  ar: es,
  co: es,
  za: en,
  ng: en,
  zh,
  ms,
};

const LOCALE_BY_LANGUAGE_CODE: Record<string, SiteLocale> = {
  ru: "ru",
  uk: "uk",
  en: "en",
  hi: "in",
  fa: "fa",
  tr: "tr",
  pt: "pt-br",
  "pt-br": "pt-br",
  kk: "kk",
  uz: "uz",
  ar: "ae",
  ur: "pk",
  id: "id",
  es: "es",
  it: "it",
  fr: "fr",
  de: "de",
  zh: "zh",
  ms: "ms",
};

export const BOT_COMMAND_LOCALES: Array<{ locale: SiteLocale; telegramLanguageCode: string }> = [
  { locale: "en", telegramLanguageCode: "en" },
  { locale: "ru", telegramLanguageCode: "ru" },
  { locale: "uk", telegramLanguageCode: "uk" },
  { locale: "in", telegramLanguageCode: "hi" },
  { locale: "fa", telegramLanguageCode: "fa" },
  { locale: "tr", telegramLanguageCode: "tr" },
  { locale: "pt-br", telegramLanguageCode: "pt" },
  { locale: "kk", telegramLanguageCode: "kk" },
  { locale: "uz", telegramLanguageCode: "uz" },
  { locale: "ae", telegramLanguageCode: "ar" },
  { locale: "pk", telegramLanguageCode: "ur" },
  { locale: "id", telegramLanguageCode: "id" },
  { locale: "es", telegramLanguageCode: "es" },
  { locale: "it", telegramLanguageCode: "it" },
  { locale: "fr", telegramLanguageCode: "fr" },
  { locale: "de", telegramLanguageCode: "de" },
  { locale: "zh", telegramLanguageCode: "zh" },
  { locale: "ms", telegramLanguageCode: "ms" },
];

export function getBotLocale(languageCode?: string | null, countryCode?: string | null): SiteLocale {
  const country = String(countryCode || "").trim().toLowerCase();
  if (country && country in BOT_COPY_BY_LOCALE) return country as SiteLocale;

  const raw = String(languageCode || "").trim().toLowerCase().replace("_", "-");
  if (raw in LOCALE_BY_LANGUAGE_CODE) return LOCALE_BY_LANGUAGE_CODE[raw];

  const short = raw.split("-")[0];
  if (short in LOCALE_BY_LANGUAGE_CODE) return LOCALE_BY_LANGUAGE_CODE[short];

  return "en";
}

export function getBotCopy(languageCode?: string | null, countryCode?: string | null): BotCopy {
  return BOT_COPY_BY_LOCALE[getBotLocale(languageCode, countryCode)] || BOT_COPY_BY_LOCALE.en;
}
