"use client";

/* Small labels on posts and stories: type, source and topic. */

import type { PostType, Source } from "@/types/domain";

const TYPE_TONE: Record<PostType, string> = {
  Question: "bg-blue-tint text-blue-ink",
  "Seeking input": "bg-yellow-tint text-yellow-ink",
  "Support needed": "bg-pink-tint text-ink-soft ring-1 ring-inset ring-pink",
  "Just venting": "bg-purple-tint text-purple-ink",
  "Just sharing": "bg-green-tint text-green-ink",
};

export function TypeChip({ type }: { type: PostType | string }) {
  const tone =
    TYPE_TONE[type as PostType] ?? "bg-pink-tint text-ink-soft ring-1 ring-inset ring-pink";
  return (
    <span
      className={`inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-semibold ${tone}`}
    >
      {type}
    </span>
  );
}

export function SourceLabel({ source, link }: { source?: Source; link?: string }) {
  if (!source) return null; // a source is optional on posts
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--grey-300)]" />
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer noopener"
          className="underline hover:text-ink"
        >
          {source}
        </a>
      ) : (
        source
      )}
    </span>
  );
}

export function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center rounded-full bg-raised px-2.5 text-[12px] font-medium text-ink-soft">
      {children}
    </span>
  );
}
