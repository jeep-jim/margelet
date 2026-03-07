import {
  publicAuthors,
  publicTemplateLibrary,
  publicAgents,
  publicFeedItems,
} from "./publicData";

export {
  publicAuthors,
  publicTemplateLibrary,
  publicAgents,
  publicFeedItems,
};

export function getPublicAuthorById(authorId) {
  return publicAuthors.find((author) => author.id === authorId) || null;
}

export function getCurrentAuthor() {
  return publicAuthors[0];
}

export function getPublicTotals(agents = publicAgents) {
  return {
    videos: 128,
    views: "326k",
    agents: agents.length,
    activeAgents: agents.filter((agent) => agent.active).length,
  };
}

export function getFilteredAgents({
  agents = publicAgents,
  agentSearch = "",
  agentFilter = "all",
}) {
  return agents.filter((agent) => {
    const q = `${agent.name} ${agent.topic} ${agent.platform}`.toLowerCase();
    const searchOk = q.includes(agentSearch.toLowerCase());
    const filterOk =
      agentFilter === "all"
        ? true
        : agentFilter === "active"
        ? agent.active
        : agent.mode.toLowerCase() === agentFilter;

    return searchOk && filterOk;
  });
}

export function getSelectedWorkspaceAgent(agents, selectedWorkspaceId) {
  return agents.find((agent) => agent.id === selectedWorkspaceId) || null;
}

export function getEditingAgent(agents, editingAgentId) {
  return agents.find((agent) => agent.id === editingAgentId) || null;
}

export function getLocalizedFeedItems(lang = "en") {
  return publicFeedItems.map((item) => {
    const author = getPublicAuthorById(item.authorId);

    return {
      id: item.id,
      author,
      growth: item.growth,
      label: lang === "ru" ? item.labelRu : item.labelEn,
      title: lang === "ru" ? item.titleRu : item.titleEn,
      caption: lang === "ru" ? item.captionRu : item.captionEn,
      views: item.views,
      installs: item.installs,
      agent: item.agent,
    };
  });
}

export function getPublicStoreAgents(lang = "en") {
  return publicTemplateLibrary.map((tpl, i) => {
    const author = getPublicAuthorById(tpl.authorId) || publicAuthors[0];

    return {
      ...tpl,
      title:
        tpl.key === "motivation"
          ? "Motivation Agent"
          : tpl.key === "news"
          ? "News Agent"
          : tpl.key === "business"
          ? "Business Agent"
          : "Facts Agent",
      type: i % 2 ? "Paid" : "Free",
      rating: (4.7 + i * 0.1).toFixed(1),
      installs: i % 2 ? `${12 + i}k` : `${4 + i}k`,
      price: i % 2 ? `⭐ ${120 + i * 40}` : "Free",
      ctr: `${(4.2 + i * 0.3).toFixed(1)}%`,
      revenue: `⭐ ${1900 + i * 700}`,
      description:
        tpl.key === "news"
          ? lang === "ru"
            ? "Быстрый новостной агент для коротких форматов с текстом, голосом, субтитрами и очередью публикации."
            : "Fast media agent for daily short-form news updates with scripts, voice, captions and queue-ready output."
          : tpl.key === "business"
          ? lang === "ru"
            ? "Бизнес-агент для экспертных каналов, которым нужны сильные тезисы и доверительная подача."
            : "Business explainer agent for expert channels that need high-trust scripts and structured talking points."
          : tpl.key === "motivation"
          ? lang === "ru"
            ? "Ежедневный мотивационный движок, который делает хуки, субтитры и короткие сценарии для роста канала."
            : "Daily motivation engine that creates hooks, captions and short video flows for consistent channel growth."
          : lang === "ru"
          ? "Faceless-агент фактов, который превращает темы в короткие ролики с сильным удержанием."
          : "Faceless facts agent that turns topics into short, curiosity-driven content with strong retention hooks.",
      tags: [tpl.topic, tpl.style, tpl.autopost ? "Autopost" : "Manual"],
      previewLabel:
        tpl.key === "news"
          ? "Breaking format"
          : tpl.key === "business"
          ? "Expert mode"
          : tpl.key === "motivation"
          ? "Daily growth"
          : "Faceless facts",
      previewTitle:
        tpl.key === "news"
          ? "This update changed the market in 24 hours"
          : tpl.key === "business"
          ? "3 rules serious founders never ignore"
          : tpl.key === "motivation"
          ? "The habit that changes your next 90 days"
          : "A fact most people learn too late",
      previewText:
        tpl.key === "news"
          ? "Hook, quick context, why it matters and CTA for follow-up shorts."
          : tpl.key === "business"
          ? "Structured short with authority framing, key points and strong finishing CTA."
          : tpl.key === "motivation"
          ? "Strong emotional hook, compact script and easy daily posting rhythm."
          : "Fast curiosity hook, reveal and retention-focused finish.",
      reviews: [
        {
          name: "Alex",
          rating: "4.9",
          text:
            lang === "ru"
              ? "Поставил за пять минут, и агент сразу начал делать usable shorts."
              : "Installed in five minutes and it started producing usable shorts right away.",
        },
        {
          name: "Mia",
          rating: "4.8",
          text:
            lang === "ru"
              ? "Пока лучший результат для Shorts. Хорошие хуки и стабильный output."
              : "Best results on Shorts so far. Good hooks and very stable output.",
        },
      ],
      author,
    };
  });
}