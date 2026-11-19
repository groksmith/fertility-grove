"use client";
import { useId } from "react";

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
  error,
  id,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  error?: string;
  id?: string;
}) {
  const auto = useId();
  const tid = id ?? auto;
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <label
            htmlFor={tid}
            className={`block text-[15px] font-semibold ${disabled ? "text-muted" : "cursor-pointer text-ink"}`}
          >
            {label}
          </label>
          {description && (
            <p className="mt-0.5 text-[14px] leading-snug text-muted">{description}</p>
          )}
        </div>
        <button
          id={tid}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          aria-describedby={error ? `${tid}-err` : undefined}
          onClick={() => onChange(!checked)}
          className={`press relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors duration-200 before:absolute before:-inset-x-1 before:-inset-y-2 before:content-[''] ${
            checked ? "bg-accent" : "bg-[var(--grey-300)]"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <span
            className="absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform duration-200 ease-[var(--e-out)]"
            style={{ transform: checked ? "translateX(20px)" : "none" }}
          />
        </button>
      </div>
      {error && (
        <p id={`${tid}-err`} role="alert" className="mt-1.5 text-[13px] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
