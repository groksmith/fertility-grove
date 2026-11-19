"use client";

/* Buttons. One button shape (a pill) everywhere. */

import Link from "next/link";

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

/** React 19: `ref` is a prop (no forwardRef). */
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ref,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return <button ref={ref} type={type} className={btn(variant, size, className)} {...rest} />;
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
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
