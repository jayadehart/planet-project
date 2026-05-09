"use client";

import { useCallback, useState } from "react";
import { TripsSidebar } from "./trips-sidebar";
import type { TripView } from "./trip-card";

export function TripsSidebarHost({
  initialTrips,
  activeChatSessionId,
}: {
  initialTrips: TripView[];
  activeChatSessionId?: string;
}) {
  const [trips, setTrips] = useState<TripView[]>(initialTrips);

  const handleUpdate = useCallback((updated: TripView) => {
    setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <TripsSidebar
      trips={trips}
      activeChatSessionId={activeChatSessionId ?? null}
      onUpdateTrip={handleUpdate}
      onDeleteTrip={handleDelete}
    />
  );
}
