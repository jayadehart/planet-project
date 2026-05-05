"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TripCard, type TripView } from "./trip-card";
import { TripDetails, type TripDetailPatch } from "./trip-details";

const SIDEBAR_COLLAPSED_KEY = "trips-sidebar-collapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

async function patchTrip(id: string, patch: Record<string, unknown>): Promise<TripView> {
  const res = await fetch(`/api/trips/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to update trip");
  }
  const body = (await res.json()) as { trip: TripView };
  return body.trip;
}

export function TripsShell({ initialTrips }: { initialTrips: TripView[] }) {
  const router = useRouter();
  const [trips, setTrips] = useState<TripView[]>(initialTrips);
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialTrips[0]?.id ?? null,
  );
  const [creating, setCreating] = useState(false);

  const selectedTrip = useMemo(
    () => trips.find((t) => t.id === selectedId) ?? null,
    [trips, selectedId],
  );

  const replaceTrip = useCallback((updated: TripView) => {
    setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const handleRename = useCallback(
    async (id: string, title: string) => {
      const updated = await patchTrip(id, { title });
      replaceTrip(updated);
    },
    [replaceTrip],
  );

  const handleToggleFavorite = useCallback(
    async (id: string, isFavorite: boolean) => {
      const updated = await patchTrip(id, { isFavorite });
      replaceTrip(updated);
    },
    [replaceTrip],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to delete trip");
      }
      setTrips((prev) => prev.filter((t) => t.id !== id));
      setSelectedId((current) => (current === id ? null : current));
    },
    [],
  );

  const handleSaveDetails = useCallback(
    async (id: string, patch: TripDetailPatch) => {
      const updated = await patchTrip(id, patch);
      replaceTrip(updated);
    },
    [replaceTrip],
  );

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      }
      return next;
    });
  };

  const handleNewTrip = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to create trip");
      const body = (await res.json()) as { trip: TripView };
      router.push(`/chat/${body.trip.chatSessionId}`);
    } finally {
      setCreating(false);
    }
  };

  const sortedTrips = useMemo(() => {
    return [...trips].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [trips]);

  return (
    <div className="flex flex-1 min-h-0 bg-zinc-50 dark:bg-black">
      <aside
        aria-label="Saved trips"
        data-testid="trips-sidebar"
        data-collapsed={collapsed}
        className={`flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-[width] ${
          collapsed ? "w-12" : "w-80"
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-zinc-200 dark:border-zinc-800">
          {!collapsed && (
            <h1 className="text-sm font-semibold tracking-tight">Trips</h1>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand trips sidebar" : "Collapse trips sidebar"}
            aria-expanded={!collapsed}
            className="ml-auto rounded p-1 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>
        {!collapsed && (
          <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleNewTrip}
              disabled={creating}
              className="w-full rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm font-medium disabled:opacity-60"
            >
              {creating ? "Creating…" : "+ New trip"}
            </button>
          </div>
        )}
        {!collapsed && (
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {sortedTrips.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No saved trips yet. Start a new chat to create one.
              </p>
            ) : (
              sortedTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  selected={selectedId === trip.id}
                  onSelect={() => setSelectedId(trip.id)}
                  actions={{
                    onRename: handleRename,
                    onToggleFavorite: handleToggleFavorite,
                    onDelete: handleDelete,
                  }}
                />
              ))
            )}
          </div>
        )}
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {selectedTrip ? (
          <TripDetails
            key={selectedTrip.id}
            trip={selectedTrip}
            onSave={handleSaveDetails}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500 dark:text-zinc-400">
            <p>Select a trip to see and edit its details.</p>
          </div>
        )}
      </main>
    </div>
  );
}
