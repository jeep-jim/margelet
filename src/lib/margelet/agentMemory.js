const MEMORY_LIMIT = 50;

function normalizeTopic(topic) {
  return String(topic || "")
    .toLowerCase()
    .trim();
}

export function createEmptyMemory() {
  return {
    topics: [],
    hooks: [],
    history: [],
  };
}

export function loadAgentMemory(agent) {
  if (agent?.memory) return agent.memory;
  return createEmptyMemory();
}

export function saveAgentMemory(agent, memory) {
  agent.memory = memory;
  return agent;
}

export function rememberGeneration(agent, result) {
  const memory = loadAgentMemory(agent);

  const topic = normalizeTopic(result?.agent?.topic);
  const hook = result?.script?.hook || "";

  if (topic) {
    memory.topics.unshift(topic);
  }

  if (hook) {
    memory.hooks.unshift(hook);
  }

  memory.history.unshift({
    topic,
    title: result?.script?.title || "",
    createdAt: new Date().toISOString(),
  });

  memory.topics = memory.topics.slice(0, MEMORY_LIMIT);
  memory.hooks = memory.hooks.slice(0, MEMORY_LIMIT);
  memory.history = memory.history.slice(0, MEMORY_LIMIT);

  return saveAgentMemory(agent, memory);
}

export function topicWasUsed(agent, topic) {
  const memory = loadAgentMemory(agent);
  const normalized = normalizeTopic(topic);

  return memory.topics.includes(normalized);
}

export function filterRepeatedTopics(agent, ideas = []) {
  const memory = loadAgentMemory(agent);

  return ideas.filter((idea) => {
    const normalized = normalizeTopic(idea);
    return !memory.topics.includes(normalized);
  });
}