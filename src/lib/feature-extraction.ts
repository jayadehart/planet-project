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
    .describe('Short imperative title naming the thing being built, e.g. "Add saved-trips sidebar at /trips" or "Add flight-price tool using Duffel API".'),
  description: z
    .string()
    .min(20)
    .describe('What the feature is, what surfaces/data/tools it adds (routes, tables, components, APIs), and the underlying user need it resolves. Describe the product change, not just the user-visible behavior.'),
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

const SYSTEM_PROMPT = `You are reviewing low-scoring chat sessions from a trip-planning product. Each session comes with a judge's evaluation: a score against the product's goal, plus tags for capability gaps and friction.

Your job is to propose substantive features that would resolve the underlying user need — not patch over it with a better-worded reply. The product is more than its chat surface; you are deciding what to build next across the whole product (chat, pages, schema, tools, integrations).

What "good" looks like:

- Feature that ships a real capability the product is missing — a new tool the assistant can call, a new page, a new persisted entity, a new integration, a new UI primitive.
- Sized so a single coding agent can complete it autonomously, but ambitious within that envelope. New routes, new components, new schema migrations, new dependencies, and new third-party APIs are all in scope. Do not default to the smallest possible interpretation. A 30-line text tweak is almost never the right answer when the gap is product-shaped.
- Resolves the user's underlying need, not the literal wording of the failure tag. If the tag is "no chat history", the right feature is probably "build a sidebar listing past trips with a /trips route and a chat_session.title field" — not "mention chat history in the greeting".
- Helps across multiple sessions (recurring tags) rather than fixing a one-off.

Examples of the shape we want:

- "Add a saved-trips sidebar at /trips backed by a trips table, with controls to rename and delete past sessions" (addresses: missing surface for past trips).
- "Add a flight-price tool the assistant can call, using the Duffel or Amadeus API behind a server-side wrapper" (addresses: missing capability — flight prices).
- "Add a profile page where users can store travel preferences (pace, budget, dietary needs) and inject them into the system prompt" (addresses: missing persistence across sessions).
- "Add an in-chat itinerary artifact with a day-by-day editable component, persisted as structured JSON on the message" (addresses: high friction copying plans elsewhere).

Examples of the shape we do NOT want:

- "Update the greeting to mention that chat history exists" (papers over the gap instead of building it).
- "Add a help page explaining what the assistant can do" (meta-explainer rather than a real capability).
- "Improve the system prompt to ask fewer clarifying questions" (prompt tweak, not a product change — only propose this if there is genuinely no product-shaped fix).

Return an empty list if the failure modes are too vague to act on, or if the only honest fix is a prompt tweak that you've already proposed in a prior batch.`;

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
