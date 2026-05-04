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
      'Short tag describing a capability the assistant lacked, if any. Null if no gap. Example: "no flight prices", "cannot save itinerary".',
    ),
  friction: z
    .string()
    .max(200)
    .nullable()
    .describe(
      'Short tag describing user friction, if any. Null if smooth. Example: "too many clarifying questions", "had to repeat dates".',
    ),
  notes: z
    .string()
    .max(500)
    .describe('One or two sentences justifying the score.'),
});

export type SessionEvaluation = z.infer<typeof evaluationSchema>;

const SYSTEM_PROMPT = `You are evaluating a single chat session between a user and a trip-planning assistant against a stated goal.

You will be given:
- The goal of the application.
- A full chat transcript.

Score how well the assistant met the goal in this session, and tag any failure modes that appeared. Be honest — low scores and concrete failure tags are how the system improves.`;

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
