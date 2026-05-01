import { pgTable, text, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { UIMessage } from 'ai';

export const chatSessions = pgTable('chat_sessions', {
  id: text('id').primaryKey(),
  title: text('title'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: text('id').primaryKey(),
  chatSessionId: text('chat_session_id')
    .notNull()
    .references(() => chatSessions.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['system', 'user', 'assistant'] }).notNull(),
  parts: jsonb('parts').$type<UIMessage['parts']>().notNull(),
  metadata: jsonb('metadata'),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const chatSessionsRelations = relations(chatSessions, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [messages.chatSessionId],
    references: [chatSessions.id],
  }),
}));
