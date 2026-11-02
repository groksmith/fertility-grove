"use client";

/* Dialogs, menus and toasts. A dialog is a centred card on desktop and a
   bottom sheet on a phone; both trap focus, close on Escape and restore focus
   to whatever opened them. Menus scale from their trigger corner. */

import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useTrap(open: boolean, panel: React.RefObject<HTMLElement | null>, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current;
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const items = panel.current.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!items.length) return;
      const a = items[0];
      const z = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === a || document.activeElement === panel.current)) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prev;
      opener?.focus?.();
    };
  }, [open, onClose, panel]);
}

const noop = () => () => {};
const useMounted = () => useSyncExternalStore(noop, () => true, () => false);

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  width = 520,
  hideClose,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  width?: number;
  hideClose?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const mounted = useMounted();
  useTrap(open, panel, onClose);
  if (!open || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <div className="scrim absolute inset-0 bg-[rgba(3,30,15,0.32)]" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="dialog-panel relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[20px] bg-panel px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom))] outline-none shadow-[0_24px_64px_-16px_rgba(3,30,15,0.35)] sm:rounded-[20px] sm:p-7"
        style={{ maxWidth: width }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="serif text-[28px] leading-[1.1] text-ink">
            {title}
          </h2>
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="press -mt-1 -mr-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-raised hover:text-ink"
            >
              <X size={20} />
            </button>
          )}
        </div>
        {description && <div className="mt-2 text-[15px] leading-relaxed text-ink-soft">{description}</div>}
        <div className="mt-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------------- Menu */

export function Menu({
  trigger,
  items,
  align = "end",
  side = "bottom",
  label,
}: {
  trigger: (props: { onClick: () => void; "aria-expanded": boolean; "aria-haspopup": "menu" }) => React.ReactNode;
  items: ({ label: string; onSelect: () => void; danger?: boolean; icon?: React.ReactNode } | "divider" | null | false)[];
  align?: "start" | "end";
  /** "top" opens upward, for triggers at the bottom of the screen. */
  side?: "top" | "bottom";
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", key);
    box.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const els = Array.from(box.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const i = els.indexOf(document.activeElement as HTMLElement);
    els[(i + (e.key === "ArrowDown" ? 1 : -1) + els.length) % els.length]?.focus();
  };

  return (
    <div ref={box} className="relative" onKeyDown={onKeyDown}>
      {trigger({ onClick: () => setOpen((v) => !v), "aria-expanded": open, "aria-haspopup": "menu" })}
      {open && (
        <div
          role="menu"
          aria-label={label}
          className={`pop absolute z-50 min-w-52 rounded-[14px] bg-panel p-1.5 shadow-[0_12px_32px_-8px_rgba(3,30,15,0.28)] ring-1 ring-line ${
            side === "top" ? "bottom-full mb-1" : "top-full mt-1"
          } ${align === "end" ? (side === "top" ? "right-0 origin-bottom-right" : "right-0 origin-top-right") : side === "top" ? "left-0 origin-bottom-left" : "left-0 origin-top-left"}`}
        >
          {items.filter(Boolean).map((it, i) =>
            it === "divider" ? (
              <div key={i} className="my-1 h-px bg-line" />
            ) : (
              it && (
                <button
                  key={it.label}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    it.onSelect();
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2.5 text-left text-[14px] font-medium hover:bg-raised focus:bg-raised focus:outline-none ${
                    it.danger ? "text-danger" : "text-ink"
                  }`}
                >
                  {it.icon}
                  {it.label}
                </button>
              )
            ),
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Toast */

type ToastItem = { id: number; text: string; leaving?: boolean };
let toasts: ToastItem[] = [];
const toastListeners = new Set<() => void>();
let tid = 0;

export function toast(text: string) {
  const id = ++tid;
  toasts = [...toasts.slice(-2), { id, text }];
  toastListeners.forEach((l) => l());
  // Leave the way it came: slide back down, then unmount.
  window.setTimeout(() => {
    toasts = toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t));
    toastListeners.forEach((l) => l());
  }, 3400);
  window.setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    toastListeners.forEach((l) => l());
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
  const items = useSyncExternalStore(subToasts, () => toasts, () => EMPTY);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-6"
    >
      {items.map((t) => (
        <div key={t.id} data-leaving={t.leaving || undefined} className="rise toast rounded-full bg-accent px-5 py-3 text-[14px] font-semibold text-white shadow-[0_12px_28px_-10px_rgba(3,30,15,0.5)]">
          {t.text}
        </div>
      ))}
    </div>
  );
}

/** Copies text; falls back silently where the clipboard API is unavailable. */
export function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    try {
      void navigator.clipboard?.writeText(text);
    } catch {
      /* a failed copy still shows the confirmation in the prototype */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return [copied, copy];
}
