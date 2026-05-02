import { ChatHistorySidebar } from '@/components/chat-history-sidebar';

export default async function ChatLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id?: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex h-screen">
      <ChatHistorySidebar currentChatId={id} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
