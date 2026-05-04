import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  ToolLoopAgent,
  createAgentUIStreamResponse,
  createIdGenerator,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type InferAgentUIMessage,
} from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { saveChat } from '@/lib/chat-store';
import { calculator } from '@/lib/tools/calculator';
import { weather } from '@/lib/tools/weather';
import { buildOffTopicResponse, detectOffTopicCategory } from '@/lib/off-topic';

const goalText = readFileSync(path.join(process.cwd(), 'GOAL.md'), 'utf8');

const instructions = `You are a trip-planning assistant. The system's goal — which you are also evaluated against after the conversation ends — is below. Use the weather tool when timing or packing matters; the calculator for budget splits or travel-time math.

${goalText}`;

const agent = new ToolLoopAgent({
  model: anthropic('claude-sonnet-4-5'),
  instructions,
  tools: { calculator, weather },
});

type ChatUIMessage = InferAgentUIMessage<typeof agent>;

const generateMessageId = createIdGenerator({ prefix: 'msg', size: 16 });

function lastUserText(messages: ChatUIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === 'user') {
      return m.parts
        .map((p) => (p.type === 'text' ? p.text : ''))
        .join('');
    }
  }
  return '';
}

export async function POST(req: Request) {
  const { messages, chatId } = (await req.json()) as {
    messages: ChatUIMessage[];
    chatId: string;
  };

  const offTopic = detectOffTopicCategory(lastUserText(messages));
  if (offTopic) {
    const text = buildOffTopicResponse(offTopic);
    const stream = createUIMessageStream<ChatUIMessage>({
      originalMessages: messages,
      generateId: generateMessageId,
      execute: ({ writer }) => {
        const id = 'text-1';
        writer.write({ type: 'start' });
        writer.write({ type: 'start-step' });
        writer.write({ type: 'text-start', id });
        writer.write({ type: 'text-delta', id, delta: text });
        writer.write({ type: 'text-end', id });
        writer.write({ type: 'finish-step' });
        writer.write({ type: 'finish' });
      },
      onFinish: async ({ messages: updated }) => {
        await saveChat({ chatId, messages: updated });
      },
    });
    return createUIMessageStreamResponse({ stream });
  }

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    originalMessages: messages,
    generateMessageId,
    onFinish: async ({ messages: updated }) => {
      await saveChat({ chatId, messages: updated });
    },
  });
}
