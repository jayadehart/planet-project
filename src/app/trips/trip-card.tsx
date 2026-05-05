"use client";

import { useState } from "react";
import {
  formatTripBudget,
  formatTripDateRange,
  type Trip,
} from "@/lib/trips";

export type TripView = Omit<Trip, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export type TripCardActions = {
  onRename: (id: string, title: string) => Promise<void> | void;
  onToggleFavorite: (id: string, isFavorite: boolean) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
};

export function TripCard({
  trip,
  selected,
  actions,
  onSelect,
}: {
  trip: TripView;
  selected: boolean;
  actions: TripCardActions;
  onSelect: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState(trip.title);
  const [busy, setBusy] = useState(false);

  const startRename = () => {
    setTitleDraft(trip.title);
    setRenaming(true);
  };

  const submitRename = async () => {
    const next = titleDraft.trim();
    if (!next || next === trip.title) {
      setRenaming(false);
      return;
    }
    setBusy(true);
    try {
      await actions.onRename(trip.id, next);
      setRenaming(false);
    } finally {
      setBusy(false);
    }
  };

  const toggleFavorite = async () => {
    setBusy(true);
    try {
      await actions.onToggleFavorite(trip.id, !trip.isFavorite);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (typeof window !== "undefined") {
      const ok = window.confirm(`Delete "${trip.title}"? This cannot be undone.`);
      if (!ok) return;
    }
    setBusy(true);
    try {
      await actions.onDelete(trip.id);
    } finally {
      setBusy(false);
    }
  };

  const dateRange = formatTripDateRange(trip.startDate, trip.endDate);
  const budget = formatTripBudget(trip.budgetCents);

  return (
    <article
      data-testid={`trip-card-${trip.id}`}
      onClick={onSelect}
      className={`group cursor-pointer rounded-lg border px-3 py-2 transition ${
        selected
          ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/40"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/60"
      }`}
    >
      <header className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {renaming ? (
            <form
              onClick={(e) => e.stopPropagation()}
              onSubmit={(e) => {
                e.preventDefault();
                void submitRename();
              }}
            >
              <input
                aria-label="Trip title"
                autoFocus
                disabled={busy}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={() => void submitRename()}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setRenaming(false);
                  }
                }}
                className="w-full bg-transparent border-b border-zinc-400 dark:border-zinc-500 text-sm font-medium focus:outline-none"
              />
            </form>
          ) : (
            <h3 className="text-sm font-medium truncate">{trip.title}</h3>
          )}
          <p className="text-xs text-zinc-600 dark:text-zinc-400 truncate">
            {trip.destination ?? "Destination TBD"}
          </p>
        </div>
        <button
          type="button"
          aria-label={trip.isFavorite ? "Unfavorite trip" : "Favorite trip"}
          aria-pressed={trip.isFavorite}
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation();
            void toggleFavorite();
          }}
          className={`shrink-0 leading-none px-1 ${
            trip.isFavorite
              ? "text-amber-500"
              : "text-zinc-400 hover:text-amber-500"
          }`}
        >
          {trip.isFavorite ? "★" : "☆"}
        </button>
      </header>
      <dl className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="flex items-center gap-1">
          <dt className="sr-only">Dates</dt>
          <dd>{dateRange}</dd>
        </div>
        {budget ? (
          <div className="flex items-center gap-1">
            <dt className="sr-only">Budget</dt>
            <dd>{budget}</dd>
          </div>
        ) : null}
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${
            trip.status === "completed"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
              : trip.status === "booked"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200"
                : trip.status === "archived"
                  ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  : "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
          }`}
        >
          {trip.status}
        </span>
      </dl>
      <footer className="mt-2 flex items-center gap-2 text-xs">
        <a
          href={`/chat/${trip.chatSessionId}`}
          onClick={(e) => e.stopPropagation()}
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          Resume chat
        </a>
        <span aria-hidden className="text-zinc-300 dark:text-zinc-700">
          ·
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation();
            startRename();
          }}
          className="text-zinc-600 hover:underline dark:text-zinc-300"
        >
          Rename
        </button>
        <span aria-hidden className="text-zinc-300 dark:text-zinc-700">
          ·
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            e.stopPropagation();
            void handleDelete();
          }}
          className="text-red-600 hover:underline dark:text-red-400"
        >
          Delete
        </button>
      </footer>
    </article>
  );
}
