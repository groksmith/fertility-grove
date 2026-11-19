"use client";
import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ Toast */

type ToastItem = { id: number; text: string; leaving?: boolean };
let toasts: ToastItem[] = [];
const toastListeners = new Set<() => void>();
let tid = 0;

export function toast(text: string) {
  const id = ++tid;
  toasts = [...toasts.slice(-2), { id, text }];
  for (const l of toastListeners) l();
  // Leave the way it came: slide back down, then unmount.
  window.setTimeout(() => {
    toasts = toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t));
    for (const l of toastListeners) l();
  }, 3400);
  window.setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    for (const l of toastListeners) l();
  }, 3600);
}

const subToasts = (l: () => void) => {
  toastListeners.add(l);
  return () => {
    toastListeners.delete(l);
  };
};
const EMPTY: ToastItem[] = [];

export function Toaster() {
  const items = useSyncExternalStore(
    subToasts,
    () => toasts,
    () => EMPTY,
  );
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-6"
    >
      {items.map((t) => (
        <div
          key={t.id}
          data-leaving={t.leaving || undefined}
          className="rise toast rounded-full bg-accent px-5 py-3 text-[14px] font-semibold text-white shadow-[0_12px_28px_-10px_rgba(3,30,15,0.5)]"
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
