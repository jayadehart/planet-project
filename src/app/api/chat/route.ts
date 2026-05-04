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
import { isFirstUserMessage, isAmbiguousMessage } from '@/lib/message-classifier';

const goalText = readFileSync(path.join(process.cwd(), 'GOAL.md'), 'utf8');

const instructions = `You are a trip-planning assistant. The system's goal — which you are also evaluated against after the conversation ends — is below. Use the weather tool when timing or packing matters; the calculator for budget splits or travel-time math.

${goalText}

## Handling unclear or off-topic opening messages

If the user's first message is ambiguous, off-topic, or lacks clear trip-planning intent (e.g., casual greetings like "whats up dog", "hey", "hello" without context, or unrelated topics), immediately ask clarifying questions to understand their trip needs. Ask about:
- Where they want to go (or if they need help choosing a destination)
- When they plan to travel (dates, duration, or timeframe)
- What interests them (activities, food, culture, nature, etc.)

Re-center the conversation toward productive trip planning rather than engaging with off-topic content.`;

const agent = new ToolLoopAgent({
  model: anthropic('claude-sonnet-4-5'),
  instructions,
  tools: { calculator, weather },
});

type ChatUIMessage = InferAgentUIMessage<typeof agent>;

export async function POST(req: Request) {
  const { messages, chatId } = (await req.json()) as {
    messages: ChatUIMessage[];
    chatId: string;
  };

  let effectiveMessages = messages;

  if (isFirstUserMessage(messages)) {
    const firstUserMsg = messages.find((m) => m.role === 'user');
    if (firstUserMsg?.parts?.[0]?.type === 'text') {
      const content = firstUserMsg.parts[0].text;
      if (isAmbiguousMessage(content)) {
        const clarifyingPrompt = `The user's message seems unclear or off-topic for trip planning. Ask them clarifying questions about their trip needs: destination, dates, and interests. Be friendly but redirect the conversation toward planning.`;
        effectiveMessages = [
          ...messages,
          {
            id: 'system-clarify-' + Date.now(),
            role: 'system' as const,
            parts: [{ type: 'text' as const, text: clarifyingPrompt }],
          },
        ];
      }
    }
  }

  return createAgentUIStreamResponse({
    agent,
    uiMessages: effectiveMessages,
    originalMessages: messages,
    generateMessageId: createIdGenerator({ prefix: 'msg', size: 16 }),
    onFinish: async ({ messages: updated }) => {
      await saveChat({ chatId, messages: updated });
    },
  });
}
