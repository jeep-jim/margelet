export const users = [
  {
    id: "u_jim",
    name: "Jim Carter",
    handle: "@jimcreator",
    role: "creator",
    status: "active",
    joinedAt: "2026-03-01",
    installs: 24700,
    revenueStars: 8420,
    verified: false,
  },
  {
    id: "u_anna",
    name: "Anna Volkov",
    handle: "@annalabs",
    role: "creator",
    status: "active",
    joinedAt: "2026-02-20",
    installs: 13200,
    revenueStars: 4900,
    verified: true,
  },
  {
    id: "u_leo",
    name: "Leo Stone",
    handle: "@leostudio",
    role: "creator",
    status: "active",
    joinedAt: "2026-02-18",
    installs: 9800,
    revenueStars: 3600,
    verified: false,
  },
  {
    id: "u_newseller",
    name: "New Seller",
    handle: "@newseller",
    role: "user",
    status: "active",
    joinedAt: "2026-03-07",
    installs: 0,
    revenueStars: 0,
    verified: false,
  },
];

export const agents = [
  {
    id: "a_motivation",
    name: "Motivation Agent",
    ownerId: "u_jim",
    type: "manual",
    status: "live",
    videosPerDay: 5,
    platform: "TikTok + Shorts",
    installs: 8900,
    rating: 4.8,
    priceStars: 120,
    visibility: "marketplace",
  },
  {
    id: "a_news",
    name: "News Agent",
    ownerId: "u_anna",
    type: "auto",
    status: "live",
    videosPerDay: 12,
    platform: "Reels + Telegram",
    installs: 12400,
    rating: 4.9,
    priceStars: 160,
    visibility: "marketplace",
  },
  {
    id: "a_facts",
    name: "Facts Agent",
    ownerId: "u_leo",
    type: "manual",
    status: "draft",
    videosPerDay: 8,
    platform: "Shorts + TikTok",
    installs: 6600,
    rating: 4.7,
    priceStars: 90,
    visibility: "marketplace",
  },
  {
    id: "a_business",
    name: "Business Agent",
    ownerId: "u_leo",
    type: "auto",
    status: "live",
    videosPerDay: 3,
    platform: "Telegram",
    installs: 3400,
    rating: 4.6,
    priceStars: 140,
    visibility: "marketplace",
  },
];

export const videos = [
  {
    id: "v_182",
    title: "Morning motivation #182",
    agentId: "a_motivation",
    status: "done",
    views: 82000,
    createdAt: "2026-03-07 11:56",
  },
  {
    id: "v_084",
    title: "AI news short #84",
    agentId: "a_news",
    status: "queued",
    views: 0,
    createdAt: "2026-03-07 12:02",
  },
  {
    id: "v_022",
    title: "History facts #22",
    agentId: "a_facts",
    status: "review",
    views: 0,
    createdAt: "2026-03-07 12:08",
  },
];

export const channels = [
  {
    id: "c_tg",
    name: "Telegram",
    status: "connected",
    health: "healthy",
    connectedCount: 128,
  },
  {
    id: "c_yt",
    name: "YouTube Shorts",
    status: "connected",
    health: "healthy",
    connectedCount: 64,
  },
  {
    id: "c_ig",
    name: "Instagram Reels",
    status: "warning",
    health: "reauth required",
    connectedCount: 29,
  },
  {
    id: "c_tt",
    name: "TikTok",
    status: "connected",
    health: "healthy",
    connectedCount: 41,
  },
];

export const payments = [
  {
    id: "p_001",
    title: "Stars payout batch",
    status: "queued",
    amountStars: 12400,
    createdAt: "2026-03-07 23:00",
  },
  {
    id: "p_002",
    title: "Creator split",
    status: "ok",
    amountStars: 84220,
    createdAt: "2026-03-07 12:14",
  },
  {
    id: "p_003",
    title: "Refund review",
    status: "review",
    amountStars: 240,
    createdAt: "2026-03-07 12:22",
  },
];

export const systemLogs = [
  {
    id: "l_001",
    title: "Render pipeline started",
    level: "info",
    time: "12:01",
  },
  {
    id: "l_002",
    title: "Marketplace purchase confirmed",
    level: "success",
    time: "12:14",
  },
  {
    id: "l_003",
    title: "Channel token expired",
    level: "warning",
    time: "12:21",
  },
];

export function getUserById(userId) {
  return users.find((user) => user.id === userId) || null;
}

export function getAgentOwner(agent) {
  return getUserById(agent.ownerId);
}

export function getAdminMetrics() {
  const totalRevenue = payments.reduce(
    (sum, payment) => sum + (payment.amountStars || 0),
    0
  );

  return {
    users: users.length,
    agents: agents.length,
    videos: videos.length,
    revenueStars: totalRevenue,
  };
}