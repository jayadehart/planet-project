import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  Greeting,
  GREETING_HISTORY_NOTE,
  GREETING_FEATURE_REQUEST_LABEL,
  FEATURE_REQUEST_URL,
} from "./greeting";

beforeEach(() => {
  cleanup();
});

describe("Greeting", () => {
  it("explains how to revisit a conversation since there is no history sidebar", () => {
    render(<Greeting />);
    expect(screen.getByText(GREETING_HISTORY_NOTE)).toBeInTheDocument();
  });

  it("links to the GitHub issue tracker for feature requests, opening in a new tab", () => {
    render(<Greeting />);
    const link = screen.getByRole("link", {
      name: GREETING_FEATURE_REQUEST_LABEL,
    });
    expect(link).toHaveAttribute("href", FEATURE_REQUEST_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel") ?? "").toMatch(/noopener/);
  });
});
