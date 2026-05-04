"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useState } from "react";
import { CapabilityBanner } from "./capability-banner";
import { Greeting } from "./greeting";

export function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: UIMessage[];
}) {
  const [input, setInput] = useState("");
  const { messages, sendMessage } = useChat({
    id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest: ({ messages }) => ({
        body: { messages, chatId: id },
      }),
    }),
  });

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur sticky top-0 z-10">
        <CapabilityBanner />
        <div className="max-w-3xl mx-auto px-8 py-4 flex items-baseline gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Trip Planner</h1>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            concrete plans, not vibes
          </span>
        </div>
      </header>
      <main className="flex flex-1 w-full max-w-3xl flex-col py-10 px-8">
        <div className="flex-1 flex flex-col gap-3 mb-24">
          {messages.length === 0 && <Greeting />}
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 whitespace-pre-wrap ${
                    isUser
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 rounded-bl-sm"
                  }`}
                >
                  {m.parts.map((part, i) =>
                    part.type === "text" ? (
                      <span key={i}>{part.text}</span>
                    ) : null,
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
            setInput("");
          }}
          className="fixed bottom-8 left-0 right-0 flex justify-center px-8"
        >
          <input
            className="w-full max-w-3xl p-3 border border-zinc-300 dark:border-zinc-800 rounded-lg shadow-sm bg-white dark:bg-zinc-900"
            value={input}
            placeholder="Where do you want to go?"
            onChange={(e) => setInput(e.target.value)}
          />
        </form>
      </main>
    </div>
  );
}
