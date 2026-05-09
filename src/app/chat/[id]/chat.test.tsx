import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { Chat } from "./chat";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

beforeEach(() => {
  pushMock.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Chat keyboard shortcut", () => {
  it("focuses the message input when Cmd+K is pressed", () => {
    render(<Chat id="test-chat" initialMessages={[]} />);
    const input = screen.getByLabelText("Message");

    expect(input).not.toHaveFocus();

    fireEvent.keyDown(window, { key: "k", metaKey: true });

    expect(input).toHaveFocus();
  });

  it("focuses the message input when Ctrl+K is pressed", () => {
    render(<Chat id="test-chat" initialMessages={[]} />);
    const input = screen.getByLabelText("Message");

    expect(input).not.toHaveFocus();

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });

    expect(input).toHaveFocus();
  });

  it("does not focus the input on a plain 'k' keypress", () => {
    render(<Chat id="test-chat" initialMessages={[]} />);
    const input = screen.getByLabelText("Message");

    fireEvent.keyDown(window, { key: "k" });

    expect(input).not.toHaveFocus();
  });
});

describe("Chat new-chat button", () => {
  it("creates a new chat and navigates when the button is clicked", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ trip: { chatSessionId: "new-chat-id" } }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<Chat id="test-chat" initialMessages={[]} />);
    const button = screen.getByRole("button", { name: "New chat" });

    fireEvent.click(button);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/chat/new-chat-id");
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/trips",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("creates a new chat when Cmd+Shift+O is pressed", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ trip: { chatSessionId: "shortcut-chat-id" } }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<Chat id="test-chat" initialMessages={[]} />);

    fireEvent.keyDown(window, { key: "o", metaKey: true, shiftKey: true });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/chat/shortcut-chat-id");
    });
  });

  it("creates a new chat when Ctrl+Shift+O is pressed", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ trip: { chatSessionId: "ctrl-shortcut-id" } }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<Chat id="test-chat" initialMessages={[]} />);

    fireEvent.keyDown(window, { key: "O", ctrlKey: true, shiftKey: true });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/chat/ctrl-shortcut-id");
    });
  });

  it("does not create a new chat on plain Cmd+O (no shift)", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<Chat id="test-chat" initialMessages={[]} />);

    fireEvent.keyDown(window, { key: "o", metaKey: true });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("does not navigate when the new-chat request fails", async () => {
    const fetchMock = vi.fn(async () =>
      new Response("nope", { status: 500 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<Chat id="test-chat" initialMessages={[]} />);
    const button = screen.getByRole("button", { name: "New chat" });

    fireEvent.click(button);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });

    expect(pushMock).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
