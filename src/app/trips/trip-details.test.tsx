import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { TripDetails } from "./trip-details";
import type { TripView } from "./trip-card";

beforeEach(() => {
  cleanup();
});

const trip: TripView = {
  id: "trip_a",
  title: "Kyoto autumn",
  destination: "Kyoto, Japan",
  startDate: "2026-11-10",
  endDate: "2026-11-17",
  budgetCents: 320000,
  status: "planning",
  isFavorite: false,
  chatSessionId: "chat_a",
  createdAt: new Date("2026-04-01").toISOString(),
  updatedAt: new Date("2026-04-02").toISOString(),
};

describe("TripDetails", () => {
  it("submits a normalized patch when the user changes a field", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TripDetails trip={trip} onSave={onSave} />);

    const destination = screen.getByLabelText("Destination") as HTMLInputElement;
    fireEvent.change(destination, { target: { value: "Osaka, Japan" } });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith("trip_a", {
      destination: "Osaka, Japan",
      startDate: "2026-11-10",
      endDate: "2026-11-17",
      budgetCents: 320000,
      status: "planning",
    });
  });

  it("rejects a negative budget without calling onSave", async () => {
    const onSave = vi.fn();
    render(<TripDetails trip={trip} onSave={onSave} />);

    const budget = screen.getByLabelText(/budget/i) as HTMLInputElement;
    fireEvent.change(budget, { target: { value: "-50" } });
    fireEvent.submit(screen.getByRole("form", { name: /edit trip details/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/non-negative/i);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("clears optional fields when the user blanks them", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<TripDetails trip={trip} onSave={onSave} />);

    const destination = screen.getByLabelText("Destination") as HTMLInputElement;
    fireEvent.change(destination, { target: { value: "  " } });
    const budget = screen.getByLabelText(/budget/i) as HTMLInputElement;
    fireEvent.change(budget, { target: { value: "" } });

    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const [, patch] = onSave.mock.calls[0];
    expect(patch.destination).toBeNull();
    expect(patch.budgetCents).toBeNull();
  });
});
