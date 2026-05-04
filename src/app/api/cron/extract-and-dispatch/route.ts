import { gt, eq, asc, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { messages as messagesTable, systemState, sessionEvaluations } from '@/db/schema';
import {
  extractFeatures,
  type ChatTranscript,
  type EvaluatedTranscript,
} from '@/lib/feature-extraction';
import { dispatchAgentRun } from '@/lib/github-dispatch';
import { judgeSession, loadGoal } from '@/lib/session-evaluation';

const SINGLETON_ID = 'global';
const LOW_SCORE_THRESHOLD = 3;

function unauthorized() {
  return new Response('Unauthorized', { status: 401 });
}

async function getOrCreateWatermark(): Promise<Date> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(systemState)
    .where(eq(systemState.id, SINGLETON_ID))
    .limit(1);
  if (existing) return existing.lastExtractionAt;

  const [created] = await db
    .insert(systemState)
    .values({ id: SINGLETON_ID })
    .onConflictDoNothing()
    .returning();
  if (created) return created.lastExtractionAt;

  const [retry] = await db
    .select()
    .from(systemState)
    .where(eq(systemState.id, SINGLETON_ID))
    .limit(1);
  return retry!.lastExtractionAt;
}

async function handle(req: Request): Promise<Response> {
  const expected = process.env.CRON_SECRET;
  if (!expected) return new Response('CRON_SECRET not configured', { status: 500 });
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${expected}`) return unauthorized();

  const watermark = await getOrCreateWatermark();
  const db = getDb();

  const newMessages = await db
    .select({
      chatSessionId: messagesTable.chatSessionId,
      createdAt: messagesTable.createdAt,
    })
    .from(messagesTable)
    .where(gt(messagesTable.createdAt, watermark))
    .orderBy(asc(messagesTable.chatSessionId), asc(messagesTable.orderIndex));

  if (newMessages.length === 0) {
    return Response.json({ messagesSeen: 0, sessionsJudged: 0, featuresExtracted: 0, dispatched: 0 });
  }

  let maxCreatedAt: Date = watermark;
  const affectedSessionIds = new Set<string>();
  for (const r of newMessages) {
    if (r.createdAt > maxCreatedAt) maxCreatedAt = r.createdAt;
    affectedSessionIds.add(r.chatSessionId);
  }

  const fullRows = await db
    .select({
      id: messagesTable.id,
      chatSessionId: messagesTable.chatSessionId,
      role: messagesTable.role,
      parts: messagesTable.parts,
    })
    .from(messagesTable)
    .where(inArray(messagesTable.chatSessionId, [...affectedSessionIds]))
    .orderBy(asc(messagesTable.chatSessionId), asc(messagesTable.orderIndex));

  const transcripts = new Map<string, ChatTranscript>();
  for (const r of fullRows) {
    let t = transcripts.get(r.chatSessionId);
    if (!t) {
      t = { chatSessionId: r.chatSessionId, messages: [] };
      transcripts.set(r.chatSessionId, t);
    }
    t.messages.push({ id: r.id, role: r.role, parts: r.parts });
  }

  const goalText = await loadGoal();

  const evaluated: EvaluatedTranscript[] = [];
  for (const transcript of transcripts.values()) {
    const evaluation = await judgeSession({ transcript, goalText });
    await db
      .insert(sessionEvaluations)
      .values({
        chatSessionId: transcript.chatSessionId,
        goalMet: evaluation.goalMet,
        capabilityGap: evaluation.capabilityGap,
        friction: evaluation.friction,
        notes: evaluation.notes,
        evaluatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: sessionEvaluations.chatSessionId,
        set: {
          goalMet: evaluation.goalMet,
          capabilityGap: evaluation.capabilityGap,
          friction: evaluation.friction,
          notes: evaluation.notes,
          evaluatedAt: new Date(),
        },
      });
    evaluated.push({ ...transcript, evaluation });
  }

  const lowScoring = evaluated.filter((e) => e.evaluation.goalMet <= LOW_SCORE_THRESHOLD);
  const features = await extractFeatures(lowScoring);

  let dispatched = 0;
  const failures: Array<{ title: string; error: string }> = [];
  for (const f of features) {
    try {
      await dispatchAgentRun(f);
      dispatched++;
    } catch (e) {
      failures.push({
        title: f.title,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const watermarkAdvanced = failures.length === 0;
  if (watermarkAdvanced) {
    await db
      .update(systemState)
      .set({ lastExtractionAt: maxCreatedAt, updatedAt: new Date() })
      .where(eq(systemState.id, SINGLETON_ID));
  }

  return Response.json({
    messagesSeen: newMessages.length,
    sessionsJudged: evaluated.length,
    lowScoringSessions: lowScoring.length,
    featuresExtracted: features.length,
    dispatched,
    failed: failures.length,
    failures,
    watermark: (watermarkAdvanced ? maxCreatedAt : watermark).toISOString(),
    watermarkAdvanced,
  });
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
