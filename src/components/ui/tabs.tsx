"use client";

/** Underline tabs: a 2px indicator as wide as the label. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { id: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="thin-scroll flex gap-6 overflow-x-auto border-b border-line"
    >
      {tabs.map((t) => {
        const on = t.id === value;
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(t.id)}
            className={`relative -mb-px flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 text-[15px] font-semibold transition-colors ${
              on ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="tabular rounded-full bg-accent px-1.5 text-[12px] leading-5 text-white">
                {t.count}
              </span>
            )}
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-ink transition-transform duration-200 ease-[var(--e-out)]"
              style={{ transform: on ? "scaleX(1)" : "scaleX(0)" }}
            />
          </button>
        );
      })}
    </div>
  );
}
