import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import {
  CapabilityBanner,
  CAPABILITY_BANNER_MESSAGE,
  CAPABILITY_BANNER_STORAGE_KEY,
} from "./capability-banner";

beforeEach(() => {
  window.localStorage.clear();
  cleanup();
});

describe("CapabilityBanner", () => {
  it("renders the capability message by default", () => {
    render(<CapabilityBanner />);
    expect(screen.getByText(CAPABILITY_BANNER_MESSAGE)).toBeInTheDocument();
  });

  it("hides the banner and persists dismissal when the dismiss button is clicked", () => {
    render(<CapabilityBanner />);
    fireEvent.click(screen.getByRole("button", { name: /dismiss banner/i }));

    expect(
      screen.queryByText(CAPABILITY_BANNER_MESSAGE),
    ).not.toBeInTheDocument();
    expect(
      window.localStorage.getItem(CAPABILITY_BANNER_STORAGE_KEY),
    ).toBe("true");
  });

  it("stays hidden on remount when localStorage records a prior dismissal", () => {
    window.localStorage.setItem(CAPABILITY_BANNER_STORAGE_KEY, "true");
    render(<CapabilityBanner />);

    expect(
      screen.queryByText(CAPABILITY_BANNER_MESSAGE),
    ).not.toBeInTheDocument();
  });
});
