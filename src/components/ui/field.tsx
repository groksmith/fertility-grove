"use client";

/* A labelled field: every control has a visible label and its hint or error tied to it with
   aria-describedby. Input, Textarea and Select read the context to wire themselves up. */

import { createContext, useContext, useId } from "react";

/* ------------------------------------------------------------------ Fields */

const FieldCtx = createContext<{ id: string; describedBy?: string; invalid: boolean } | null>(null);
export const useField = () => useContext(FieldCtx);

export function Field({
  label,
  hint,
  error,
  optional,
  children,
  className = "",
  counter,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
  counter?: React.ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy =
    [hint ? hintId : "", error ? errId : ""].filter(Boolean).join(" ") || undefined;
  return (
    <FieldCtx.Provider value={{ id, describedBy, invalid: !!error }}>
      <div className={className}>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <label htmlFor={id} className="text-[14px] font-semibold text-ink">
            {label}
            {optional && <span className="font-normal text-muted"> (optional)</span>}
          </label>
          {counter}
        </div>
        {children}
        {hint && (
          <p id={hintId} className="mt-1.5 text-[13px] leading-snug text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={errId}
            className="mt-1.5 text-[13px] font-semibold leading-snug text-danger"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </FieldCtx.Provider>
  );
}

/* Focus is one 2px border: the 1px border turns ink and an inset 1px ring
   doubles it, so the field doesn't shift. The global outline is off for
   .field-input (globals.css). */
export const inputBase =
  "field-input w-full rounded-[10px] border bg-white px-3.5 text-[15px] text-ink placeholder:text-[var(--grey-600)] transition-[border-color,box-shadow] duration-150 focus:border-accent focus:shadow-[inset_0_0_0_1px_var(--color-accent)]";

export function fieldProps(ctx: ReturnType<typeof useField>, invalidProp?: boolean) {
  const invalid = invalidProp ?? ctx?.invalid;
  return {
    id: ctx?.id,
    "aria-describedby": ctx?.describedBy,
    "aria-invalid": invalid || undefined,
    border: invalid ? "border-danger" : "border-line-strong",
  };
}

/** "123 / 1,000": turns red past the limit when typing isn't hard-stopped. */
export function Counter({ value, max }: { value: string; max: number }) {
  const n = value.length;
  return (
    <span
      className={`tabular text-[13px] ${n > max ? "font-semibold text-danger" : "text-muted"}`}
      aria-live="polite"
    >
      {n.toLocaleString()} / {max.toLocaleString()}
    </span>
  );
}
