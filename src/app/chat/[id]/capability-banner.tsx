"use client";

import { useSyncExternalStore } from "react";

export const CAPABILITY_BANNER_STORAGE_KEY = "capability-banner-dismissed";
export const CAPABILITY_BANNER_MESSAGE =
  "This assistant helps with trip planning only.";

const DISMISS_CHANGE_EVENT = "capability-banner:dismiss-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(DISMISS_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(DISMISS_CHANGE_EVENT, callback);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(CAPABILITY_BANNER_STORAGE_KEY) === "true";
}

function getServerSnapshot() {
  return false;
}

export function CapabilityBanner() {
  const dismissed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    window.localStorage.setItem(CAPABILITY_BANNER_STORAGE_KEY, "true");
    window.dispatchEvent(new Event(DISMISS_CHANGE_EVENT));
  };

  return (
    <div
      role="status"
      className="w-full border-b border-amber-200 bg-amber-50 text-amber-900 text-sm dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
    >
      <div className="max-w-3xl mx-auto px-8 py-2 flex items-center justify-between gap-4">
        <span>{CAPABILITY_BANNER_MESSAGE}</span>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="text-amber-900/70 hover:text-amber-900 dark:text-amber-200/70 dark:hover:text-amber-200 px-2 leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}
