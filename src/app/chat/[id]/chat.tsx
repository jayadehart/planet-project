'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useState } from 'react';

export function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: UIMessage[];
}) {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { messages, chatId: id },
      }),
    }),
  });

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-16 px-8">
        <div className="flex-1 flex flex-col gap-3 mb-24">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 whitespace-pre-wrap ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-bl-sm'
                  }`}
                >
                  {m.parts.map((part, i) =>
                    part.type === 'text' ? <span key={i}>{part.text}</span> : null,
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim()) return;
            sendMessage({ text: input });
            setInput('');
          }}
          className="fixed bottom-8 left-0 right-0 flex justify-center px-8"
        >
          <input
            className="w-full max-w-3xl p-3 border border-zinc-300 dark:border-zinc-800 rounded-lg shadow-sm dark:bg-zinc-900"
            value={input}
            placeholder="Say something..."
            onChange={(e) => setInput(e.target.value)}
          />
        </form>
      </main>
    </div>
  );
}
