import type { Video } from "../types/app";

export const initialVideos: Video[] = [
  {
    id: 1,
    mediaType: "video",
    title: {
      ru: "Как сделать движение дорогим",
      en: "How to make motion feel expensive",
    },
    caption: {
      ru: "Быстрый совет из дизайн-канала",
      en: "A fast tip from a design channel",
    },
    channel: "Motion Lab",
    avatar: "ML",
    handle: "@motionlab",
    views: "42.1K",
    likes: 812,
    comments: 34,
    duration: "0:37",
    lang: "RU",
    postUrl: "https://t.me/motionlab/481",
    bg: "from-violet-600 via-fuchsia-500 to-amber-400",
  },

  {
    id: 2,
    mediaType: "image", // 🔥 ВОТ ОНО
    title: {
      ru: "Постер из Telegram",
      en: "Telegram poster",
    },
    caption: {
      ru: "Теперь это не только видео",
      en: "Now not only video",
    },
    channel: "Visual Club",
    avatar: "VC",
    handle: "@visualclub",
    views: "12.2K",
    likes: 201,
    comments: 5,
    duration: "",
    lang: "RU",
    postUrl: "https://t.me/visualclub/11",
    bg: "from-pink-500 via-rose-500 to-orange-500",
  },

  {
    id: 3,
    mediaType: "video",
    title: {
      ru: "AI цветокор: до / после",
      en: "AI color grade",
    },
    caption: {
      ru: "Новый формат",
      en: "New format",
    },
    channel: "Neon Edit",
    avatar: "NE",
    handle: "@neonedit",
    views: "73.8K",
    likes: 1261,
    comments: 89,
    duration: "0:52",
    lang: "ES",
    postUrl: "https://t.me/neonedit/902",
    bg: "from-emerald-500 via-teal-500 to-sky-500",
  },
];