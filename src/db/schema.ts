import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { UIMessage } from 'ai';

export const chatSessions = pgTable('chat_sessions', {
  id: text('id').primaryKey(),
  title: text('title'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const TRIP_STATUSES = ['planning', 'booked', 'completed', 'archived'] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const trips = pgTable('trips', {
  id: text('id').primaryKey(),
  title: text('title').notNull().default('Untitled trip'),
  destination: text('destination'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  budgetCents: integer('budget_cents'),
  status: text('status', { enum: TRIP_STATUSES }).notNull().default('planning'),
  isFavorite: boolean('is_favorite').notNull().default(false),
  chatSessionId: text('chat_session_id')
    .notNull()
    .references(() => chatSessions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const tripsRelations = relations(trips, ({ one }) => ({
  session: one(chatSessions, {
    fields: [trips.chatSessionId],
    references: [chatSessions.id],
  }),
}));

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
  trips: many(trips),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [messages.chatSessionId],
    references: [chatSessions.id],
  }),
}));

export const systemState = pgTable('system_state', {
  id: text('id').primaryKey(),
  lastExtractionAt: timestamp('last_extraction_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const sessionEvaluations = pgTable('session_evaluations', {
  chatSessionId: text('chat_session_id')
    .primaryKey()
    .references(() => chatSessions.id, { onDelete: 'cascade' }),
  goalMet: integer('goal_met').notNull(),
  capabilityGap: text('capability_gap'),
  friction: text('friction'),
  notes: text('notes'),
  evaluatedAt: timestamp('evaluated_at').notNull().defaultNow(),
});
