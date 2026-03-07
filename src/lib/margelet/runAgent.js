import { normalizeAgent } from "./agentSchema";
import { generateScript } from "./scriptEngine";

export async function runAgent(agentConfig) {
  const agent = normalizeAgent(agentConfig);

  const script = await generateScript(agent);

  const scenes = script.script.map((line, i) => ({
    id: i,
    text: line,
    duration: Math.floor(agent.lengthSec / script.script.length),
  }));

  return {
    agent,
    script,
    scenes,
  };
}