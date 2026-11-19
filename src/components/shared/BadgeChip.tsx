"use client";

import { BadgeCheck, Leaf as LeafIcon } from "lucide-react";
import type { Badge } from "@/types/domain";

const BADGE: Record<Badge, { label: string; cls: string }> = {
  mentor: { label: "Mentor", cls: "bg-purple-tint text-purple-ink" },
  "founding-mentor": { label: "Founding mentor", cls: "bg-purple-tint text-purple-ink" },
  clinician: { label: "Verified clinician", cls: "bg-blue-tint text-blue-ink" },
  team: { label: "Fertility Grove team", cls: "bg-green-tint text-green-ink" },
  partner: { label: "Partner", cls: "bg-pink-tint text-ink-soft ring-1 ring-inset ring-pink" },
};

export function BadgeChip({ badge }: { badge: Badge }) {
  const b = BADGE[badge];
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 rounded-full px-2 text-[12px] font-semibold ${b.cls}`}
    >
      {badge === "clinician" && <BadgeCheck size={13} />}
      {(badge === "mentor" || badge === "founding-mentor") && <LeafIcon size={12} />}
      {b.label}
    </span>
  );
}
