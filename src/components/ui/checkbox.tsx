"use client";

import { Check } from "lucide-react";
import { useId } from "react";

export function Checkbox({
  checked,
  onChange,
  children,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  error?: string;
}) {
  const id = useId();
  return (
    <div>
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug text-ink"
      >
        <span className="relative mt-0.5 grid h-5 w-5 shrink-0 place-items-center">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            aria-describedby={error ? `${id}-err` : undefined}
            aria-invalid={!!error || undefined}
            className="peer absolute inset-0 cursor-pointer appearance-none rounded-[5px] border-2 border-[var(--grey-600)] checked:border-accent checked:bg-accent"
          />
          <Check
            size={14}
            strokeWidth={3}
            className="pointer-events-none relative text-white opacity-0 peer-checked:opacity-100"
          />
        </span>
        <span>{children}</span>
      </label>
      {error && (
        <p
          id={`${id}-err`}
          role="alert"
          className="mt-1.5 pl-8 text-[13px] font-semibold text-danger"
        >
          {error}
        </p>
      )}
    </div>
  );
}
