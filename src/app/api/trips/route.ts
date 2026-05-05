import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createTrip, listTrips, tripCreateSchema } from '@/lib/trips';

export async function GET() {
  const trips = await listTrips();
  return NextResponse.json({ trips });
}

export async function POST(req: Request) {
  let body: unknown = {};
  try {
    const text = await req.text();
    body = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const parsed = tripCreateSchema.parse(body);
    const trip = await createTrip(parsed);
    return NextResponse.json({ trip }, { status: 201 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid trip payload', issues: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }
}
