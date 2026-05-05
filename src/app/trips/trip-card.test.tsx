import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { TripCard, type TripView } from "./trip-card";

beforeEach(() => {
  cleanup();
});

const sampleTrip: TripView = {
  id: "trip_1",
  title: "Lisbon long weekend",
  destination: "Lisbon, Portugal",
  startDate: "2026-06-12",
  endDate: "2026-06-15",
  budgetCents: 180000,
  status: "planning",
  isFavorite: false,
  chatSessionId: "chat_1",
  createdAt: new Date("2026-05-01").toISOString(),
  updatedAt: new Date("2026-05-02").toISOString(),
};

function renderCard(overrides: Partial<TripView> = {}, selected = false) {
  const onRename = vi.fn().mockResolvedValue(undefined);
  const onToggleFavorite = vi.fn().mockResolvedValue(undefined);
  const onDelete = vi.fn().mockResolvedValue(undefined);
  const onSelect = vi.fn();
  render(
    <TripCard
      trip={{ ...sampleTrip, ...overrides }}
      selected={selected}
      onSelect={onSelect}
      actions={{ onRename, onToggleFavorite, onDelete }}
    />,
  );
  return { onRename, onToggleFavorite, onDelete, onSelect };
}

describe("TripCard", () => {
  it("renders the trip metadata", () => {
    renderCard();
    expect(screen.getByText("Lisbon long weekend")).toBeInTheDocument();
    expect(screen.getByText("Lisbon, Portugal")).toBeInTheDocument();
    expect(screen.getByText("2026-06-12 → 2026-06-15")).toBeInTheDocument();
    expect(screen.getByText("$1,800")).toBeInTheDocument();
    expect(screen.getByText("planning")).toBeInTheDocument();
  });

  it("links the resume action to the trip's chat session", () => {
    renderCard();
    const link = screen.getByRole("link", { name: /resume chat/i });
    expect(link).toHaveAttribute("href", "/chat/chat_1");
  });

  it("toggles favorite via the action callback", async () => {
    const { onToggleFavorite } = renderCard();
    fireEvent.click(screen.getByRole("button", { name: /favorite trip/i }));
    await waitFor(() =>
      expect(onToggleFavorite).toHaveBeenCalledWith("trip_1", true),
    );
  });

  it("renames the trip after submitting the inline editor", async () => {
    const { onRename } = renderCard();
    fireEvent.click(screen.getByRole("button", { name: /rename/i }));
    const input = screen.getByLabelText("Trip title") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Lisbon escape" } });
    fireEvent.submit(input.closest("form")!);
    await waitFor(() =>
      expect(onRename).toHaveBeenCalledWith("trip_1", "Lisbon escape"),
    );
  });

  it("does not rename when the new title is unchanged or blank", async () => {
    const { onRename } = renderCard();
    fireEvent.click(screen.getByRole("button", { name: /rename/i }));
    const input = screen.getByLabelText("Trip title") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.submit(input.closest("form")!);
    await waitFor(() =>
      expect(screen.queryByLabelText("Trip title")).not.toBeInTheDocument(),
    );
    expect(onRename).not.toHaveBeenCalled();
  });

  it("confirms before deleting and skips when the user cancels", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { onDelete } = renderCard();
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("calls onDelete when the user confirms", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { onDelete } = renderCard();
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith("trip_1"));
    confirmSpy.mockRestore();
  });

  it("calls onSelect when the card body is clicked", () => {
    const { onSelect } = renderCard();
    fireEvent.click(screen.getByTestId("trip-card-trip_1"));
    expect(onSelect).toHaveBeenCalled();
  });

  it("falls back to placeholder text when destination is missing", () => {
    renderCard({ destination: null });
    expect(screen.getByText("Destination TBD")).toBeInTheDocument();
  });
});
