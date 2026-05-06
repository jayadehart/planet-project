import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { Chat } from "./chat";

afterEach(() => {
  cleanup();
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
