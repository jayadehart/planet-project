import { describe, it, expect, vi, beforeEach } from "vitest";

const createChatMock = vi.fn();
const redirectMock = vi.fn((url: string) => {
  throw new Error(`__REDIRECT__:${url}`);
});

vi.mock("@/lib/chat-store", () => ({
  createChat: () => createChatMock(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

import { startNewChat } from "./actions";

beforeEach(() => {
  createChatMock.mockReset();
  redirectMock.mockClear();
  redirectMock.mockImplementation((url: string) => {
    throw new Error(`__REDIRECT__:${url}`);
  });
});

describe("startNewChat", () => {
  it("creates a new chat session and redirects to the new chat route", async () => {
    createChatMock.mockResolvedValueOnce("new-chat-id");

    await expect(startNewChat()).rejects.toThrow("__REDIRECT__:/chat/new-chat-id");

    expect(createChatMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/chat/new-chat-id");
  });

  it("does not redirect when chat creation fails", async () => {
    createChatMock.mockRejectedValueOnce(new Error("db down"));

    await expect(startNewChat()).rejects.toThrow("db down");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
