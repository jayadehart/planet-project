import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { generateId } from 'ai';
import { getDb } from '@/db';
import { chatSessions, trips, TRIP_STATUSES, type TripStatus } from '@/db/schema';

export type Trip = {
  id: string;
  title: string;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  budgetCents: number | null;
  status: TripStatus;
  isFavorite: boolean;
  chatSessionId: string;
  createdAt: Date;
  updatedAt: Date;
};

export const tripUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    destination: z.string().trim().max(120).nullable(),
    startDate: z.string().trim().max(40).nullable(),
    endDate: z.string().trim().max(40).nullable(),
    budgetCents: z.number().int().nonnegative().nullable(),
    status: z.enum(TRIP_STATUSES),
    isFavorite: z.boolean(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field is required',
  });

export type TripUpdate = z.infer<typeof tripUpdateSchema>;

export const tripCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    destination: z.string().trim().max(120),
    startDate: z.string().trim().max(40),
    endDate: z.string().trim().max(40),
    budgetCents: z.number().int().nonnegative(),
  })
  .partial();

export type TripCreate = z.infer<typeof tripCreateSchema>;

export async function listTrips(): Promise<Trip[]> {
  const rows = await getDb()
    .select()
    .from(trips)
    .orderBy(desc(trips.isFavorite), desc(trips.updatedAt));
  return rows as Trip[];
}

export async function getTrip(id: string): Promise<Trip | null> {
  const [row] = await getDb()
    .select()
    .from(trips)
    .where(eq(trips.id, id))
    .limit(1);
  return (row as Trip | undefined) ?? null;
}

export async function createTrip(input: TripCreate = {}): Promise<Trip> {
  const parsed = tripCreateSchema.parse(input);
  const chatId = generateId();
  const id = generateId();
  const db = getDb();
  await db.insert(chatSessions).values({ id: chatId });
  const [row] = await db
    .insert(trips)
    .values({
      id,
      chatSessionId: chatId,
      title: parsed.title ?? 'Untitled trip',
      destination: parsed.destination ?? null,
      startDate: parsed.startDate ?? null,
      endDate: parsed.endDate ?? null,
      budgetCents: parsed.budgetCents ?? null,
    })
    .returning();
  return row as Trip;
}

export async function updateTrip(
  id: string,
  patch: TripUpdate,
): Promise<Trip | null> {
  const validated = tripUpdateSchema.parse(patch);
  const [row] = await getDb()
    .update(trips)
    .set({ ...validated, updatedAt: new Date() })
    .where(eq(trips.id, id))
    .returning();
  return (row as Trip | undefined) ?? null;
}

export async function deleteTrip(id: string): Promise<boolean> {
  const [row] = await getDb()
    .delete(trips)
    .where(eq(trips.id, id))
    .returning({ id: trips.id });
  return !!row;
}

export function formatTripDateRange(
  startDate: string | null,
  endDate: string | null,
): string {
  if (!startDate && !endDate) return 'Dates TBD';
  if (startDate && endDate) return `${startDate} → ${endDate}`;
  return startDate ?? endDate ?? 'Dates TBD';
}

export function formatTripBudget(budgetCents: number | null): string | null {
  if (budgetCents === null || budgetCents === undefined) return null;
  const dollars = Math.round(budgetCents / 100);
  return `$${dollars.toLocaleString('en-US')}`;
}
