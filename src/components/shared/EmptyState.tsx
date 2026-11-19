"use client";

import { Spot, type SpotKind } from "@/components/art/Scenes";

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
    <div
      className={`flex flex-col items-center rounded-[20px] border border-line bg-panel text-center ${compact ? "px-6 py-8" : "px-6 py-12"}`}
    >
      <Spot kind={art} size={compact ? 120 : 168} />
      <h2 className="mt-4 text-[18px] font-semibold text-ink">{title}</h2>
      {body && (
        <p className="mt-1.5 max-w-[46ch] text-[15px] leading-relaxed text-ink-soft">{body}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
