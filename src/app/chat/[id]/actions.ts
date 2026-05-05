"use server";

import { redirect } from "next/navigation";
import { createChat } from "@/lib/chat-store";

export async function startNewChat(): Promise<void> {
  const id = await createChat();
  redirect(`/chat/${id}`);
}
