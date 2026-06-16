export type SpaceTheme = "dark" | "light";

export type SpaceTelegramUser = {
  id?: number | string;
  first_name?: string;
  username?: string;
  photo_url?: string;
};

export type SpaceSignalKind = "want" | "ask" | "buy" | "talk" | "help" | "sell";

export type SpaceSignal = {
  id: string;
  kind: SpaceSignalKind;
  text: string;
  x: number;
  y: number;
  createdAt: number;
  authorName: string;
  authorAvatar: string | null;
  replies: SpaceReply[];
};

export type SpaceReply = {
  id: string;
  text: string;
  createdAt: number;
  authorName: string;
  authorAvatar: string | null;
};
