export async function generateScript(agent) {
  const hook = `Did you know this about ${agent.topic}?`;

  const script = [
    `Most people misunderstand ${agent.topic}.`,
    `Here is what actually matters.`,
    `And this is why it changes everything.`,
  ];

  return {
    hook,
    script,
    title: `${agent.topic} explained in 30 seconds`,
  };
}