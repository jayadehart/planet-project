import { ToolLoopAgent, createAgentUIStreamResponse, type UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

const agent = new ToolLoopAgent({
  model: anthropic('claude-sonnet-4-5'),
  instructions: 'You are a helpful assistant.',
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  return createAgentUIStreamResponse({ agent, uiMessages: messages });
}
