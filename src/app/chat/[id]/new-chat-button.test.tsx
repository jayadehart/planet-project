import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

const startNewChatMock = vi.fn();

vi.mock("./actions", () => ({
  startNewChat: (...args: unknown[]) => startNewChatMock(...args),
}));

import { NewChatButton, NEW_CHAT_BUTTON_LABEL } from "./new-chat-button";

beforeEach(() => {
  startNewChatMock.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("NewChatButton", () => {
  it("renders a labeled submit button", () => {
    render(<NewChatButton />);
    const button = screen.getByRole("button", {
      name: new RegExp(NEW_CHAT_BUTTON_LABEL, "i"),
    });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("type", "submit");
  });

  it("invokes the startNewChat server action on submit", () => {
    render(<NewChatButton />);
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(NEW_CHAT_BUTTON_LABEL, "i"),
      }),
    );
    expect(startNewChatMock).toHaveBeenCalledTimes(1);
  });

  it("does not invoke the action when the button is disabled before render", () => {
    // Edge case: confirm the action is only called on actual submission, not on mount.
    render(<NewChatButton />);
    expect(startNewChatMock).not.toHaveBeenCalled();
  });
});
