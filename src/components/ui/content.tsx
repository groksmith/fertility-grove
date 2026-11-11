"use client";

/* Content pieces shared by posts, comments, stories and empty screens. */

import Link from "next/link";
import { ArrowBigDown, ArrowBigUp, MessageCircleHeart, Phone } from "lucide-react";
import { useState } from "react";
import { Spot, type SpotKind } from "@/components/art/Scenes";
import { act, useStore } from "@/lib/store";
import { CRISIS } from "@/lib/options";
import type { PostType, Source, Vote } from "@/lib/types";
import { Button } from "./controls";
import { Dialog } from "./overlay";

/** Panels: white, one large radius, separated from the ground by tone alone. */
export function Panel({
  children,
  className = "",
  as: As = "section",
  ...rest
}: { children: React.ReactNode; className?: string; as?: "section" | "div" | "article" | "aside" } & React.HTMLAttributes<HTMLElement>) {
  return (
    <As className={`rounded-[20px] border border-line bg-panel ${className}`} {...rest}>
      {children}
    </As>
  );
}

export function PageHeader({
  title,
  lede,
  actions,
  art,
}: {
  title: string;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  art?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 lg:mb-8">
      <div className="flex min-w-0 items-center gap-4">
        {art}
        <div className="min-w-0">
          <h1 className="serif text-[28px] leading-[1.1] text-ink lg:text-[32px]">{title}</h1>
          {lede && <p className="mt-2 max-w-[60ch] text-[15px] leading-relaxed text-ink-soft">{lede}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

const TYPE_TONE: Record<PostType, string> = {
  Question: "bg-blue-tint text-blue-ink",
  "Seeking input": "bg-yellow-tint text-yellow-ink",
  "Support needed": "bg-pink-tint text-ink-soft ring-1 ring-inset ring-pink",
  "Just venting": "bg-purple-tint text-purple-ink",
  "Just sharing": "bg-green-tint text-green-ink",
};

export function TypeChip({ type }: { type: PostType | string }) {
  const tone = TYPE_TONE[type as PostType] ?? "bg-pink-tint text-ink-soft ring-1 ring-inset ring-pink";
  return <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-semibold ${tone}`}>{type}</span>;
}

export function SourceLabel({ source, link }: { source?: Source; link?: string }) {
  if (!source) return null; // a source is optional on posts
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--grey-300)]" />
      {link ? (
        <a href={link} target="_blank" rel="noreferrer noopener" className="underline hover:text-ink">
          {source}
        </a>
      ) : (
        source
      )}
    </span>
  );
}

export function TagChip({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex h-6 items-center rounded-full bg-raised px-2.5 text-[12px] font-medium text-ink-soft">{children}</span>;
}

/** Up / score / down. Tapping the same arrow again removes the vote. */
export function VoteControl({
  up,
  down,
  my,
  onVote,
  allowDown,
  disabled,
  compact,
}: {
  up: number;
  down: number;
  my: Vote;
  onVote: (v: Vote) => void;
  allowDown: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const score = up - down;
  const sz = compact ? 18 : 20;
  return (
    <div className="inline-flex items-center rounded-full bg-raised" role="group" aria-label={`Score ${score}`}>
      <button
        type="button"
        aria-label="Upvote"
        aria-pressed={my === 1}
        disabled={disabled}
        onClick={() => onVote(1)}
        className={`press grid h-9 w-9 place-items-center rounded-full ${my === 1 ? "text-positive" : "text-muted hover:text-ink"} disabled:opacity-40`}
      >
        <ArrowBigUp size={sz} fill={my === 1 ? "currentColor" : "none"} />
      </button>
      <span className={`tabular min-w-6 text-center text-[14px] font-semibold ${my === 1 ? "text-positive" : my === -1 ? "text-coral-ink" : "text-ink"}`}>
        {score}
      </span>
      {allowDown ? (
        <button
          type="button"
          aria-label="Downvote"
          aria-pressed={my === -1}
          disabled={disabled}
          onClick={() => onVote(-1)}
          className={`press grid h-9 w-9 place-items-center rounded-full ${my === -1 ? "text-coral-ink" : "text-muted hover:text-ink"} disabled:opacity-40`}
        >
          <ArrowBigDown size={sz} fill={my === -1 ? "currentColor" : "none"} />
        </button>
      ) : (
        <span className="w-3" />
      )}
    </div>
  );
}

export function EmptyState({
  art,
  title,
  body,
  action,
  compact,
}: {
  art: SpotKind;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center rounded-[20px] border border-line bg-panel text-center ${compact ? "px-6 py-8" : "px-6 py-12"}`}>
      <Spot kind={art} size={compact ? 120 : 168} />
      <h2 className="mt-4 text-[18px] font-semibold text-ink">{title}</h2>
      {body && <p className="mt-1.5 max-w-[46ch] text-[15px] leading-relaxed text-ink-soft">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Crisis resources: 988 as buttons and as plain text (PRD §19). */
export function CrisisCard({ intro, tone = "card" }: { intro?: string; tone?: "card" | "inline" }) {
  return (
    <div role="note" className={`rounded-[20px] ${tone === "card" ? "bg-accent p-5 text-white" : "border border-line bg-raised p-4 text-ink"}`}>
      <p className="text-[16px] font-semibold leading-snug">{intro ?? "You're not alone. Help is available right now."}</p>
      <p className={`mt-1 text-[14px] leading-relaxed ${tone === "card" ? "text-white/85" : "text-ink-soft"}`}>{CRISIS.line}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={CRISIS.call} className={`press inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-semibold ${tone === "card" ? "bg-white text-ink" : "bg-accent text-white"}`}>
          <Phone size={16} /> Call 988
        </a>
        <a href={CRISIS.text} className={`press inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-semibold ${tone === "card" ? "bg-white/15 text-white" : "bg-white text-ink"}`}>
          <MessageCircleHeart size={16} /> Text 988
        </a>
        <a href={CRISIS.chat} target="_blank" rel="noreferrer noopener" className={`press inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold ${tone === "card" ? "bg-white/15 text-white" : "bg-white text-ink"}`}>
          Chat online
        </a>
      </div>
      <p className={`mt-3 text-[13px] ${tone === "card" ? "text-white/80" : "text-muted"}`}>
        Phone and text: 988. In an emergency, call 911.
      </p>
    </div>
  );
}

/** Shown when an unconfirmed member tries something that needs a confirmed email. */
export function UnconfirmedDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const email = useStore((s) => s.me.email);
  const [sent, setSent] = useState(false);
  return (
    <Dialog open={open} onClose={onClose} title="Confirm your email first">
      <p className="text-[15px] leading-relaxed text-ink-soft">
        Confirm your email to do this. We sent a link to <strong className="text-ink">{email}</strong>.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            act.auth.resendLink();
            setSent(true);
          }}
        >
          {sent ? "Link sent again" : "Resend link"}
        </Button>
        <Link href="/confirm-email" className="press inline-flex h-11 items-center rounded-full px-5 text-[15px] font-semibold text-accent hover:bg-raised">
          I have the link
        </Link>
      </div>
    </Dialog>
  );
}
