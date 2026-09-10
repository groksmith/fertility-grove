"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ListFilter, Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { Avatar, Button, EmptyState, LinkButton } from "@/components/ui";
import { PEOPLE } from "@/lib/data";
import { COMMUNITY_TABS } from "@/lib/nav";
import { useStore } from "@/lib/store";

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const { groups, posts, toggleGroup } = useStore();
  const [q, setQ] = useState("");

  const group = groups.find((g) => g.id === params.id);

  if (!group) {
    return (
      <AppShell section="community" tabs={COMMUNITY_TABS}>
        <EmptyState
          title="That group doesn't exist."
          body="It may have been renamed or removed."
          action={<LinkButton href="/community/groups">Browse all groups</LinkButton>}
        />
      </AppShell>
    );
  }

  const groupPosts = posts
    .filter((p) => p.groupId === group.id)
    .filter(
      (p) =>
        !q ||
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        p.body.toLowerCase().includes(q.toLowerCase()),
    );

  const faces = Object.values(PEOPLE).slice(0, 6);

  return (
    <AppShell
      section="community"
      tabs={COMMUNITY_TABS}
      rail={
        <div>
          <Button
            variant={group.joined ? "outline" : "greenDark"}
            className="h-12 w-full !text-[15px]"
            onClick={() => toggleGroup(group.id)}
          >
            {group.joined ? "Leave group" : "Join group"}
          </Button>

          <h3 className="serif mt-8 flex items-start gap-2 text-[20px] leading-tight">
            <ListFilter size={17} className="mt-1.5 shrink-0" /> About {group.name}
          </h3>
          <dl className="mt-4 space-y-2.5 text-[13.5px]">
            {[
              ["Posts Today:", group.postsToday],
              ["Avg Posts Daily:", group.avgPostsDaily],
              ["Group Members:", group.members.toLocaleString()],
              ["Created On:", group.createdOn],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-end gap-2">
                <dt className="text-muted">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-6">
        <Link
          href="/community/groups"
          className="inline-flex items-center gap-1.5 text-[14px]"
        >
          <ChevronLeft size={17} /> back to all groups
        </Link>
        <div className="flex min-w-[240px] flex-1 items-center gap-2.5">
          <Search size={17} className="text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search this group..."
            aria-label={`Search ${group.name}`}
            className="w-full bg-transparent text-[14px] placeholder:text-muted focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-7 flex -space-x-3">
        {faces.map((p) => (
          <Avatar key={p.id} name={p.name} size={44} ring />
        ))}
      </div>

      <h2 className="mt-5 text-[28px] font-bold tracking-[-0.01em]">{group.name}</h2>
      <p className="mt-2 max-w-[760px] text-[14.5px] leading-relaxed">
        {group.description}
      </p>

      <div className="mt-5 xl:hidden">
        <Button
          variant={group.joined ? "outline" : "greenDark"}
          onClick={() => toggleGroup(group.id)}
        >
          {group.joined ? "Leave group" : "Join group"}
        </Button>
      </div>

      <div className="mt-9 space-y-7">
        {groupPosts.length === 0 ? (
          <EmptyState
            title="No posts here yet."
            body={
              q
                ? `Nothing in ${group.name} matches "${q}".`
                : `Be the first to post in ${group.name}.`
            }
            action={
              <LinkButton href="/community/new" variant="coral">
                Create a post
              </LinkButton>
            }
          />
        ) : (
          groupPosts.map((p) => (
            <PostCard key={p.id} post={p} showSource={false} />
          ))
        )}
      </div>
    </AppShell>
  );
}
