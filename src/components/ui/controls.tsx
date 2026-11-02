"use client";

/* Buttons and form controls. One button shape (a pill) everywhere; every field
   has a visible label and its hint or error tied to it with aria-describedby. */

import Link from "next/link";
import { Check, Eye, EyeOff } from "lucide-react";
import { createContext, forwardRef, useContext, useId, useState } from "react";

type Variant = "primary" | "secondary" | "quiet" | "ghost" | "danger" | "light";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-black",
  secondary: "bg-panel text-ink border border-line-strong hover:border-ink",
  quiet: "bg-raised text-ink hover:bg-line",
  ghost: "bg-transparent text-ink hover:bg-raised",
  danger: "bg-danger text-white hover:brightness-110",
  light: "bg-white text-ink hover:bg-[var(--tint-green)]",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3.5 text-[14px] gap-1.5",
  md: "h-11 px-5 text-[15px] gap-2",
  lg: "h-13 px-7 text-[16px] gap-2",
};

const btn = (v: Variant, s: Size, extra = "") =>
  `press inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap select-none disabled:cursor-not-allowed disabled:opacity-45 ${VARIANT[v]} ${SIZE[s]} ${extra}`;

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button({ variant = "primary", size = "md", className = "", type = "button", ...rest }, ref) {
  return <button ref={ref} type={type} className={btn(variant, size, className)} {...rest} />;
});

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: { href: string; variant?: Variant; size?: Size; className?: string; children: React.ReactNode } & Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
>) {
  return (
    <Link href={href} className={btn(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

export function IconButton({
  label,
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`press grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-raised hover:text-ink disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

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
  const describedBy = [hint ? hintId : "", error ? errId : ""].filter(Boolean).join(" ") || undefined;
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
          <p id={errId} className="mt-1.5 text-[13px] font-semibold leading-snug text-danger" role="alert">
            {error}
          </p>
        )}
      </div>
    </FieldCtx.Provider>
  );
}

export const inputBase =
  "w-full rounded-[10px] border bg-white px-3.5 text-[15px] text-ink placeholder:text-[var(--grey-600)] transition-[border-color,box-shadow] duration-150 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--site-line)]";

function fieldProps(ctx: ReturnType<typeof useField>, invalidProp?: boolean) {
  const invalid = invalidProp ?? ctx?.invalid;
  return {
    id: ctx?.id,
    "aria-describedby": ctx?.describedBy,
    "aria-invalid": invalid || undefined,
    border: invalid ? "border-danger" : "border-line-strong",
  };
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = "", ...rest },
  ref,
) {
  const { border, ...a } = fieldProps(useField());
  // Emails are never spell-checked or auto-capitalised.
  const email = rest.type === "email" ? { spellCheck: false, autoCapitalize: "none" } : {};
  return <input ref={ref} className={`${inputBase} h-11 ${border} ${className}`} {...a} {...email} {...rest} />;
});

export function Textarea({
  className = "",
  max,
  hardStop,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { max?: number; hardStop?: boolean }) {
  const { border, ...a } = fieldProps(useField());
  return (
    <textarea
      className={`${inputBase} min-h-28 resize-y py-3 leading-relaxed ${border} ${className}`}
      maxLength={hardStop ? max : undefined}
      {...a}
      {...rest}
    />
  );
}

/** "123 / 1,000": turns red past the limit when typing isn't hard-stopped. */
export function Counter({ value, max }: { value: string; max: number }) {
  const n = value.length;
  return (
    <span className={`tabular text-[13px] ${n > max ? "font-semibold text-danger" : "text-muted"}`} aria-live="polite">
      {n.toLocaleString()} / {max.toLocaleString()}
    </span>
  );
}

const CHEVRON =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235c625f' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export function Select({ className = "", style, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { border, ...a } = fieldProps(useField());
  return (
    <select
      className={`${inputBase} h-11 appearance-none pr-10 ${border} ${className}`}
      style={{ backgroundImage: CHEVRON, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", ...style }}
      {...a}
      {...rest}
    />
  );
}

export function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-12" />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute inset-y-0 right-1 my-auto grid h-9 w-10 place-items-center rounded-full text-muted hover:text-ink"
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

/* ----------------------------------------------------------------- Toggles */

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
          <label htmlFor={tid} className={`block text-[15px] font-semibold ${disabled ? "text-muted" : "cursor-pointer text-ink"}`}>
            {label}
          </label>
          {description && <p className="mt-0.5 text-[14px] leading-snug text-muted">{description}</p>}
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
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug text-ink">
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
          <Check size={14} strokeWidth={3} className="pointer-events-none relative text-white opacity-0 peer-checked:opacity-100" />
        </span>
        <span>{children}</span>
      </label>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 pl-8 text-[13px] font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- Choices */

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
  const cols = columns === 1 ? "" : columns === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <fieldset aria-describedby={[hint ? `${id}-h` : "", error ? `${id}-e` : ""].filter(Boolean).join(" ") || undefined}>
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
                on ? "border-accent bg-raised text-ink ring-1 ring-accent" : "border-line-strong bg-white text-ink hover:border-ink"
              }`}
            >
              <input
                type={multi ? "checkbox" : "radio"}
                name={id}
                checked={on}
                onChange={() => onChange(multi ? (on ? value.filter((x) => x !== o) : [...value, o]) : [o])}
                className="sr-only"
              />
              <span
                aria-hidden
                className={`grid h-5 w-5 shrink-0 place-items-center border-2 ${multi ? "rounded-[5px]" : "rounded-full"} ${
                  on ? "border-accent bg-accent" : "border-[var(--grey-300)]"
                }`}
              >
                {on && (multi ? <Check size={13} strokeWidth={3} className="text-white" /> : <span className="h-2 w-2 rounded-full bg-white" />)}
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

/** Small toggleable chips, e.g. topic tags and filters. */
export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  max,
  label,
  labelOf = (v) => v,
}: {
  options: readonly T[];
  value: T[];
  onChange: (v: T[]) => void;
  max?: number;
  label: string;
  labelOf?: (v: T) => string;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o);
        const full = !on && max !== undefined && value.length >= max;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            disabled={full}
            onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
            className={`press h-9 rounded-full border px-3.5 text-[14px] font-medium ${
              on ? "border-accent bg-accent text-white" : "border-line-strong bg-white text-ink-soft hover:border-ink"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {labelOf(o)}
          </button>
        );
      })}
    </div>
  );
}

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
    <div role="tablist" aria-label={label} className="thin-scroll flex gap-6 overflow-x-auto border-b border-line">
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
              <span className="tabular rounded-full bg-accent px-1.5 text-[12px] leading-5 text-white">{t.count}</span>
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

/** A small segmented control for sort and view switches. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-raised p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
          className={`press h-8 rounded-full px-3 text-[13px] font-semibold ${
            o.id === value ? "bg-accent text-white" : "text-ink-soft hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
