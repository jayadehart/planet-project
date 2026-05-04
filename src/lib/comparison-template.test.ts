import { describe, it, expect } from "vitest";
import {
  TRIP_COMPARISON_TEMPLATE,
  detectsTripComparison,
} from "./comparison-template";

describe("detectsTripComparison", () => {
  it("returns true for explicit comparison phrasing", () => {
    expect(detectsTripComparison("Can you help me compare two trips?")).toBe(
      true,
    );
    expect(detectsTripComparison("Lisbon vs Porto for a long weekend")).toBe(
      true,
    );
    expect(detectsTripComparison("Tokyo versus Kyoto in November")).toBe(true);
    expect(detectsTripComparison("Which is better, Rome or Athens?")).toBe(
      true,
    );
    expect(
      detectsTripComparison("Which one should I pick: Madrid or Barcelona?"),
    ).toBe(true);
  });

  it("returns false for empty or unrelated input", () => {
    expect(detectsTripComparison("")).toBe(false);
    expect(detectsTripComparison("   ")).toBe(false);
    expect(detectsTripComparison("Plan me a 3-day trip to Paris")).toBe(false);
    // "or" alone shouldn't trigger — only explicit comparison signals.
    expect(detectsTripComparison("Should I bring a coat or not?")).toBe(false);
  });
});

describe("TRIP_COMPARISON_TEMPLATE", () => {
  it("contains placeholders for both trips and the standard fields", () => {
    expect(TRIP_COMPARISON_TEMPLATE).toContain("Trip A:");
    expect(TRIP_COMPARISON_TEMPLATE).toContain("Trip B:");
    expect(TRIP_COMPARISON_TEMPLATE).toContain("Destination:");
    expect(TRIP_COMPARISON_TEMPLATE).toContain("Dates:");
    expect(TRIP_COMPARISON_TEMPLATE).toContain("Budget:");
  });
});
