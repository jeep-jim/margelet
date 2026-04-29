import type { IngestedPost, Locale } from "../../types/app";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type CreatorScreenProps = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  posts: IngestedPost[];
  openPost: (post: IngestedPost) => void;
};

export type CabinetTab = "channel" | "about" | "language";

export type CreatorChannelStatus = "draft" | "pending" | "active" | "paused" | "expired";

export type CreatorChannelPlan = "paid" | "barter";

export type CreatorChannelPlacement = {
  id: string;
  ownerTelegramId: string;
  channelUrl: string;
  channelHandle: string;
  channelTitle?: string;
  channelAvatarUrl?: string | null;
  verified?: boolean;
  country: Locale;
  tags: string[];
  plan: CreatorChannelPlan;
  status: CreatorChannelStatus;
  createdAt: string;
  startsAt: string | null;
  endsAt: string | null;
  pricingLabel: string;
  donateUrl: string | null;
};

export type TgUser = {
  id: string;
  first_name: string;
  username?: string;
  photo_url?: string;
};

export type ScreenCopy = {
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
  installButton: string;
  installIosHint: string;
  installOpened: string;
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
