"use client";

/* Groups. The screen's question: which groups are for me? Matched groups come
   first with the reason they were suggested, then every other active group. */

import Link from "next/link";
import { useState } from "react";
import { Check, Lock, Search } from "lucide-react";
import { GroupCover, groupHue } from "@/components/art/Brand";
import { Spot } from "@/components/art/Scenes";
import { Button, EmptyState, PageHeader, Panel, toast } from "@/components/ui";
import { act, sel, useStore } from "@/lib/store";
import type { Group } from "@/lib/types";
import { hueInk } from "@/lib/hue";

function TypeLabel({ group }: { group: Group }) {
  const hue = groupHue(group);
  return (
    <span className="inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-semibold" style={{ background: `var(--${hue}-50)`, color: hueInk(hue), boxShadow: `inset 0 0 0 1px var(--${hue}-300)` }}>
      {group.type}
    </span>
  );
}

function GroupRow({ group, why }: { group: Group; why?: string }) {
  const joined = useStore((s) => s.joined.includes(group.id));
  return (
    // Phone: cover beside the text, the button under it. Wider: the button on the right.
    <li className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-x-3.5 gap-y-3 py-4 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:items-center sm:gap-x-4">
      <Link href={`/groups/${group.id}`} tabIndex={-1} aria-hidden className="row-span-2 sm:row-span-1">
        <GroupCover group={group} size={56} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/groups/${group.id}`} className="text-[16px] font-semibold text-ink hover:underline">
            {group.name}
          </Link>
          <TypeLabel group={group} />
          {group.readAccess === "members-only" && (
            <span className="inline-flex items-center gap-1 text-[12.5px] text-muted">
              <Lock size={12} /> Members-only
            </span>
          )}
        </div>
        {why && <p className="mt-0.5 text-[13px] font-semibold text-green-ink">{why}</p>}
        <p className="mt-0.5 line-clamp-2 text-[14px] leading-snug text-ink-soft">{group.description}</p>
        <p className="tabular mt-1 text-[13px] text-muted">
          {sel.plural(group.members, "member")} · {sel.plural(group.postsThisWeek, "post")} this week
        </p>
      </div>
      <Button
        size="sm"
        variant={joined ? "quiet" : "secondary"}
        aria-pressed={joined}
        className="col-start-2 justify-self-start sm:col-start-3 sm:row-start-1"
        onClick={() => {
          act.groups.toggleJoin(group.id);
          toast(joined ? `Left ${group.name}` : `Joined ${group.name}`);
        }}
      >
        {joined ? (
          <>
            <Check size={15} /> Joined
          </>
        ) : (
          "Join"
        )}
      </Button>
    </li>
  );
}

export default function GroupsPage() {
  const s = useStore();
  const [q, setQ] = useState("");
  const matches = sel.groupMatches(s, 5);
  const matchedIds = matches.map((m) => m.group.id);
  const term = q.trim().toLowerCase();
  const fits = (g: Group) => !term || `${g.name} ${g.description}`.toLowerCase().includes(term);
  const matched = matches.filter((m) => fits(m.group));
  const rest = s.groups.filter((g) => g.status === "active" && !matchedIds.includes(g.id) && fits(g));
  const joinedCount = s.joined.length;

  return (
    <>
      <PageHeader
        title="Groups"
        lede={
          joinedCount
            ? `You're in ${joinedCount} ${joinedCount === 1 ? "group" : "groups"}. Join as many as you like; posting, commenting and voting happen inside a group.`
            : "Join a group to post, comment and vote. Joining is instant and you can leave any time."
        }
        art={<Spot kind="canopy" size={96} className="hidden sm:block" />}
      />

      <label className="search-field mb-6 flex h-11 max-w-md items-center gap-2 rounded-full border border-line-strong bg-panel px-4 text-muted focus-within:ring-2 focus-within:ring-accent">
        <Search size={17} aria-hidden />
        <span className="sr-only">Search groups</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search groups by name or topic"
          enterKeyHint="search"
          className="w-full bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none"
        />
      </label>

      {matched.length === 0 && rest.length === 0 ? (
        <EmptyState art="lens" title="No groups match that yet." body="Try different words, or ask in a group you're already in." />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            {matched.length > 0 && (
              <Panel className="px-5 pt-5 pb-1 sm:px-6" aria-labelledby="matched-h">
                <h2 id="matched-h" className="text-[18px] font-semibold">Matched to you</h2>
                <p className="mt-0.5 text-[14px] text-muted">Suggested from your diagnosis, stage and path.</p>
                <ul className="divide-y divide-line">
                  {matched.map((m) => (
                    <GroupRow key={m.group.id} group={m.group} why={m.why} />
                  ))}
                </ul>
              </Panel>
            )}
            {rest.length > 0 && (
              <Panel className="px-5 pt-5 pb-1 sm:px-6" aria-labelledby="all-h">
                <h2 id="all-h" className="text-[18px] font-semibold">All groups</h2>
                <p className="mt-0.5 text-[14px] text-muted">
                  <span className="tabular">{rest.length}</span> more in both communities
                </p>
                <ul className="divide-y divide-line">
                  {rest.map((g) => (
                    <GroupRow key={g.id} group={g} />
                  ))}
                </ul>
              </Panel>
            )}
          </div>
          <aside className="space-y-4">
            <Panel className="p-5">
              <h2 className="text-[16px] font-semibold">Three kinds of group</h2>
              <ul className="mt-3 space-y-3 text-[14px] leading-snug text-ink-soft">
                <li>
                  <span className="font-semibold text-coral-ink">Diagnosis</span> groups gather people with the same diagnosis.
                </li>
                <li>
                  <span className="font-semibold text-blue-ink">Stage</span> groups follow where you are: testing, IUI, IVF, pregnant after infertility.
                </li>
                <li>
                  <span className="font-semibold text-yellow-ink">Topic</span> groups cover what cuts across: partners, donors, work, taking a break.
                </li>
              </ul>
            </Panel>
            <Panel className="p-5">
              <h2 className="text-[16px] font-semibold">Pregnancy news has its own space</h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
                Good news lives in Success stories, so nobody comes across it before they&apos;re ready.
              </p>
              <Link href="/stories" className="mt-3 inline-block text-[14px] font-semibold text-accent hover:underline">
                Visit Success stories
              </Link>
            </Panel>
          </aside>
        </div>
      )}
    </>
  );
}
