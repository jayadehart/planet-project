import { generateId, type UIMessage } from 'ai';
import { eq, asc, sql } from 'drizzle-orm';
import { db } from '@/db';
import { chatSessions, messages as messagesTable } from '@/db/schema';

export async function createChat(): Promise<string> {
  const id = generateId();
  await db.insert(chatSessions).values({ id });
  return id;
}

export async function chatExists(id: string): Promise<boolean> {
  const [row] = await db
    .select({ id: chatSessions.id })
    .from(chatSessions)
    .where(eq(chatSessions.id, id))
    .limit(1);
  return !!row;
}

export async function loadChat(id: string): Promise<UIMessage[]> {
  const rows = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.chatSessionId, id))
    .orderBy(asc(messagesTable.orderIndex));

  return rows.map((r) => ({
    id: r.id,
    role: r.role,
    parts: r.parts,
    ...(r.metadata ? { metadata: r.metadata } : {}),
  })) as UIMessage[];
}

export async function saveChat({
  chatId,
  messages,
}: {
  chatId: string;
  messages: UIMessage[];
}): Promise<void> {
  if (messages.length === 0) return;

  await db
    .insert(messagesTable)
    .values(
      messages.map((m, i) => ({
        id: m.id,
        chatSessionId: chatId,
        role: m.role,
        parts: m.parts,
        metadata: m.metadata ?? null,
        orderIndex: i,
      })),
    )
    .onConflictDoUpdate({
      target: messagesTable.id,
      set: {
        parts: sql`excluded.parts`,
        orderIndex: sql`excluded.order_index`,
      },
    });

  await db
    .update(chatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(chatSessions.id, chatId));
}
