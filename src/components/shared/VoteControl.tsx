"use client";

import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import type { Vote } from "@/types/domain";

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
    // biome-ignore lint/a11y/useSemanticElements: role="group" labels these buttons as one control; <fieldset> adds UA border, padding and min-width that would break the inline layout
    <div
      className="inline-flex items-center rounded-full bg-raised"
      role="group"
      aria-label={`Score ${score}`}
    >
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
      <span
        className={`tabular min-w-6 text-center text-[14px] font-semibold ${my === 1 ? "text-positive" : my === -1 ? "text-coral-ink" : "text-ink"}`}
      >
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
