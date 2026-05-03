import {
  ToolLoopAgent,
  createAgentUIStreamResponse,
  createIdGenerator,
  type InferAgentUIMessage,
} from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { saveChat } from '@/lib/chat-store';
import { calculator } from '@/lib/tools/calculator';

const agent = new ToolLoopAgent({
  model: anthropic('claude-sonnet-4-5'),
  instructions: 'You are a helpful assistant.',
  tools: { calculator },
});

type ChatUIMessage = InferAgentUIMessage<typeof agent>;

export async function POST(req: Request) {
  const { messages, chatId } = (await req.json()) as {
    messages: ChatUIMessage[];
    chatId: string;
  };

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    originalMessages: messages,
    generateMessageId: createIdGenerator({ prefix: 'msg', size: 16 }),
    onFinish: async ({ messages: updated }) => {
      await saveChat({ chatId, messages: updated });
    },
  });
}
