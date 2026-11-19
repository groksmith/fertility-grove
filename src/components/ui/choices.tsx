"use client";

import { Check } from "lucide-react";
import { useId } from "react";

/** Big tappable options for onboarding and settings: single or multi select. */
export function Choices<T extends string>({
  options,
  value,
  onChange,
  multi,
  legend,
  error,
  columns = 2,
  hint,
}: {
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
  multi?: boolean;
  legend: string;
  error?: string;
  columns?: 1 | 2 | 3;
  hint?: string;
}) {
  const id = useId();
  const cols =
    columns === 1 ? "" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <fieldset
      aria-describedby={
        [hint ? `${id}-h` : "", error ? `${id}-e` : ""].filter(Boolean).join(" ") || undefined
      }
    >
      <legend className="mb-2 text-[14px] font-semibold text-ink">
        {legend}
        {multi && <span className="font-normal text-muted"> · choose any</span>}
      </legend>
      {hint && (
        <p id={`${id}-h`} className="-mt-1 mb-3 text-[13px] text-muted">
          {hint}
        </p>
      )}
      <div className={`grid gap-2 ${cols}`}>
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <label
              key={o}
              className={`press flex min-h-12 cursor-pointer items-center gap-3 rounded-[10px] border px-3.5 py-2.5 text-[15px] leading-snug ${
                on
                  ? "border-accent bg-raised text-ink ring-1 ring-accent"
                  : "border-line-strong bg-white text-ink hover:border-ink"
              }`}
            >
              <input
                type={multi ? "checkbox" : "radio"}
                name={id}
                checked={on}
                onChange={() =>
                  onChange(multi ? (on ? value.filter((x) => x !== o) : [...value, o]) : [o])
                }
                className="sr-only"
              />
              <span
                aria-hidden
                className={`grid h-5 w-5 shrink-0 place-items-center border-2 ${multi ? "rounded-[5px]" : "rounded-full"} ${
                  on ? "border-accent bg-accent" : "border-[var(--grey-300)]"
                }`}
              >
                {on &&
                  (multi ? (
                    <Check size={13} strokeWidth={3} className="text-white" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  ))}
              </span>
              {o}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${id}-e`} role="alert" className="mt-2 text-[13px] font-semibold text-danger">
          {error}
        </p>
      )}
    </fieldset>
  );
}
