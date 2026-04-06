import type { TranslationSchema } from "./types";

export const en: TranslationSchema = {
  common: {
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    back: "Back",
    continue: "Continue",
    confirm: "Confirm",
    retry: "Retry",
    more: "More",
    less: "Less",
    open: "Open",
    yes: "Yes",
    no: "No",
    search: "Search",
    clear: "Clear",
  },

  brand: {
    appName: "margeleT",
    tagline: "Telegram video feed",
  },

  nav: {
    feed: "Feed",
    add: "Add",
    creator: "Creator",
    profile: "Profile",
    admin: "Admin",
    about: "About",
  },

  intro: {
    slides: [
      {
        title: "Welcome to margeleT",
        text: "A global feed of real Telegram content.",
      },
      {
        title: "Only original sources",
        text: "Every post stays connected to its original Telegram channel.",
      },
      {
        title: "Clean and fast",
        text: "Open, watch and scroll without extra noise.",
      },
      {
        title: "Choose your language",
        text: "The interface and content can adapt to your selected market.",
      },
    ],
    next: "Next",
    enter: "Enter",
  },

  feed: {
    title: "Feed",
    empty: "Nothing here yet",
    loading: "Loading feed...",
    openChannel: "Open channel",
    openPost: "Open post",
    share: "Share",
    save: "Save",
    saved: "Saved",
    like: "Like",
    liked: "Liked",
    readMore: "Read more",
    collapse: "Hide",
    noPosts: "No posts found for this selection",
    unsupportedMedia: "This media is unavailable",
    sourceLabel: "Source",
    originalPost: "Original Telegram post",
    embeddedBlock: "Embedded Telegram block",
    swipeHint: "Tap outside to close viewer.",
  },

  modes: {
    new: "New",
    rising: "Rising",
    trending: "Trending",
  },

  addSource: {
    title: "Add channel",
    subtitle: "Send a Telegram channel link for moderation.",
    inputLabel: "Channel link",
    inputPlaceholder: "Paste Telegram channel URL",
    submit: "Send for moderation",
    success: "Channel request sent",
    moderationNote: "The channel will not be published automatically.",
    invalidUrl: "Please enter a valid Telegram link",
    telegramOnly: "Only Telegram links are supported",
    channelSent: "Your channel was sent for moderation",
  },

  creator: {
    title: "Creator",
    subtitle: "Add one Telegram post link",
    sourceName: "Channel / author",
    sourcePlaceholder: "Channel name",
    postUrl: "Telegram post link",
    postUrlPlaceholder: "Paste Telegram post URL",
    submit: "Add to margeleT",
    success: "Post sent to feed",
    checksTitle: "What MVP checks",
    checkPublic: "Public Telegram post link",
    checkMedia: "Original post contains playable media",
    checkMetadata: "Title / caption / channel metadata available",
  },

  profile: {
    title: "Profile",
    subtitle: "Your preferences and account",
    language: "Language",
    country: "Country",
    telegram: "Telegram",
    notConnected: "Not connected",
    connected: "Connected",
    connectTelegram: "Connect Telegram",
    logout: "Log out",
    preferences: "Preferences",
  },

  auth: {
    signIn: "Sign in",
    signOut: "Sign out",
    authorize: "Authorize",
    authRequired: "Authorization required",
    authDescription:
      "Authorize to save videos you like and access more margeleT features.",
  },

  errors: {
    unknown: "Something went wrong",
    network: "Network error",
    forbidden: "Access denied",
    notFound: "Not found",
    requiredField: "This field is required",
    invalidTelegramUrl: "Invalid Telegram URL",
    failedToLoadFeed: "Failed to load feed",
    failedToSubmit: "Failed to submit",
    failedToSave: "Failed to save",
  },
};