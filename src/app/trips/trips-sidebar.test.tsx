import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { TripsSidebar } from "./trips-sidebar";
import type { TripView } from "./trip-card";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const lisbon: TripView = {
  id: "trip_lisbon",
  title: "Lisbon long weekend",
  destination: "Lisbon, Portugal",
  startDate: "2026-06-12",
  endDate: "2026-06-15",
  budgetCents: 180000,
  status: "planning",
  isFavorite: false,
  chatSessionId: "chat_lisbon",
  createdAt: new Date("2026-05-01").toISOString(),
  updatedAt: new Date("2026-05-02").toISOString(),
};

const kyoto: TripView = {
  id: "trip_kyoto",
  title: "Kyoto autumn",
  destination: "Kyoto, Japan",
  startDate: "2026-11-10",
  endDate: "2026-11-17",
  budgetCents: 320000,
  status: "booked",
  isFavorite: false,
  chatSessionId: "chat_kyoto",
  createdAt: new Date("2026-04-01").toISOString(),
  updatedAt: new Date("2026-04-15").toISOString(),
};

const fetchMock = vi.fn();

function renderSidebar(
  overrides: Partial<React.ComponentProps<typeof TripsSidebar>> = {},
) {
  const onUpdateTrip = vi.fn();
  const onDeleteTrip = vi.fn();
  const props = {
    trips: [lisbon, kyoto],
    onUpdateTrip,
    onDeleteTrip,
    ...overrides,
  };
  render(<TripsSidebar {...props} />);
  return { onUpdateTrip, onDeleteTrip };
}

beforeEach(() => {
  cleanup();
  pushMock.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TripsSidebar", () => {
  it("renders all trips initially", () => {
    renderSidebar();
    expect(screen.getByText("Lisbon long weekend")).toBeInTheDocument();
    expect(screen.getByText("Kyoto autumn")).toBeInTheDocument();
  });

  it("filters trips by destination as the user types", () => {
    renderSidebar();
    const search = screen.getByLabelText("Search trips") as HTMLInputElement;

    fireEvent.change(search, { target: { value: "lisbon" } });
    expect(screen.getByText("Lisbon long weekend")).toBeInTheDocument();
    expect(screen.queryByText("Kyoto autumn")).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "japan" } });
    expect(screen.queryByText("Lisbon long weekend")).not.toBeInTheDocument();
    expect(screen.getByText("Kyoto autumn")).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches the search", () => {
    renderSidebar();
    fireEvent.change(screen.getByLabelText("Search trips"), {
      target: { value: "antarctica" },
    });
    expect(screen.getByText(/no trips match/i)).toBeInTheDocument();
  });

  it("shows the empty-list message when there are no trips", () => {
    renderSidebar({ trips: [] });
    expect(screen.getByText(/no saved trips yet/i)).toBeInTheDocument();
  });

  it("invokes onSelectTrip when a card is clicked instead of navigating", () => {
    const onSelectTrip = vi.fn();
    renderSidebar({ onSelectTrip });
    fireEvent.click(screen.getByTestId("trip-card-trip_lisbon"));
    expect(onSelectTrip).toHaveBeenCalledWith(lisbon);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("navigates to the trip's chat when no onSelectTrip is provided", () => {
    renderSidebar();
    fireEvent.click(screen.getByTestId("trip-card-trip_kyoto"));
    expect(pushMock).toHaveBeenCalledWith("/chat/chat_kyoto");
  });

  it("highlights the trip whose chat session matches activeChatSessionId", () => {
    renderSidebar({ activeChatSessionId: "chat_kyoto" });
    const kyotoCard = screen.getByTestId("trip-card-trip_kyoto");
    const lisbonCard = screen.getByTestId("trip-card-trip_lisbon");
    expect(kyotoCard.className).toMatch(/border-blue-/);
    expect(lisbonCard.className).not.toMatch(/border-blue-/);
  });

  it("calls onDeleteTrip after a successful delete request", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const { onDeleteTrip } = renderSidebar();

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => expect(onDeleteTrip).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/trips\//),
      expect.objectContaining({ method: "DELETE" }),
    );

    confirmSpy.mockRestore();
  });

  it("collapses and expands the sidebar via the toggle button", () => {
    renderSidebar({ trips: [lisbon] });
    const sidebar = screen.getByTestId("trips-sidebar");
    expect(sidebar.dataset.collapsed).toBe("false");

    fireEvent.click(
      screen.getByRole("button", { name: /collapse trips sidebar/i }),
    );
    expect(sidebar.dataset.collapsed).toBe("true");
    expect(screen.queryByLabelText("Search trips")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /expand trips sidebar/i }),
    );
    expect(sidebar.dataset.collapsed).toBe("false");
  });
});
