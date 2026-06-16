export type SpaceTheme = "dark" | "light";

export type SpaceTelegramUser = {
  id?: number | string;
  first_name?: string;
  username?: string;
  photo_url?: string;
};

export type SpaceSignalKind = "want" | "ask" | "buy" | "talk" | "help" | "sell";

export type SpacePlanetId =
  | "all"
  | "tech"
  | "finance"
  | "world"
  | "startup"
  | "creative"
  | "community";

export type SpaceViewport = {
  x: number;
  y: number;
  scale: number;
};

export type SpaceReply = {
  id: string;
  text: string;
  createdAt: number;
  authorName: string;
  authorAvatar: string | null;
};

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
  planetId: SpacePlanetId;
};

export type SpacePlanet = {
  id: SpacePlanetId;
  emoji: string;
  title: string;
  gradient: string;
  keywords: string[];
};
