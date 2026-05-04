import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { UIMessage } from 'ai';
import type { SessionEvaluation } from './session-evaluation';

export const featureSchema = z.object({
  title: z
    .string()
    .min(4)
    .max(80)
    .describe('Short imperative title, e.g. "Show real-time flight prices"'),
  description: z
    .string()
    .min(20)
    .describe('What the feature is and how it should behave from the user perspective. Reference the failure mode it addresses.'),
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

export type EvaluatedTranscript = ChatTranscript & {
  evaluation: SessionEvaluation;
};

const SYSTEM_PROMPT = `You are reviewing low-scoring chat sessions from a trip-planning assistant. Each session comes with a judge's evaluation: a score against the app's goal, plus tags for capability gaps and friction.

Your job is to propose small, concrete features that would close those gaps. Drive features from the failure modes — not from raw user questions.

Rules:
- Each feature must be small and concrete enough that a coding agent could ship it in a single PR.
- Each feature must reference the failure mode (capability gap or friction tag) it addresses.
- Prefer features that would help across multiple sessions (recurring tags) over one-off ideas.
- If the failure modes are too vague to act on, return an empty list.`;

function renderTranscript(t: EvaluatedTranscript): string {
  const lines = t.messages.map((m) => {
    const text = (m.parts ?? [])
      .map((p) => (p.type === 'text' ? p.text : `[${p.type}]`))
      .join('');
    return `[msg:${m.id}] ${m.role}: ${text}`;
  });
  return [
    `### chat ${t.chatSessionId}`,
    `score: ${t.evaluation.goalMet}/5`,
    `capability gap: ${t.evaluation.capabilityGap ?? 'none'}`,
    `friction: ${t.evaluation.friction ?? 'none'}`,
    `judge notes: ${t.evaluation.notes}`,
    '',
    lines.join('\n'),
  ].join('\n');
}

export async function extractFeatures(
  transcripts: EvaluatedTranscript[],
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
