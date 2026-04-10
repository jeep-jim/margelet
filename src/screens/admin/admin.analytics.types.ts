export type TopPostItem = {
  id: number;
  postUrl: string;
  sourceHandle: string;
  sourceTitle: string;
  textPreview: string;
  createdAt: string;
  tag: string;
  views: number;
  opens: number;
  tgClicks: number;
  likes: number;
  subscriptions: number;
  score: number;
};

export type TopSourceItem = {
  handle: string;
  title: string;
  countryCode: string | null;
  views: number;
  opens: number;
  tgClicks: number;
  subscriptions: number;
  score: number;
};

export type AnalyticsResponse = {
  views: number;
  opens: number;
  tgClicks: number;
  likes: number;
  subscriptions: number;
  uniqueUsers: number;

  countries: Record<string, string>;
  countriesUnique: Record<string, string>;
  devices: Record<string, string>;
  devicesUnique: Record<string, string>;

  todayViews: number;
  last7Views: number;
  last30Views: number;

  todayUniqueUsers: number;
  last7UniqueUsers: number;
  last30UniqueUsers: number;

  todayOpens: number;
  last7Opens: number;
  last30Opens: number;

  todayTgClicks: number;
  last7TgClicks: number;
  last30TgClicks: number;

  days: Record<string, string>;
  uniqueDays: Record<string, string>;
  openDays: Record<string, string>;
  tgClickDays: Record<string, string>;

  topPosts: TopPostItem[];
  topSources: TopSourceItem[];
};