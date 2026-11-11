"use client";

/* Who outside the group can read a post (PRD §9, §10): "Allow sharing outside
   Fertility Grove", and, only in groups visible to guests, "Show to visitors".
   Turning visitors on turns sharing on and holds it there. Members-only
   groups offer neither. Used by Write a post and Edit post. */

import { Toggle } from "@/components/ui";
import type { Group, PostType } from "@/lib/types";

/* Draft wording, sent back to the PRD for review. */
export const VISITORS_HELP =
  "Anyone can find and read this post, including people without an account, and search engines can list it. Comments stay private. If you turn this off later, search engines may keep a copy for a while.";

/** Show to visitors is offered only here. */
export const offersVisitors = (g: Group | undefined) => !!g && g.visibleToGuests && g.readAccess === "any";

export function PostVisibility({
  group,
  type,
  allowSharing,
  showToVisitors,
  onChange,
}: {
  group: Group | undefined;
  type: PostType | undefined;
  allowSharing: boolean;
  showToVisitors: boolean;
  onChange: (v: { allowSharing: boolean; showToVisitors: boolean }) => void;
}) {
  if (group?.readAccess === "members-only") return null;
  const visitors = offersVisitors(group) && showToVisitors;
  const exposed = type === "Support needed" || type === "Just venting";
  return (
    <>
      <Toggle
        checked={allowSharing || visitors}
        disabled={visitors}
        onChange={(on) => onChange({ allowSharing: on, showToVisitors: visitors })}
        label="Allow sharing outside Fertility Grove"
        description={
          visitors
            ? "Stays on while Show to visitors is on. Comments are never shown outside."
            : "Lets members make a public link to this post. Comments are never shown outside."
        }
      />
      {offersVisitors(group) && (
        <div>
          <Toggle
            checked={visitors}
            // Turning it off leaves sharing on: the link keeps working, unlisted.
            onChange={(on) => onChange({ allowSharing: on || allowSharing, showToVisitors: on })}
            label="Show to visitors"
            description={VISITORS_HELP}
          />
          {visitors && exposed && (
            <p role="note" className="mt-3 rounded-[10px] bg-yellow-tint px-4 py-3 text-[14px] text-[var(--yellow-700)]">
              This will be readable by anyone on the internet.
            </p>
          )}
        </div>
      )}
    </>
  );
}
