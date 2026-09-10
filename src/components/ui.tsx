"use client";

import Link from "next/link";
import { forwardRef, useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------- Logo */

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span className="serif text-[26px] leading-none tracking-tight text-ink">
        <span className="inline-block">f</span>
        <span className="inline-block -ml-[3px] translate-y-[3px]">g</span>
      </span>
      {!compact && (
        <span className="serif text-[17px] leading-none text-ink">
          fertilitygrove
        </span>
      )}
    </span>
  );
}

export function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <span
      className="inline-grid place-items-center rounded-full border border-ink/80"
      style={{ width: size, height: size }}
    >
      <span className="serif leading-none text-ink" style={{ fontSize: size * 0.42 }}>
        <span className="inline-block">f</span>
        <span className="inline-block -ml-[2px] translate-y-[2px]">g</span>
      </span>
    </span>
  );
}

/* ----------------------------------------------------------------- Avatar */

const AVATAR_COLORS = [
  ["#E0F6EB", "#0A7A3B"],
  ["#FFE7DE", "#C24A28"],
  ["#DFF3FF", "#326A97"],
  ["#F1E7F1", "#7546A4"],
  ["#FFFBE8", "#A8862A"],
  ["#FFE8F3", "#C94C88"],
];

export const AVATAR_PRESETS = AVATAR_COLORS;

export function Avatar({
  name,
  initials,
  size = 40,
  ring,
  status,
  preset,
}: {
  name?: string;
  initials?: string;
  size?: number;
  ring?: boolean;
  status?: "online" | "away" | "offline" | "busy" | "invisible";
  /** Index into the onboarding avatar set; overrides the initials chip. */
  preset?: number;
}) {
  const source = (name ?? "").trim();
  const label =
    initials ??
    (source.startsWith("@")
      ? source.replace(/^@/, "").slice(0, 2)
      : source
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0])
          .join(""));
  const idx =
    (label.toUpperCase().charCodeAt(0) + (label.toUpperCase().charCodeAt(1) || 0)) %
    AVATAR_COLORS.length;
  const usePreset = typeof preset === "number" && preset >= 0;
  const [bg, fg] = usePreset
    ? AVATAR_COLORS[preset % AVATAR_COLORS.length]
    : (AVATAR_COLORS[idx] ?? AVATAR_COLORS[0]);
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span
        className={`grid h-full w-full place-items-center rounded-full font-semibold uppercase ${
          ring ? "ring-2 ring-white" : ""
        }`}
        style={{ background: bg, color: fg, fontSize: size * 0.36 }}
      >
        {usePreset ? (
          <svg
            width={size * 0.62}
            height={size * 0.62}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            aria-hidden
          >
            <circle cx="12" cy="10" r="3.4" />
            <path d="M5.6 19.2a6.8 6.8 0 0 1 12.8 0" />
          </svg>
        ) : (
          label || "?"
        )}
      </span>
      {status && status !== "invisible" && (
        <span
          className="absolute bottom-0 right-0 block rounded-full border-2 border-white"
          style={{
            width: Math.max(8, size * 0.26),
            height: Math.max(8, size * 0.26),
            background:
              status === "online"
                ? "var(--fg-green-bright)"
                : status === "away"
                  ? "var(--fg-yellow)"
                  : status === "busy"
                    ? "#E0574F"
                    : "#C7C7C7",
          }}
        />
      )}
    </span>
  );
}

/* ----------------------------------------------------------------- Button */

type Variant =
  | "green"
  | "greenDark"
  | "coral"
  | "blue"
  | "yellow"
  | "purple"
  | "ghost"
  | "outline"
  | "quiet";

