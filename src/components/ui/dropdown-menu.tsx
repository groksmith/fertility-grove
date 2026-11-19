"use client";
import { useEffect, useRef, useState } from "react";

export function Menu({
  trigger,
  items,
  align = "end",
  side = "bottom",
  label,
}: {
  trigger: (props: {
    onClick: () => void;
    "aria-expanded": boolean;
    "aria-haspopup": "menu";
  }) => React.ReactNode;
  items: (
    | { label: string; onSelect: () => void; danger?: boolean; icon?: React.ReactNode }
    | "divider"
    | null
    | false
  )[];
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
    // biome-ignore lint/a11y/noStaticElementInteractions: the wrapper only routes arrow keys between the menu's own focusable items; it is not itself interactive
    <div ref={box} className="relative" onKeyDown={onKeyDown}>
      {trigger({
        onClick: () => setOpen((v) => !v),
        "aria-expanded": open,
        "aria-haspopup": "menu",
      })}
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
