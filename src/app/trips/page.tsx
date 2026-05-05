import { listTrips } from '@/lib/trips';
import { TripsShell } from './trips-shell';

export const dynamic = 'force-dynamic';

export default async function TripsPage() {
  const trips = await listTrips();
  const serialized = trips.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));
  return <TripsShell initialTrips={serialized} />;
}
