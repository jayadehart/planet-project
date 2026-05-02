import { redirect } from 'next/navigation';
import { createChat } from '@/lib/chat-store';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const id = await createChat();
  redirect(`/chat/${id}`);
}
