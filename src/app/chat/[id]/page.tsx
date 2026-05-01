import { notFound } from 'next/navigation';
import { chatExists, loadChat } from '@/lib/chat-store';
import { Chat } from './chat';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await chatExists(id))) notFound();
  const initialMessages = await loadChat(id);
  return <Chat id={id} initialMessages={initialMessages} />;
}
