import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  ToolLoopAgent,
  createAgentUIStreamResponse,
  createIdGenerator,
  type InferAgentUIMessage,
  type ModelMessage,
} from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { saveChat } from '@/lib/chat-store';
import {
  INTERFACE_REDIRECT_INSTRUCTION,
  isFirstMessageInterfaceRequest,
} from '@/lib/interface-request';
import { calculator } from '@/lib/tools/calculator';
import { weather } from '@/lib/tools/weather';

const goalText = readFileSync(path.join(process.cwd(), 'GOAL.md'), 'utf8');

const instructions = `You are a trip-planning assistant. The system's goal — which you are also evaluated against after the conversation ends — is below. Use the weather tool when timing or packing matters; the calculator for budget splits or travel-time math.

${goalText}`;

const agent = new ToolLoopAgent({
  model: anthropic('claude-sonnet-4-5'),
  instructions,
  tools: { calculator, weather },
  prepareCall: ({ instructions: base, ...rest }) => {
    const callMessages = (rest as { messages?: readonly ModelMessage[] }).messages;
    const isInterfaceRequest =
      !!callMessages && isFirstMessageInterfaceRequest(callMessages);
    const instructions = isInterfaceRequest
      ? `${base ?? ''}\n\n${INTERFACE_REDIRECT_INSTRUCTION}`
      : base;
    return { ...rest, instructions };
  },
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
