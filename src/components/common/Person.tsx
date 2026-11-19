"use client";

/* A member's display identity: the name (real name or @handle, by their own
   setting), the tree beside it, pronouns and badges, linked to the profile. */

import Link from "next/link";
import { TreeGlyph } from "@/components/art/Tree";
import { Avatar, BadgeChip } from "@/components/shared";
import { displayName } from "@/features/auth";
import type { Member } from "@/types/domain";

/** "Annie M. · she/her" with the tree glyph, linked to the profile. */
export function Name({
  member,
  link = true,
  badges = true,
  pronouns = true,
  className = "",
}: {
  member: Member;
  link?: boolean;
  badges?: boolean;
  pronouns?: boolean;
  className?: string;
}) {
  const name = displayName(member);
  const team = member.badges.includes("team");
  const href = member.id === "me" ? "/dashboard" : `/u/${member.handle}`;
  return (
    <span className={`inline-flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 ${className}`}>
      {/* The name and its tree stay together; long handles truncate, never wrap away from the tree. */}
      <span className="inline-flex max-w-full min-w-0 items-center gap-1.5" title={name}>
        {link && !team ? (
          <Link
            href={href}
            className="inline-flex min-h-6 items-center truncate font-semibold text-ink hover:underline"
          >
            {name}
          </Link>
        ) : (
          <span className="truncate font-semibold text-ink">{name}</span>
        )}
        {!team && (
          <span
            title={`${member.level} · ${member.sunlight.toLocaleString()} Sunlight`}
            className="inline-flex shrink-0"
          >
            <TreeGlyph level={member.level} />
            <span className="sr-only">{member.level}</span>
          </span>
        )}
      </span>
      {pronouns && member.pronouns && (
        <span className="text-[13px] text-muted">· {member.pronouns}</span>
      )}
      {badges && member.badges.map((b) => <BadgeChip key={b} badge={b} />)}
    </span>
  );
}

export function Person({
  member,
  sub,
  size = 40,
  children,
}: {
  member: Member;
  sub?: React.ReactNode;
  size?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar member={member} size={size} />
      <div className="min-w-0 flex-1">
        <Name member={member} />
        {sub && <div className="mt-0.5 text-[13px] leading-snug text-muted">{sub}</div>}
      </div>
      {children}
    </div>
  );
}
