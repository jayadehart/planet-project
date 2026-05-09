import { notFound } from 'next/navigation';
import { chatExists, loadChat } from '@/lib/chat-store';
import { listTrips } from '@/lib/trips';
import { TripsSidebarHost } from '../../trips/trips-sidebar-host';
import { Chat } from './chat';

export const dynamic = 'force-dynamic';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await chatExists(id))) notFound();
  const [initialMessages, trips] = await Promise.all([
    loadChat(id),
    listTrips(),
  ]);
  const serializedTrips = trips.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));
  return (
    <div className="flex flex-1 min-h-0 bg-zinc-50 dark:bg-black">
      <TripsSidebarHost
        initialTrips={serializedTrips}
        activeChatSessionId={id}
      />
      <Chat id={id} initialMessages={initialMessages} />
    </div>
  );
}
