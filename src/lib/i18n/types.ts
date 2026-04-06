import type { SiteLocale } from "../locales";

export type Locale = SiteLocale;

export type TranslationSchema = {
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    close: string;
    back: string;
    continue: string;
    confirm: string;
    retry: string;
    more: string;
    less: string;
    open: string;
    yes: string;
    no: string;
    search: string;
    clear: string;
  };

  brand: {
    appName: string;
    tagline: string;
  };

  nav: {
    feed: string;
    add: string;
    creator: string;
    profile: string;
    admin: string;
    about: string;
  };

  feed: {
    title: string;
    empty: string;
    loading: string;
    openChannel: string;
    openPost: string;
    share: string;
    save: string;
    saved: string;
    like: string;
    liked: string;
    readMore: string;
    collapse: string;
    noPosts: string;
    unsupportedMedia: string;
    sourceLabel: string;
    originalPost: string;
    embeddedBlock: string;
    swipeHint: string;
  };

  modes: {
    new: string;
    rising: string;
    trending: string;
  };

  addSource: {
    title: string;
    subtitle: string;
    inputLabel: string;
    inputPlaceholder: string;
    submit: string;
    success: string;
    moderationNote: string;
    invalidUrl: string;
    telegramOnly: string;
    channelSent: string;
  };

  creator: {
    title: string;
    subtitle: string;
    sourceName: string;
    sourcePlaceholder: string;
    postUrl: string;
    postUrlPlaceholder: string;
    submit: string;
    success: string;
    checksTitle: string;
    checkPublic: string;
    checkMedia: string;
    checkMetadata: string;
  };

  profile: {
    title: string;
    subtitle: string;
    language: string;
    country: string;
    telegram: string;
    notConnected: string;
    connected: string;
    connectTelegram: string;
    logout: string;
    preferences: string;
  };

  auth: {
    signIn: string;
    signOut: string;
    authorize: string;
    authRequired: string;
    authDescription: string;
  };

  errors: {
    unknown: string;
    network: string;
    forbidden: string;
    notFound: string;
    requiredField: string;
    invalidTelegramUrl: string;
    failedToLoadFeed: string;
    failedToSubmit: string;
    failedToSave: string;
  };
};

export type TranslationKey =
  | keyof TranslationSchema
  | `${keyof TranslationSchema}.${string}`;