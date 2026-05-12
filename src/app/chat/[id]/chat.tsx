"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CapabilityBanner } from "./capability-banner";

export function Chat({
  id,
  initialMessages,
}: {
  id: string;
  initialMessages: UIMessage[];
}) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const creatingRef = useRef(false);
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

  const startNewChat = useCallback(async () => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreating(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        console.error("Failed to create new chat", res.status);
        return;
      }
      const body = (await res.json()) as { trip: { chatSessionId: string } };
      router.push(`/chat/${body.trip.chatSessionId}`);
    } catch (err) {
      console.error("Failed to create new chat", err);
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  }, [router]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "o"
      ) {
        e.preventDefault();
        void startNewChat();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [startNewChat]);

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur sticky top-0 z-10">
        <CapabilityBanner />
        <div className="max-w-3xl mx-auto px-8 py-4 flex items-baseline gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Trip Planner</h1>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            concrete plans, not vibes
          </span>
          <button
            type="button"
            onClick={() => void startNewChat()}
            disabled={creating}
            aria-label="New chat"
            title="New chat (⌘⇧O)"
            className="ml-auto inline-flex items-center gap-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-60"
          >
            {creating ? "Creating…" : "+ New chat"}
          </button>
          <a
            href="/trips"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Saved trips
          </a>
        </div>
      </header>
      <main className="flex flex-1 w-full max-w-3xl flex-col py-10 px-8">
        <div className="flex-1 flex flex-col gap-3 mb-24">
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
          <div className="w-full max-w-3xl flex items-stretch gap-2">
            <button
              type="button"
              onClick={() => void startNewChat()}
              disabled={creating}
              aria-label="Start new chat"
              title="Start new chat (⌘⇧O)"
              className="shrink-0 inline-flex items-center justify-center rounded-lg border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-lg font-medium text-zinc-700 dark:text-zinc-200 shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-60"
            >
              {creating ? "…" : "+"}
            </button>
            <input
              ref={inputRef}
              aria-label="Message"
              className="flex-1 p-3 border border-zinc-300 dark:border-zinc-800 rounded-lg shadow-sm bg-white dark:bg-zinc-900"
              value={input}
              placeholder="Where do you want to go?"
              onChange={(e) => setInput(e.target.value)}
            />
          </div>
        </form>
      </main>
    </div>
  );
}
