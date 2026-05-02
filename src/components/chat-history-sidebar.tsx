import Link from 'next/link';
import { getAllChats } from '@/lib/chat-store';

export async function ChatHistorySidebar({
  currentChatId,
}: {
  currentChatId?: string;
}) {
  const chats = await getAllChats();

  return (
    <aside className="w-64 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
          Chat History
        </h2>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {chats.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 p-2">
            No chats yet
          </p>
        ) : (
          <ul className="space-y-1">
            {chats.map((chat) => (
              <li key={chat.id}>
                <Link
                  href={`/chat/${chat.id}`}
                  className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                    currentChatId === chat.id
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="font-medium truncate">
                    {chat.title || 'Untitled Chat'}
                  </div>
                  <div className="text-xs opacity-70 mt-0.5">
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
        <Link
          href="/"
          className="block w-full px-3 py-2 bg-blue-600 text-white rounded-md text-sm text-center hover:bg-blue-700 transition-colors"
        >
          New Chat
        </Link>
      </div>
    </aside>
  );
}
