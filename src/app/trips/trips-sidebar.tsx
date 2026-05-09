"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { filterTripsByQuery } from "@/lib/trips";
import { TripCard, type TripView } from "./trip-card";

const SIDEBAR_COLLAPSED_KEY = "trips-sidebar-collapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

async function patchTrip(
  id: string,
  patch: Record<string, unknown>,
): Promise<TripView> {
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

export type TripsSidebarProps = {
  trips: TripView[];
  activeTripId?: string | null;
  activeChatSessionId?: string | null;
  onSelectTrip?: (trip: TripView) => void;
  onUpdateTrip: (trip: TripView) => void;
  onDeleteTrip: (id: string) => void;
};

export function TripsSidebar({
  trips,
  activeTripId = null,
  activeChatSessionId = null,
  onSelectTrip,
  onUpdateTrip,
  onDeleteTrip,
}: TripsSidebarProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsed);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const handleRename = useCallback(
    async (id: string, title: string) => {
      const updated = await patchTrip(id, { title });
      onUpdateTrip(updated);
    },
    [onUpdateTrip],
  );

  const handleToggleFavorite = useCallback(
    async (id: string, isFavorite: boolean) => {
      const updated = await patchTrip(id, { isFavorite });
      onUpdateTrip(updated);
    },
    [onUpdateTrip],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to delete trip");
      }
      onDeleteTrip(id);
    },
    [onDeleteTrip],
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

  const visibleTrips = useMemo(
    () => filterTripsByQuery(sortedTrips, query),
    [sortedTrips, query],
  );

  const isSelected = useCallback(
    (trip: TripView) => {
      if (activeTripId && trip.id === activeTripId) return true;
      if (activeChatSessionId && trip.chatSessionId === activeChatSessionId)
        return true;
      return false;
    },
    [activeTripId, activeChatSessionId],
  );

  const handleSelect = useCallback(
    (trip: TripView) => {
      if (onSelectTrip) {
        onSelectTrip(trip);
      } else {
        router.push(`/chat/${trip.chatSessionId}`);
      }
    },
    [onSelectTrip, router],
  );

  const trimmedQuery = query.trim();

  return (
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
          <a
            href="/trips"
            className="text-sm font-semibold tracking-tight hover:underline"
          >
            Trips
          </a>
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
        <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleNewTrip}
            disabled={creating}
            className="w-full rounded-md bg-blue-600 text-white px-3 py-1.5 text-sm font-medium disabled:opacity-60"
          >
            {creating ? "Creating…" : "+ New trip"}
          </button>
          <label className="flex flex-col gap-1">
            <span className="sr-only">Search trips</span>
            <input
              type="search"
              aria-label="Search trips"
              placeholder="Search by destination or keyword"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
          </label>
        </div>
      )}
      {!collapsed && (
        <div
          data-testid="trips-sidebar-list"
          className="flex-1 overflow-y-auto p-3 flex flex-col gap-2"
        >
          {sortedTrips.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No saved trips yet. Start a new chat to create one.
            </p>
          ) : visibleTrips.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No trips match &ldquo;{trimmedQuery}&rdquo;.
            </p>
          ) : (
            visibleTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                selected={isSelected(trip)}
                onSelect={() => handleSelect(trip)}
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
  );
}
