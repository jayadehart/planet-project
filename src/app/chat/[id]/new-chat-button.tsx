"use client";

import { useFormStatus } from "react-dom";
import { startNewChat } from "./actions";

export const NEW_CHAT_BUTTON_LABEL = "New Trip";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <span aria-hidden="true">+</span>
      <span>{NEW_CHAT_BUTTON_LABEL}</span>
    </button>
  );
}

export function NewChatButton() {
  return (
    <form action={startNewChat}>
      <SubmitButton />
    </form>
  );
}
