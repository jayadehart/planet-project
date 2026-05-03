import { gt, eq, asc } from 'drizzle-orm';
import { getDb } from '@/db';
import { messages as messagesTable, systemState } from '@/db/schema';
import { extractFeatures, type ChatTranscript } from '@/lib/feature-extraction';
import { dispatchAgentRun } from '@/lib/github-dispatch';

const SINGLETON_ID = 'global';

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

  const rows = await db
    .select({
      id: messagesTable.id,
      chatSessionId: messagesTable.chatSessionId,
      role: messagesTable.role,
      parts: messagesTable.parts,
      createdAt: messagesTable.createdAt,
    })
    .from(messagesTable)
    .where(gt(messagesTable.createdAt, watermark))
    .orderBy(asc(messagesTable.chatSessionId), asc(messagesTable.orderIndex));

  if (rows.length === 0) {
    return Response.json({ messagesSeen: 0, featuresExtracted: 0, dispatched: 0 });
  }

  const byChat = new Map<string, ChatTranscript>();
  let maxCreatedAt: Date = watermark;
  for (const r of rows) {
    if (r.createdAt > maxCreatedAt) maxCreatedAt = r.createdAt;
    let t = byChat.get(r.chatSessionId);
    if (!t) {
      t = { chatSessionId: r.chatSessionId, messages: [] };
      byChat.set(r.chatSessionId, t);
    }
    t.messages.push({ id: r.id, role: r.role, parts: r.parts });
  }

  const features = await extractFeatures([...byChat.values()]);

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
    messagesSeen: rows.length,
    chats: byChat.size,
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
