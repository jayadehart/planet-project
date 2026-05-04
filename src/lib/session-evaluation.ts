import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ChatTranscript } from './feature-extraction';

export const evaluationSchema = z.object({
  goalMet: z
    .number()
    .int()
    .min(1)
    .max(5)
    .describe('1 = goal not met at all, 5 = user clearly leaves with an actionable plan.'),
  capabilityGap: z
    .string()
    .max(200)
    .nullable()
    .describe(
      'Short tag describing something the product was missing — a capability, surface, persisted entity, integration, or UI primitive. Null if nothing was missing. Examples: "no flight prices" (missing tool/integration), "no place to view past trips" (missing surface), "did not remember dietary prefs across sessions" (missing persistence), "no map view for suggested places" (missing primitive). Tag what the product needed, not what the assistant should have said.',
    ),
  friction: z
    .string()
    .max(200)
    .nullable()
    .describe(
      'Short tag describing in-flow friction, if any. Null if smooth. Can be conversational ("too many clarifying questions", "had to repeat dates") or product-shaped ("had to copy plan to notes app", "no way to share itinerary").',
    ),
  notes: z
    .string()
    .max(500)
    .describe('One or two sentences justifying the score.'),
});

export type SessionEvaluation = z.infer<typeof evaluationSchema>;

const SYSTEM_PROMPT = `You are evaluating a single chat session between a user and a trip-planning product against a stated goal.

You will be given:
- The goal of the product.
- A full chat transcript.

Score how well the product served the user in this session, and tag any failure modes that appeared. Be honest — low scores and concrete failure tags are how the system improves.

The product is more than its chat surface. When you tag a capability gap, prefer product-shaped framings (missing tool, missing page, missing persistence, missing integration, missing UI primitive) over framings that imply the only fix is the assistant saying something different. If a user wanted to save an itinerary, view past trips, see real flight prices, or use a feature that doesn't exist yet, that's a product gap to tag — not a conversational shortcoming.`;

function renderTranscript(t: ChatTranscript): string {
  const lines = t.messages.map((m) => {
    const text = (m.parts ?? [])
      .map((p) => (p.type === 'text' ? p.text : `[${p.type}]`))
      .join('');
    return `${m.role}: ${text}`;
  });
  return lines.join('\n');
}

export async function loadGoal(): Promise<string> {
  const p = path.join(process.cwd(), 'GOAL.md');
  return readFile(p, 'utf8');
}

export async function judgeSession({
  transcript,
  goalText,
}: {
  transcript: ChatTranscript;
  goalText: string;
}): Promise<SessionEvaluation> {
  const userPrompt = `## Goal\n\n${goalText}\n\n## Transcript\n\n${renderTranscript(transcript)}`;

  const { output } = await generateText({
    model: anthropic('claude-sonnet-4-5'),
    output: Output.object({ schema: evaluationSchema }),
    system: SYSTEM_PROMPT,
    prompt: userPrompt,
  });

  return output;
}
