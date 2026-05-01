import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { UIMessage } from 'ai';

export const featureSchema = z.object({
  title: z
    .string()
    .min(4)
    .max(80)
    .describe('Short imperative title, e.g. "Add timestamps to chat list"'),
  description: z
    .string()
    .min(20)
    .describe('What the feature is and how it should behave from the user perspective'),
});

export const featureListSchema = z.object({
  features: z.array(featureSchema),
});

export type ExtractedFeature = z.infer<typeof featureSchema>;

export type ChatTranscript = {
  chatSessionId: string;
  messages: Array<{
    id: string;
    role: 'system' | 'user' | 'assistant';
    parts: UIMessage['parts'];
  }>;
};

const SYSTEM_PROMPT = `You are reviewing chat logs between users and an AI assistant in order to identify discrete feature requests or implied features based on user questions.

Example:
  User: "How can I go back to old chats?"
  Feature: "Persisted chat logs, chat session navigation"

Rules:
- Each feature must be small and concrete enough that a coding agent could ship it in a single PR.
- If no genuine feature requests are present, return an empty list.`;

function renderTranscript(t: ChatTranscript): string {
  const lines = t.messages.map((m) => {
    const text = (m.parts ?? [])
      .map((p) => (p.type === 'text' ? p.text : `[${p.type}]`))
      .join('');
    return `[msg:${m.id}] ${m.role}: ${text}`;
  });
  return `### chat ${t.chatSessionId}\n${lines.join('\n')}`;
}

export async function extractFeatures(
  transcripts: ChatTranscript[],
): Promise<ExtractedFeature[]> {
  if (transcripts.length === 0) return [];

  const userPrompt = transcripts.map(renderTranscript).join('\n\n');

  const { output } = await generateText({
    model: anthropic('claude-sonnet-4-5'),
    output: Output.object({ schema: featureListSchema }),
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
  });

  return output.features;
}
