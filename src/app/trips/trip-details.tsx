"use client";

import { useState } from "react";
import { TRIP_STATUSES, type TripStatus } from "@/db/schema";
import type { TripView } from "./trip-card";

export type TripDetailPatch = {
  destination?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  budgetCents?: number | null;
  status?: TripStatus;
};

export function TripDetails({
  trip,
  onSave,
}: {
  trip: TripView;
  onSave: (id: string, patch: TripDetailPatch) => Promise<void> | void;
}) {
  const [destination, setDestination] = useState(trip.destination ?? "");
  const [startDate, setStartDate] = useState(trip.startDate ?? "");
  const [endDate, setEndDate] = useState(trip.endDate ?? "");
  const [budgetDollars, setBudgetDollars] = useState(
    trip.budgetCents !== null && trip.budgetCents !== undefined
      ? String(Math.round(trip.budgetCents / 100))
      : "",
  );
  const [status, setStatus] = useState<TripStatus>(trip.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    let budgetCents: number | null = null;
    if (budgetDollars.trim()) {
      const parsed = Number(budgetDollars);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError("Budget must be a non-negative number.");
        return;
      }
      budgetCents = Math.round(parsed * 100);
    }
    setSaving(true);
    try {
      await onSave(trip.id, {
        destination: destination.trim() ? destination.trim() : null,
        startDate: startDate.trim() ? startDate.trim() : null,
        endDate: endDate.trim() ? endDate.trim() : null,
        budgetCents,
        status,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 max-w-xl"
      aria-label="Edit trip details"
    >
      <h2 className="text-xl font-semibold">{trip.title}</h2>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Destination</span>
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="e.g. Lisbon, Portugal"
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Start date</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">End date</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Budget (USD)</span>
        <input
          type="number"
          min={0}
          step={1}
          value={budgetDollars}
          onChange={(e) => setBudgetDollars(e.target.value)}
          placeholder="e.g. 2500"
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TripStatus)}
          className="rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
        >
          {TRIP_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <a
          href={`/chat/${trip.chatSessionId}`}
          className="rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium"
        >
          Resume chat
        </a>
      </div>
    </form>
  );
}
