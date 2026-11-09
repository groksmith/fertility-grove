/* Group covers: one painted motif each, in the grove's gouache hand on their
   type's tint, until group admins add their own cover photos. A group without
   its own cover falls back to a crop of the orange-tree canopy. The logo lives in
   components/Logo.tsx. */

import Image from "next/image";
import type { Group, Hue } from "@/lib/types";
import { hash } from "./shapes";

const TYPE_HUE: Record<Group["type"], Hue> = {
  Diagnosis: "coral",
  Stage: "blue",
  Topic: "yellow",
};

const GROUP_ART = new Set([
  "g-endo", "g-pcos", "g-dor", "g-mf", "g-rpl", "g-unexplained", "g-waiting", "g-iui",
  "g-ivf", "g-eggfreeze", "g-pai", "g-partners", "g-donor", "g-break", "g-work", "g-spring",
]);

export const groupHue = (g: Pick<Group, "type">): Hue => TYPE_HUE[g.type];

export function GroupCover({ group, size = 56, className = "" }: { group: Pick<Group, "id" | "type">; size?: number; className?: string }) {
  const hue = groupHue(group);
  const src = GROUP_ART.has(group.id) ? `/brand/groups/${group.id}.webp` : `/brand/art/canopy-${Math.floor(hash(group.id)() * 6)}.webp`;
  return (
    <span
      aria-hidden
      className={`relative block shrink-0 overflow-hidden rounded-[10px] bg-white ring-1 ring-inset ring-line ${className}`}
      style={{ width: size, height: size }}
      data-hue={hue}
    >
      <Image src={src} alt="" fill sizes={`${size * 2}px`} quality={90} className="object-cover" />
    </span>
  );
}
