import { runAgent } from "./runAgent";
import { generateContentStrategy } from "./contentStrategyEngine";
import { filterRepeatedTopics } from "./agentMemory";

/*
AgentDirector

Управляет несколькими агентами:
- строит стратегию
- распределяет идеи
- запускает генерацию
*/

function normalizeAgents(input) {
  if (!Array.isArray(input)) return [];
  return input.filter(Boolean);
}

function distributeIdeas(agents, strategy) {
  const ideas = strategy?.plan || [];
  const map = new Map();

  agents.forEach((agent) => {
    map.set(agent.id || agent.name, []);
  });

  ideas.forEach((idea, index) => {
    const agent = agents[index % agents.length];
    const key = agent.id || agent.name;

    const list = map.get(key) || [];
    list.push(idea.idea);

    map.set(key, list);
  });

  return map;
}

async function generateForAgent(agent, ideas) {
  const safeIdeas = filterRepeatedTopics(agent, ideas);

  const results = [];

  for (const topic of safeIdeas) {
    const result = await runAgent({
      ...agent,
      topic,
      requestedVideos: 1,
    });

    results.push(result);
  }

  return results;
}

function buildQueue(results) {
  const queue = [];

  results.forEach((agentResult) => {
    if (agentResult?.items) {
      agentResult.items.forEach((item) => {
        queue.push({
          type: "video",
          topic: item.topic,
          title: item.script?.title || "",
          agent: item.agent?.name || "",
          publishPlan: item.publishPlan,
        });
      });
    } else {
      queue.push({
        type: "video",
        topic: agentResult?.agent?.topic || "",
        title: agentResult?.script?.title || "",
        agent: agentResult?.agent?.name || "",
        publishPlan: agentResult?.publishPlan,
      });
    }
  });

  return queue;
}

export async function runAgentDirector(agentsInput, days = 7) {
  const agents = normalizeAgents(agentsInput);

  if (!agents.length) {
    return {
      status: "no-agents",
      queue: [],
      strategy: null,
    };
  }

  // стратегия
  const strategy = generateContentStrategy(agents[0], days);

  // распределение идей
  const distribution = distributeIdeas(agents, strategy);

  const allResults = [];

  for (const agent of agents) {
    const key = agent.id || agent.name;
    const ideas = distribution.get(key) || [];

    const results = await generateForAgent(agent, ideas);

    allResults.push(...results);
  }

  const queue = buildQueue(allResults);

  return {
    status: "ok",
    agents: agents.length,
    days,
    strategy,
    queue,
  };
}