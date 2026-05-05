import { redirect } from 'next/navigation';
import { createTrip } from '@/lib/trips';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const trip = await createTrip();
  redirect(`/chat/${trip.chatSessionId}`);
}
