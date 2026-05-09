"use client";

import { useCallback, useState } from "react";
import { type TripView } from "./trip-card";
import { TripDetails, type TripDetailPatch } from "./trip-details";
import { TripsSidebar } from "./trips-sidebar";

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

export function TripsShell({ initialTrips }: { initialTrips: TripView[] }) {
  const [trips, setTrips] = useState<TripView[]>(initialTrips);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialTrips[0]?.id ?? null,
  );

  const selectedTrip = trips.find((t) => t.id === selectedId) ?? null;

  const handleUpdate = useCallback((updated: TripView) => {
    setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }, []);

  const handleSaveDetails = useCallback(
    async (id: string, patch: TripDetailPatch) => {
      const updated = await patchTrip(id, patch);
      handleUpdate(updated);
    },
    [handleUpdate],
  );

  return (
    <div className="flex flex-1 min-h-0 bg-zinc-50 dark:bg-black">
      <TripsSidebar
        trips={trips}
        activeTripId={selectedId}
        onSelectTrip={(trip) => setSelectedId(trip.id)}
        onUpdateTrip={handleUpdate}
        onDeleteTrip={handleDelete}
      />
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
