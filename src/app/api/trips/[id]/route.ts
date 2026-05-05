import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { deleteTrip, getTrip, tripUpdateSchema, updateTrip } from '@/lib/trips';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const trip = await getTrip(id);
  if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ trip });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const patch = tripUpdateSchema.parse(body);
    const trip = await updateTrip(id, patch);
    if (!trip) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ trip });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid trip patch', issues: err.issues },
        { status: 400 },
      );
    }
    throw err;
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const ok = await deleteTrip(id);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
