"use client";

/* The public feed (PRD v1.2 §10, Guest browsing). Posts guests can read,
   from every group visible to guests, newest first, with a filter by group.
   Linked from the landing page. No sign-in needed. */

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ReadingFrame } from "@/components/AuthFrame";
import { JoinBlock, PublicPostCard, useGuestAction } from "@/components/Guest";
import { EmptyState, Field, Select } from "@/components/ui";
import { guestGroups, publicFeed } from "@/lib/api";
import { sel, useStore } from "@/lib/store";

export default function CommunityPage() {
  const s = useStore();
  const [groupId, setGroupId] = useState("");
  const { ask, ui } = useGuestAction();
  // TODO(api): the public feed endpoint (GET, no sign-in), filtered by group.
  const groups = guestGroups(s);
  const items = publicFeed(s, groupId || undefined);

  return (
    <ReadingFrame
      title="From the community"
      lede="Posts members chose to share with everyone, newest first. The conversations under them stay inside Fertility Grove."
    >
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <Field label="Filter by group" className="w-full sm:w-72">
          <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">All groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </Field>
        <p className="tabular pb-2 text-[14px] text-muted">{sel.plural(items.length, "post")}</p>
      </div>
      {groupId && (
        <Link href={`/community/${groupId}`} className="mt-3 inline-flex items-center gap-1 text-[14px] font-semibold text-accent hover:underline">
          About {groups.find((g) => g.id === groupId)?.name} <ArrowRight size={15} aria-hidden />
        </Link>
      )}

      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState art="sprout" title="No public posts here yet." body="Members choose post by post what to share with everyone." />
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {items.map((item) => (
            <li key={item.post.id}>
              <PublicPostCard item={item} ask={ask} />
            </li>
          ))}
        </ul>
      )}

      <JoinBlock title="Join the conversation" />
      {ui}
    </ReadingFrame>
  );
}
