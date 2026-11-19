"use client";

/* A dialog is a centred card on desktop and a bottom sheet on a phone; it traps focus, closes on
   Escape and restores focus to whatever opened it. */

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useMounted } from "@/hooks/useMounted";

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
      const a = items[0];
      const z = items[items.length - 1];
      if (!a || !z) return;
      if (
        e.shiftKey &&
        (document.activeElement === a || document.activeElement === panel.current)
      ) {
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
      <div
        className="scrim absolute inset-0 bg-[rgba(3,30,15,0.32)]"
        onClick={onClose}
        aria-hidden
      />
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
        {description && (
          <div className="mt-2 text-[15px] leading-relaxed text-ink-soft">{description}</div>
        )}
        <div className="mt-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
