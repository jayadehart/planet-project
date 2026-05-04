import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  ToolLoopAgent,
  createAgentUIStreamResponse,
  createIdGenerator,
  type InferAgentUIMessage,
} from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { saveChat } from '@/lib/chat-store';
import { calculator } from '@/lib/tools/calculator';
import { weather } from '@/lib/tools/weather';
import { restaurantReservation } from '@/lib/tools/restaurant-reservation';

const goalText = readFileSync(path.join(process.cwd(), 'GOAL.md'), 'utf8');

const instructions = `You are a trip-planning assistant. The system's goal — which you are also evaluated against after the conversation ends — is below. Use the weather tool when timing or packing matters; the calculator for budget splits or travel-time math; the restaurantReservation tool to book tables at specific restaurants when the user requests it.

${goalText}`;

const agent = new ToolLoopAgent({
  model: anthropic('claude-sonnet-4-5'),
  instructions,
  tools: { calculator, weather, restaurantReservation },
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