const VARIANTS: Record<Variant, string> = {
  green: "bg-green-bright text-ink hover:brightness-[0.96]",
  greenDark: "bg-green-dark text-white hover:brightness-110",
  coral: "bg-coral text-ink hover:brightness-[0.96]",
  blue: "bg-blue text-ink hover:brightness-[0.96]",
  yellow: "bg-yellow text-ink hover:brightness-[0.96]",
  purple: "bg-purple text-white hover:brightness-110",
  ghost: "bg-transparent text-ink hover:bg-black/[0.04]",
  outline: "bg-white text-ink border border-line-strong hover:bg-surface",
  quiet: "bg-surface text-ink hover:bg-line",
};

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "green", size = "md", className = "", ...rest },
  ref,
) {
  const sizes = {
    sm: "h-8 px-3 text-[13px] rounded-lg",
    md: "h-10 px-4 text-[14px] rounded-[10px]",
    lg: "h-12 px-6 text-[15px] rounded-xl",
  };
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${sizes[size]} ${className}`}
      {...rest}
    />
  );
});

export function LinkButton({
  href,
  variant = "green",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}) {
  const sizes = {
    sm: "h-8 px-3 text-[13px] rounded-lg",
    md: "h-10 px-4 text-[14px] rounded-[10px]",
    lg: "h-12 px-6 text-[15px] rounded-xl",
  };
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 font-medium transition ${VARIANTS[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------- Tag */

export function Tag({
  children,
  tone = "gray",
  outlined,
  className = "",
}: {
  children: React.ReactNode;
  tone?: "gray" | "green" | "coral" | "blue" | "yellow" | "purple" | "pink";
  outlined?: boolean;
  className?: string;
}) {
  const tones: Record<string, { bg: string; fg: string; bd: string }> = {
    gray: { bg: "#F1F1F1", fg: "#3D3D3D", bd: "#E2E2E2" },
    green: { bg: "#E0F6EB", fg: "#0A7A3B", bd: "#42C074" },
    coral: { bg: "#FFE7DE", fg: "#C24A28", bd: "#F48265" },
    blue: { bg: "#DFF3FF", fg: "#326A97", bd: "#85C5F9" },
    yellow: { bg: "#FFFBE8", fg: "#8A6D12", bd: "#FFD339" },
    purple: { bg: "#F1E7F1", fg: "#7546A4", bd: "#A874DB" },
    pink: { bg: "#FFE8F3", fg: "#C94C88", bd: "#F97AB3" },
  };
  const t = tones[tone];
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-[12.5px] font-medium ${className}`}
      style={{
        background: outlined ? "transparent" : t.bg,
        color: t.fg,
        border: `1px solid ${outlined ? t.bd : "transparent"}`,
      }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ Field */

export function Field({
  label,
  hint,
  error,
  children,
  required,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-[13.5px] font-medium text-ink-soft">
          {label}
          {required && <span className="text-coral"> *</span>}
        </span>
      )}
      {children}
      {hint && !error && (
        <span className="mt-1.5 block text-[12.5px] text-muted-light">{hint}</span>
      )}
      {error && (
        <span className="mt-1.5 block text-[12.5px] font-medium text-[#C0392B]">
          {error}
        </span>
      )}
    </label>
  );
}

export const inputClass =
  "w-full rounded-[10px] border border-line-strong bg-white px-3.5 py-2.5 text-[14.5px] text-ink placeholder:text-muted-light transition focus:border-green focus:outline-none";

/* Single-line fields are capped so they don't stretch across a wide column.
   Pass `!max-w-none` on the rare field that should fill its container. */
export const fieldWidth = "max-w-[330px]";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`${inputClass} ${fieldWidth} ${className}`} {...rest} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  const { className = "", ...rest } = props;
  return <textarea className={`${inputClass} resize-none ${className}`} {...rest} />;
}

const CHEVRON =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235C5C5C' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", style, ...rest } = props;
  return (
    <select
      className={`${inputClass} ${fieldWidth} appearance-none pr-10 ${className}`}
      style={{
        backgroundImage: CHEVRON,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        backgroundSize: "16px",
        ...style,
      }}
      {...rest}
    />
  );
}

/* ------------------------------------------------------------- Empty state */

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface/60 px-8 py-14 text-center">
      {icon && <div className="mb-4 text-muted-light">{icon}</div>}
      <h3 className="serif text-[22px] text-ink">{title}</h3>
      {body && (
        <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted">{body}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- Progress */

export function Progress({
  value,
  max,
  tone = "blue",
}: {
  value: number;
  max: number;
  tone?: "blue" | "green" | "coral";
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colors = { blue: "#529BD7", green: "#42C074", coral: "#F48265" };
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-line"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Amount raised"
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${pct}%`, background: colors[tone] }}
      />
    </div>
  );
}

/* --------------------------------------------------------------- Clipboard */

/** Copies text and flips a label for a moment. Falls back silently when the
 *  clipboard API is unavailable (http origins, older browsers). */
export function useCopy(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    try {
      void navigator.clipboard?.writeText(text);
    } catch {
      /* prototype: a failed copy still shows the confirmation */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return [copied, copy];
}

/** Marks a control that is intentionally inert in the prototype. */
export const notWired = {
  disabled: true,
  title: "Not wired up in this prototype",
} as const;

/* ------------------------------------------------------------------ Modal */

export function Modal({
  open,
  onClose,
  children,
  width = 520,
  labelledBy,
  label,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  labelledBy?: string;
  label?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);

  /* Escape to close, Tab kept inside the dialog, page scroll locked while open,
     and focus restored to whatever opened it. */
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4"
      onClick={onClose}
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        className="pop-in max-h-[88vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.25)] outline-none sm:p-8"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- Confetti */

const CONFETTI_COLORS = [
  "#42C074",
  "#F48265",
  "#85C5F9",
  "#FFD339",
  "#A874DB",
  "#F97AB3",
];

export function Confetti({ count = 46 }: { count?: number }) {
  const bits = Array.from({ length: count }, (_, i) => {
    const seed = (i * 9301 + 49297) % 233280;
    const rnd = seed / 233280;
    return {
      left: `${(i / count) * 100 + rnd * 4}%`,
      delay: `${rnd * 1.6}s`,
      duration: `${2.4 + rnd * 1.8}s`,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.round(rnd * 8),
      round: i % 3 === 0,
    };
  });
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden"
    >
      {bits.map((b, i) => (
        <span
          key={i}
          className="absolute top-0 block"
          style={{
            left: b.left,
            width: b.size,
            height: b.round ? b.size : b.size * 0.5,
            background: b.color,
            borderRadius: b.round ? "50%" : 2,
            animation: `fg-confetti-fall ${b.duration} linear ${b.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}
