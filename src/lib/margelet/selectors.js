import {
  users,
  agents,
  videos,
  channels,
  payments,
  systemLogs,
  getUserById,
  getAgentOwner,
  getAdminMetrics,
} from "./mockData";

export {
  users,
  agents,
  videos,
  channels,
  payments,
  systemLogs,
  getUserById,
  getAgentOwner,
  getAdminMetrics,
};

export function getCreators() {
  return users.filter((user) => user.role === "creator");
}

export function getMarketplaceAgents() {
  return agents
    .filter((agent) => agent.visibility === "marketplace")
    .sort((a, b) => b.installs - a.installs);
}

export function getTopAgents(limit = 3) {
  return [...agents]
    .sort((a, b) => b.installs - a.installs)
    .slice(0, limit);
}

export function getTopCreators(limit = 3) {
  return [...getCreators()]
    .sort((a, b) => b.installs - a.installs)
    .slice(0, limit);
}

export function getDashboardMetrics() {
  const activeAgents = agents.filter((agent) => agent.status === "live").length;
  const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);

  return {
    videos: videos.length,
    views: totalViews,
    agents: agents.length,
    activeAgents,
  };
}

export function getRecentUsers(limit = 5) {
  return [...users]
    .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))
    .slice(0, limit);
}

export function getRecentVideos(limit = 5) {
  return [...videos]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, limit);
}

export function getSystemAlerts(limit = 5) {
  return [...systemLogs]
    .filter((log) => log.level === "warning" || log.level === "error")
    .slice(0, limit);
}

export function getHealthyChannels() {
  return channels.filter((channel) => channel.health === "healthy");
}

export function getWarningChannels() {
  return channels.filter((channel) => channel.health !== "healthy");
}

export function getUserByHandle(handle) {
  return users.find((user) => user.handle === handle) || null;
}

export function getAgentsByOwnerId(ownerId) {
  return agents.filter((agent) => agent.ownerId === ownerId);
}

export function getVideosByAgentId(agentId) {
  return videos.filter((video) => video.agentId === agentId);
}

export function getMarketplaceRows() {
  return getMarketplaceAgents().map((agent) => {
    const owner = getAgentOwner(agent);

    return {
      id: agent.id,
      title: agent.name,
      ownerName: owner?.name || "Unknown",
      ownerHandle: owner?.handle || "@unknown",
      installs: agent.installs,
      rating: agent.rating,
      priceStars: agent.priceStars,
      type: agent.type,
      status: agent.status,
      platform: agent.platform,
    };
  });
}

export function getAdminUsersRows() {
  return users.map((user) => ({
    id: user.id,
    title: `${user.name}${user.verified ? " ✓" : ""}`,
    meta: `${user.handle} • ${user.role} • joined ${user.joinedAt}`,
    badge: user.status,
  }));
}

export function getAdminAgentsRows() {
  return agents.map((agent) => {
    const owner = getAgentOwner(agent);

    return {
      id: agent.id,
      title: agent.name,
      meta: `${owner?.handle || "@unknown"} • ${agent.videosPerDay} videos/day • ${agent.platform}`,
      badge: agent.status,
    };
  });
}

export function getAdminPaymentsRows() {
  return payments.map((payment) => ({
    id: payment.id,
    title: payment.title,
    meta: `${payment.amountStars.toLocaleString()} Stars • ${payment.createdAt}`,
    badge: payment.status,
  }));
}

export function getAdminVideosRows() {
  return videos.map((video) => ({
    id: video.id,
    title: video.title,
    meta: `${video.createdAt} • ${video.views.toLocaleString()} views`,
    badge: video.status,
  }));
}

export function getAdminChannelsRows() {
  return channels.map((channel) => ({
    id: channel.id,
    title: channel.name,
    meta: `${channel.connectedCount} connected • ${channel.health}`,
    badge: channel.status,
  }));
}

export function getAdminLogsRows() {
  return systemLogs.map((log) => ({
    id: log.id,
    title: log.title,
    meta: `time ${log.time}`,
    badge: log.level,
  }));
}